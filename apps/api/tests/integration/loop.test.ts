import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { io, type Socket } from 'socket.io-client';
import type { AddressInfo } from 'node:net';
import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/server.js';
import { __setTestRng } from '../../src/realtime/gateway.js';
import { CLIENT_EVENTS, SERVER_EVENTS, ResolveDecision, Skill } from '@caravans/shared';

let app: FastifyInstance;
let base: string;

beforeAll(async () => {
  app = await buildApp();
  await app.listen({ port: 0, host: '127.0.0.1' });
  const addr = app.server.address() as AddressInfo;
  base = `http://127.0.0.1:${addr.port}`;
  __setTestRng(() => 0.999); // d20 = 20 → revela pistas de Investigação DT ≤ 20
});

afterAll(async () => {
  __setTestRng(null);
  await app.close();
});

async function loginCookie(email: string): Promise<string> {
  const res = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'caravans123' }),
  });
  const headers = res.headers as unknown as { getSetCookie?: () => string[] };
  const cookies = headers.getSetCookie?.() ?? [res.headers.get('set-cookie') ?? ''];
  const raw = cookies.find((c) => c.startsWith('caravans_session=')) ?? cookies[0] ?? '';
  return raw.split(';')[0]!;
}

async function getJSON<T>(path: string, cookie: string): Promise<T> {
  const r = await fetch(`${base}${path}`, { headers: { Cookie: cookie } });
  return (await r.json()) as T;
}

function connect(cookie: string): Socket {
  return io(base, { extraHeaders: { Cookie: cookie }, transports: ['websocket'], reconnection: false });
}

function once<T = unknown>(sock: Socket, ev: string, timeout = 8000): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timeout esperando ${ev}`)), timeout);
    sock.once(ev, (d: T) => {
      clearTimeout(t);
      resolve(d);
    });
  });
}

describe('US1 — laço central em tempo real', () => {
  it('intenção → mestre → aprovação → pista revelada, sem vazar dt ao jogador', async () => {
    const mCookie = await loginCookie('mestre@caravans.test');
    const pCookie = await loginCookie('jogador@caravans.test');

    const { sessions } = await getJSON<{ sessions: { sessionId: string }[] }>(
      '/api/my/sessions',
      pCookie,
    );
    const sessionId = sessions[0]!.sessionId;

    const master = connect(mCookie);
    const player = connect(pCookie);
    try {
      const mSnapP = once(master, SERVER_EVENTS.SCENE_SNAPSHOT);
      const pSnapP = once<{ snapshot: { scene: { objects: { id: string; name: string }[] } } }>(
        player,
        SERVER_EVENTS.SCENE_SNAPSHOT,
      );
      master.emit(CLIENT_EVENTS.SESSION_JOIN, { sessionId });
      player.emit(CLIENT_EVENTS.SESSION_JOIN, { sessionId });
      await mSnapP;
      const pSnap = await pSnapP;

      const obj = pSnap.snapshot.scene.objects.find((o) => o.name === 'Marca de sangue');
      expect(obj, 'cena semeada deve ter "Marca de sangue"').toBeTruthy();

      // 1) jogador envia intenção → mestre recebe na fila
      const createdP = once<{ intent: { id: string; action: string; authorName: string } }>(
        master,
        SERVER_EVENTS.INTENT_CREATED,
      );
      player.emit(CLIENT_EVENTS.INTENT_SUBMIT, {
        sessionId,
        clientIntentId: randomUUID(),
        targetObjectId: obj!.id,
        action: 'examinar a marca de sangue',
        skill: Skill.INVESTIGACAO,
      });
      const created = await createdP;
      expect(created.intent.action).toBe('examinar a marca de sangue');
      expect(created.intent.authorName).toBe('Cordelia Vance');

      // 2) mestre aprova → jogador recebe pista revelada + desfecho da intenção
      const revealedP = once<{ clue: { text: string; skill: string } }>(
        player,
        SERVER_EVENTS.CLUE_REVEALED,
      );
      const updatedP = once<{ intent: { status: string } }>(player, SERVER_EVENTS.INTENT_UPDATED);
      master.emit(CLIENT_EVENTS.INTENT_RESOLVE, {
        intentId: created.intent.id,
        decision: ResolveDecision.APPROVE,
      });

      const revealed = await revealedP;
      expect(revealed.clue.text.toLowerCase()).toContain('sangue');
      // 3) não-vazamento em tempo real: nenhum "dt" no payload enviado ao jogador
      expect(JSON.stringify(revealed)).not.toMatch(/"dt"/);

      const updated = await updatedP;
      expect(updated.intent.status).toBe('APPROVED');
    } finally {
      master.disconnect();
      player.disconnect();
    }
  });
});

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { AddressInfo } from 'node:net';
import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/server.js';
import { __setTestRng } from '../../src/realtime/gateway.js';
import { CLIENT_EVENTS, SERVER_EVENTS, ResolveDecision, Skill } from '@caravans/shared';
import { setupWorld, loginCookie, connect, once, sleep, type World } from '../helpers.js';

let app: FastifyInstance;
let base: string;
let world: World;

beforeAll(async () => {
  app = await buildApp();
  await app.listen({ port: 0, host: '127.0.0.1' });
  base = `http://127.0.0.1:${(app.server.address() as AddressInfo).port}`;
  world = await setupWorld();
  __setTestRng(() => 0.999); // garante revelação da pista DT10
});
afterAll(async () => {
  __setTestRng(null);
  await app.close();
});

describe('US4 — reconexão e idempotência', () => {
  it('restaura o estado ao reconectar e não duplica intenção', async () => {
    const mCookie = await loginCookie(base, world.masterEmail, world.password);
    const pCookie = await loginCookie(base, world.playerEmail, world.password);

    const master = connect(base, mCookie);
    let player = connect(base, pCookie);

    // conta quantas intenções o mestre recebe (para checar idempotência)
    let createdCount = 0;
    let lastIntentId = '';
    master.on(SERVER_EVENTS.INTENT_CREATED, (e: { intent: { id: string } }) => {
      createdCount += 1;
      lastIntentId = e.intent.id;
    });

    try {
      const mReady = once(master, SERVER_EVENTS.SCENE_SNAPSHOT);
      const pReady = once(player, SERVER_EVENTS.SCENE_SNAPSHOT);
      master.emit(CLIENT_EVENTS.SESSION_JOIN, { sessionId: world.sessionId });
      player.emit(CLIENT_EVENTS.SESSION_JOIN, { sessionId: world.sessionId });
      await mReady;
      await pReady;

      // idempotência: mesmo clientIntentId enviado duas vezes
      const clientIntentId = randomUUID();
      const submit = () =>
        player.emit(CLIENT_EVENTS.INTENT_SUBMIT, {
          sessionId: world.sessionId,
          clientIntentId,
          targetObjectId: world.objectId,
          action: 'examinar',
          skill: Skill.INVESTIGACAO,
        });
      submit();
      submit();
      await sleep(400);
      expect(createdCount).toBe(1);

      // mestre aprova → pista revelada
      const revealed = once(player, SERVER_EVENTS.CLUE_REVEALED);
      master.emit(CLIENT_EVENTS.INTENT_RESOLVE, { intentId: lastIntentId, decision: ResolveDecision.APPROVE });
      await revealed;

      // jogador cai e reconecta → estado restaurado (pista descoberta presente)
      player.disconnect();
      player = connect(base, pCookie);
      const rejoinedP = once<{ snapshot: { groupClues: { text: string }[] } }>(
        player,
        SERVER_EVENTS.SCENE_SNAPSHOT,
      );
      player.emit(CLIENT_EVENTS.SESSION_JOIN, { sessionId: world.sessionId });
      const rejoined = await rejoinedP;
      expect(rejoined.snapshot.groupClues.length).toBeGreaterThanOrEqual(1);
      expect(rejoined.snapshot.groupClues.some((c) => c.text.includes('sangue'))).toBe(true);
    } finally {
      master.disconnect();
      player.disconnect();
    }
  });
});

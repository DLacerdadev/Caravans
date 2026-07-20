import { io, type Socket } from 'socket.io-client';
import { prisma } from '../src/db/client.js';
import { hashPassword } from '../src/plugins/auth.js';
import { Skill } from '@caravans/shared';

const uid = () => `${Date.now()}${Math.floor(Math.random() * 1e6)}`;

export interface World {
  masterEmail: string;
  playerEmail: string;
  password: string;
  campaignId: string;
  sessionId: string;
  sceneId: string;
  objectId: string;
  clueId: string;
  clockId: string;
}

/** Cria um mundo isolado direto no banco (não interfere com outros testes/paralelismo). */
export async function setupWorld(): Promise<World> {
  const password = 'test1234';
  const passwordHash = await hashPassword(password);
  const masterEmail = `m${uid()}@caravans.test`;
  const playerEmail = `p${uid()}@caravans.test`;

  const master = await prisma.user.create({ data: { email: masterEmail, passwordHash, displayName: 'Mestre T' } });
  const player = await prisma.user.create({ data: { email: playerEmail, passwordHash, displayName: 'Jogador T' } });

  const campaign = await prisma.campaign.create({
    data: {
      name: 'Campanha T',
      joinCode: `T${uid().slice(-5)}`,
      members: { create: [{ userId: master.id, role: 'MASTER' }, { userId: player.id, role: 'PLAYER' }] },
    },
  });

  const scene = await prisma.scene.create({
    data: {
      campaignId: campaign.id,
      title: 'Cena T',
      status: 'ACTIVE',
      objects: {
        create: [
          {
            name: 'Marca de sangue',
            x: 0.4,
            y: 0.5,
            clues: {
              create: [
                { skill: Skill.INVESTIGACAO, dt: 10, text: 'O sangue é humano.', order: 1 },
                { skill: Skill.OCULTISMO, dt: 15, text: 'Componente de ritual.', order: 2 },
              ],
            },
          },
        ],
      },
    },
    include: { objects: { include: { clues: true } } },
  });
  const object = scene.objects[0]!;
  const clue = object.clues[0]!;

  const session = await prisma.session.create({
    data: { campaignId: campaign.id, name: 'Sessão T', activeSceneId: scene.id },
  });
  const clock = await prisma.threatClock.create({
    data: { sessionId: session.id, name: 'Ameaça T', current: 1, max: 4 },
  });

  return {
    masterEmail,
    playerEmail,
    password,
    campaignId: campaign.id,
    sessionId: session.id,
    sceneId: scene.id,
    objectId: object.id,
    clueId: clue.id,
    clockId: clock.id,
  };
}

export async function loginCookie(base: string, email: string, password: string): Promise<string> {
  const res = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const headers = res.headers as unknown as { getSetCookie?: () => string[] };
  const cookies = headers.getSetCookie?.() ?? [res.headers.get('set-cookie') ?? ''];
  return (cookies.find((c) => c.startsWith('caravans_session=')) ?? cookies[0] ?? '').split(';')[0]!;
}

export function connect(base: string, cookie: string): Socket {
  return io(base, { extraHeaders: { Cookie: cookie }, transports: ['websocket'], reconnection: false });
}

export function once<T = unknown>(sock: Socket, ev: string, timeout = 8000): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timeout ${ev}`)), timeout);
    sock.once(ev, (d: T) => {
      clearTimeout(t);
      resolve(d);
    });
  });
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

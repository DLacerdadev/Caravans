import { prisma } from '../../db/client.js';
import {
  buildMasterSnapshot,
  buildPlayerSnapshot,
  type RawScene,
  type RawIntent,
  type RawClock,
  type RawDiscovery,
} from '../../realtime/projection.js';
import type { Role, SceneSnapshot } from '@caravans/shared';

export interface SessionContext {
  sessionId: string;
  campaignId: string;
  seq: number;
}

export async function getSessionContext(sessionId: string): Promise<SessionContext | null> {
  const s = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!s) return null;
  return { sessionId: s.id, campaignId: s.campaignId, seq: s.seq };
}

async function loadRaw(sessionId: string) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      activeScene: {
        include: { objects: { include: { clues: { orderBy: { order: 'asc' } } } } },
      },
      intents: { include: { author: true }, orderBy: { createdAt: 'asc' } },
      clocks: { orderBy: { createdAt: 'asc' } },
      discoveries: true,
    },
  });
  if (!session) return null;

  const scene: RawScene | null = session.activeScene
    ? {
        id: session.activeScene.id,
        title: session.activeScene.title,
        imagePath: session.activeScene.imagePath,
        imageWidth: session.activeScene.imageWidth,
        imageHeight: session.activeScene.imageHeight,
        objects: session.activeScene.objects.map((o) => ({
          id: o.id,
          name: o.name,
          description: o.description,
          x: o.x,
          y: o.y,
          state: o.state ?? {},
          clues: o.clues.map((c) => ({
            id: c.id,
            sceneObjectId: c.sceneObjectId,
            skill: c.skill,
            dt: c.dt,
            text: c.text,
            order: c.order,
          })),
        })),
      }
    : null;

  const intents: RawIntent[] = session.intents.map((i) => ({
    id: i.id,
    authorId: i.authorId,
    authorName: i.author.displayName,
    targetObjectId: i.targetObjectId,
    action: i.action,
    skill: i.skill,
    status: i.status,
    rollResult: i.rollResult,
    note: i.note,
    createdAt: i.createdAt,
  }));
  const clocks: RawClock[] = session.clocks.map((c) => ({
    id: c.id,
    name: c.name,
    current: c.current,
    max: c.max,
  }));
  const discoveries: RawDiscovery[] = session.discoveries.map((d) => ({
    clueId: d.clueId,
    scope: d.scope,
    userId: d.userId,
  }));

  return { seq: session.seq, scene, intents, clocks, discoveries };
}

export async function buildSnapshot(
  sessionId: string,
  userId: string,
  role: Role,
): Promise<SceneSnapshot | null> {
  const raw = await loadRaw(sessionId);
  if (!raw) return null;
  if (role === 'MASTER') {
    return buildMasterSnapshot({ sessionId, seq: raw.seq, scene: raw.scene, discoveries: raw.discoveries, intents: raw.intents, clocks: raw.clocks });
  }
  return buildPlayerSnapshot({ sessionId, seq: raw.seq, scene: raw.scene, discoveries: raw.discoveries, intents: raw.intents, userId });
}

/** Incrementa e retorna o próximo seq da sessão (ordenação de eventos). */
export async function nextSeq(sessionId: string): Promise<number> {
  const s = await prisma.session.update({
    where: { id: sessionId },
    data: { seq: { increment: 1 } },
    select: { seq: true },
  });
  return s.seq;
}

/** Sessões visíveis ao usuário (atalho de MVP para chegar à cena sem a UI completa de campanha). */
export async function listMySessions(userId: string) {
  const memberships = await prisma.campaignMember.findMany({
    where: { userId },
    include: { campaign: { include: { sessions: true } } },
  });
  const out: { sessionId: string; sessionName: string; campaignName: string; role: Role }[] = [];
  for (const m of memberships) {
    for (const s of m.campaign.sessions) {
      out.push({ sessionId: s.id, sessionName: s.name, campaignName: m.campaign.name, role: m.role as Role });
    }
  }
  return out;
}

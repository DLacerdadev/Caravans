import type { Server } from 'socket.io';
import { prisma } from '../db/client.js';
import { verifySession, parseCookies, COOKIE, getRoleInCampaign } from '../plugins/auth.js';
import { buildSnapshot, getSessionContext, nextSeq } from '../modules/sessions/state.js';
import {
  CLIENT_EVENTS,
  SERVER_EVENTS,
  ResolveDecision,
  intentSubmitSchema,
  intentResolveSchema,
  sessionJoinSchema,
  rollTest,
  resolveReveal,
  type IntentView,
  type Rng,
} from '@caravans/shared';

// Hook de RNG para testes determinísticos (em produção usa Math.random via rollTest).
let rngOverride: Rng | null = null;
export function __setTestRng(fn: Rng | null): void {
  rngOverride = fn;
}

const roomSession = (id: string) => `session:${id}`;
const roomMaster = (id: string) => `session:${id}:master`;
const roomPlayers = (id: string) => `session:${id}:players`;

type IntentWithAuthor = {
  id: string;
  authorId: string;
  targetObjectId: string | null;
  action: string;
  skill: IntentView['skill'];
  status: IntentView['status'];
  rollResult: number | null;
  note: string | null;
  createdAt: Date;
  author: { displayName: string };
};

function intentView(i: IntentWithAuthor): IntentView {
  return {
    id: i.id,
    authorId: i.authorId,
    authorName: i.author.displayName,
    targetObjectId: i.targetObjectId,
    action: i.action,
    skill: i.skill,
    status: i.status,
    rollResult: i.rollResult,
    note: i.note,
    createdAt: i.createdAt.toISOString(),
  };
}

export function registerGateway(io: Server): void {
  // Autenticação no handshake via cookie de sessão.
  io.use((socket, next) => {
    const cookies = parseCookies(socket.handshake.headers.cookie);
    const uid = verifySession(cookies[COOKIE]);
    if (!uid) return next(new Error('UNAUTHENTICATED'));
    (socket.data as Record<string, unknown>).userId = uid;
    next();
  });

  io.on('connection', (socket) => {
    const userId = (socket.data as { userId: string }).userId;
    const fail = (code: string, message: string) =>
      socket.emit(SERVER_EVENTS.ERROR, { code, message });

    socket.on(CLIENT_EVENTS.SESSION_JOIN, async (payload) => {
      const parsed = sessionJoinSchema.safeParse(payload);
      if (!parsed.success) return fail('BAD_REQUEST', 'Join inválido');
      const ctx = await getSessionContext(parsed.data.sessionId);
      if (!ctx) return fail('NOT_FOUND', 'Sessão não encontrada');
      const role = await getRoleInCampaign(ctx.campaignId, userId);
      if (!role) return fail('FORBIDDEN', 'Sem acesso a esta sessão');
      socket.join(roomSession(ctx.sessionId));
      socket.join(role === 'MASTER' ? roomMaster(ctx.sessionId) : roomPlayers(ctx.sessionId));
      const snapshot = await buildSnapshot(ctx.sessionId, userId, role);
      socket.emit(SERVER_EVENTS.SCENE_SNAPSHOT, { seq: snapshot?.seq ?? 0, snapshot });
    });

    socket.on(CLIENT_EVENTS.INTENT_SUBMIT, async (payload) => {
      const parsed = intentSubmitSchema.safeParse(payload);
      if (!parsed.success) return fail('BAD_REQUEST', 'Intenção inválida');
      const d = parsed.data;
      const ctx = await getSessionContext(d.sessionId);
      if (!ctx) return fail('NOT_FOUND', 'Sessão não encontrada');
      const role = await getRoleInCampaign(ctx.campaignId, userId);
      if (role !== 'PLAYER') return fail('FORBIDDEN', 'Apenas jogadores enviam intenções');

      // Idempotência por (sessionId, clientIntentId).
      const existing = await prisma.intent.findUnique({
        where: { sessionId_clientIntentId: { sessionId: d.sessionId, clientIntentId: d.clientIntentId } },
      });
      if (existing) return;

      const session = await prisma.session.findUnique({ where: { id: d.sessionId } });
      if (!session?.activeSceneId) return fail('NO_SCENE', 'Sem cena ativa');

      const intent = await prisma.intent.create({
        data: {
          sessionId: d.sessionId,
          sceneId: session.activeSceneId,
          authorId: userId,
          targetObjectId: d.targetObjectId ?? null,
          action: d.action,
          skill: d.skill,
          clientIntentId: d.clientIntentId,
        },
        include: { author: true },
      });
      const seq = await nextSeq(d.sessionId);
      io.to(roomMaster(d.sessionId)).emit(SERVER_EVENTS.INTENT_CREATED, { seq, intent: intentView(intent) });
    });

    socket.on(CLIENT_EVENTS.INTENT_RESOLVE, async (payload) => {
      const parsed = intentResolveSchema.safeParse(payload);
      if (!parsed.success) return fail('BAD_REQUEST', 'Resolução inválida');
      const d = parsed.data;
      const intent = await prisma.intent.findUnique({
        where: { id: d.intentId },
        include: { author: true },
      });
      if (!intent) return fail('NOT_FOUND', 'Intenção não encontrada');
      const ctx = await getSessionContext(intent.sessionId);
      if (!ctx) return fail('NOT_FOUND', 'Sessão não encontrada');
      const role = await getRoleInCampaign(ctx.campaignId, userId);
      if (role !== 'MASTER') return fail('FORBIDDEN', 'Apenas o mestre resolve');
      if (intent.status !== 'PENDING') return; // já resolvida

      if (d.decision === ResolveDecision.REJECT || d.decision === ResolveDecision.ADJUST) {
        const status = d.decision === ResolveDecision.REJECT ? 'REJECTED' : 'ADJUSTED';
        const updated = await prisma.intent.update({
          where: { id: intent.id },
          data: { status, note: d.note ?? null, resolvedAt: new Date() },
          include: { author: true },
        });
        const seq = await nextSeq(intent.sessionId);
        io.to(roomSession(intent.sessionId)).emit(SERVER_EVENTS.INTENT_UPDATED, {
          seq,
          intent: intentView(updated),
        });
        return;
      }

      // APPROVE → rola o teste e revela as pistas do alvo com DT ≤ resultado.
      const roll = rollTest(rngOverride ? { rng: rngOverride } : {});
      let revealed: { id: string; sceneObjectId: string; skill: typeof intent.skill; dt: number; text: string; order: number }[] = [];
      if (intent.targetObjectId) {
        const clues = await prisma.clue.findMany({ where: { sceneObjectId: intent.targetObjectId } });
        revealed = resolveReveal(
          clues.map((c) => ({
            id: c.id,
            sceneObjectId: c.sceneObjectId,
            skill: c.skill,
            dt: c.dt,
            text: c.text,
            order: c.order,
          })),
          intent.skill,
          roll.total,
        );
      }

      const updated = await prisma.intent.update({
        where: { id: intent.id },
        data: {
          status: 'APPROVED',
          rollResult: roll.total,
          rollBreakdown: { d20: roll.d20, mod: roll.mod, total: roll.total },
          resolvedAt: new Date(),
        },
        include: { author: true },
      });

      // Persiste descobertas (escopo GRUPO), sem duplicar.
      for (const c of revealed) {
        const already = await prisma.clueDiscovery.findFirst({
          where: { clueId: c.id, sessionId: intent.sessionId, scope: 'GROUP' },
        });
        if (!already) {
          await prisma.clueDiscovery.create({
            data: { clueId: c.id, sessionId: intent.sessionId, scope: 'GROUP', intentId: intent.id },
          });
        }
      }

      const seqUpd = await nextSeq(intent.sessionId);
      io.to(roomSession(intent.sessionId)).emit(SERVER_EVENTS.INTENT_UPDATED, {
        seq: seqUpd,
        intent: intentView(updated),
      });
      for (const c of revealed) {
        const seqClue = await nextSeq(intent.sessionId);
        io.to(roomSession(intent.sessionId)).emit(SERVER_EVENTS.CLUE_REVEALED, {
          seq: seqClue,
          clue: { id: c.id, sceneObjectId: c.sceneObjectId, skill: c.skill, text: c.text, order: c.order },
          scope: 'GROUP',
        });
      }
    });
  });
}

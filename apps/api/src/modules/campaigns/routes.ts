import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { campaignCreateSchema, campaignJoinSchema } from '@caravans/shared';
import type { CampaignDetail, CampaignSummary } from '@caravans/shared';
import { prisma } from '../../db/client.js';
import { requireUser, getRoleInCampaign, httpError } from '../../plugins/auth.js';

const sessionCreateSchema = z.object({ name: z.string().min(1).max(120) });

function makeJoinCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
  return code;
}

export async function campaignRoutes(app: FastifyInstance): Promise<void> {
  // Lista as campanhas do usuário (com seu papel).
  app.get('/api/campaigns', async (req) => {
    const uid = requireUser(req);
    const memberships = await prisma.campaignMember.findMany({
      where: { userId: uid },
      include: { campaign: { include: { _count: { select: { sessions: true } } } } },
      orderBy: { campaign: { createdAt: 'desc' } },
    });
    const campaigns: CampaignSummary[] = memberships.map((m) => ({
      id: m.campaign.id,
      name: m.campaign.name,
      synopsis: m.campaign.synopsis,
      role: m.role,
      joinCode: m.role === 'MASTER' ? m.campaign.joinCode : null,
      sessionCount: m.campaign._count.sessions,
    }));
    return { campaigns };
  });

  // Cria uma campanha (criador vira MASTER).
  app.post('/api/campaigns', async (req, reply) => {
    const uid = requireUser(req);
    const body = campaignCreateSchema.parse(req.body);
    let joinCode = makeJoinCode();
    // garante unicidade
    while (await prisma.campaign.findUnique({ where: { joinCode } })) joinCode = makeJoinCode();
    const campaign = await prisma.campaign.create({
      data: {
        name: body.name,
        synopsis: body.synopsis ?? null,
        joinCode,
        members: { create: { userId: uid, role: 'MASTER' } },
      },
    });
    reply.code(201);
    return {
      campaign: {
        id: campaign.id,
        name: campaign.name,
        synopsis: campaign.synopsis,
        role: 'MASTER',
        joinCode: campaign.joinCode,
        sessionCount: 0,
      } satisfies CampaignSummary,
    };
  });

  // Ingressa numa campanha por código (como PLAYER).
  app.post('/api/campaigns/join', async (req) => {
    const uid = requireUser(req);
    const body = campaignJoinSchema.parse(req.body);
    const campaign = await prisma.campaign.findUnique({ where: { joinCode: body.joinCode.toUpperCase() } });
    if (!campaign) throw httpError(404, 'CAMPAIGN_NOT_FOUND', 'Código de campanha inválido');
    const existing = await getRoleInCampaign(campaign.id, uid);
    if (!existing) {
      await prisma.campaignMember.create({ data: { campaignId: campaign.id, userId: uid, role: 'PLAYER' } });
    }
    return { campaign: { id: campaign.id, name: campaign.name } };
  });

  // Detalhe da campanha (projeção por papel — joinCode/scenes só ao mestre).
  app.get('/api/campaigns/:id', async (req) => {
    const uid = requireUser(req);
    const { id } = req.params as { id: string };
    const role = await getRoleInCampaign(id, uid);
    if (!role) throw httpError(403, 'FORBIDDEN', 'Sem acesso a esta campanha');
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        members: { include: { user: true } },
        sessions: true,
        scenes: true,
      },
    });
    if (!campaign) throw httpError(404, 'NOT_FOUND', 'Campanha não encontrada');
    const isMaster = role === 'MASTER';
    const detail: CampaignDetail = {
      id: campaign.id,
      name: campaign.name,
      synopsis: campaign.synopsis,
      role,
      joinCode: isMaster ? campaign.joinCode : null,
      sessionCount: campaign.sessions.length,
      members: campaign.members.map((m) => ({ userId: m.userId, displayName: m.user.displayName, role: m.role })),
      sessions: campaign.sessions.map((s) => ({ id: s.id, name: s.name })),
      scenes: isMaster
        ? campaign.scenes.map((sc) => ({
            id: sc.id,
            title: sc.title,
            status: sc.status,
            isActive: campaign.sessions.some((s) => s.activeSceneId === sc.id),
          }))
        : [],
    };
    return { campaign: detail };
  });

  // Cria uma sessão (apenas mestre).
  app.post('/api/campaigns/:id/sessions', async (req, reply) => {
    const uid = requireUser(req);
    const { id } = req.params as { id: string };
    const role = await getRoleInCampaign(id, uid);
    if (role !== 'MASTER') throw httpError(403, 'FORBIDDEN', 'Apenas o mestre cria sessões');
    const body = sessionCreateSchema.parse(req.body);
    const session = await prisma.session.create({ data: { campaignId: id, name: body.name } });
    reply.code(201);
    return { session: { id: session.id, name: session.name } };
  });
}

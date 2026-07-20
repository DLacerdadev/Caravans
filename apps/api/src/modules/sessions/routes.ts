import type { FastifyInstance } from 'fastify';
import { requireUser, getRoleInCampaign, httpError } from '../../plugins/auth.js';
import { buildSnapshot, getSessionContext, listMySessions } from './state.js';

export async function sessionRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/my/sessions', async (req) => {
    const uid = requireUser(req);
    return { sessions: await listMySessions(uid) };
  });

  app.get('/api/sessions/:id/state', async (req) => {
    const uid = requireUser(req);
    const { id } = req.params as { id: string };
    const ctx = await getSessionContext(id);
    if (!ctx) throw httpError(404, 'NOT_FOUND', 'Sessão não encontrada');
    const role = await getRoleInCampaign(ctx.campaignId, uid);
    if (!role) throw httpError(403, 'FORBIDDEN', 'Sem acesso a esta sessão');
    return { snapshot: await buildSnapshot(id, uid, role) };
  });
}

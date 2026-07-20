import type { FastifyInstance } from 'fastify';
import { registerSchema, loginSchema } from '@caravans/shared';
import { prisma } from '../../db/client.js';
import {
  hashPassword,
  verifyPassword,
  setSessionCookie,
  clearSessionCookie,
  requireUser,
  httpError,
} from '../../plugins/auth.js';

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/auth/register', async (req, reply) => {
    const body = registerSchema.parse(req.body);
    const exists = await prisma.user.findUnique({ where: { email: body.email } });
    if (exists) throw httpError(409, 'EMAIL_TAKEN', 'E-mail já cadastrado');
    const user = await prisma.user.create({
      data: {
        email: body.email,
        passwordHash: await hashPassword(body.password),
        displayName: body.displayName,
      },
    });
    setSessionCookie(reply, user.id);
    reply.code(201);
    return { user: { id: user.id, email: user.email, displayName: user.displayName } };
  });

  app.post('/api/auth/login', async (req, reply) => {
    const body = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user || !(await verifyPassword(user.passwordHash, body.password))) {
      throw httpError(401, 'BAD_CREDENTIALS', 'Credenciais inválidas');
    }
    setSessionCookie(reply, user.id);
    return { user: { id: user.id, email: user.email, displayName: user.displayName } };
  });

  app.post('/api/auth/logout', async (_req, reply) => {
    clearSessionCookie(reply);
    reply.code(204);
  });

  app.get('/api/auth/me', async (req) => {
    const uid = requireUser(req);
    const user = await prisma.user.findUnique({ where: { id: uid } });
    if (!user) throw httpError(401, 'UNAUTHENTICATED', 'Não autenticado');
    return { user: { id: user.id, email: user.email, displayName: user.displayName } };
  });
}

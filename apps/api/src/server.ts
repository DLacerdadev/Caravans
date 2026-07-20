import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
import fastifySocketIO from 'fastify-socket.io';
import type { Server as IOServer } from 'socket.io';
import { ZodError } from 'zod';
import { config, COOKIE_NAME } from './config.js';
import { verifySession } from './plugins/auth.js';
import { authRoutes } from './modules/auth/routes.js';
import { sessionRoutes } from './modules/sessions/routes.js';
import { registerGateway } from './realtime/gateway.js';

/** Cria a aplicação (registrada e pronta), sem chamar listen — usada por main() e por testes. */
export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: { level: process.env.NODE_ENV === 'test' ? 'silent' : 'info' } });

  await app.register(cors, { origin: config.webOrigin, credentials: true });
  await app.register(cookie);
  await app.register(multipart, { limits: { fileSize: config.maxUploadMb * 1024 * 1024 } });
  await app.register(fastifySocketIO, { cors: { origin: config.webOrigin, credentials: true } });

  app.addHook('onRequest', async (req) => {
    const token = req.cookies?.[COOKIE_NAME];
    const uid = verifySession(token);
    if (uid) req.userId = uid;
  });

  app.setErrorHandler((err, _req, reply) => {
    if (err instanceof ZodError) {
      reply.code(400).send({ error: { code: 'VALIDATION', message: 'Dados inválidos', details: err.flatten() } });
      return;
    }
    const statusCode = (err as { statusCode?: number }).statusCode ?? 500;
    const code = (err as { code?: string }).code ?? 'INTERNAL';
    if (statusCode >= 500) app.log.error(err);
    reply.code(statusCode).send({ error: { code, message: err.message } });
  });

  app.get('/api/health', async () => ({ ok: true }));
  await app.register(authRoutes);
  await app.register(sessionRoutes);

  await app.ready();
  registerGateway((app as unknown as { io: IOServer }).io);
  return app;
}

async function main() {
  const app = await buildApp();
  await app.listen({ port: config.port, host: '0.0.0.0' });
  app.log.info(`API + Socket.IO em http://localhost:${config.port}`);
}

// Só sobe o servidor quando executado diretamente (não durante testes que importam buildApp).
if (process.env.NODE_ENV !== 'test') {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { AddressInfo } from 'node:net';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/server.js';

let app: FastifyInstance;
let base: string;

beforeAll(async () => {
  app = await buildApp();
  await app.listen({ port: 0, host: '127.0.0.1' });
  base = `http://127.0.0.1:${(app.server.address() as AddressInfo).port}`;
});
afterAll(async () => {
  await app.close();
});

const uniqueEmail = () => `t${Date.now()}${Math.floor(Math.random() * 1e6)}@caravans.test`;

describe('contrato — autenticação', () => {
  it('registra, identifica (me) e rejeita senha errada', async () => {
    const email = uniqueEmail();

    const reg = await fetch(`${base}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'segredo123', displayName: 'Teste' }),
    });
    expect(reg.status).toBe(201);
    const cookie = (reg.headers.get('set-cookie') ?? '').split(';')[0]!;
    expect(cookie).toContain('caravans_session=');

    const me = await fetch(`${base}/api/auth/me`, { headers: { Cookie: cookie } });
    expect(me.status).toBe(200);
    expect((await me.json()).user.email).toBe(email);

    const bad = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'errada' }),
    });
    expect(bad.status).toBe(401);
  });

  it('bloqueia /me sem sessão', async () => {
    const res = await fetch(`${base}/api/auth/me`);
    expect(res.status).toBe(401);
  });
});

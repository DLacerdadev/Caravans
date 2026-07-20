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

async function registerUser(displayName: string): Promise<string> {
  const res = await fetch(`${base}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: uniqueEmail(), password: 'segredo123', displayName }),
  });
  return (res.headers.get('set-cookie') ?? '').split(';')[0]!;
}
function jsonHeaders(cookie: string) {
  return { 'Content-Type': 'application/json', Cookie: cookie };
}

describe('contrato — campanhas e papéis', () => {
  it('criar → ingressar → assimetria do joinCode por papel', async () => {
    const master = await registerUser('Mestre X');
    const player = await registerUser('Jogador Y');

    // mestre cria campanha
    const created = await fetch(`${base}/api/campaigns`, {
      method: 'POST',
      headers: jsonHeaders(master),
      body: JSON.stringify({ name: 'Campanha de Teste' }),
    });
    expect(created.status).toBe(201);
    const { campaign } = await created.json();
    expect(campaign.role).toBe('MASTER');
    expect(campaign.joinCode).toMatch(/^[A-Z0-9]{6}$/);

    // jogador ingressa pelo código
    const joined = await fetch(`${base}/api/campaigns/join`, {
      method: 'POST',
      headers: jsonHeaders(player),
      body: JSON.stringify({ joinCode: campaign.joinCode }),
    });
    expect(joined.status).toBe(200);

    // jogador lista: vê a campanha como PLAYER e SEM joinCode
    const playerList = await (await fetch(`${base}/api/campaigns`, { headers: { Cookie: player } })).json();
    const seen = playerList.campaigns.find((c: { id: string }) => c.id === campaign.id);
    expect(seen.role).toBe('PLAYER');
    expect(seen.joinCode).toBeNull();

    // detalhe: mestre vê joinCode; jogador não
    const masterDetail = await (await fetch(`${base}/api/campaigns/${campaign.id}`, { headers: { Cookie: master } })).json();
    expect(masterDetail.campaign.joinCode).toBe(campaign.joinCode);
    const playerDetail = await (await fetch(`${base}/api/campaigns/${campaign.id}`, { headers: { Cookie: player } })).json();
    expect(playerDetail.campaign.joinCode).toBeNull();

    // mestre cria sessão; jogador não pode
    const sess = await fetch(`${base}/api/campaigns/${campaign.id}/sessions`, {
      method: 'POST',
      headers: jsonHeaders(master),
      body: JSON.stringify({ name: 'Sessão de Teste' }),
    });
    expect(sess.status).toBe(201);

    const forbidden = await fetch(`${base}/api/campaigns/${campaign.id}/sessions`, {
      method: 'POST',
      headers: jsonHeaders(player),
      body: JSON.stringify({ name: 'Não deveria' }),
    });
    expect(forbidden.status).toBe(403);
  });

  it('rejeita código inválido', async () => {
    const user = await registerUser('Alguém');
    const res = await fetch(`${base}/api/campaigns/join`, {
      method: 'POST',
      headers: jsonHeaders(user),
      body: JSON.stringify({ joinCode: 'ZZZZZZ' }),
    });
    expect(res.status).toBe(404);
  });
});

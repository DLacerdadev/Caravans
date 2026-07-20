import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { AddressInfo } from 'node:net';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/server.js';
import { CLIENT_EVENTS, SERVER_EVENTS } from '@caravans/shared';
import { setupWorld, loginCookie, connect, once, sleep, type World } from '../helpers.js';

let app: FastifyInstance;
let base: string;
let world: World;

beforeAll(async () => {
  app = await buildApp();
  await app.listen({ port: 0, host: '127.0.0.1' });
  base = `http://127.0.0.1:${(app.server.address() as AddressInfo).port}`;
  world = await setupWorld();
});
afterAll(async () => {
  await app.close();
});

describe('US3 — controles do mestre', () => {
  it('revelar chega ao jogador; relógio fica só com o mestre', async () => {
    const mCookie = await loginCookie(base, world.masterEmail, world.password);
    const pCookie = await loginCookie(base, world.playerEmail, world.password);
    const master = connect(base, mCookie);
    const player = connect(base, pCookie);
    try {
      const mReady = once(master, SERVER_EVENTS.SCENE_SNAPSHOT);
      const pReady = once(player, SERVER_EVENTS.SCENE_SNAPSHOT);
      master.emit(CLIENT_EVENTS.SESSION_JOIN, { sessionId: world.sessionId });
      player.emit(CLIENT_EVENTS.SESSION_JOIN, { sessionId: world.sessionId });
      await mReady;
      await pReady;

      // Revelar manual → jogador recebe, sem dt
      const revealed = once<{ clue: { text: string } }>(player, SERVER_EVENTS.CLUE_REVEALED);
      master.emit(CLIENT_EVENTS.CLUE_REVEAL, { clueId: world.clueId });
      const ev = await revealed;
      expect(ev.clue.text).toContain('sangue');
      expect(JSON.stringify(ev)).not.toMatch(/"dt"/);

      // Relógio: mestre recebe clock:updated; jogador NÃO
      let playerGotClock = false;
      player.on(SERVER_EVENTS.CLOCK_UPDATED, () => {
        playerGotClock = true;
      });
      const masterClock = once<{ clock: { current: number } }>(master, SERVER_EVENTS.CLOCK_UPDATED);
      master.emit(CLIENT_EVENTS.CLOCK_ADVANCE, { clockId: world.clockId, delta: 1 });
      const clk = await masterClock;
      expect(clk.clock.current).toBe(2);
      await sleep(300);
      expect(playerGotClock).toBe(false);
    } finally {
      master.disconnect();
      player.disconnect();
    }
  });
});

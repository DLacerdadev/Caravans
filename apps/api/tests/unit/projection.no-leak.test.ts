import { describe, it, expect } from 'vitest';
import {
  buildPlayerSnapshot,
  buildMasterSnapshot,
  type RawScene,
  type RawClue,
} from '../../src/realtime/projection.js';
import { Skill, DiscoveryScope } from '@caravans/shared';

const clueHidden: RawClue = {
  id: 'clue-hidden',
  sceneObjectId: 'obj1',
  skill: Skill.OCULTISMO,
  dt: 20,
  text: 'SEGREDO OCULTO — não deve vazar',
  order: 2,
};
const clueFound: RawClue = {
  id: 'clue-found',
  sceneObjectId: 'obj1',
  skill: Skill.INVESTIGACAO,
  dt: 10,
  text: 'O sangue é humano.',
  order: 1,
};

const scene: RawScene = {
  id: 'scene1',
  title: 'O Gabinete do Relojoeiro',
  imagePath: null,
  imageWidth: null,
  imageHeight: null,
  objects: [
    {
      id: 'obj1',
      name: 'Marca de sangue',
      description: null,
      x: 0.4,
      y: 0.5,
      state: {},
      clues: [clueFound, clueHidden],
    },
  ],
};

const discoveries = [{ clueId: 'clue-found', scope: DiscoveryScope.GROUP, userId: null }];
const clocks = [{ id: 'clk1', name: 'A Congregação de Ferro', current: 3, max: 5 }];

describe('projeção do jogador — não vaza dado oculto (SC-003)', () => {
  const snap = buildPlayerSnapshot({
    sessionId: 's1',
    seq: 7,
    scene,
    discoveries,
    intents: [],
    userId: 'u-player',
  });
  const json = JSON.stringify(snap);

  it('não contém a palavra "dt" em nenhum lugar do payload', () => {
    expect(json).not.toMatch(/"dt"/);
  });
  it('não contém o texto de pista não descoberta', () => {
    expect(json).not.toContain('SEGREDO OCULTO');
  });
  it('não contém nenhum relógio de ameaça', () => {
    expect(json).not.toContain('Congregação de Ferro');
    expect(json).not.toMatch(/"clocks"/);
  });
  it('inclui apenas a pista descoberta', () => {
    expect(snap.scene?.objects[0]?.clues.map((c) => c.id)).toEqual(['clue-found']);
    expect(snap.groupClues.map((c) => c.id)).toEqual(['clue-found']);
  });
});

describe('projeção do mestre — vê tudo', () => {
  const snap = buildMasterSnapshot({ sessionId: 's1', seq: 7, scene, discoveries, intents: [], clocks, scenes: [] });
  it('inclui DTs e todas as pistas', () => {
    const clues = snap.scene?.objects[0]?.clues ?? [];
    expect(clues).toHaveLength(2);
    expect(clues.every((c) => typeof c.dt === 'number')).toBe(true);
  });
  it('inclui os relógios de ameaça', () => {
    expect(snap.clocks[0]?.name).toBe('A Congregação de Ferro');
  });
});

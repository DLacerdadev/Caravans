import { describe, it, expect } from 'vitest';
import {
  rollD20,
  rollTest,
  resolveReveal,
  advanceClock,
  isClockComplete,
  type Rng,
} from '../src/rules/index.js';
import { Skill } from '../src/domain/enums.js';

/** RNG determinístico: devolve valores fixos em sequência. */
function seq(values: number[]): Rng {
  let i = 0;
  return () => values[i++ % values.length]!;
}

describe('rollD20', () => {
  it('mapeia [0,1) para 1..20', () => {
    expect(rollD20(() => 0)).toBe(1);
    expect(rollD20(() => 0.999)).toBe(20);
    expect(rollD20(() => 0.5)).toBe(11);
  });
});

describe('rollTest', () => {
  it('soma d20 + modificador', () => {
    const r = rollTest({ skillMod: 3, rng: () => 0.5 }); // d20 = 11
    expect(r).toEqual({ d20: 11, mod: 3, total: 14 });
  });
  it('modificador padrão é 0 (MVP)', () => {
    const r = rollTest({ rng: () => 0 });
    expect(r.total).toBe(1);
  });
});

describe('resolveReveal', () => {
  const clues = [
    { id: 'a', skill: Skill.INVESTIGACAO, dt: 10 },
    { id: 'b', skill: Skill.INVESTIGACAO, dt: 15 },
    { id: 'c', skill: Skill.INVESTIGACAO, dt: 20 },
    { id: 'd', skill: Skill.OCULTISMO, dt: 15 },
  ];
  it('revela apenas pistas da mesma perícia com DT ≤ resultado', () => {
    const out = resolveReveal(clues, Skill.INVESTIGACAO, 15).map((c) => c.id);
    expect(out).toEqual(['a', 'b']);
  });
  it('não vaza pistas de outra perícia', () => {
    const out = resolveReveal(clues, Skill.INVESTIGACAO, 20).map((c) => c.id);
    expect(out).not.toContain('d');
  });
  it('resultado baixo não revela nada', () => {
    expect(resolveReveal(clues, Skill.INVESTIGACAO, 5)).toHaveLength(0);
  });
});

describe('advanceClock', () => {
  it('avança respeitando o máximo', () => {
    expect(advanceClock({ current: 1, max: 5 }).current).toBe(2);
    expect(advanceClock({ current: 5, max: 5 }).current).toBe(5);
  });
  it('recua sem passar de 0', () => {
    expect(advanceClock({ current: 0, max: 4 }, -1).current).toBe(0);
  });
  it('marca completo', () => {
    expect(isClockComplete({ current: 4, max: 4 })).toBe(true);
    expect(isClockComplete({ current: 3, max: 4 })).toBe(false);
  });
});

// uso do seq() para garantir sequência determinística de rolagens
describe('sequência determinística', () => {
  it('produz rolagens previsíveis', () => {
    const rng = seq([0, 0.999]);
    expect(rollD20(rng)).toBe(1);
    expect(rollD20(rng)).toBe(20);
  });
});

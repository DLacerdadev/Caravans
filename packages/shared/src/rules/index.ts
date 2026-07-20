// Motor de regras — funções PURAS, sem I/O, com RNG injetável (Princípio V).
import type { Skill } from '../domain/enums.js';

/** Gerador de aleatoriedade em [0,1). Injetável para testes determinísticos. */
export type Rng = () => number;
export const defaultRng: Rng = () => Math.random();

/** Rola 1d20 (1..20). */
export function rollD20(rng: Rng = defaultRng): number {
  return Math.floor(rng() * 20) + 1;
}

export interface RollResult {
  d20: number;
  mod: number;
  total: number;
}

/** Resolve um teste: d20 + modificador de perícia. No MVP o modificador é 0 por padrão
 *  (fichas de personagem são evolução futura). */
export function rollTest(params: { skillMod?: number; rng?: Rng } = {}): RollResult {
  const mod = params.skillMod ?? 0;
  const d20 = rollD20(params.rng ?? defaultRng);
  return { d20, mod, total: d20 + mod };
}

export interface ClueLike {
  id: string;
  skill: Skill;
  dt: number;
}

/** Revela as pistas do alvo cuja PERÍCIA bate com a da intenção E cujo DT ≤ resultado.
 *  Uma perícia nunca revela pistas de outra perícia (ex.: Investigação não abre Ocultismo). */
export function resolveReveal<T extends ClueLike>(clues: T[], skill: Skill, rollTotal: number): T[] {
  return clues.filter((c) => c.skill === skill && c.dt <= rollTotal);
}

export interface ClockLike {
  current: number;
  max: number;
}

/** Avança/recua um relógio, mantendo-o em [0, max]. */
export function advanceClock<T extends ClockLike>(clock: T, delta = 1): T {
  const current = Math.max(0, Math.min(clock.max, clock.current + delta));
  return { ...clock, current };
}

export function isClockComplete(clock: ClockLike): boolean {
  return clock.current >= clock.max;
}

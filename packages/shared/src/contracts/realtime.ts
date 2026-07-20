// Contratos de tempo real (Socket.IO). Payloads cliente→servidor validados por Zod.
import { z } from 'zod';
import { ResolveDecision, Skill } from '../domain/enums.js';
import type { ClueView, ClockView, IntentView, SceneSnapshot } from './views.js';

// ---- Nomes de evento ----
export const CLIENT_EVENTS = {
  SESSION_JOIN: 'session:join',
  INTENT_SUBMIT: 'intent:submit',
  INTENT_RESOLVE: 'intent:resolve',
  CLUE_REVEAL: 'clue:reveal',
  CLOCK_ADVANCE: 'clock:advance',
  SCENE_SWITCH: 'scene:switch',
} as const;

export const SERVER_EVENTS = {
  SCENE_SNAPSHOT: 'scene:snapshot',
  INTENT_CREATED: 'intent:created',
  INTENT_UPDATED: 'intent:updated',
  CLUE_REVEALED: 'clue:revealed',
  CLOCK_UPDATED: 'clock:updated',
  SCENE_CHANGED: 'scene:changed',
  ERROR: 'error',
} as const;

// ---- Cliente → Servidor (validados) ----
export const sessionJoinSchema = z.object({ sessionId: z.string().min(1) });
export type SessionJoinInput = z.infer<typeof sessionJoinSchema>;

export const intentSubmitSchema = z.object({
  sessionId: z.string().min(1),
  clientIntentId: z.string().uuid(),
  targetObjectId: z.string().min(1).optional(),
  action: z.string().min(1).max(280),
  skill: z.nativeEnum(Skill),
});
export type IntentSubmitInput = z.infer<typeof intentSubmitSchema>;

export const intentResolveSchema = z.object({
  intentId: z.string().min(1),
  decision: z.nativeEnum(ResolveDecision),
  note: z.string().max(280).optional(),
});
export type IntentResolveInput = z.infer<typeof intentResolveSchema>;

export const clueRevealSchema = z.object({ clueId: z.string().min(1) });
export type ClueRevealInput = z.infer<typeof clueRevealSchema>;

export const clockAdvanceSchema = z.object({
  clockId: z.string().min(1),
  delta: z.union([z.literal(1), z.literal(-1)]),
});
export type ClockAdvanceInput = z.infer<typeof clockAdvanceSchema>;

export const sceneSwitchSchema = z.object({
  sessionId: z.string().min(1),
  sceneId: z.string().min(1),
});
export type SceneSwitchInput = z.infer<typeof sceneSwitchSchema>;

// ---- Servidor → Cliente (tipos) ----
export interface SceneSnapshotEvent {
  seq: number;
  snapshot: SceneSnapshot;
}
export interface IntentCreatedEvent {
  seq: number;
  intent: IntentView;
}
export interface IntentUpdatedEvent {
  seq: number;
  intent: IntentView;
}
export interface ClueRevealedEvent {
  seq: number;
  clue: ClueView;
  scope: 'PLAYER' | 'GROUP';
  byUserId?: string;
}
export interface ClockUpdatedEvent {
  seq: number;
  clock: ClockView;
}
export interface SceneChangedEvent {
  seq: number;
  sceneId: string;
}
export interface RealtimeErrorEvent {
  code: string;
  message: string;
}

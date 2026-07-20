// Formas PROJETADAS enviadas do servidor ao cliente (saída). A projeção por papel garante que a
// visão do jogador nunca contém DT, pista não descoberta ou valores de relógio (Princípio III).
import type { IntentStatus, Role, Skill } from '../domain/enums.js';

export interface UserDto {
  id: string;
  email: string;
  displayName: string;
}

export interface SessionSummary {
  id: string;
  name: string;
}

export interface CampaignSummary {
  id: string;
  name: string;
  synopsis: string | null;
  role: Role;
  joinCode: string | null; // só preenchido para o mestre
  sessionCount: number;
}

export interface CampaignMemberDto {
  userId: string;
  displayName: string;
  role: Role;
}

export interface SceneSummary {
  id: string;
  title: string;
  status: string;
  isActive: boolean;
}

export interface CampaignDetail extends CampaignSummary {
  members: CampaignMemberDto[];
  sessions: SessionSummary[];
  scenes: SceneSummary[]; // vazio para jogadores
}

/** Pista como o JOGADOR vê (somente descobertas; sem DT). */
export interface ClueView {
  id: string;
  sceneObjectId: string;
  skill: Skill;
  text: string;
  order: number;
}

/** Pista como o MESTRE vê (inclui DT e todas as pistas). */
export interface ClueMasterView extends ClueView {
  dt: number;
  discovered: boolean;
}

export interface SceneObjectView {
  id: string;
  name: string;
  description?: string | null;
  x: number;
  y: number;
  state: Record<string, unknown>;
  clues: ClueView[];
}

export interface SceneObjectMasterView extends Omit<SceneObjectView, 'clues'> {
  clues: ClueMasterView[];
}

export interface SceneView {
  id: string;
  title: string;
  imagePath?: string | null;
  imageWidth?: number | null;
  imageHeight?: number | null;
  objects: SceneObjectView[];
}

export interface SceneMasterView extends Omit<SceneView, 'objects'> {
  objects: SceneObjectMasterView[];
}

export interface IntentView {
  id: string;
  authorId: string;
  authorName: string;
  targetObjectId?: string | null;
  action: string;
  skill: Skill;
  status: IntentStatus;
  rollResult?: number | null;
  note?: string | null;
  createdAt: string;
}

/** Relógio de ameaça — SÓ enviado ao mestre. */
export interface ClockView {
  id: string;
  name: string;
  current: number;
  max: number;
}

export interface PlayerSnapshot {
  role: Extract<Role, 'PLAYER'>;
  sessionId: string;
  seq: number;
  scene: SceneView | null;
  myIntents: IntentView[];
  groupClues: ClueView[];
}

export interface MasterSnapshot {
  role: Extract<Role, 'MASTER'>;
  sessionId: string;
  seq: number;
  scene: SceneMasterView | null;
  intents: IntentView[];
  clocks: ClockView[];
  scenes: SceneSummary[]; // cenas disponíveis da campanha (para troca de cena)
}

export type SceneSnapshot = PlayerSnapshot | MasterSnapshot;

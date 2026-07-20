// Projeções por papel — funções PURAS (sem I/O) que decidem o que cada papel recebe.
// Garantem a assimetria (Princípio III): a visão do jogador nunca contém dt, pista oculta ou relógio.
import type {
  ClueView,
  ClueMasterView,
  IntentView,
  ClockView,
  MasterSnapshot,
  PlayerSnapshot,
  SceneMasterView,
  SceneObjectMasterView,
  SceneObjectView,
  SceneView,
} from '@caravans/shared';
import { DiscoveryScope } from '@caravans/shared';
import type { Skill, IntentStatus } from '@caravans/shared';

export interface RawClue {
  id: string;
  sceneObjectId: string;
  skill: Skill;
  dt: number;
  text: string;
  order: number;
}
export interface RawObject {
  id: string;
  name: string;
  description: string | null;
  x: number;
  y: number;
  state: unknown;
  clues: RawClue[];
}
export interface RawScene {
  id: string;
  title: string;
  imagePath: string | null;
  imageWidth: number | null;
  imageHeight: number | null;
  objects: RawObject[];
}
export interface RawIntent {
  id: string;
  authorId: string;
  authorName: string;
  targetObjectId: string | null;
  action: string;
  skill: Skill;
  status: IntentStatus;
  rollResult: number | null;
  note: string | null;
  createdAt: Date | string;
}
export interface RawClock {
  id: string;
  name: string;
  current: number;
  max: number;
}
export interface RawDiscovery {
  clueId: string;
  scope: string; // 'PLAYER' | 'GROUP'
  userId: string | null;
}

function intentView(i: RawIntent): IntentView {
  return {
    id: i.id,
    authorId: i.authorId,
    authorName: i.authorName,
    targetObjectId: i.targetObjectId,
    action: i.action,
    skill: i.skill,
    status: i.status,
    rollResult: i.rollResult,
    note: i.note,
    createdAt: typeof i.createdAt === 'string' ? i.createdAt : i.createdAt.toISOString(),
  };
}

function playerClue(c: RawClue): ClueView {
  return { id: c.id, sceneObjectId: c.sceneObjectId, skill: c.skill, text: c.text, order: c.order };
}
function masterClue(c: RawClue, discovered: boolean): ClueMasterView {
  return { ...playerClue(c), dt: c.dt, discovered };
}

/** Conjunto de clueIds visíveis ao jogador: descobertas do grupo + as pessoais dele. */
function visibleClueIds(discoveries: RawDiscovery[], userId: string): Set<string> {
  const ids = new Set<string>();
  for (const d of discoveries) {
    if (d.scope === DiscoveryScope.GROUP) ids.add(d.clueId);
    else if (d.scope === DiscoveryScope.PLAYER && d.userId === userId) ids.add(d.clueId);
  }
  return ids;
}

export function toPlayerScene(scene: RawScene | null, visibleIds: Set<string>): SceneView | null {
  if (!scene) return null;
  const objects: SceneObjectView[] = scene.objects.map((o) => ({
    id: o.id,
    name: o.name,
    description: o.description,
    x: o.x,
    y: o.y,
    state: (o.state as Record<string, unknown>) ?? {},
    clues: o.clues.filter((c) => visibleIds.has(c.id)).map(playerClue),
  }));
  return {
    id: scene.id,
    title: scene.title,
    imagePath: scene.imagePath,
    imageWidth: scene.imageWidth,
    imageHeight: scene.imageHeight,
    objects,
  };
}

export function toMasterScene(scene: RawScene | null, discoveredIds: Set<string>): SceneMasterView | null {
  if (!scene) return null;
  const objects: SceneObjectMasterView[] = scene.objects.map((o) => ({
    id: o.id,
    name: o.name,
    description: o.description,
    x: o.x,
    y: o.y,
    state: (o.state as Record<string, unknown>) ?? {},
    clues: o.clues.map((c) => masterClue(c, discoveredIds.has(c.id))),
  }));
  return {
    id: scene.id,
    title: scene.title,
    imagePath: scene.imagePath,
    imageWidth: scene.imageWidth,
    imageHeight: scene.imageHeight,
    objects,
  };
}

export function buildPlayerSnapshot(args: {
  sessionId: string;
  seq: number;
  scene: RawScene | null;
  discoveries: RawDiscovery[];
  intents: RawIntent[];
  userId: string;
}): PlayerSnapshot {
  const visible = visibleClueIds(args.discoveries, args.userId);
  const groupClues: ClueView[] = [];
  if (args.scene) {
    for (const o of args.scene.objects) {
      for (const c of o.clues) if (visible.has(c.id)) groupClues.push(playerClue(c));
    }
  }
  return {
    role: 'PLAYER',
    sessionId: args.sessionId,
    seq: args.seq,
    scene: toPlayerScene(args.scene, visible),
    myIntents: args.intents.filter((i) => i.authorId === args.userId).map(intentView),
    groupClues,
  };
}

export function buildMasterSnapshot(args: {
  sessionId: string;
  seq: number;
  scene: RawScene | null;
  discoveries: RawDiscovery[];
  intents: RawIntent[];
  clocks: RawClock[];
}): MasterSnapshot {
  const discovered = new Set(args.discoveries.map((d) => d.clueId));
  const clocks: ClockView[] = args.clocks.map((c) => ({
    id: c.id,
    name: c.name,
    current: c.current,
    max: c.max,
  }));
  return {
    role: 'MASTER',
    sessionId: args.sessionId,
    seq: args.seq,
    scene: toMasterScene(args.scene, discovered),
    intents: args.intents.map(intentView),
    clocks,
  };
}

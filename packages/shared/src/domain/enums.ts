// Enums de domínio — fonte única compartilhada entre front, back e (espelhado) Prisma.

export const Role = { MASTER: 'MASTER', PLAYER: 'PLAYER' } as const;
export type Role = (typeof Role)[keyof typeof Role];

export const Skill = {
  INVESTIGACAO: 'INVESTIGACAO',
  OCULTISMO: 'OCULTISMO',
  PERCEPCAO: 'PERCEPCAO',
  FORCA: 'FORCA',
  FURTIVIDADE: 'FURTIVIDADE',
  MEDICINA: 'MEDICINA',
} as const;
export type Skill = (typeof Skill)[keyof typeof Skill];
export const SKILLS: Skill[] = Object.values(Skill);

export const SKILL_LABELS: Record<Skill, string> = {
  INVESTIGACAO: 'Investigação',
  OCULTISMO: 'Ocultismo',
  PERCEPCAO: 'Percepção',
  FORCA: 'Força',
  FURTIVIDADE: 'Furtividade',
  MEDICINA: 'Medicina',
};

export const IntentStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  ADJUSTED: 'ADJUSTED',
  REJECTED: 'REJECTED',
} as const;
export type IntentStatus = (typeof IntentStatus)[keyof typeof IntentStatus];

export const SceneStatus = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  ARCHIVED: 'ARCHIVED',
} as const;
export type SceneStatus = (typeof SceneStatus)[keyof typeof SceneStatus];

export const ResolveDecision = {
  APPROVE: 'APPROVE',
  ADJUST: 'ADJUST',
  REJECT: 'REJECT',
} as const;
export type ResolveDecision = (typeof ResolveDecision)[keyof typeof ResolveDecision];

export const DiscoveryScope = { PLAYER: 'PLAYER', GROUP: 'GROUP' } as const;
export type DiscoveryScope = (typeof DiscoveryScope)[keyof typeof DiscoveryScope];

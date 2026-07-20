// Contratos HTTP (entrada do cliente → validada no servidor). Tipos inferidos via z.infer.
import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Mínimo de 8 caracteres'),
  displayName: z.string().min(1).max(60),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const campaignCreateSchema = z.object({
  name: z.string().min(1).max(120),
  synopsis: z.string().max(2000).optional(),
});
export type CampaignCreateInput = z.infer<typeof campaignCreateSchema>;

export const campaignJoinSchema = z.object({
  joinCode: z.string().min(4).max(16),
});
export type CampaignJoinInput = z.infer<typeof campaignJoinSchema>;

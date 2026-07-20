import jwt from 'jsonwebtoken';
import { hash, verify } from '@node-rs/argon2';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { config, COOKIE_NAME } from '../config.js';
import { prisma } from '../db/client.js';
import type { Role } from '@caravans/shared';

declare module 'fastify' {
  interface FastifyRequest {
    userId?: string;
  }
}

export async function hashPassword(pw: string): Promise<string> {
  return hash(pw);
}
export async function verifyPassword(hashStr: string, pw: string): Promise<boolean> {
  try {
    return await verify(hashStr, pw);
  } catch {
    return false;
  }
}

export function signSession(userId: string): string {
  return jwt.sign({ sub: userId }, config.jwtSecret, { expiresIn: '7d' });
}
export function verifySession(token: string | undefined | null): string | null {
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { sub?: string };
    return decoded.sub ?? null;
  } catch {
    return null;
  }
}

export function setSessionCookie(reply: FastifyReply, userId: string): void {
  reply.setCookie(COOKIE_NAME, signSession(userId), {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.cookieSecure,
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}
export function clearSessionCookie(reply: FastifyReply): void {
  reply.clearCookie(COOKIE_NAME, { path: '/' });
}

/** Erro com statusCode para o error handler. */
export function httpError(statusCode: number, code: string, message: string): Error {
  const e = new Error(message) as Error & { statusCode: number; code: string };
  e.statusCode = statusCode;
  e.code = code;
  return e;
}

export function requireUser(req: FastifyRequest): string {
  if (!req.userId) throw httpError(401, 'UNAUTHENTICATED', 'Não autenticado');
  return req.userId;
}

export async function getRoleInCampaign(campaignId: string, userId: string): Promise<Role | null> {
  const m = await prisma.campaignMember.findUnique({
    where: { campaignId_userId: { campaignId, userId } },
  });
  return (m?.role as Role | undefined) ?? null;
}

/** Cookie parse simples para o handshake do Socket.IO. */
export function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  }
  return out;
}
export const COOKIE = COOKIE_NAME;

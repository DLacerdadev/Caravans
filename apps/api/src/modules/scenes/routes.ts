import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import { extname, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { Skill } from '@caravans/shared';
import { prisma } from '../../db/client.js';
import { requireUser, getRoleInCampaign, httpError } from '../../plugins/auth.js';
import { config } from '../../config.js';

const sceneCreateSchema = z.object({ title: z.string().min(1).max(160) });
const objectCreateSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
});
const clueCreateSchema = z.object({
  skill: z.nativeEnum(Skill),
  dt: z.number().int().min(1).max(40),
  text: z.string().min(1).max(500),
  order: z.number().int().min(0).optional(),
});

const ALLOWED_MIME = new Set(['image/png', 'image/jpeg', 'image/webp']);
const EXT: Record<string, string> = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp' };

async function requireMasterOfScene(sceneId: string, userId: string) {
  const scene = await prisma.scene.findUnique({ where: { id: sceneId } });
  if (!scene) throw httpError(404, 'NOT_FOUND', 'Cena não encontrada');
  const role = await getRoleInCampaign(scene.campaignId, userId);
  if (role !== 'MASTER') throw httpError(403, 'FORBIDDEN', 'Apenas o mestre');
  return scene;
}

export async function sceneRoutes(app: FastifyInstance): Promise<void> {
  // Ler cena completa (mestre) — para o editor de autoria
  app.get('/api/scenes/:id', async (req) => {
    const uid = requireUser(req);
    const { id } = req.params as { id: string };
    await requireMasterOfScene(id, uid);
    const full = await prisma.scene.findUnique({
      where: { id },
      include: { objects: { include: { clues: { orderBy: { order: 'asc' } } }, orderBy: { createdAt: 'asc' } } },
    });
    if (!full) throw httpError(404, 'NOT_FOUND', 'Cena não encontrada');
    return {
      scene: {
        id: full.id,
        title: full.title,
        imagePath: full.imagePath,
        objects: full.objects.map((o) => ({
          id: o.id,
          name: o.name,
          x: o.x,
          y: o.y,
          clues: o.clues.map((c) => ({ id: c.id, skill: c.skill, dt: c.dt, text: c.text })),
        })),
      },
    };
  });

  // Criar cena (mestre)
  app.post('/api/campaigns/:id/scenes', async (req, reply) => {
    const uid = requireUser(req);
    const { id } = req.params as { id: string };
    const role = await getRoleInCampaign(id, uid);
    if (role !== 'MASTER') throw httpError(403, 'FORBIDDEN', 'Apenas o mestre');
    const body = sceneCreateSchema.parse(req.body);
    const scene = await prisma.scene.create({ data: { campaignId: id, title: body.title } });
    reply.code(201);
    return { scene: { id: scene.id, title: scene.title, status: scene.status } };
  });

  // Upload de imagem da cena (mestre, multipart)
  app.post('/api/scenes/:id/image', async (req) => {
    const uid = requireUser(req);
    const { id } = req.params as { id: string };
    await requireMasterOfScene(id, uid);
    const file = await req.file();
    if (!file) throw httpError(400, 'NO_FILE', 'Nenhum arquivo enviado');
    if (!ALLOWED_MIME.has(file.mimetype)) throw httpError(415, 'BAD_TYPE', 'Tipo de imagem não suportado');

    await mkdir(config.uploadDir, { recursive: true });
    const filename = `${id}-${randomUUID()}${EXT[file.mimetype] ?? extname(file.filename) ?? '.img'}`;
    const dest = join(config.uploadDir, filename);
    await pipeline(file.file, createWriteStream(dest));
    if (file.file.truncated) throw httpError(413, 'TOO_LARGE', 'Imagem excede o tamanho máximo');

    const imagePath = `/uploads/${filename}`;
    await prisma.scene.update({ where: { id }, data: { imagePath } });
    return { imagePath };
  });

  // Adicionar objeto/ponto de interesse (mestre)
  app.post('/api/scenes/:id/objects', async (req, reply) => {
    const uid = requireUser(req);
    const { id } = req.params as { id: string };
    await requireMasterOfScene(id, uid);
    const body = objectCreateSchema.parse(req.body);
    const obj = await prisma.sceneObject.create({
      data: { sceneId: id, name: body.name, description: body.description ?? null, x: body.x, y: body.y },
    });
    reply.code(201);
    return { object: { id: obj.id, name: obj.name } };
  });

  // Adicionar pista a um objeto (mestre)
  app.post('/api/objects/:id/clues', async (req, reply) => {
    const uid = requireUser(req);
    const { id } = req.params as { id: string };
    const obj = await prisma.sceneObject.findUnique({ where: { id } });
    if (!obj) throw httpError(404, 'NOT_FOUND', 'Objeto não encontrado');
    await requireMasterOfScene(obj.sceneId, uid);
    const body = clueCreateSchema.parse(req.body);
    const clue = await prisma.clue.create({
      data: { sceneObjectId: id, skill: body.skill, dt: body.dt, text: body.text, order: body.order ?? 0 },
    });
    reply.code(201);
    return { clue: { id: clue.id } };
  });
}

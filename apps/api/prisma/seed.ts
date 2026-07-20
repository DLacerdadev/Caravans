import { prisma } from '../src/db/client.js';
import { hashPassword } from '../src/plugins/auth.js';
import { Skill } from '@caravans/shared';

async function main() {
  const passwordHash = await hashPassword('caravans123');

  const master = await prisma.user.upsert({
    where: { email: 'mestre@caravans.test' },
    update: {},
    create: { email: 'mestre@caravans.test', passwordHash, displayName: 'Mestre' },
  });
  const player = await prisma.user.upsert({
    where: { email: 'jogador@caravans.test' },
    update: {},
    create: { email: 'jogador@caravans.test', passwordHash, displayName: 'Cordelia Vance' },
  });

  let campaign = await prisma.campaign.findUnique({ where: { joinCode: 'BAKER' } });
  if (!campaign) {
    campaign = await prisma.campaign.create({
      data: {
        name: 'Os Casos de Baker Street',
        synopsis: 'Londres, 1891. Desaparecimentos ligam relojoeiros, docas e uma congregação silenciosa.',
        joinCode: 'BAKER',
      },
    });
  }

  await prisma.campaignMember.upsert({
    where: { campaignId_userId: { campaignId: campaign.id, userId: master.id } },
    update: { role: 'MASTER' },
    create: { campaignId: campaign.id, userId: master.id, role: 'MASTER' },
  });
  await prisma.campaignMember.upsert({
    where: { campaignId_userId: { campaignId: campaign.id, userId: player.id } },
    update: { role: 'PLAYER' },
    create: { campaignId: campaign.id, userId: player.id, role: 'PLAYER' },
  });

  let scene = await prisma.scene.findFirst({ where: { campaignId: campaign.id } });
  if (!scene) {
    scene = await prisma.scene.create({
      data: {
        campaignId: campaign.id,
        title: 'O Gabinete do Relojoeiro',
        status: 'ACTIVE',
        objects: {
          create: [
            {
              name: 'Marca de sangue',
              description: 'Respingos na parede leste.',
              x: 0.42,
              y: 0.55,
              clues: {
                create: [
                  { skill: Skill.INVESTIGACAO, dt: 10, text: 'O sangue é humano.', order: 1 },
                  { skill: Skill.INVESTIGACAO, dt: 15, text: 'Há dois padrões distintos de respingo.', order: 2 },
                  { skill: Skill.INVESTIGACAO, dt: 20, text: 'Parte da marca foi produzida depois da morte.', order: 3 },
                  { skill: Skill.OCULTISMO, dt: 15, text: 'O sangue foi usado como componente de um ritual.', order: 4 },
                ],
              },
            },
            {
              name: 'Relógio parado',
              description: 'Todos os relógios da oficina pararam às 21h47.',
              x: 0.7,
              y: 0.4,
              clues: {
                create: [
                  { skill: Skill.PERCEPCAO, dt: 10, text: 'O ponteiro parou às 21h47.', order: 1 },
                  { skill: Skill.OCULTISMO, dt: 20, text: 'A parada não é mecânica — é um eco.', order: 2 },
                ],
              },
            },
          ],
        },
      },
    });
  }

  let session = await prisma.session.findFirst({ where: { campaignId: campaign.id } });
  if (!session) {
    session = await prisma.session.create({
      data: { campaignId: campaign.id, name: 'Sessão 1', activeSceneId: scene.id },
    });
  } else if (!session.activeSceneId) {
    session = await prisma.session.update({ where: { id: session.id }, data: { activeSceneId: scene.id } });
  }

  const clock = await prisma.threatClock.findFirst({ where: { sessionId: session.id } });
  if (!clock) {
    await prisma.threatClock.create({
      data: { sessionId: session.id, name: 'A Congregação de Ferro', current: 1, max: 5 },
    });
  }

  console.log('\nSeed pronto.');
  console.log('  Mestre : mestre@caravans.test');
  console.log('  Jogador: jogador@caravans.test');
  console.log('  Senha  : caravans123');
  console.log(`  Sessão : ${session.id} (campanha ${campaign.name})\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

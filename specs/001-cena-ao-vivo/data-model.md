# Data Model — MVP 001-cena-ao-vivo

Modelo persistido (PostgreSQL/Prisma) e projeções por papel. Nomes de tipos em inglês para o
código; conceitos mapeiam 1:1 com as entidades da spec.

## Enums

- **Role**: `MASTER` | `PLAYER` — papel do membro na campanha.
- **Skill** (conjunto fixo): `INVESTIGACAO` | `OCULTISMO` | `PERCEPCAO` | `FORCA` | `FURTIVIDADE` |
  `MEDICINA`.
- **IntentStatus**: `PENDING` | `APPROVED` | `ADJUSTED` | `REJECTED`.
- **SceneStatus**: `DRAFT` | `ACTIVE` | `ARCHIVED`.

## Entidades

### User
- `id` (uuid, pk), `email` (único), `passwordHash`, `displayName`, `createdAt`.
- Relacionamentos: `memberships` (CampaignMember[]).

### Campaign
- `id`, `name`, `synopsis?`, `joinCode` (único, para ingresso), `createdAt`.
- Relacionamentos: `members`, `sessions`.

### CampaignMember
- `id`, `campaignId` (fk), `userId` (fk), `role` (Role).
- Regra: único por (`campaignId`, `userId`). Determina autorização por papel.

### Session
- `id`, `campaignId` (fk), `name`, `activeSceneId?` (fk → Scene), `seq` (int, contador monotônico
  de eventos da sessão), `createdAt`.
- Regra: no máximo **uma** cena ativa por vez (`activeSceneId`).

### Scene
- `id`, `campaignId` (fk), `title`, `status` (SceneStatus), `imagePath?` (upload), `imageWidth?`,
  `imageHeight?`, `createdAt`.
- Relacionamentos: `objects` (SceneObject[]).

### SceneObject  (objeto de cena / ponto de interesse)
- `id`, `sceneId` (fk), `name`, `description?`, `x` (0..1), `y` (0..1) — posição **relativa** sobre
  a imagem; `state` (json, ex.: aberto/fechado), `createdAt`.
- Relacionamentos: `clues` (Clue[]).
- Regra: `x`/`y` normalizados (independem da resolução → Princípio I).

### Clue  (pista)  — **contém campos OCULTOS ao jogador**
- `id`, `sceneObjectId` (fk), `skill` (Skill), `dt` (int) 🔒, `text` (string) 🔒 até descoberta,
  `order` (int).
- 🔒 = nunca enviado ao jogador enquanto não descoberta (ver Projeções).

### Intent  (intenção)
- `id`, `sessionId` (fk), `sceneId` (fk), `authorId` (fk → User), `targetObjectId?` (fk),
  `action` (string), `skill` (Skill), `status` (IntentStatus), `clientIntentId` (uuid, único por
  sessão — idempotência), `rollResult?` (int), `rollBreakdown?` (json, ex.: `{d20, mod, total}`),
  `createdAt`, `resolvedAt?`.
- Transições de estado:
  - `PENDING → APPROVED` (mestre aprova; dispara rolagem + possível revelação)
  - `PENDING → ADJUSTED` (mestre devolve ao jogador; jogador refaz → **nova** Intent PENDING)
  - `PENDING → REJECTED` (mestre recusa)

### ClueDiscovery  (descoberta de pista)  — histórico
- `id`, `clueId` (fk), `sessionId` (fk), `scope` (`PLAYER` | `GROUP`), `userId?` (quando PLAYER),
  `intentId?` (origem), `discoveredAt`.
- Regra: idempotente — não duplica descoberta da mesma pista para o mesmo escopo.

### ThreatClock  (relógio de ameaça)  — **OCULTO ao jogador**
- `id`, `sessionId` (fk), `name`, `current` (int) 🔒, `max` (int) 🔒, `createdAt`.

## Relacionamentos (resumo)

```text
User 1—N CampaignMember N—1 Campaign 1—N Session 1—N Intent
Campaign 1—N Scene 1—N SceneObject 1—N Clue 1—N ClueDiscovery
Session 1—N ThreatClock
Session.activeSceneId → Scene
```

## Projeções por papel (imposição da assimetria)

| Entidade | Visão do JOGADOR | Visão do MESTRE |
|---|---|---|
| Clue | apenas pistas **descobertas** (id, skill, text, order); **sem `dt`** | todas as pistas com `dt` e `text` |
| SceneObject | metadados + pistas descobertas | metadados + todas as pistas (com dt) |
| ThreatClock | **não enviado** | `name`, `current`, `max` |
| Intent | próprias intenções + desfecho; sem `dt` de pistas | fila completa com detalhes e rolagem |
| Scene snapshot | objetos + pistas descobertas + histórico do grupo | tudo acima + DTs + relógios |

Funções no servidor: `toPlayerScene(scene, discoveries)` e `toMasterScene(scene)`; um teste de
não-vazamento garante que a saída de `toPlayerScene`/eventos do jogador não contenha `dt`, texto de
pista não descoberta nem campos de `ThreatClock` (SC-003).

## Regras de validação (derivadas dos requisitos)
- `Clue.dt`: inteiro ≥ 1. `Clue.skill` ∈ Skill.
- `SceneObject.x|y`: número em [0,1].
- `Intent.skill` ∈ Skill; `action` não vazio; `clientIntentId` único por sessão (dedupe).
- `Campaign.joinCode`: único; usado no ingresso por papel.
- `Session`: `activeSceneId` deve referenciar uma cena da mesma campanha.

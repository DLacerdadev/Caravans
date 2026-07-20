# Implementation Plan: MVP Etapa 1 — Cena Investigativa Jogável ao Vivo

**Branch**: `001-cena-ao-vivo` | **Date**: 2026-07-16 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/001-cena-ao-vivo/spec.md`

## Summary

Entregar o laço central do jogo de ponta a ponta: acesso por papel (mestre/jogador), estrutura
Campanha → Sessão → Cena, uma cena investigativa 2D com pontos de interesse, e o fluxo de
**intenção → mediação do mestre → rolagem automática (d20 + perícia) → revelação de pista**,
tudo **sincronizado em tempo real** e com **informação assimétrica imposta no servidor**.

Abordagem técnica: monorepo TypeScript com `apps/web` (React + Vite), `apps/api`
(Fastify + Socket.IO) e `packages/shared` (contratos Zod + tipos + **motor de regras puro**).
Persistência em PostgreSQL via Prisma. Contratos de dados definidos uma única vez em `shared` e
consumidos por front e back. A assimetria é garantida por **projeções por papel** no servidor
(DTOs distintos) e por **salas por papel** no tempo real; dados ocultos nunca saem para o cliente
do jogador.

## Technical Context

**Language/Version**: TypeScript 5.x sobre Node.js 20 LTS  
**Primary Dependencies**: React 18 + Vite (web); Fastify + Socket.IO (api); Prisma (ORM); Zod
(contratos/validação compartilhados); argon2 (hash de senha); Vitest (testes)  
**Storage**: PostgreSQL 16 (via Docker em dev); uploads de imagem em filesystem local em dev,
atrás de uma interface de storage (S3 no futuro)  
**Testing**: Vitest (unit do motor de regras em `shared`; contrato de API e eventos; teste
dedicado de não-vazamento de dados ocultos), `socket.io-client` para tempo real  
**Target Platform**: navegadores modernos (desktop e mobile); servidor Node em Linux  
**Project Type**: Web (monorepo front + back + shared)  
**Performance Goals**: intenção visível ao mestre ≤ 1s p95 (SC-001); revelação visível ao jogador
≤ 1s p95 (SC-002); reconexão restaura estado ≤ 3s (SC-004)  
**Constraints**: assimetria imposta no servidor — 0 vazamentos de DT/pista oculta/relógio ao
jogador (SC-003); eventos idempotentes e ordenáveis por sessão (SC-007)  
**Scale/Scope**: 1 mestre + ≥ 6 jogadores por sessão (SC-005); MVP focado numa feature

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Como o plano atende | Status |
|---|---|---|
| I. Domínio separado da apresentação | Domínio, contratos e regras vivem em `packages/shared`, sem dependência de UI; `web` só projeta | ✅ |
| II. Tempo real de primeira classe | Socket.IO com salas por sessão; servidor é fonte da verdade; reidratação ao entrar/reconectar | ✅ |
| III. Informação assimétrica (servidor) | Projeções por papel (DTO jogador × mestre) + salas por papel; dados ocultos nunca emitidos ao jogador; teste de não-vazamento obrigatório | ✅ |
| IV. Estado persistente e consequências | Prisma/Postgres; intenções e descobertas persistidas com autor/tempo; estados aprovada/ajustada/recusada | ✅ |
| V. Testabilidade da lógica (NÃO NEGOCIÁVEL) | Motor de regras puro em `shared` (RNG injetável), coberto por unit tests antes/junto da implementação | ✅ |
| VI. Acessibilidade e identidade "O Limiar" | `web` reusa tokens/CSS do `prototype/`; mantém foco visível, teclado, reduced-motion, alvos ≥44px | ✅ |
| VII. Stack fixa e tipos compartilhados | Stack conforme constituição; contratos Zod/TS únicos em `shared` | ✅ |

**Resultado do gate**: PASS — sem violações. `Complexity Tracking` vazio.

## Project Structure

### Documentation (this feature)

```text
specs/001-cena-ao-vivo/
├── plan.md              # Este arquivo
├── research.md          # Fase 0 — decisões técnicas
├── data-model.md        # Fase 1 — modelo de dados
├── quickstart.md        # Fase 1 — como rodar em dev
├── contracts/           # Fase 1 — contratos de API e de tempo real
│   ├── rest-api.md
│   └── realtime-events.md
└── tasks.md             # Fase 2 — gerado por /speckit-tasks
```

### Source Code (repository root)

```text
apps/
├── web/                         # SPA React + Vite (identidade "O Limiar")
│   ├── src/
│   │   ├── app/                 # bootstrap, rotas, provedores (auth, socket)
│   │   ├── pages/               # login, campanhas, campanha, zona-segura, caso, cena, mestre
│   │   ├── features/            # cena, intençoes, pistas, mestre (lógica de UI por domínio)
│   │   ├── components/          # componentes reutilizáveis (cards, chips, medidores…)
│   │   ├── lib/                 # cliente http, cliente socket, hooks
│   │   └── styles/              # tokens.css/reset/components (portados do prototype/)
│   └── tests/
├── api/                         # Fastify + Socket.IO
│   ├── src/
│   │   ├── modules/             # auth, campaigns, sessions, scenes, objects, clues, intents
│   │   ├── realtime/            # gateway Socket.IO, salas, handlers, projeções por papel
│   │   ├── db/                  # cliente Prisma, repositórios
│   │   ├── plugins/             # auth, multipart/upload, error handling
│   │   └── server.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.ts              # cena/pistas/relógio de exemplo
│   │   └── migrations/
│   ├── uploads/                 # imagens de cena (dev)
│   └── tests/{unit,contract,integration}
packages/
└── shared/                      # contratos + tipos + MOTOR DE REGRAS puro
    ├── src/
    │   ├── domain/              # enums e modelos de domínio (papéis, perícias, estados)
    │   ├── contracts/           # esquemas Zod: HTTP e eventos de tempo real
    │   ├── rules/               # rolagem, revelação de pistas, relógios (puros, RNG injetável)
    │   └── index.ts
    └── tests/                   # unit tests do motor de regras
pnpm-workspace.yaml
package.json                     # scripts raiz (dev, build, test, lint, db)
tsconfig.base.json
docker-compose.yml               # PostgreSQL para dev
.env.example
```

**Structure Decision**: Monorepo com **pnpm workspaces** e três pacotes (`apps/web`, `apps/api`,
`packages/shared`). `shared` centraliza contratos (Zod) e o motor de regras puro, satisfazendo os
Princípios I, V e VII. O `prototype/` permanece intacto como referência de UI; seus tokens/CSS são
**portados** para `apps/web/src/styles`.

## Complexity Tracking

> Sem violações da constituição — seção intencionalmente vazia.

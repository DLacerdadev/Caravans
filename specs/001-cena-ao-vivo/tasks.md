# Tasks: MVP Etapa 1 — Cena Investigativa Jogável ao Vivo

**Feature**: `specs/001-cena-ao-vivo` · **Plan**: [plan.md](./plan.md) · **Spec**: [spec.md](./spec.md)

Organização por história de usuário (prioridades da spec). Testes incluídos porque a constituição
exige o Princípio V (lógica de jogo testada) e SC-003 (não-vazamento). `[P]` = paralelizável
(arquivos distintos, sem dependência pendente). Caminhos são relativos à raiz do repositório.

Convenção de pacotes: `apps/web`, `apps/api`, `packages/shared` (import como `@caravans/shared`).

---

## Phase 1: Setup (inicialização do monorepo)

- [x] T001 Criar raiz do monorepo: `pnpm-workspace.yaml`, `package.json` raiz (scripts `dev`/`build`/`test`/`lint`/`db:*`) e `tsconfig.base.json`
- [x] T002 [P] Adicionar `docker-compose.yml` (PostgreSQL 16) e `.env.example` na raiz (sem segredos reais)
- [x] T003 [P] Scaffold de `packages/shared` (package.json `@caravans/shared`, tsconfig, Zod, Vitest) com `packages/shared/src/index.ts`
- [x] T004 [P] Scaffold de `apps/api` (Fastify, `@fastify/socket.io`, `@fastify/cookie`, `@fastify/multipart`, Prisma, argon2, Vitest) com `apps/api/src/server.ts` placeholder
- [x] T005 [P] Scaffold de `apps/web` (Vite + React + TS, react-router-dom, @tanstack/react-query, zustand, socket.io-client) com `apps/web/src/main.tsx` placeholder
- [x] T006 [P] Portar tokens/CSS do protótipo para `apps/web/src/styles/` (tokens, reset, components, layout, responsive) preservando "O Limiar"
- [x] T007 [P] Configurar ESLint + Prettier na raiz e por pacote

---

## Phase 2: Foundational (pré-requisitos bloqueantes — antes de todas as histórias)

- [x] T008 Definir enums de domínio em `packages/shared/src/domain/enums.ts` (Role, Skill, IntentStatus, SceneStatus)
- [x] T009 Escrever o schema Prisma em `apps/api/prisma/schema.prisma` com todas as entidades de [data-model.md](./data-model.md)
- [x] T010 Migração inicial + client Prisma e módulo de acesso em `apps/api/src/db/client.ts`
- [x] T011 [P] Contratos Zod das entidades e DTOs REST em `packages/shared/src/contracts/http.ts`
- [x] T012 [P] Contratos Zod dos eventos de tempo real em `packages/shared/src/contracts/realtime.ts`
- [x] T013 [P] Motor de regras puro (RNG injetável) em `packages/shared/src/rules/` (`rollTest`, `resolveReveal`, `advanceClock`)
- [x] T014 [P] Testes unitários do motor de regras (seed determinística) em `packages/shared/tests/rules.test.ts` **(test-first)**
- [x] T015 Projeções por papel `toPlayerScene`/`toMasterScene` em `apps/api/src/realtime/projection.ts`
- [x] T016 [P] Teste de **não-vazamento**: payload do jogador sem `dt`/pista oculta/relógio em `apps/api/tests/unit/projection.no-leak.test.ts` **(test-first, SC-003)**
- [x] T017 Bootstrap do Fastify (cors, cookie, tratamento de erro, healthcheck) em `apps/api/src/server.ts` e `apps/api/src/plugins/`
- [x] T018 Infra de autenticação (argon2 + JWT em cookie httpOnly, guard por papel) em `apps/api/src/plugins/auth.ts`
- [x] T019 Bootstrap do gateway Socket.IO (auth no handshake, salas `session:{id}` + `:master`/`:players`, contador `seq`) em `apps/api/src/realtime/gateway.ts`
- [x] T020 Bootstrap do app web (router, QueryClientProvider, AuthProvider, SocketProvider, cliente HTTP) em `apps/web/src/app/`
- [x] T021 Script de seed em `apps/api/prisma/seed.ts` (mestre + jogador fictícios, campanha/sessão/cena, POI "Marca de sangue", pistas Investigação/Ocultismo, relógio de ameaça)

**Checkpoint**: base pronta — banco, contratos, regras testadas, auth, gateway e seed funcionando.

---

## Phase 3: User Story 1 — Descobrir pistas ao vivo (Priority: P1) 🎯 MVP

**Goal**: laço central — jogador envia intenção → mestre resolve → rolagem automática → pista
revelada, tudo em tempo real e sem vazar dado oculto.

**Independent Test**: com mestre e jogador na cena semeada, o jogador envia intenção; ela aparece
na hora no painel do mestre; ao aprovar, a pista com DT ≤ resultado é revelada ao jogador; a DT
nunca chega ao cliente do jogador.

- [x] T022 [US1] Serviços/repos de cena, objetos, pistas e intenções em `apps/api/src/modules/scenes/` e `apps/api/src/modules/intents/`
- [x] T023 [US1] `GET /api/sessions/:id/state` — snapshot projetado por papel em `apps/api/src/modules/sessions/state.ts`
- [x] T024 [US1] Handler `intent:submit` (idempotente por `clientIntentId`) → PENDING → `intent:created` só à sala do mestre, em `apps/api/src/realtime/handlers/intents.ts`
- [x] T025 [US1] Handler `intent:resolve` APPROVE → `rollTest` (d20+perícia) → cria `ClueDiscovery` p/ pistas com DT ≤ resultado → APPROVED com `rollResult` → emite `clue:revealed` (projetado) + `intent:updated`
- [x] T026 [US1] Handler `intent:resolve` REJECT e ADJUST (ADJUST devolve ao autor com `note`) em `apps/api/src/realtime/handlers/intents.ts`
- [x] T027 [P] [US1] Web: página **Cena (Vígil)** ligada ao snapshot + socket (POIs, enviar intenção, histórico de pistas) em `apps/web/src/pages/cena.tsx`
- [x] T028 [P] [US1] Web: **Painel do mestre** — fila de intenções ao vivo com Aprovar/Ajustar/Recusar em `apps/web/src/pages/mestre.tsx`
- [x] T029 [US1] Teste de integração do laço (submit→approve→reveal) + não-vazamento em tempo real em `apps/api/tests/integration/loop.test.ts`

**Checkpoint**: o núcleo do jogo é jogável de ponta a ponta.

---

## Phase 4: User Story 2 — Entrar na mesa pelo papel certo (Priority: P2)

**Goal**: acesso real por papel e ingresso em campanha.

**Independent Test**: um usuário se autentica, ingressa por código como jogador e chega à cena na
visão correta; não consegue abrir a visão de mestre sem o papel.

- [ ] T030 [US2] API de campanhas: listar/criar/ingressar(`joinCode`)/detalhe em `apps/api/src/modules/campaigns/`
- [ ] T031 [P] [US2] Web: páginas **login/registro** ligadas à API de auth em `apps/web/src/pages/login.tsx`
- [ ] T032 [P] [US2] Web: páginas **campanhas** e **campanha** (listar/criar/ingressar) em `apps/web/src/pages/campanhas.tsx` e `apps/web/src/pages/campanha.tsx`
- [ ] T033 [US2] Rotas com guarda por papel (mestre × jogador) em `apps/web/src/app/routes.tsx`
- [ ] T034 [P] [US2] Testes de contrato de auth e campanhas em `apps/api/tests/contract/auth.test.ts` e `campaigns.test.ts`

**Checkpoint**: qualquer usuário entra, escolhe campanha e chega à cena no papel certo.

---

## Phase 5: User Story 3 — Conduzir a sessão como mestre (Priority: P2)

**Goal**: alavancas do mestre — revelar pista manual, avançar relógio, trocar cena; e autoria de
cenas (upload de imagem, objetos, pistas).

**Independent Test**: o mestre revela uma pista, avança um relógio e troca a cena; o jogador
recebe pista e nova cena em tempo real, mas nunca o valor do relógio nem DTs.

- [ ] T035 [US3] Handlers `clue:reveal` (manual), `clock:advance`, `scene:switch` em `apps/api/src/realtime/handlers/master.ts`
- [ ] T036 [US3] API de cenas: criar cena, **upload de imagem** (multipart, validar mime/tamanho), CRUD de objetos/pistas, definir cena ativa em `apps/api/src/modules/scenes/`
- [ ] T037 [P] [US3] Web: controles do mestre (revelar, relógio de ameaça, troca de cena, autoria de cena) em `apps/web/src/pages/mestre.tsx`
- [ ] T038 [US3] Teste de integração: controles do mestre emitem corretamente e dado oculto continua só do mestre em `apps/api/tests/integration/master-controls.test.ts`

**Checkpoint**: o mestre conduz a mesa completamente.

---

## Phase 6: User Story 4 — Retomar de onde parou (Priority: P3)

**Goal**: persistência e reconexão sem perda nem duplicação.

**Independent Test**: com pistas já reveladas, o jogador recarrega e volta ao mesmo estado; uma
intenção anterior não é duplicada.

- [ ] T039 [US4] Reidratação via `scene:snapshot` no join/reconnect + descarte de `seq` ≤ snapshot no `SocketProvider` (`apps/web/src/app/socket.tsx`) e gateway
- [ ] T040 [US4] Idempotência/dedupe de intenções e descobertas na reconexão em `apps/api/src/realtime/handlers/intents.ts`
- [ ] T041 [US4] Teste de integração de reconexão (restaura estado, sem duplicar) em `apps/api/tests/integration/reconnect.test.ts`

**Checkpoint**: confiável para uma mesa real.

---

## Phase 7: Polish & Cross-Cutting

- [ ] T042 [P] Passagem de acessibilidade e responsividade nas páginas web (foco, teclado, reduced-motion, alvos ≥44px)
- [ ] T043 [P] Estados de carregando/vazio/erro em todas as páginas em `apps/web/src/components/states/`
- [ ] T044 [P] Atualizar README e finalizar `specs/001-cena-ao-vivo/quickstart.md` com o fluxo real
- [ ] T045 CI: portão lint + typecheck + testes (GitHub Actions) em `.github/workflows/ci.yml`

---

## Dependencies (ordem de conclusão)

- **Setup (P1)** → **Foundational (P2)** → histórias.
- **US1 (P1)** depende de Foundational; é o MVP mínimo entregável.
- **US2 (P2)** depende de Foundational (auth infra já em T018/T019); complementa o acesso.
- **US3 (P2)** depende de US1 (cena/handlers) para reusar gateway e projeções.
- **US4 (P3)** depende de US1 (snapshot/handlers) e US3 (mais estado a reidratar).
- **Polish** por último.

## Parallel opportunities

- Setup: T002–T007 em paralelo após T001.
- Foundational: T011, T012, T013/T014, T016 em paralelo (arquivos distintos); T015 após T011.
- US1: T027 e T028 (web) em paralelo enquanto os handlers T024–T026 (api) avançam.
- US2: T031, T032, T034 em paralelo após T030.

## Implementation strategy

1. **MVP primeiro**: entregar até o fim da **US1** (laço central jogável) — é o valor comprovável.
2. Incrementar **US2** (acesso real por papel), depois **US3** (controles do mestre) e **US4**
   (reconexão), cada uma um incremento testável de forma independente.
3. Polir por último. Cada história fecha com seu checkpoint e testes verdes.

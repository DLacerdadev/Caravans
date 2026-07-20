# Contrato — API REST (HTTP)

Base: `/api`. Autenticação por cookie httpOnly (JWT). Corpo e respostas em JSON, exceto upload
(multipart). Todos os esquemas de entrada/saída são definidos em Zod em `packages/shared/contracts`
e reusados no servidor (validação) e no cliente (tipos). Erros seguem
`{ error: { code, message, details? } }`.

## Autenticação
- `POST /api/auth/register` — body `{ email, password, displayName }` → `201 { user }` + cookie.
- `POST /api/auth/login` — body `{ email, password }` → `200 { user }` + cookie.
- `POST /api/auth/logout` — `204`.
- `GET  /api/auth/me` — `200 { user }` | `401`.

## Campanhas
- `GET  /api/campaigns` — campanhas do usuário (com seu papel). `200 { campaigns[] }`.
- `POST /api/campaigns` — cria campanha (criador vira MASTER). body `{ name, synopsis? }` →
  `201 { campaign }`.
- `POST /api/campaigns/join` — body `{ joinCode }` → ingressa como PLAYER. `200 { campaign }`.
- `GET  /api/campaigns/:id` — detalhe (membros, papel do solicitante). `200 { campaign }`.

## Sessões
- `GET  /api/campaigns/:id/sessions` — `200 { sessions[] }`.
- `POST /api/campaigns/:id/sessions` *(MASTER)* — body `{ name }` → `201 { session }`.
- `PATCH /api/sessions/:id/active-scene` *(MASTER)* — body `{ sceneId }` → define cena ativa.

## Cenas e objetos
- `GET  /api/campaigns/:id/scenes` *(MASTER)* — `200 { scenes[] }`.
- `POST /api/campaigns/:id/scenes` *(MASTER)* — body `{ title }` → `201 { scene }`.
- `POST /api/scenes/:id/image` *(MASTER, multipart)* — campo `file` (png/jpeg/webp ≤ 5MB) →
  `200 { imagePath, imageWidth, imageHeight }`.
- `POST /api/scenes/:id/objects` *(MASTER)* — body `{ name, description?, x, y }` (x,y ∈ [0,1]) →
  `201 { object }`.
- `POST /api/objects/:id/clues` *(MASTER)* — body `{ skill, dt, text, order? }` → `201 { clue }`.
- `GET  /api/scenes/:id` — **projeção por papel**: MASTER recebe DTs e todas as pistas; PLAYER
  recebe apenas pistas já descobertas, **sem dt**. `200 { scene }`.

## Estado de jogo (leitura inicial; o tempo real cuida das atualizações)
- `GET /api/sessions/:id/state` — snapshot inicial projetado por papel (cena ativa, objetos,
  pistas visíveis, histórico do grupo; MASTER também recebe fila de intenções, DTs e relógios).

## Autorização
- Endpoints marcados *(MASTER)* exigem papel MASTER na campanha correspondente; caso contrário
  `403`. Não-membros recebem `403/404`. Sem cookie válido → `401`.

## Regras de conteúdo oculto
- Nenhuma resposta destinada a um PLAYER pode conter `clue.dt`, texto de pista não descoberta, ou
  qualquer campo de `ThreatClock`. Garantido pelas funções de projeção e coberto por teste.

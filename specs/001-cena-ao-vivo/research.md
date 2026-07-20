# Research — MVP 001-cena-ao-vivo

Decisões técnicas para resolver o Technical Context. A stack macro é fixada pela constituição
(React+Vite / Node+Socket.IO / Postgres+Prisma); aqui resolvem-se as escolhas abertas.

## 1. Gestão do monorepo
- **Decisão**: pnpm workspaces (`apps/web`, `apps/api`, `packages/shared`).
- **Rationale**: instalação rápida, hoisting controlado, ótimo suporte a TS project references e a
  pacotes internos (`@caravans/shared`). Um único lugar para scripts (dev/build/test/lint/db).
- **Alternativas**: npm workspaces (mais lento, menos rígido); Turborepo/Nx (cache de build
  poderoso, porém peso desnecessário para o MVP — pode ser adotado depois sem reescrever nada).

## 2. Framework da API
- **Decisão**: **Fastify** + `@fastify/socket.io`.
- **Rationale**: alto desempenho, tipagem de primeira, plugins oficiais para multipart (upload),
  cookies e CORS; integra o servidor HTTP com Socket.IO no mesmo processo.
- **Alternativas**: Express (mais familiar, ecossistema maior, porém tipagem/perf inferiores);
  NestJS (estrutura rica, mas cerimônia excessiva para o escopo do MVP).

## 3. Contratos compartilhados e validação
- **Decisão**: **Zod** em `packages/shared/src/contracts`, com tipos inferidos (`z.infer`).
- **Rationale**: uma única fonte de verdade valida no servidor (entrada HTTP e payload de eventos)
  e tipa o cliente, sem duplicação divergente (Princípio VII). Erros de validação previsíveis.
- **Alternativas**: TypeBox (bom com Fastify, menos ergonômico no cliente); tipos TS “puros” sem
  validação em runtime (não protegem a fronteira do servidor).

## 4. Motor de regras
- **Decisão**: funções **puras** em `packages/shared/src/rules`, com **RNG injetável**
  (`rng: () => number`); nada de I/O. Ex.: `rollTest({ skillMod, rng })`, `resolveReveal({ target,
  roll })`, `advanceClock(clock)`.
- **Rationale**: Princípio V (testável, determinístico com seed); reutilizável por api e por
  testes; separa regra de transporte/persistência (Princípio I).
- **Alternativas**: regra embutida nos handlers da API (difícil de testar, acopla I/O).

## 5. Autenticação e autorização
- **Decisão**: e-mail + senha com **argon2**; sessão via **JWT em cookie httpOnly** (SameSite,
  Secure em produção). Autorização por papel obtida do vínculo `MembroDaCampanha`. O handshake do
  Socket.IO lê o mesmo cookie/token para autenticar a conexão.
- **Rationale**: simples e seguro para o MVP; o mesmo mecanismo cobre HTTP e WebSocket.
- **Alternativas**: biblioteca de auth (Lucia/Auth.js) — útil depois; OAuth/SSO — fora do MVP.

## 6. Tempo real: salas, papéis e reidratação
- **Decisão**: ao entrar numa sessão, o socket entra em `session:{id}` e numa sala por papel:
  `session:{id}:master` ou `session:{id}:players`. Eventos com dado oculto são emitidos **apenas**
  à sala do mestre; eventos “públicos” vão a ambos, sempre via **projeção por papel**. Ao
  conectar/reconectar, o servidor envia um **snapshot** completo do estado da cena adequado ao
  papel (`scene:snapshot`).
- **Idempotência/ordem**: cada intenção carrega um `clientIntentId` (UUID do cliente) para dedupe;
  cada evento de sessão recebe um `seq` monotônico por sessão para o cliente ordenar/descartar
  duplicatas.
- **Rationale**: atende Princípios II e III e os critérios SC-003/SC-007.
- **Alternativas**: namespaces por papel (mais rígido, pior para trocar de papel); difusão única
  filtrada no cliente (**rejeitada**: vazaria dado oculto ao cliente do jogador).

## 7. Projeção por papel (anti-vazamento)
- **Decisão**: funções `toPlayerView(entity)` / `toMasterView(entity)` no servidor decidem o que
  cada papel recebe. O cliente do jogador **nunca** recebe: DT, texto de pista não descoberta,
  valor de relógio de ameaça, eventos ocultos.
- **Rationale**: impõe a assimetria na origem (Princípio III). Testável por um teste dedicado que
  falha se qualquer campo proibido aparecer no payload do jogador (SC-003).

## 8. Upload de imagem de cena
- **Decisão**: `@fastify/multipart`; validar **mime** (`image/png|jpeg|webp`) e **tamanho**
  (≤ 5 MB); salvar em `apps/api/uploads` (dev) atrás de uma interface `StorageService`; servir de
  forma estática. Referência da imagem guardada como caminho/URL na `Cena`.
- **Rationale**: cobre o requisito confirmado no clarify (upload real) sem acoplar a nuvem.
- **Alternativas**: S3/Cloud desde já (infra extra desnecessária no MVP; a interface permite
  migrar depois).

## 9. Estado do cliente (web)
- **Decisão**: **TanStack Query** para estado de servidor via HTTP + um provedor de **socket** que
  injeta atualizações no cache; **Zustand** para estado de UI local (seleção, modais).
- **Rationale**: separa dados do servidor (fonte da verdade) de estado efêmero de UI; recebe bem
  os eventos de tempo real.
- **Alternativas**: Redux (boilerplate maior); só Context (reatividade e cache inferiores).

## 10. Testes
- **Decisão**: **Vitest** em todos os pacotes. Camadas: (a) **unit** do motor de regras em
  `shared`; (b) **contrato** de HTTP e de eventos validando os esquemas Zod; (c) **integração** de
  tempo real com `socket.io-client`; (d) **teste de não-vazamento** que assina os payloads do
  jogador. Banco de teste isolado (schema/‘database’ dedicado) para integração.
- **Rationale**: Princípio V e SC-003/SC-007.

## 11. Ambiente de desenvolvimento
- **Decisão**: `docker-compose.yml` com PostgreSQL 16; `.env.example` versionado (sem segredos
  reais); `prisma migrate dev` + `prisma db seed` (cena/pistas/relógio de exemplo); scripts raiz
  `dev` (sobe web + api concorrentes), `test`, `lint`, `db:*`.
- **Rationale**: “clonar e rodar” rápido; seed permite validar o laço imediatamente.

## Itens sem NEEDS CLARIFICATION
Todas as incógnitas do Technical Context foram resolvidas acima. Nenhum marcador pendente.

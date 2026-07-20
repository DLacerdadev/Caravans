<!-- SPECKIT START -->
## Contexto do agente

Projeto **Sobrevivendo ao Horror** (Motor Narrativo Operacional / codinome *Caravans*) — RPG
investigativo digital de horror, mestre + jogadores, cenas 2D e estado de mundo persistente.

- **Constituição**: `.specify/memory/constitution.md` (princípios não negociáveis).
- **Feature ativa**: `specs/001-cena-ao-vivo/` — MVP Etapa 1 (cena jogável ao vivo).
  - Plano: `specs/001-cena-ao-vivo/plan.md`
  - Spec: `specs/001-cena-ao-vivo/spec.md`
  - Dados: `specs/001-cena-ao-vivo/data-model.md`
  - Contratos: `specs/001-cena-ao-vivo/contracts/`
  - Como rodar: `specs/001-cena-ao-vivo/quickstart.md`

**Stack**: monorepo TypeScript (pnpm workspaces) — `apps/web` (React + Vite),
`apps/api` (Fastify + Socket.IO), `packages/shared` (contratos Zod + motor de regras puro).
PostgreSQL + Prisma. Contratos/tipos definidos uma vez em `shared` e usados por front e back.

**Regras de ouro**: domínio separado da apresentação; tempo real de primeira classe;
**informação assimétrica imposta no servidor** (jogador nunca recebe DT/pista oculta/relógio);
motor de regras puro e testado; UI reaproveita tokens/identidade "O Limiar" do `prototype/`;
apenas dados fictícios (política da organização).

**Referência de UI**: protótipo navegável em `prototype/` (não apagar).
<!-- SPECKIT END -->

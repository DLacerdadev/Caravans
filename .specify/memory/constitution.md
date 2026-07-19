<!--
Sync Impact Report
- Version change: (template) → 1.0.0
- Ratification: 2026-07-16 (initial adoption)
- Principles defined:
  I. Domínio separado da apresentação
  II. Tempo real de primeira classe
  III. Informação assimétrica (mestre × jogador)
  IV. Estado de mundo persistente e orientado a consequências
  V. Testabilidade da lógica de jogo
  VI. Acessibilidade e identidade visual "O Limiar"
  VII. Stack fixa e tipos compartilhados
- Added sections: Restrições Técnicas e de Dados; Fluxo de Desenvolvimento; Governance
- Templates status:
  ✅ .specify/templates/plan-template.md (Constitution Check é genérico; compatível)
  ✅ .specify/templates/spec-template.md (compatível)
  ✅ .specify/templates/tasks-template.md (compatível)
- Deferred TODOs: nenhum
-->

# Sobrevivendo ao Horror — Constituição

Projeto: **Motor Narrativo Operacional** (codinome *Caravans*) — RPG investigativo digital
de horror, com mestre e jogadores, cenas 2D interativas e estado de mundo persistente.

## Core Principles

### I. Domínio separado da apresentação
A lógica e os dados do jogo — campanhas, sessões, cenas, objetos, personagens, posições,
pistas, intenções, eventos, Caminhos, organizações e estado do mundo — MUST existir como
modelo de domínio independente da interface. A camada de apresentação (2D hoje, 3D no
futuro; jogador, mestre, mesa) apenas projeta esse domínio. Nenhuma regra de jogo pode
depender de detalhes de layout, framework ou de uma forma específica de renderização.
*Rationale:* permite evoluir o visual e adicionar novas apresentações sem reescrever regras
ou persistência (ver README, "O visual como camada, não como regra").

### II. Tempo real de primeira classe
A sincronização ao vivo é requisito, não otimização. Ações do jogador (intenções) e
mudanças de estado de cena/mundo MUST propagar-se entre jogador e mestre em tempo real via
Socket.IO. O servidor é a fonte da verdade; clientes reconciliam a partir dele. Após
desconexão, o cliente MUST restaurar o estado atual ao reconectar. Eventos de tempo real
MUST ser idempotentes e ordenáveis para tolerar reconexão e reentrega.
*Rationale:* a experiência central é uma mesa compartilhada e viva.

### III. Informação assimétrica (mestre × jogador)
O mestre vê o que é oculto ao jogador: relógios de ameaça, dificuldades (DT), eventos e
pistas ainda não descobertas. A separação MUST ser imposta no **servidor**: dados ocultos
nunca são enviados ao cliente do jogador, mesmo que a UI não os mostre. Uma pista travada
por teste, uma DT ou um relógio NUNCA podem vazar por payload, log ou canal de tempo real
para quem não deve vê-los.
*Rationale:* vazamento no cliente arruína a investigação; a autoridade é do servidor.

### IV. Estado de mundo persistente e orientado a consequências
Decisões alteram o estado persistente do universo. Resultados NÃO são apenas "vitória" ou
"derrota": o sistema MUST suportar sucesso, fracasso e vitória parcial, e registrar as
consequências que modificam o mundo. Mutações de estado relevantes MUST ser persistidas de
forma auditável (quem, quando, o quê) para reconstruir a linha do tempo da campanha.
*Rationale:* o mundo continua se movendo e cada resultado abre novas possibilidades.

### V. Testabilidade da lógica de jogo (NÃO NEGOCIÁVEL)
A lógica de regras — resolução de testes/DT, revelação de pistas por perícia, relógios de
ameaça, avanço de tempo (dia/rodada/fase), condições/eventos e transições de cena — MUST ser
pura, isolada da I/O e coberta por testes automatizados escritos antes ou junto da
implementação. Nenhuma regra de jogo entra em produção sem teste que a fixe.
*Rationale:* regras são o coração do produto e a maior fonte de regressões sutis.

### VI. Acessibilidade e identidade visual "O Limiar"
Toda interface MUST ser mobile-first e acessível por padrão: HTML semântico, foco visível,
navegação por teclado, contraste legível, respeito a `prefers-reduced-motion` e alvos de
toque ≥ 44px. A identidade oficial é **"O Limiar"**: modo *Luz de Gás* (zona segura), modo
*Vígil* (missão) e o *Posto de Comando* (painel do mestre), com os tokens já definidos no
protótipo. Novas telas MUST herdar tokens e componentes existentes em vez de recriá-los.
*Rationale:* consistência e acesso são parte da qualidade, não um retrabalho posterior.

### VII. Stack fixa e tipos compartilhados
A stack é fixa: **Frontend** React + TypeScript (Vite, SPA); **Backend** Node + TypeScript
com Socket.IO; **Banco** PostgreSQL + Prisma. Os contratos de dados (modelos de domínio,
payloads de API e de eventos de tempo real) MUST ser definidos em TypeScript e
**compartilhados** entre frontend e backend, sem duplicação divergente. Trocar qualquer peça
da stack exige emenda a esta constituição.
*Rationale:* um único idioma tipado ponta-a-ponta reduz erros de contrato e acelera o tempo real.

## Restrições Técnicas e de Dados

- **Monorepo** com pacotes separados para `web` (React/Vite), `api` (Node/Socket.IO) e
  `shared` (tipos/contratos de domínio). Persistência via Prisma sobre PostgreSQL.
- **Autenticação real** de usuários e autorização por papel (jogador × mestre) por campanha.
- **Política de dados da organização (obrigatória):** é PROIBIDO inserir dados pessoais,
  sensíveis ou identificáveis reais de qualquer pessoa. Usar exclusivamente dados fictícios
  ou anonimizados. Segredos (senhas, tokens, chaves) NUNCA são versionados.
- **Fora de escopo do MVP** (Etapa 1): ambiente 3D, geração autônoma de campanhas, simulação
  completa de organizações, progressão até a ascensão e economia global — conforme README.

## Fluxo de Desenvolvimento

- **Spec-driven** (spec-kit): `constitution → specify → clarify → plan → tasks → analyze →
  implement`. Nenhuma feature de produção é implementada sem spec e plano aprovados.
- **Versionamento:** Git no GitHub (`DLacerdadev/Caravans`), commits pequenos e descritivos.
  O protótipo em `prototype/` permanece como referência de UI e não é apagado sem pedido.
- **Portões de qualidade:** lint + type-check + testes da lógica de jogo MUST passar antes de
  integrar. Toda mudança que afete regras acompanha teste correspondente (Princípio V).

## Governance

Esta constituição prevalece sobre outras práticas do projeto. Emendas MUST ser documentadas
neste arquivo com atualização de versão e do Sync Impact Report. Versionamento semântico:
MAJOR para remoção/redefinição incompatível de princípios; MINOR para novo princípio ou
expansão material; PATCH para esclarecimentos. Revisões e integrações MUST verificar
conformidade com os princípios; qualquer violação exige justificativa explícita e registro,
ou correção antes de integrar.

**Version**: 1.0.0 | **Ratified**: 2026-07-16 | **Last Amended**: 2026-07-16

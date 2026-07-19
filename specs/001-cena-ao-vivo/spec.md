# Feature Specification: MVP Etapa 1 — Cena Investigativa Jogável ao Vivo

**Feature Branch**: `001-cena-ao-vivo`  
**Created**: 2026-07-16  
**Status**: Draft  
**Input**: User description: "MVP Etapa 1 — Cena investigativa jogável ao vivo, com mestre e jogadores sincronizados."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Descobrir pistas ao vivo, mediado pelo mestre (Priority: P1)

Numa cena investigativa aberta, o jogador observa a imagem do ambiente, seleciona um ponto de
interesse e declara uma **intenção** (uma ação sobre um alvo, com uma perícia). O mestre recebe
essa intenção na hora, decide **Aprovar**, **Ajustar** ou **Recusar** e, ao aprovar, resolve o
resultado; quando o resultado alcança a dificuldade de uma pista, a **pista é revelada** e
aparece imediatamente para o jogador e para o grupo. Dificuldades e pistas ainda não descobertas
permanecem invisíveis ao jogador.

**Why this priority**: É o núcleo do produto — o laço de jogo (observar → declarar intenção →
mediação do mestre → revelação) que prova a experiência de investigação ao vivo. Sem ele, nada
mais importa.

**Independent Test**: Com um mestre e um jogador conectados à mesma cena semeada, o jogador envia
uma intenção sobre um ponto de interesse; verifica-se que ela aparece no painel do mestre em
tempo real, que a aprovação revela a pista correspondente e que a pista surge para o jogador —
sem que a dificuldade oculta jamais chegue ao cliente do jogador.

**Acceptance Scenarios**:

1. **Given** jogador e mestre na mesma cena, **When** o jogador seleciona um ponto de interesse e
   envia uma intenção, **Then** a intenção aparece na fila do mestre em tempo real com autor,
   ação, alvo e perícia.
2. **Given** uma intenção na fila, **When** o mestre a Aprova e o resultado alcança a DT de uma
   pista, **Then** a pista é revelada e aparece para o jogador e no histórico do grupo na hora.
3. **Given** uma intenção na fila, **When** o mestre a Recusa, **Then** o jogador é notificado do
   resultado e nenhuma pista é revelada.
4. **Given** uma pista ainda não descoberta com DT definida, **When** o cliente do jogador recebe
   o estado da cena, **Then** o texto da pista e a DT não estão presentes em nenhum dado enviado
   ao jogador.

---

### User Story 2 - Entrar na mesa pelo papel certo (Priority: P2)

Um usuário cria conta e/ou entra no sistema, ingressa em uma campanha como **mestre** ou
**jogador** e chega à cena ativa da sessão. O mestre enxerga a visão de comando; o jogador
enxerga a visão de jogo.

**Why this priority**: É a porta de entrada que habilita o laço central com identidade e papel
corretos, mas depende de uma cena existir para ter valor pleno (por isso P2).

**Independent Test**: Um usuário se autentica, ingressa numa campanha por um código e é levado à
cena com a visão correspondente ao seu papel; um mesmo usuário não consegue abrir a visão do
outro papel.

**Acceptance Scenarios**:

1. **Given** um usuário sem sessão, **When** ele se autentica com credenciais válidas, **Then**
   ele acessa suas campanhas.
2. **Given** um código de campanha válido, **When** o jogador ingressa, **Then** ele entra como
   jogador e vê a cena ativa na visão de jogo.
3. **Given** um usuário sem papel de mestre na campanha, **When** ele tenta abrir o painel do
   mestre, **Then** o acesso é negado.

---

### User Story 3 - Conduzir a sessão como mestre (Priority: P2)

Além de mediar intenções, o mestre controla a cena: revela manualmente pistas e vê suas DTs,
avança um **relógio de ameaça** e **troca a cena ativa** da sessão. As mudanças relevantes
aparecem para os jogadores em tempo real (sem vazar o que é oculto).

**Why this priority**: Dá ao mestre as alavancas mínimas para conduzir a mesa; complementa o
laço central.

**Independent Test**: O mestre revela uma pista pela DT, avança um relógio e troca a cena;
verifica-se que o jogador recebe a pista e a nova cena em tempo real, mas nunca recebe o valor do
relógio nem DTs não reveladas.

**Acceptance Scenarios**:

1. **Given** a cena com pistas de DTs conhecidas apenas pelo mestre, **When** o mestre revela uma
   pista, **Then** ela aparece para o grupo em tempo real.
2. **Given** um relógio de ameaça em andamento, **When** o mestre o avança, **Then** o novo valor
   é registrado e visível só ao mestre.
3. **Given** múltiplas cenas na sessão, **When** o mestre troca a cena ativa, **Then** os
   jogadores são levados à nova cena em tempo real.

---

### User Story 4 - Retomar de onde parou (Priority: P3)

Se um participante cai (rede, recarregar página) e reconecta, ele retorna ao estado atual da
cena: as pistas que já havia descoberto, os objetos e o que estava visível, sem perder progresso.

**Why this priority**: Confiabilidade é essencial para uma mesa real, mas o laço central pode ser
demonstrado antes desta garantia estar completa (por isso P3).

**Independent Test**: Durante uma cena com pistas já reveladas, o jogador recarrega a página;
verifica-se que ele volta à mesma cena com exatamente as pistas descobertas até então.

**Acceptance Scenarios**:

1. **Given** um jogador com pistas já descobertas, **When** ele reconecta, **Then** vê a cena
   atual e todas as pistas que já havia descoberto.
2. **Given** uma intenção enviada antes de uma queda, **When** o jogador reconecta, **Then** o
   estado reflete a decisão do mestre (aprovada/recusada) sem duplicar a intenção.

---

### Edge Cases

- Dois jogadores enviam intenções quase simultâneas → ambas entram na fila do mestre em ordem,
  sem perda nem duplicação.
- Jogador cai no meio do envio de uma intenção → ao reconectar, a intenção não é reenviada
  automaticamente nem duplicada.
- Mestre sai da sessão → a sessão permanece; jogadores veem estado "aguardando o mestre".
- Jogador tenta acessar dados ocultos (pista não revelada, DT, relógio) por qualquer meio → o
  servidor não fornece esses dados ao papel de jogador.
- Cena sem pontos de interesse ou sessão sem cena ativa → o jogador vê um estado vazio claro.
- Intenção sobre um alvo que não tem pista associada → o mestre pode resolver sem revelar pista.

## Requirements *(mandatory)*

### Functional Requirements

**Acesso e papéis**
- **FR-001**: O sistema MUST permitir que um usuário se autentique com credenciais próprias.
- **FR-002**: O sistema MUST permitir que um usuário ingresse em uma campanha e MUST associá-lo a
  um papel por campanha: **mestre** ou **jogador**.
- **FR-003**: O sistema MUST restringir a visão e as ações conforme o papel: apenas o mestre
  acessa a visão/controles de mestre.

**Estrutura de jogo**
- **FR-004**: O mestre MUST poder criar e gerenciar a estrutura **Campanha → Sessão → Cena**.
- **FR-005**: Uma sessão MUST ter, a cada momento, no máximo uma **cena ativa**.
- **FR-006**: Uma cena MUST poder conter uma imagem de ambiente e **pontos de interesse**
  clicáveis, cada um associado a um **objeto de cena**.

**Pistas e dificuldade**
- **FR-007**: Uma pista MUST ser vinculada a uma **perícia** e a uma **dificuldade (DT)**.
- **FR-008**: A DT e o conteúdo de pistas não descobertas MUST permanecer ocultos ao jogador.
- **FR-009**: O sistema MUST registrar pistas descobertas por **jogador** e por **grupo**.

**Intenção e mediação**
- **FR-010**: O jogador MUST poder declarar uma **intenção** contendo ao menos autor, alvo/ponto
  de interesse, ação e perícia.
- **FR-011**: O mestre MUST ver uma **fila** das intenções pendentes e MUST poder **Aprovar**,
  **Ajustar** ou **Recusar** cada uma.
- **FR-012**: Ao aprovar, o sistema MUST permitir resolver o resultado e, quando o resultado
  alcança a DT de uma pista aplicável, **revelar** a pista.
- **FR-013**: O jogador MUST ser notificado do desfecho de sua intenção (aprovada/ajustada/
  recusada) e do que foi revelado, se algo.

**Tempo real e assimetria (imposta no servidor)**
- **FR-014**: Intenções enviadas pelo jogador MUST aparecer no painel do mestre em tempo real.
- **FR-015**: Revelações de pista e mudanças de estado de cena MUST aparecer para os jogadores em
  tempo real.
- **FR-016**: O servidor MUST garantir que dados ocultos (DTs, pistas não descobertas, valores de
  relógios de ameaça, eventos ocultos) **nunca** sejam enviados ao cliente do jogador, por
  nenhum canal (carga de dados, tempo real ou log).

**Controles do mestre**
- **FR-017**: O mestre MUST poder revelar uma pista manualmente (vendo sua DT).
- **FR-018**: O mestre MUST poder avançar ao menos um **relógio de ameaça** por sessão, cujo
  valor é visível apenas ao mestre.
- **FR-019**: O mestre MUST poder **trocar a cena ativa** da sessão, levando os jogadores à nova
  cena em tempo real.

**Persistência e reconexão**
- **FR-020**: O sistema MUST persistir o estado da cena (pistas descobertas, estado dos objetos,
  posições registradas) de forma que sobreviva a recarga/queda.
- **FR-021**: Ao reconectar, o participante MUST receber o estado atual da cena correspondente ao
  seu papel, sem perda de progresso e sem duplicar ações anteriores.

### Key Entities *(include if feature involves data)*

- **Usuário**: quem acessa o sistema; possui credenciais e pode participar de campanhas.
- **Campanha**: contêiner do mundo/jogo; agrega membros com papéis e um código de ingresso.
- **Membro da campanha**: vínculo Usuário↔Campanha com **papel** (mestre/jogador).
- **Sessão**: uma partida dentro da campanha; referencia a **cena ativa**.
- **Cena**: contexto jogável com imagem de ambiente e pontos de interesse.
- **Objeto de cena / Ponto de interesse**: elemento clicável da cena; agrega pistas e ações.
- **Pista**: informação vinculada a **perícia** + **DT**; possui estado descoberto/oculto.
- **Intenção**: declaração do jogador (autor, alvo, ação, perícia) com estado
  (pendente/aprovada/ajustada/recusada) e desfecho.
- **Descoberta de pista**: registro de que uma pista foi revelada (por jogador e/ou grupo, quando).
- **Relógio de ameaça**: contador segmentado da sessão, visível apenas ao mestre.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em 95% dos envios, a intenção do jogador aparece no painel do mestre em até 1
  segundo após o envio.
- **SC-002**: Em 95% das revelações, a pista aprovada pelo mestre aparece para o jogador em até 1
  segundo.
- **SC-003**: Em 100% dos testes de assimetria, nenhum dado oculto (DT, pista não revelada, valor
  de relógio) é entregue ao cliente do jogador.
- **SC-004**: Após recarregar a página, o jogador recupera a cena e todas as pistas já
  descobertas em até 3 segundos, em 100% dos casos.
- **SC-005**: Uma sessão suporta 1 mestre e ao menos 6 jogadores simultâneos numa cena sem perda
  perceptível de sincronização.
- **SC-006**: Um jogador novo consegue, a partir do acesso, chegar à cena ativa e enviar sua
  primeira intenção em menos de 2 minutos.
- **SC-007**: 0 duplicações de intenção ou de descoberta de pista em cenários de reconexão
  testados.

## Assumptions

- **Autenticação**: método padrão de e-mail + senha para MVP; cadastro simples. (Sem SSO/OAuth
  nesta etapa.)
- **Ingresso na campanha**: por um **código/convite** compartilhado pelo mestre.
- **Imagem da cena**: fornecida pelo mestre (por URL) a partir de um conjunto de exemplo incluído
  no MVP; upload avançado de imagens fica para evolução futura.
- **Resolução do teste (DT)**: conduzida pelo **mestre** (ao aprovar, ele confirma/informa o
  resultado que revela ou não a pista). A rolagem automática de dados é evolução futura — a ser
  confirmada em `/speckit-clarify`.
- **Escala**: até ~6 jogadores por sessão no MVP; navegadores modernos de desktop e celular.
- **Fora de escopo (reafirmado)**: mapas táticos com grid/tokens arrastáveis, progressão por
  Caminhos, organizações/simulação de mundo, geração de missões, ambiente 3D e ascensão.
- **Referência de UI**: telas e identidade "O Limiar" do protótipo em `prototype/` (login,
  campanha, zona segura, caso, cena, painel do mestre) — reaproveitadas, não recriadas.
- **Política de dados**: apenas dados fictícios/anonimizados; nenhum dado pessoal real.

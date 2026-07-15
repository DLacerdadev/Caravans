---
name: prototype-first
description: Cria protótipos visuais completos e navegáveis em HTML, CSS e JavaScript antes de qualquer integração com React, frameworks, backend, banco de dados, autenticação ou APIs. Use quando o usuário pedir telas, layouts, interfaces, fluxos visuais, dashboards, sistemas web, aplicativos mobile-first, mockups funcionais ou modelos iniciais de sites.
argument-hint: "[tela, módulo ou fluxo a ser prototipado]"
---

# Prototype First

Crie primeiro uma representação visual completa e navegável da interface antes de implementar a aplicação real.

## Contexto solicitado

$ARGUMENTS

## Objetivo

Transformar requisitos, documentos e descrições do produto em um protótipo navegável de alta fidelidade usando:

- HTML semântico;
- CSS organizado;
- JavaScript local;
- dados simulados;
- navegação simulada;
- componentes visuais reutilizáveis.

Use a skill `frontend-design` quando ela estiver disponível para definir uma direção visual específica, intencional e coerente com o produto.

## Regra principal

Não iniciar a integração real do sistema durante esta etapa.

Não implementar:

- backend;
- banco de dados;
- autenticação real;
- APIs;
- WebSocket;
- integração com serviços externos;
- React, Vue, Angular ou outro framework;
- regras reais de persistência;
- arquitetura definitiva de produção.

Use dados simulados e comportamentos locais para representar essas funcionalidades.

## Diretório do protótipo

Salve o protótipo em:

`prototype/`

Não altere o código de produção existente, exceto quando o usuário pedir explicitamente.

Estrutura recomendada:

```text
prototype/
├── index.html
├── pages/
├── styles/
│   ├── tokens.css
│   ├── reset.css
│   ├── components.css
│   ├── layout.css
│   └── responsive.css
├── scripts/
│   ├── navigation.js
│   ├── mock-data.js
│   └── interactions.js
├── assets/
└── README.md
```

## Processo obrigatório

### 1. Entender o produto

Antes de escrever o código:

- Identifique o tipo de sistema.
- Identifique os usuários principais.
- Identifique o objetivo principal de cada tela.
- Liste as telas necessárias.
- Liste os principais fluxos de navegação.
- Registre suposições quando alguma informação estiver ausente.

Não interrompa o trabalho por requisitos pequenos ausentes. Faça uma escolha coerente e registre a suposição.

### 2. Definir a direção visual

Defina antes da implementação:

- conceito visual;
- paleta;
- tipografia;
- escala de espaçamento;
- bordas e sombras;
- comportamento dos cards;
- comportamento da navegação;
- elemento visual característico do produto.

Crie os tokens no arquivo `styles/tokens.css`.

### 3. Planejar as telas

Crie um inventário contendo:

- nome da tela;
- objetivo;
- conteúdo principal;
- ações disponíveis;
- origem da navegação;
- destino da navegação;
- estados especiais.

### 4. Construir o protótipo

Implemente todas as telas necessárias para demonstrar o fluxo solicitado.

As telas devem ser navegáveis entre si.

Quando uma funcionalidade ainda não existir, simule-a usando JavaScript local.

Exemplos:

- login simulado;
- troca de usuário;
- abertura de modal;
- seleção de item;
- filtros;
- abas;
- notificações;
- envio de formulário;
- estados de processamento;
- mudança de tela;
- atualização de dados simulados.

### 5. Criar estados completos

Sempre que aplicável, represente:

- carregamento;
- vazio;
- sucesso;
- erro;
- desabilitado;
- selecionado;
- pendente;
- concluído;
- confirmação;
- cancelamento.

### 6. Responsividade

Trabalhe com abordagem mobile-first.

Valide pelo menos:

- 360px;
- 390px;
- 768px;
- 1024px;
- 1440px.

Não apenas reduza o tamanho dos componentes. Reorganize navegação, painéis, cards e ações de acordo com o espaço disponível.

### 7. Acessibilidade mínima

Garanta:

- HTML semântico;
- labels em campos;
- foco visível;
- navegação por teclado;
- contraste legível;
- botões identificáveis;
- áreas clicáveis adequadas para celular;
- respeito a `prefers-reduced-motion`.

### 8. Revisão visual

Antes de concluir:

- Verifique inconsistências de espaçamento.
- Verifique alinhamentos.
- Verifique hierarquia tipográfica.
- Verifique textos genéricos.
- Verifique elementos sem função.
- Verifique responsividade.
- Verifique navegação entre todas as telas.
- Remova decorações que não contribuam para o produto.

## Entregáveis

Ao concluir, apresente:

- Inventário das telas criadas.
- Fluxo de navegação.
- Estrutura dos arquivos.
- Decisões visuais.
- Funcionalidades simuladas.
- Suposições realizadas.
- Elementos que ainda precisarão de integração real.
- Instruções para abrir o protótipo.

## Limite desta etapa

Pare após entregar e validar o protótipo.

Não converta o protótipo para React ou para a arquitetura real sem uma solicitação explícita do usuário.

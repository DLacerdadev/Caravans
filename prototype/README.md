# Protótipo — Sobrevivendo ao Horror

Protótipo navegável (HTML + CSS + JavaScript puros, com **dados simulados**).
Sem backend, sem API, sem framework — conforme a etapa de prototipação.

## Como abrir

Abra `prototype/index.html` no navegador (duplo clique já funciona).
Ele redireciona para a tela de login do jogador.

> Dica: para o `localStorage`/`sessionStorage` funcionarem de forma estável,
> vale servir a pasta com um servidor local simples, mas **não é obrigatório**
> para navegar o protótipo.

## Conceito visual — "O Limiar"

A interface tem **dois modos** e a *travessia* entre eles é o elemento característico:

- **Zona Segura → "Luz de Gás"** (vitoriano ~1890): login, campanha, QG, dossiê do caso.
- **Sessão Ativa → "Vígil"** (horror onírico): dentro da missão / cena investigativa.

O modo é definido por `data-mode="safe" | "mission"` no `<html>`; todos os componentes
leem os tokens correspondentes em `styles/tokens.css`.

## Fluxo implementado (Jogador: login → cena)

```text
login → campanhas → zona-segura ──┬─ "Olhar caso" → caso ─┐
                                  │                        ├─ (travessia "O Limiar") → cena
                                  └─ "Entrar na missão" ───┘
cena → "Retornar à zona segura" → zona-segura
```

## Telas

| Arquivo | Tela | Modo |
|---|---|---|
| `pages/login.html` | Acesso do investigador (login simulado) | Luz de Gás |
| `pages/campanhas.html` | Seleção de campanha | Luz de Gás |
| `pages/zona-segura.html` | Quartel-General / seleção de missão | Luz de Gás |
| `pages/caso.html` | Sumário do caso: andamento, dicas, pistas, fotos | Luz de Gás |
| `pages/cena.html` | Cena investigativa: POI, pistas, intenção, histórico | Vígil |

## Funcionalidades simuladas

- Login (qualquer credencial preenchida entra).
- Travessia "O Limiar" ao entrar/sair da missão.
- Revelar pista clicando numa pista embaçada (simula teste bem-sucedido).
- Pistas descobertas persistem por caso (`localStorage`) e alimentam o
  **andamento da investigação** e o **histórico de pistas**.
- Enviar intenção ao mestre → estado "aguardando" → "aprovada".

## Estrutura

```text
prototype/
├── index.html
├── pages/       (login, campanhas, zona-segura, caso, cena)
├── styles/      (tokens, reset, layout, components, responsive)
├── scripts/     (mock-data, navigation, interactions)
├── assets/      (imagens reais das cenas — a adicionar)
└── README.md
```

## Ainda precisa de integração real (fora desta etapa)

Autenticação, persistência em banco, sincronização mestre↔jogadores em tempo real,
resolução de testes/dados, e as imagens reais das cenas.

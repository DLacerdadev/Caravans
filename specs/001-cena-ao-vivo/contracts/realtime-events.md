# Contrato — Tempo real (Socket.IO)

Conexão autenticada pelo cookie de sessão (handshake). Após conectar, o cliente entra numa sessão;
o servidor o coloca em `session:{id}` e na sala do seu papel (`:master` ou `:players`). Todos os
payloads são validados por esquemas Zod em `packages/shared/contracts`.

## Convenções
- **Salas**: `session:{id}` (todos), `session:{id}:master` (só mestre), `session:{id}:players`.
- **Ordenação**: todo evento de estado carrega `seq` (monotônico por sessão) e `sessionId`.
- **Idempotência**: `intent:submit` carrega `clientIntentId` (UUID). Reenvios são deduplicados.
- **Projeção por papel**: eventos com dado oculto são emitidos só à sala do mestre; a versão do
  jogador é uma projeção sem campos ocultos.

## Cliente → Servidor
- `session:join` `{ sessionId }` → entra nas salas e recebe `scene:snapshot` (projetado ao papel).
- `intent:submit` *(PLAYER)* `{ sessionId, clientIntentId, targetObjectId?, action, skill }` →
  cria intenção PENDING (idempotente por `clientIntentId`).
- `intent:resolve` *(MASTER)* `{ intentId, decision: 'APPROVE'|'ADJUST'|'REJECT', note? }` →
  APPROVE dispara rolagem e possível revelação; ADJUST devolve ao jogador; REJECT encerra.
- `clue:reveal` *(MASTER)* `{ clueId }` → revelação manual.
- `clock:advance` *(MASTER)* `{ clockId, delta: +1|-1 }`.
- `scene:switch` *(MASTER)* `{ sessionId, sceneId }`.

## Servidor → Cliente
- `scene:snapshot` `{ seq, scene, discoveries, intents?, clocks? }` — estado completo projetado ao
  papel (mestre recebe `intents`+DTs+`clocks`; jogador não).
- `intent:created` → **só mestre**: `{ seq, intent }` (entra na fila).
- `intent:updated` → mestre recebe `{ seq, intent }` completo; autor recebe
  `{ seq, intentId, status, outcome }` (sem DT). ADJUST inclui `note`.
- `clue:revealed` → ambos: `{ seq, clue: <projeção> , scope, byUserId? }` (jogador nunca recebe
  `dt`; recebe `text` só porque agora está descoberta).
- `clock:updated` → **só mestre**: `{ seq, clock }`.
- `scene:changed` → ambos: `{ seq, sceneId }` (dispara novo `scene:snapshot`).
- `presence:updated` → ambos: `{ seq, online: [{ userId, role }] }`.
- `error` → `{ code, message }` (ex.: permissão negada, validação).

## Reconexão
- Ao reconectar, o cliente reemite `session:join`; o servidor responde com `scene:snapshot` atual.
  O cliente descarta eventos com `seq` ≤ ao do snapshot. Intenções não são reenviadas
  automaticamente; se foram resolvidas, o snapshot já reflete o desfecho (SC-004, SC-007).

## Fluxo de referência (laço central)
1. PLAYER emite `intent:submit` → servidor persiste PENDING → `intent:created` só ao mestre.
2. MASTER emite `intent:resolve {APPROVE}` → motor de regras rola (d20+perícia) vs DT das pistas do
   alvo → cria `ClueDiscovery` para as pistas com dt ≤ resultado → persiste APPROVED com
   `rollResult` → emite `clue:revealed` a ambos e `intent:updated` (mestre completo; autor sem dt).
3. Estado fica consistente; reconectar recupera via `scene:snapshot`.

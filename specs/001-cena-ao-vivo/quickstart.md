# Quickstart — Dev (MVP 001-cena-ao-vivo)

Pré-requisitos: **Node 20+**, **pnpm**, **Docker** (para o PostgreSQL). Nenhum segredo real deve
ser versionado; use `.env` a partir de `.env.example`.

## 1. Subir o banco
```bash
docker compose up -d db        # PostgreSQL 16 em localhost:5432
```

## 2. Instalar dependências (monorepo)
```bash
pnpm install
```

## 3. Configurar ambiente
```bash
cp .env.example apps/api/.env  # ajustar DATABASE_URL, JWT_SECRET (dev), etc.
```

## 4. Migrar e semear o banco
```bash
pnpm db:migrate                # prisma migrate dev
pnpm db:seed                   # cria campanha/sessão/cena + pistas + relógio de exemplo
```
O seed cria um **mestre** e um **jogador** de teste (credenciais fictícias) e uma cena com o ponto
de interesse "Marca de sangue" e pistas por Investigação/Ocultismo, mais um relógio de ameaça.

## 5. Rodar em desenvolvimento
```bash
pnpm dev                       # sobe api (Fastify+Socket.IO) e web (Vite) em paralelo
# web:  http://localhost:5173
# api:  http://localhost:3000/api
```

## 6. Validar o laço central (manual)
1. Abra a web como **mestre** (login do seed) e como **jogador** (outra janela/anônima).
2. Jogador entra na cena → clica no ponto de interesse → envia uma **intenção** (perícia).
3. A intenção aparece **na hora** no painel do mestre.
4. Mestre **Aprova** → o sistema rola (d20+perícia); pistas com DT ≤ resultado são **reveladas** e
   aparecem para o jogador imediatamente.
5. Recarregue a janela do jogador → o estado (pistas descobertas) é restaurado.

## 7. Testes
```bash
pnpm test                      # todos os pacotes (Vitest)
pnpm --filter @caravans/shared test   # só o motor de regras (unit)
```
Inclui o **teste de não-vazamento**: garante que nenhum payload destinado ao jogador contém DT,
pista não descoberta ou valores de relógio de ameaça.

## Scripts raiz (referência)
- `pnpm dev` · `pnpm build` · `pnpm test` · `pnpm lint`
- `pnpm db:migrate` · `pnpm db:seed` · `pnpm db:reset`

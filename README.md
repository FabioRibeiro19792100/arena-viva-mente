# Bancada

Aplicação web para acompanhar eventos esportivos, reservar salas e participar da conversa ao vivo.

## Stack

- Vite
- React
- TypeScript
- Tailwind
- Supabase
- Vercel

## Modelo atual de dados esportivos

O projeto foi refatorado para um modelo **server-first com persistência**.

### Regras principais

- o frontend **não chama** a API esportiva externa
- o backend é o único responsável por consultar a API-Sports
- os jogos são persistidos no Supabase
- o frontend lê apenas:
  - `/api/matches`
  - `/api/matches/:id`
  - `/api/matches/:id/insights`
- atualização de dados acontece por job agendado

### Tabelas relevantes

Definidas em [supabase/schema.sql](/Users/fabioribeiro/Documents/ArquiDigital/arena-viva-mente/supabase/schema.sql):

- `sports_matches`
- `sports_sync_status`
- `match_insights_cache`

## Jobs agendados

Configurados em [vercel.json](/Users/fabioribeiro/Documents/ArquiDigital/arena-viva-mente/vercel.json):

- `scheduled`: `0 6 * * *`
  - atualiza agenda e próximos jogos `1x por dia`

Isso significa que **não existe request externo por usuário**.  
Quem sincroniza é o servidor, em intervalos centrais.

No momento, o sync de `ao vivo` não roda por cron.

- em produção: fica desativado
- em localhost: pode ser disparado manualmente pelo botão `Sincronizar agora`

## Endpoints internos

- `/api/matches`
- `/api/matches/:id`
- `/api/matches/:id/insights`
- `/api/jobs/sync-matches`
- `/api/assets/logo`

## Variáveis de ambiente

Exemplo em [.env.example](/Users/fabioribeiro/Documents/ArquiDigital/arena-viva-mente/.env.example).

As principais para o backend:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `API_SPORTS_KEY`
- `CRON_SECRET`

As variáveis públicas do frontend:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Desenvolvimento local

```sh
npm install
npm run dev
```

Servidor local:

- [http://localhost:8080](http://localhost:8080)

No localhost, a home expõe um atalho `Sincronizar agora` para disparar manualmente o job e recarregar o feed persistido.

## Fluxo resumido

1. o job consulta futebol, NBA e vôlei no backend
2. o backend normaliza e grava em `sports_matches`
3. a home e as outras telas leem do banco via `/api/matches`
4. favoritos, reservas e salas reidratam jogos pelo mesmo backend

## Observações

- se uma fonte externa cair, o frontend continua lendo o último snapshot persistido
- logos e bandeiras passam por `/api/assets/logo` para reduzir falhas de host externo no navegador

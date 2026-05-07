# Bridges Dashboard

Bridge volume analytics for Gnosis Chain. Vite + React 19 + TanStack Query + Tailwind v4.

## Stack

- Vite 8 + Bun
- React 19, react-router-dom
- TanStack Query v5 with persisted localStorage cache (`bridges-query-cache`)
- Tailwind CSS v4 via `@tailwindcss/vite`
- Recharts for charts
- Biome for lint/format

## Local development

```bash
bun install
bun run dev    # http://localhost:5173
```

The dashboard reads bridge data over GraphQL. Set the endpoint in `.env.local`:

```
VITE_GRAPHQL_ENDPOINT=http://localhost:8080/v1/graphql
```

The default already points at a local Hasura/Envio indexer on port 8080. See `.env.example`.

## Scripts

- `bun run dev` — Vite dev server on `:5173`
- `bun run build` — production build to `dist/`
- `bun run preview` — preview the production build
- `bun run typecheck` — `tsc --noEmit`
- `bun run lint` — `biome lint .`
- `bun run format` — `biome format --write .`

## URL state

- `?period=7d|30d|all` — time window (default `all`)
- `?hideOmni=1` — exclude the legacy Omnibridge

## Data model

GraphQL endpoint returns the indexer schema. See `src/lib/types.ts` for the
shapes consumed (`BridgeDailyStats`, `BridgeTokenDailyStats`, `ChainPairStats`,
`TokenStats`, `BridgeTransfer`).

Each section has a hook in `src/hooks/queryHooks.ts` that wraps `useQuery`.
Components render skeletons while loading and an "unavailable" notice on error.

# SEVA AI

SEVA AI helps people describe a public-service need, find potentially relevant verified or demo records, prepare documents, and follow a guided next step.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/seva-ai/src/App.tsx` — responsive product shell, routes, screens, and client interactions
- `artifacts/seva-ai/src/index.css` — SEVA visual system and responsive styles
- `lib/api-spec/openapi.yaml` — source of truth for the service, journey, document, agent, notification, dashboard, and analytics API
- `artifacts/api-server/src/routes/seva.ts` — validated demo API handlers
- `artifacts/api-server/src/lib/seva-store.ts` — clearly labeled demo records and in-memory prototype state
- `lib/db/src/schema/index.ts` — Drizzle schema for users, services, sources, journeys, documents, agent events, notifications, and saved services

## Architecture decisions

- Demo service records are explicitly marked `is_demo` and use source-first copy; the UI never presents demo data as guaranteed eligibility.
- The first build keeps document state only and does not store document bytes; object storage can be added later with explicit consent.
- The API is contract-first through OpenAPI and generated React Query hooks, while the demo server uses an in-memory store so the initial journey is usable without authentication.
- High-level agent activity is exposed as safe status events only; hidden reasoning is not shown.

## Product

- Responsive SEVA AI dashboard with home, service discovery, service detail, My Services, agent activity, document readiness, notifications, profile preferences, analytics, and admin verification views.
- Demo journey for an education-support request with official-source reminders, readiness checks, and next-step guidance.
- Major actions are wired through generated API hooks: searching, analyzing requests, saving journeys, updating journeys, adding/toggling/removing documents, and marking notifications read.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Demo timestamps may be human-readable labels as well as ISO values; client display helpers must tolerate both.
- Managed artifact workflows provide `PORT` and `BASE_PATH`; restart `artifacts/seva-ai: web` and `artifacts/api-server: API Server` rather than running app servers manually.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details

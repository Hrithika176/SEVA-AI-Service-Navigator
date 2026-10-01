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
- `lib/api-spec/openapi.yaml` — source of truth for the service-source, journey, document, agent, notification, dashboard, and analytics API
- `artifacts/api-server/src/routes/seva.ts` — service, agent, journey, and document API handlers plus freshness reports
- `artifacts/api-server/src/lib/seva-store.ts` — clearly labeled demo records and in-memory prototype state
- `artifacts/api-server/src/lib/service-catalog.ts` — PostgreSQL service catalog plus explicitly marked demo records
- `artifacts/api-server/src/lib/agents/` — deterministic request pipeline for intent, verified discovery, requirements, documents, guidance, and follow-up
- `lib/db/src/schema/index.ts` — Drizzle schema for users, services, sources, journeys, documents, agent events, notifications, and saved services

## Architecture decisions

- Demo service records are explicitly marked `is_demo` and use source-first copy; the UI never presents demo data as guaranteed eligibility.
- Service results carry an explicit source name, source type, official URL, last-verified value, and verification status; an unverified record must show `Verification required`.
- Official URLs are curated data supplied by the service catalog; the agent does not invent or infer URLs.
- The first build keeps document state only and does not store document bytes; object storage can be added later with explicit consent.
- Verified discovery reads only active, non-demo, verified PostgreSQL records with HTTPS URLs and required source metadata. Demo records remain excluded.
- Agent processing is deterministic and source-grounded; there are no external AI API calls. Requirements and document guidance come only from matched verified records.
- Agent events and session-scoped journey progress are persisted under a browser-generated session ID. Event labels are safe status metadata and never contain the raw request.
- The API is contract-first through OpenAPI and generated React Query hooks. Demo records and prototype documents remain in memory.
- Persistent edits to PostgreSQL service records are blocked until authenticated admin access is configured; the current editor can only update in-memory demo metadata.

## Product

- Responsive SEVA AI dashboard with home, service discovery, service detail, My Services, agent activity, document readiness, notifications, profile preferences, analytics, and admin verification views.
- Demo journey for an education-support request with official-source reminders, readiness checks, and next-step guidance; live agent requests use the verified database catalog.
- Major actions are wired through generated API hooks: searching, analyzing requests, saving journeys, updating journeys, adding/toggling/removing documents, and marking notifications read.
- Service pages expose official-source metadata and an outdated-information report; `/admin` provides demo source editing, while database-backed source changes are rejected until authenticated admin access is configured.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Demo timestamps may be human-readable labels as well as ISO values; client display helpers must tolerate both.
- Managed artifact workflows provide `PORT` and `BASE_PATH`; restart `artifacts/seva-ai: web` and `artifacts/api-server: API Server` rather than running app servers manually.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details

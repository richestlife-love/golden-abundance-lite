# Golden Abundance 金富有志工

Monorepo-style layout:

- `frontend/` — React 18 + TypeScript + Vite
- `backend/` — Python FastAPI service
- `docs/` — production launch plan and design specs

## Prerequisites

- [`just`](https://github.com/casey/just) 1.31+
- [`uv`](https://github.com/astral-sh/uv) — backend Python runtime
- Node 22+ with [`pnpm`](https://pnpm.io/) 10+ (dev uses Node 25 via `frontend/.nvmrc`; `engines` floor is 22)
- Docker — local Postgres via `docker compose`

## Invocation

Recipes are organised as a root justfile plus per-subtree justfiles (`backend/justfile`, `frontend/justfile`), wired together with `just` modules. Invoke them two ways:

```sh
# From repo root — cross-stack recipes and module dispatch
just gen-types
just backend <recipe>
just frontend <recipe>
just --list
```

```sh
# Or cd into the subtree and drop the prefix
cd backend  && just ci
cd frontend && just ci
```

## Recipes

### Root (`justfile`)

| Recipe | Purpose | When to run |
| --- | --- | --- |
| `just gen-types` | Regenerate `frontend/src/api/schema.d.ts` from FastAPI OpenAPI (gitignored; loaded in-process, no running server or DB needed). | After backend routes/schemas change. |

### Backend (`backend/justfile`)

| Recipe | Purpose | When to run |
| --- | --- | --- |
| `just backend db-up` / `db-down` | Start / stop local Postgres via `docker compose`. | `db-up` once per machine boot. |
| `just backend migrate` | Apply Alembic migrations to head. | Fresh DB, or after pulling new revisions. |
| `just backend makemigration MSG="..."` | Autogenerate an Alembic revision. | After changing SQLAlchemy models. |
| `just backend seed` | Populate task definitions + news items. Idempotent but **skip-on-conflict** — won't update existing rows. | Fresh DB. |
| `just backend seed-reset` | Destructive: truncate seed-owned tables then re-seed. Refuses `APP_ENV=prod`. | When seed _content_ changed, or demo state is polluted. |
| `just backend dev [port]` | FastAPI dev server with reload (default port 8000). | Daily. |
| `just backend test [args]` | pytest passthrough. | During development. |
| `just backend contract-validate` | Validate example JSON fixtures against Pydantic contract models. | After editing contract examples. |
| `just backend ci` | Full local CI: sync deps, ruff (lint + format), ty, contract-validate, pytest. | Before pushing. |

### Frontend (`frontend/justfile`)

| Recipe | Purpose | When to run |
| --- | --- | --- |
| `just frontend dev` | Vite dev server (port from `VITE_PORT` in `.env.local`, default 5173). | Daily. |
| `just frontend test [args]` | Vitest passthrough. | During development. |
| `just frontend tunnel` | Expose dev server via ngrok (reads `NGROK_HOST` + `VITE_PORT` from `.env.local`). | Mobile testing, webhooks, etc. |
| `just frontend ci` | Full local CI: install, lint, format, typecheck, test, build. | Before pushing. |

## Typical workflows

| Situation | Commands |
| --- | --- |
| Fresh clone | `just backend db-up` → `just backend migrate` → `just backend seed-reset` → `just backend dev` + `just frontend dev` |
| After `git pull` | `just backend migrate` → `just backend seed-reset` (if seed content changed) → `just gen-types` (if backend API changed) |
| Changed models | `just backend makemigration MSG="…"` → `just backend migrate` |
| Changed routes / schemas | `just gen-types` |
| Demo data polluted | `just backend seed-reset` |
| Before pushing | `just backend ci` && `just frontend ci` |

See [`frontend/README.md`](frontend/README.md) for deeper frontend setup notes and TypeScript configuration.

# Frontend

React 18 + TypeScript + Vite.

## Running

Prereqs: [`just`](https://github.com/casey/just), `pnpm` 10+ (see `packageManager` in `package.json`), Node 22+ — dev uses Node 25 via `.nvmrc` (`nvm use` / `fnm use` picks it up); the `engines` floor is 22 so LTS contributors can run too. Also Docker (for the backend's Postgres), and [`uv`](https://github.com/astral-sh/uv) (used by `gen-types` to load the FastAPI app in-process).

Recipes are organised as a root justfile plus per-subtree justfiles (`backend/justfile`, `frontend/justfile`) wired together with `just` modules. Cross-stack recipes (`dev`, `gen-types`, `gen-demo-accounts`) live at the repo root. Subtree recipes can be run either by `cd`ing in or via the module prefix from root (e.g. `just backend db-up`). Frontend-only commands that have no just recipe are `pnpm` scripts under `frontend/`.

### Daily dev loop — from the repo root

```sh
just dev
```

Boots backend (`:8000`) + frontend (`:5173`) in parallel; Ctrl-C kills both. Vite proxies `/api/*` to the backend, so `fetch('/api/v1/me')` just works. **Requires** the backend DB already up, migrated, and seeded — see the one-time setup below.

### After a backend contract change — from the repo root

```sh
just gen-types            # rewrites frontend/src/api/schema.d.ts from the in-process FastAPI OpenAPI
just gen-demo-accounts    # rewrites frontend/src/dev/demo-accounts.json from backend.seed.DEMO_USERS
```

`gen-types` needs neither a running server nor a DB — it imports the FastAPI app and dumps OpenAPI in-process. `schema.d.ts` is gitignored; CI must run this before any `tsc`/`vite build` step. `demo-accounts.json` is checked in — regenerate and commit after changing `DEMO_USERS`.

### One-time / after-DB-schema-change setup — backend recipes

```sh
just backend db-up        # docker compose up Postgres
just backend migrate      # alembic upgrade head
just backend seed-reset   # truncate seed tables + reseed demo users, tasks, news
```

Or `cd backend && just db-up` etc. if you prefer. `seed-reset` is refused when `APP_ENV=prod`. Use it (instead of `just backend seed`) when seed _content_ has changed — `seed` is idempotent but skip-on-conflict, so it won't update rows that already exist. Run `just --list backend` (or `just --list` inside `backend/`) to see the full recipe set (`ci`, `test`, `makemigration`, etc.).

### Frontend-only commands

From repo root (preferred):

```sh
just frontend dev          # Vite only (no backend; API calls 404 at the proxy)
just frontend test         # Vitest run (pass extra args: just frontend test --watch)
just frontend ci           # install + lint + format + typecheck + test + bundle
```

Or `cd frontend` and drop the `frontend` prefix. The underlying `pnpm` scripts (`pnpm dev`, `pnpm test`, `pnpm test:watch`, `pnpm build`, `pnpm typecheck`, `pnpm lint`, `pnpm format`) are also available for direct invocation. `pnpm build` (and `pnpm typecheck`) require `frontend/src/api/schema.d.ts` — run `just gen-types` from root first.

Local env overrides go in `frontend/.env.local` (gitignored). See `frontend/.env.example` for the supported variables (`VITE_API_BASE_URL`, `VITE_PORT`, `VITE_ALLOWED_HOSTS`, `NGROK_HOST`).

## Layout

- `index.html` — Vite entry (loads `/src/main.tsx`)
- `src/main.tsx` — React root with StrictMode
- `src/App.tsx` — screen orchestration and app state
- `src/types.ts` — client-side data types (replaced in Phase 4 by contract-generated types)
- `src/data.ts` — mock TASKS / MOCK_TEAMS (MOCK_MEMBERS exported for future use)
- `src/utils.ts` — pure helpers (`getEffectiveStatus`)
- `src/ui/` — 17 shared presentational primitives
- `src/screens/` — 18 screen/flow components
- `src/assets/` — static images (fingerprinted by Vite)

## TypeScript configuration

`tsconfig.json` runs `strict: true` with these deliberate exceptions:

- `noUnusedParameters: false` — React event handlers often accept more params than they use (the event argument, the map index, etc.); forcing unused-parameter errors would be noisy.

Other flags (`strict`, `noUnusedLocals`, `allowJs: false`) are all strict.

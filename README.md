# Golden Abundance Lite 金富有志工

Monorepo-style layout:

- `frontend/` — React 18 + TypeScript + Vite (Phase 1 split is complete)
- `backend/` — Python FastAPI service (Phase 2 contract module; runtime lands in Phase 5)
- `docs/` — production launch plan and design specs

## Run

Recipes live per subtree. `cd` into the subtree first, then run:

```sh
cd frontend
just ci             # install + lint + format + typecheck + bundle
just dev            # Vite dev server on http://localhost:5173
just tunnel         # https://subvitalized-occupative-katelyn.ngrok-free.dev
```

```sh
cd backend
just ci                # install + lint + format + typecheck (+test after Phase 5)
just contract-validate # validate JSON fixtures against the Pydantic contract
```

Requires [`just`](https://github.com/casey/just), Node 20+ with [`pnpm`](https://pnpm.io/) (frontend), and [`uv`](https://github.com/astral-sh/uv) (backend).

See [`frontend/README.md`](frontend/README.md) for frontend layout and TypeScript configuration.

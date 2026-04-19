# Golden Abundance Lite 金富有志工

React + Babel standalone, rendered in the browser — no build step.

## Run

Recipes now live per subtree. From the repo root:

```sh
just -f frontend/justfile serve    # http://localhost:8000
just -f frontend/justfile tunnel   # https://subvitalized-occupative-katelyn.ngrok-free.dev
just -f backend/justfile ci        # ruff + ty
just -f backend/justfile contract-validate
```

Or `cd frontend` / `cd backend` first and run the recipe name directly.

Requires [`just`](https://github.com/casey/just) and [`uv`](https://github.com/astral-sh/uv).

## Layout

- `index.html` — page shell, loads React and Babel from unpkg
- `app.jsx` — the root React component
- `assets/` — images

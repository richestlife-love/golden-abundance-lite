# Golden Abundance Lite 金富有志工

React + Babel standalone, rendered in the browser — no build step.

## Run

```sh
just serve          # http://localhost:8000
just tunnel         # https://subvitalized-occupative-katelyn.ngrok-free.dev
```

Requires [`just`](https://github.com/casey/just) and [`uv`](https://github.com/astral-sh/uv).

## Layout

- `index.html` — page shell, loads React and Babel from unpkg
- `app.jsx` — the root React component
- `assets/` — images

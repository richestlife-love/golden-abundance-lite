# Frontend

React 18 + TypeScript + Vite. See the [root README](../README.md) for run recipes.

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

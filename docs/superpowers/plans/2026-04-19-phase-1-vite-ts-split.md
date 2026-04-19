# Phase 1 — Vite + TypeScript + Module Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Babel-via-CDN single-file prototype with a Vite + TypeScript project, and split `frontend/app.jsx` (10,184 lines, 42 top-level symbols) into focused per-component files while preserving exact runtime behaviour.

**Architecture:** Two-tier flat module layout under `frontend/src/` — `ui/` for 18 shared primitives (GlobalStyles, MascotHero, form inputs, BottomNav, etc.) and `screens/` for 19 feature components (LandingScreen, HomeScreen, MyScreen, forms, etc.). The original monolith is renamed to `src/App.jsx` after Vite scaffolding and progressively drained of function bodies until only the root `App` component remains; each extraction commit leaves the app runnable. TypeScript is adopted incrementally: `.tsx` for newly-extracted files (with prop types derived from usage and mock-data shapes), `.jsx` for the shrinking monolith, finally flipping the monolith to `.tsx` in the last task.

**Tech Stack:** Vite 6, React 18, TypeScript 5, `@vitejs/plugin-react`, npm (no existing JS package manager to follow), Node 20+. No router, no state library, no component library. All styles remain inline `style={{...}}`. No behavioural changes.

---

## Coordination notes

- **Phase 2 runs in parallel** on `backend/` (Pydantic contract). Do not touch `backend/` or `docs/superpowers/specs/`. This plan only writes under `frontend/`, `justfile`, `README.md`, and `docs/production-launch-plan.md` / `docs/superpowers/plans/`.
- **Client types vs. contract types.** `frontend/src/types.ts` produced here describes the *current mock-data shapes* used by the prototype (camelCase, optional-everything, `id: number` for tasks, `id: string` for users/teams). These will be **replaced** in Phase 4 by types generated from the Pydantic contract (snake_case, UUIDs, etc.). Do not try to pre-align with the contract — the contract's own doc (§6) defers the rename to Phase 4. Keep types loose and faithful to today's runtime data.
- **Stale line references in the contract spec.** `docs/superpowers/specs/2026-04-19-api-contract-design.md` cites lines like `frontend/app.jsx:6845` as evidence. Those references become stale after Task 1 (when `app.jsx` moves to `src/App.jsx`) and increasingly meaningless as extractions proceed. The spec is already approved; do not update it — its references are historical breadcrumbs, not live requirements. Phase 2 implementation works from the spec content, not from re-reading the frontend.
- **No routing changes.** `useState("screen")` stays in `App.tsx`. URL-based routing is Phase 3.
- **No mock data replacement.** `TASKS`, `MOCK_MEMBERS`, `MOCK_TEAMS` move to `src/data.ts` verbatim. Replacement by `fetch` calls is Phase 4.

## Target file structure

```
frontend/
├── package.json            (new)
├── vite.config.ts          (new)
├── tsconfig.json           (new)
├── tsconfig.node.json      (new)
├── .gitignore              (new; node_modules, dist)
├── index.html              (rewritten: remove CDN <script>s, add Vite entry)
└── src/
    ├── main.tsx            (new: ReactDOM.createRoot → <App/>)
    ├── App.tsx             (final; shrinks over tasks 1–15, then renamed from .jsx in task 16)
    ├── types.ts            (new; client types)
    ├── data.ts             (TASKS, MOCK_MEMBERS, MOCK_TEAMS)
    ├── utils.ts            (getEffectiveStatus)
    ├── assets/
    │   └── mascot-halfbody.png   (moved from frontend/assets/)
    ├── ui/                       (18 shared primitives)
    │   ├── GlobalStyles.tsx
    │   ├── PaperBackground.tsx
    │   ├── MascotHero.tsx
    │   ├── SparkleGlyph.tsx
    │   ├── Headline.tsx
    │   ├── GradientButton.tsx
    │   ├── LaunchOverlay.tsx
    │   ├── GoogleLogo.tsx
    │   ├── GoogleSpinner.tsx
    │   ├── BottomNav.tsx
    │   ├── MenuRow.tsx
    │   ├── FormShell.tsx
    │   ├── FieldLabel.tsx
    │   ├── TextInput.tsx
    │   ├── Textarea.tsx
    │   ├── ChipGroup.tsx
    │   ├── SubmitButton.tsx
    │   └── FormSuccessOverlay.tsx
    └── screens/                  (19 feature components)
        ├── LandingScreen.tsx
        ├── GoogleAuthScreen.tsx
        ├── TaskCard.tsx          (used by Home + Tasks)
        ├── NewsBoard.tsx
        ├── HomeScreen.tsx
        ├── TasksScreen.tsx
        ├── TaskDetailScreen.tsx
        ├── RankScreen.tsx
        ├── MyRewards.tsx
        ├── RewardsScreen.tsx
        ├── MyScreen.tsx
        ├── TeamCard.tsx
        ├── RenameTeamSheet.tsx
        ├── ShareSheet.tsx
        ├── ProfileScreen.tsx
        ├── ProfileSetupForm.tsx
        ├── InterestForm.tsx
        ├── TicketForm.tsx
        └── TeamForm.tsx

backend/                          (UNTOUCHED — Phase 2 territory)
docs/
└── production-launch-plan.md     (updated: check off Phase 1 items in task 15)
justfile                          (updated in task 1: serve → vite dev)
README.md                         (updated in task 15: new commands & layout)
```

## Execution conventions

**Verification after every task.** This migration is mechanical — no unit tests are added. The "green bar" is:

1. `npm --prefix frontend run build` — TypeScript compiles AND Vite bundles with zero errors.
2. `npm --prefix frontend run dev` (or `just serve`) — dev server starts on `http://localhost:8000`.
3. **Smoke test** — click through every user flow the task affects. The full smoke-test checklist is defined once here and re-used by reference in each task:

   - **Landing + auth:** Open `/`, click the gradient start button, land on Google auth screen, click a Google account mock, land on profile setup form.
   - **Profile setup:** Fill minimum fields (zhName, phone+code, country, location), submit, land on Home.
   - **Home:** Mascot + headline render, news carousel scrolls, task cards render with correct statuses (task 1 completed, task 2 in-progress, task 3 todo, task 4 expired).
   - **Tasks screen:** Bottom nav → 任務, all four cards listed, tap card → TaskDetailScreen.
   - **TaskDetailScreen:** Steps render, "開始任務" CTA → opens the right form (task 1 → InterestForm, task 2 → TicketForm, task 3 → TeamForm from Me screen).
   - **InterestForm / TicketForm submit:** Complete → success overlay → returns to TaskDetail with completed status.
   - **Rank screen:** Bottom nav → 排行榜, period switcher works (week/month/all-time), user + team tabs both render.
   - **My screen:** Bottom nav → 我的, led-team card renders with 3 pending requests, approve one → member count goes up, reject one → disappears. Rename team via pencil icon → RenameTeamSheet slides up → save applies alias. Share via share icon → ShareSheet slides up.
   - **Team join form:** From MyScreen, "加入團隊" button → TeamForm, search by team ID/name/leader → join → pending state on MyScreen.
   - **Rewards:** 獎勵 button on Home or MyScreen → RewardsScreen lists earned rewards.
   - **Profile:** ProfileScreen avatar/info render, tap edit → ProfileSetupForm pre-filled, save → returns to ProfileScreen.
   - **Sign out:** Menu → sign out → Landing.

   Each task lists which flows it must not break; run those before committing. Tasks that don't touch a flow don't need to re-test it — but `npm run build` is mandatory every task.

**Commit granularity.** One commit per task. Commit message template: `refactor: <what> (phase-1/task-<n>)`.

**Line numbers cite the ORIGINAL monolith.** Every task references `src/App.jsx` by line ranges from the pre-Task-1 `frontend/app.jsx`. After earlier extractions drain the file, those numbers are wrong — by Task 6 the monolith has shed ~400+ lines off the top, and by Task 13 the shift exceeds several thousand lines. Use function names (every step leads with `Extract <ComponentName>`) plus `Grep` to locate the current position: e.g. `grep -n "^function GoogleLogo" frontend/src/App.jsx`. Do not attempt to jump to an absolute line in the shrunken file.

**File conventions for new `.tsx` files.** Every extracted component file follows this skeleton:

```tsx
import { /* hooks as needed */ } from 'react';
import type { /* types as needed */ } from '../types';
// additional imports (other ui/screens components, data, utils, assets)

type Props = {
  // inferred from how App.jsx (or the parent component) calls this component
};

export default function ComponentName({ /* destructured props */ }: Props) {
  // body moved verbatim from src/App.jsx, with minimal edits:
  // - React.* references → direct named imports (useState, useRef, etc.)
  // - internal helper functions stay inline unless they're exported elsewhere
  // - no behavioural changes
}
```

Named export in the same file for callers that prefer it — but `export default` is the canonical form.

**Prop typing policy.**

- **Handler props:** typed by parameter shape (`onOpen: (id: number) => void`).
- **Data props:** imported from `types.ts` (`t: Task`, `user: User`, `tasks: Task[]`).
- **Style/colour props:** `string` (they're CSS colour strings — keep loose).
- **Optional props with defaults:** reflect the default in the type (`size?: number` with `= 18` in destructure).
- **Props that are literally unused in the body:** type them anyway (TypeScript will flag mismatches if callers change).
- **Arrays of unknown-shape mocks (e.g. mock avatar gradients):** `string` for the gradient CSS value. Do not invent richer types.

Prefer `unknown` over `any` if a shape is truly opaque, but in practice every prop in this codebase has a clear source — trace the call site. Avoid suppressions (`// @ts-expect-error`, `any`) unless called out explicitly in a task.

**Working-state invariant.** After every commit, `just serve` runs the app correctly. Never leave the repo in a broken intermediate state between tasks. If a task feels too big and you need to stop, commit a working subset and note what remains — don't leave unexported imports or missing symbols.

---

### Task 1: Scaffold Vite + TypeScript (monolithic intermediate)

**Goal:** Migrate from Babel-via-CDN to Vite, leaving the app logic intact as a single `src/App.jsx` that Vite bundles. No split yet. App behaves identically.

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/tsconfig.json`
- Create: `frontend/tsconfig.node.json`
- Create: `frontend/.gitignore`
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/App.jsx` (content copied from `frontend/app.jsx`, minor edits noted below)
- Create: `frontend/src/assets/mascot-halfbody.png` (moved from `frontend/assets/`)
- Modify: `frontend/index.html`
- Modify: `justfile`
- Delete: `frontend/app.jsx`
- Delete: `frontend/assets/` (directory; empty after move)

- [ ] **Step 1: Sanity check the starting state**

Run:
```bash
git status
ls -la frontend/
```
Expected: clean working tree; `frontend/app.jsx`, `frontend/index.html`, `frontend/assets/mascot-halfbody.png` present; no `frontend/package.json` yet. If Phase 2 has modified anything in `frontend/`, stop and coordinate — this plan assumes the frontend tree matches what was described in the plan header.

Also verify:
```bash
node --version    # should be >=20
npm --version     # any recent
```
Expected: Node 20+ installed. If not, stop and install it before proceeding.

- [ ] **Step 2: Create `frontend/package.json`**

Content:
```json
{
  "name": "frontend",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.4",
    "typescript": "^5.7.2",
    "vite": "^6.0.5"
  }
}
```

- [ ] **Step 3: Create `frontend/vite.config.ts`**

Content:
```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 8000, host: true },
  preview: { port: 8000 },
});
```

`host: true` is needed so `just tunnel` (ngrok → localhost:8000) can reach the dev server. Default Vite binds to `localhost` only; `host: true` binds to all interfaces.

- [ ] **Step 4: Create `frontend/tsconfig.json`**

Content:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "allowJs": true,
    "checkJs": false,
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

Rationale for the non-default settings:
- `allowJs: true, checkJs: false` — the monolithic `src/App.jsx` must compile without TS errors during the migration. TSX files added later get full checking because they're `.tsx`.
- `noUnusedLocals: false, noUnusedParameters: false` — during extraction, imports are temporarily added before use; avoids spurious build failures.
- `strict: true` — applies to `.tsx` files; types must be real.

- [ ] **Step 5: Create `frontend/tsconfig.node.json`**

Content:
```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 6: Create `frontend/.gitignore`**

Content:
```
node_modules
dist
dist-ssr
*.local
.vite
```

- [ ] **Step 7: Create `frontend/src/main.tsx`**

Content:
```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('root element not found');

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

Note: `<StrictMode>` is a new addition for Vite. It runs effects twice in dev to surface side-effect bugs. All current effects in `App.jsx` are resize/interval listeners and should tolerate double-invocation. If a smoke-test flow breaks under StrictMode (unlikely but possible), remove `<StrictMode>` and re-verify — flag the affected component as a follow-up.

- [ ] **Step 8: Move the asset**

Run:
```bash
mkdir -p frontend/src/assets
git mv frontend/assets/mascot-halfbody.png frontend/src/assets/mascot-halfbody.png
ls -la frontend/assets      # sanity: confirm only untracked cruft remains (e.g. macOS .DS_Store)
rm -rf frontend/assets
```

`rmdir` is avoided: macOS often leaves `.DS_Store` behind after `git mv`, which would fail a plain `rmdir`. After `git mv`, anything remaining in `frontend/assets/` is untracked, so `rm -rf` on this specifically-named directory (confirmed empty of tracked files by the preceding `ls`) is safe.

- [ ] **Step 9: Create `frontend/src/App.jsx` by copying and editing the monolith**

Run:
```bash
cp frontend/app.jsx frontend/src/App.jsx
```

Now apply three edits to `frontend/src/App.jsx`:

1. **Replace the React globals destructure (line 4 of the original) with ES imports and add a mascot asset import.** Change:
```js
const { useState, useEffect, useRef, useMemo } = React;
```
to:
```js
import { useState, useEffect, useRef, useMemo } from 'react';
import mascotHalfbodyUrl from './assets/mascot-halfbody.png';
```

2. **Replace the hardcoded asset URL inside `MascotHero`.** Around line 95 of the original monolith, the string `` `assets/mascot-halfbody.png?v=1` `` appears. Replace with `mascotHalfbodyUrl`. (Vite fingerprints the asset, so the manual `?v=1` cache-bust is no longer needed.) Use Grep to verify there's exactly one occurrence of `mascot-halfbody.png` in `src/App.jsx` before editing, and exactly zero after.

3. **Replace the bottom-of-file mount with an export.** Change:
```js
ReactDOM.createRoot(document.getElementById("root")).render(<App />);
```
to:
```js
export default App;
```

Do NOT rename the file to `.tsx` yet — that happens in Task 16, after the monolith has been drained.

- [ ] **Step 10: Rewrite `frontend/index.html`**

Full new content:
```html
<!doctype html>
<html lang="zh">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>欢迎加入金富有志工</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;600;700;900&family=Noto+Serif+SC:wght@700;900&display=swap"
      rel="stylesheet"
    />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

The three removed `<script>` tags (React UMD, ReactDOM UMD, Babel standalone) are now provided by Vite's bundling of `src/main.tsx`. Fonts stay as `<link>` because they're not part of the JS bundle.

- [ ] **Step 11: Delete the old monolith**

Run:
```bash
git rm frontend/app.jsx
```

- [ ] **Step 12: Update `justfile`**

Replace the entire `justfile` content with:
```
default: serve

# Install frontend deps (idempotent; npm ci-style when lockfile present).
install:
    npm --prefix frontend install

# Run the Vite dev server on http://localhost:8000
serve: install
    npm --prefix frontend run dev

# Type-check and build the production bundle into frontend/dist
build: install
    npm --prefix frontend run build

# Expose local port 8000 (https) via a reserved ngrok hostname
tunnel:
    ngrok http --url=subvitalized-occupative-katelyn.ngrok-free.dev --scheme=https 8000
```

The `serve` recipe keeps its name (README references it); its body now runs Vite. The `uv` / Python `http.server` dependency is gone.

- [ ] **Step 13: Install and build**

Run:
```bash
just install
just build
```

Expected:
- `just install` creates `frontend/node_modules/` and `frontend/package-lock.json`.
- `just build` compiles TypeScript (`tsc -b`) and produces `frontend/dist/`. Zero errors.

If `tsc -b` complains about `src/App.jsx` not being in any project, verify `tsconfig.json` has `"allowJs": true` and the `include` is `["src"]`. If it still fails, the `.jsx` is fine for Vite but `tsc` may want explicit inclusion — this is handled by `allowJs` + `include: ["src"]`; debug from there.

- [ ] **Step 14: Dev-server smoke test**

Run:
```bash
just serve
```

In a browser at `http://localhost:8000`, run the full smoke-test checklist from the Execution conventions section. Every flow must work exactly as it did before.

Known risks:
- **Mascot image 404.** If `mascotHalfbodyUrl` resolves wrong, the mascot disappears. Check the browser Network tab — the URL should be something like `/src/assets/mascot-halfbody.png?…` in dev, `/assets/mascot-halfbody-HASH.png` in the built bundle.
- **StrictMode-induced double-invocation.** If a screen flickers oddly, comment out `<StrictMode>` in `main.tsx` and retest. If that fixes it, keep StrictMode off for now and add a follow-up note in the commit message.

Stop the dev server with `Ctrl+C`.

- [ ] **Step 15: Commit**

Run:
```bash
git add -A
git status
```

Expected new/modified/deleted files:
- new: `frontend/package.json`, `frontend/package-lock.json`, `frontend/vite.config.ts`, `frontend/tsconfig.json`, `frontend/tsconfig.node.json`, `frontend/.gitignore`, `frontend/src/main.tsx`, `frontend/src/App.jsx`, `frontend/src/assets/mascot-halfbody.png`
- modified: `frontend/index.html`, `justfile`
- deleted: `frontend/app.jsx`, `frontend/assets/mascot-halfbody.png` (shown as rename if git detects it)

Commit:
```bash
git commit -m "$(cat <<'EOF'
refactor: scaffold Vite + TypeScript in frontend/ (phase-1/task-1)

- add package.json, vite.config.ts, tsconfig.*, .gitignore
- move app.jsx → src/App.jsx; add src/main.tsx entry
- move assets/ → src/assets/; import mascot as ES module
- rewrite index.html to use Vite module entry (drop CDN scripts)
- update justfile to run vite instead of python http.server

App runs identically; no behavioural change. Subsequent tasks split
App.jsx into per-component modules.
EOF
)"
```

---

### Task 2: Client type declarations (`src/types.ts`)

**Goal:** Create `src/types.ts` with the minimum set of types needed for the rest of the extraction. These are CLIENT types — loose, optional-heavy, faithful to the mock data. They will be regenerated from the Pydantic contract in Phase 4.

**Files:**
- Create: `frontend/src/types.ts`

- [ ] **Step 1: Inspect the mock data shapes**

Read:
- `frontend/src/App.jsx` lines 790–874 (`TASKS` array).
- `frontend/src/App.jsx` lines 9352–9401 (`MOCK_MEMBERS`).
- `frontend/src/App.jsx` lines 9403–9456 (`MOCK_TEAMS`).
- `frontend/src/App.jsx` line 9811 onward (the `App` component's `useState` calls and the `handleProfileComplete` / `syncTeamTask` / `joinTeam` handlers — the User and Team shapes are most visible here).

Confirm by reading that:
- `Task.id` is `number` (1, 2, 3, 4).
- `Team.id` is `string` (`"T-MING2024"`, etc.).
- `User.id` is `string` (`"U..."` format constructed by `userIdFromEmail`).
- `Team.members` and `Team.requests` hold entries with `{id, name, avatar}` where `avatar` is a CSS gradient string.
- `Task.status` is one of `"todo" | "in_progress" | "completed" | "expired"` as stored; the "locked" status is derived by `getEffectiveStatus`.
- `Task.tag` is one of `"探索" | "社区" | "陪伴"` in the mock data.

- [ ] **Step 2: Write `frontend/src/types.ts`**

Content:
```ts
// Client-side types for the prototype. These describe the current mock-data
// shapes — loose, optional-heavy, camelCase. Phase 4 replaces them with
// types generated from the FastAPI/Pydantic contract (snake_case, UUIDs).

export type TaskTag = "探索" | "社区" | "陪伴";
export type TaskStatus = "todo" | "in_progress" | "completed" | "expired";
export type EffectiveTaskStatus = TaskStatus | "locked";

export type TaskStep = {
  label: string;
  done: boolean;
};

export type TeamProgress = {
  total: number;
  cap: number;
  ledTotal: number;
  joinedTotal: number;
};

export type Task = {
  id: number;
  title: string;
  due: string | null;
  daysLeft: number | null;
  color: string;
  points: number;
  tag: TaskTag;
  bonus: string | null;
  status: TaskStatus;
  progress?: number;
  summary: string;
  description: string;
  estMinutes: number;
  steps?: TaskStep[];
  requires?: number[];
  cap?: number;
  teamProgress?: TeamProgress | null;
  isChallenge?: boolean;
};

export type User = {
  id: string;                       // "U" + derived suffix
  email: string;
  name: string;
  picture?: string;
  zhName?: string;
  enName?: string;
  nickname?: string;
  phone?: string;
  phoneCode?: string;
  lineId?: string;
  telegramId?: string;
  country?: string;
  location?: string;
};

export type TeamMemberRef = {
  id: string;
  name: string;
  avatar: string;                   // CSS gradient string
};

export type JoinRequest = {
  id: string;
  name: string;
  avatar: string;
};

export type TeamRole = "leader" | "member";

// Team as carried in App state. `requests` is leader-only. `status`/`currentCount`
// are only set on the joined-team branch (pending → approved flow).
export type Team = {
  id: string;                       // "T-..." format
  role: TeamRole;
  name: string;
  alias?: string;
  topic: string;
  leader: TeamMemberRef;
  members: TeamMemberRef[];
  requests?: JoinRequest[];
  cap?: number;
  status?: "pending" | "approved";
  currentCount?: number;
};

// Mock leaderboard team entry (see MOCK_TEAMS). Differs from the in-app Team
// used for ledTeam/joinedTeam: flat `members`/`leader` counts, no `role`.
export type MockTeam = {
  id: string;
  name: string;
  leader: string;
  leaderId: string;
  topic: string;
  members: number;
  cap: number;
  points: number;
  weekPoints: number;
  rank: number;
  leaderAvatar: string;
};

export type MockMember = {
  id: string;
  name: string;
  role: string;                     // job/skill label, e.g. "設計美編"
  avatar: string;
};

// Success overlay payload used by FormSuccessOverlay.
export type SuccessData = {
  color: string;
  points: number;
  bonus: string | null;
  title?: string;
};

// Top-level screen identifiers driven by App's `screen` useState.
export type ScreenId =
  | "landing"
  | "auth"
  | "profileSetup"
  | "profile"
  | "profileEdit"
  | "home"
  | "tasks"
  | "rank"
  | "taskDetail"
  | "form"
  | "me"
  | "rewards";
```

- [ ] **Step 3: Verify the file compiles**

Run:
```bash
just build
```

Expected: zero errors. `types.ts` has no value exports that any other file imports yet, so this just confirms TypeScript is happy with the declarations.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/types.ts
git commit -m "refactor: add client-side type declarations (phase-1/task-2)"
```

---

### Task 3: Extract mock data and utilities (`src/data.ts`, `src/utils.ts`)

**Goal:** Move the top-level data constants and pure helpers out of `src/App.jsx`. After this task, those symbols are imported from `./data` and `./utils` rather than hoisted within `App.jsx`.

**Files:**
- Create: `frontend/src/data.ts`
- Create: `frontend/src/utils.ts`
- Modify: `frontend/src/App.jsx` (remove definitions; add imports)

- [ ] **Step 1: Create `frontend/src/data.ts`**

Copy three chunks from `src/App.jsx` verbatim, wrapping each in an `export const` typed against the types module:

- `TASKS` from lines 790–874 → `export const TASKS: Task[] = [ … ];`
- `MOCK_MEMBERS` from lines 9352–9401 → `export const MOCK_MEMBERS: MockMember[] = [ … ];`
- `MOCK_TEAMS` from lines 9403–9456 → `export const MOCK_TEAMS: MockTeam[] = [ … ];`

File skeleton:
```ts
import type { Task, MockMember, MockTeam } from './types';

export const TASKS: Task[] = [
  // … verbatim copy of the array at src/App.jsx lines 791–874 …
];

export const MOCK_MEMBERS: MockMember[] = [
  // … verbatim copy of the array at src/App.jsx lines 9353–9401 …
];

export const MOCK_TEAMS: MockTeam[] = [
  // … verbatim copy of the array at src/App.jsx lines 9404–9456 …
];
```

Do not alter any string, colour, or numeric value. If TypeScript complains about a `Task` literal (e.g. `tag: "社区"` vs. the `TaskTag` union), do not relax the type — instead, widen `TaskTag` in `types.ts` to include the offending literal. If something doesn't fit, the types are wrong; fix the type, not the data.

- [ ] **Step 2: Create `frontend/src/utils.ts`**

Copy the `getEffectiveStatus` function from `src/App.jsx` lines 876–884. Type it properly:

```ts
import type { Task, EffectiveTaskStatus } from './types';

export function getEffectiveStatus(
  t: Task,
  allTasks: Task[],
): { status: EffectiveTaskStatus; unmet: number[] } {
  const completedIds = new Set(
    allTasks.filter((x) => x.status === "completed").map((x) => x.id),
  );
  const unmet = (t.requires || []).filter((rid) => !completedIds.has(rid));
  return unmet.length > 0
    ? { status: "locked", unmet }
    : { status: t.status, unmet: [] };
}
```

(The function body is identical to the monolith; only JSDoc-style inference has been replaced with explicit types.)

- [ ] **Step 3: Edit `frontend/src/App.jsx`**

- Remove the `TASKS = [ … ];` block (lines 790–874 of the original monolith, now similarly placed in `src/App.jsx`).
- Remove the `MOCK_MEMBERS = [ … ];` block.
- Remove the `MOCK_TEAMS = [ … ];` block.
- Remove the `function getEffectiveStatus(...) { … }` block.
- At the top of the file, **after** the React and mascot imports added in Task 1, add:
  ```js
  import { TASKS, MOCK_MEMBERS, MOCK_TEAMS } from './data';
  import { getEffectiveStatus } from './utils';
  ```

Everything else in `App.jsx` stays as-is. Components still reference `TASKS`, `MOCK_MEMBERS`, `MOCK_TEAMS`, and `getEffectiveStatus` as bare identifiers — they're now imports rather than file-scope hoisted constants.

- [ ] **Step 4: Build and verify**

```bash
just build
```
Expected: zero errors.

- [ ] **Step 5: Smoke test**

```bash
just serve
```

Check affected flows:
- **Home:** Task cards show same ordering and statuses as before.
- **Tasks screen:** All four cards render.
- **Task detail:** Prerequisite lock on task 3 still works (until tasks 1 & 2 are completed) — this is `getEffectiveStatus`.
- **Team join form:** Search by leader/name/id still works — that uses `MOCK_TEAMS`.

Stop the dev server.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/data.ts frontend/src/utils.ts frontend/src/App.jsx
git commit -m "refactor: extract mock data and task-status util (phase-1/task-3)"
```

---

### Task 4: UI primitives batch A — intro / hero components (7 files)

**Goal:** Extract 7 visual primitives with no cross-component dependencies beyond React. These are the easiest starting points and confirm the extraction workflow.

**Files** (listed in extraction order — `SparkleGlyph` before `MascotHero` because the latter depends on the former):
- Create: `frontend/src/ui/GlobalStyles.tsx`
- Create: `frontend/src/ui/PaperBackground.tsx`
- Create: `frontend/src/ui/SparkleGlyph.tsx`
- Create: `frontend/src/ui/MascotHero.tsx`
- Create: `frontend/src/ui/Headline.tsx`
- Create: `frontend/src/ui/GradientButton.tsx`
- Create: `frontend/src/ui/LaunchOverlay.tsx`
- Modify: `frontend/src/App.jsx`

**Extraction template (apply for each component below).**

For each component:

1. Read the corresponding function body from `src/App.jsx` (line numbers listed below).
2. Create the new file at the listed path, following the "File conventions for new `.tsx` files" section. The body is copied verbatim. Imports: `import { /* hooks */ } from 'react';` as needed; inter-component imports only if the body references other extracted components (none in Batch A except that `MascotHero` uses `SparkleGlyph`).
3. In `src/App.jsx`, delete the original function declaration.
4. In `src/App.jsx`, add an import at the top: `import ComponentName from './ui/ComponentName';`.
5. After all components in the batch are extracted, run `just build` → zero errors, then `just serve` → smoke test the affected flows.
6. Commit.

**Batch A components (in dependency order — extract SparkleGlyph before MascotHero because MascotHero uses it):**

- [ ] **Step 1: Extract `GlobalStyles` (App.jsx lines 7–24)**

Target: `frontend/src/ui/GlobalStyles.tsx`.

Props: none.

Skeleton:
```tsx
export default function GlobalStyles() {
  // body unchanged from App.jsx lines 8–23
}
```

- [ ] **Step 2: Extract `PaperBackground` (App.jsx lines 27–31)**

Target: `frontend/src/ui/PaperBackground.tsx`.

Props: none.

- [ ] **Step 3: Extract `SparkleGlyph` (App.jsx lines 137–158)**

Target: `frontend/src/ui/SparkleGlyph.tsx`.

Props type:
```ts
type Props = {
  x: number;
  y: number;
  size?: number;        // default 18
  color?: string;       // default "#fff"
  delay?: number;       // default 0
};
```

Keep the existing default-arg destructure: `{ x, y, size = 18, color = "#fff", delay = 0 }: Props`.

- [ ] **Step 4: Extract `MascotHero` (App.jsx lines 34–135)**

Target: `frontend/src/ui/MascotHero.tsx`.

Imports: needs `SparkleGlyph` (extracted in Step 3) and `mascotHalfbodyUrl`:
```tsx
import SparkleGlyph from './SparkleGlyph';
import mascotHalfbodyUrl from '../assets/mascot-halfbody.png';
```

Also relocate the mascot import here — remove it from `App.jsx`'s top imports once this extraction is done. (The `MascotHero` is the only consumer.)

Props type:
```ts
type Props = {
  size: number;
};
```

- [ ] **Step 5: Extract `Headline` (App.jsx lines 160–182)**

Target: `frontend/src/ui/Headline.tsx`.

Props type:
```ts
type Props = {
  text: string;
  fontSize: number;
};
```

- [ ] **Step 6: Extract `GradientButton` (App.jsx lines 184–232)**

Target: `frontend/src/ui/GradientButton.tsx`.

Props type:
```ts
type Props = {
  label: string;
  onClick: () => void;
};
```

`GradientButton` uses `useState` for hover/press state — include `import { useState } from 'react';`.

- [ ] **Step 7: Extract `LaunchOverlay` (App.jsx lines 234–279)**

Target: `frontend/src/ui/LaunchOverlay.tsx`.

Props type:
```ts
type Props = {
  onDone: () => void;
};
```

`LaunchOverlay` uses `useEffect` (timers) — include it in the React imports.

- [ ] **Step 8: Update `App.jsx` imports**

Add to the top of `src/App.jsx` (alongside the existing ones):
```js
import GlobalStyles from './ui/GlobalStyles';
import PaperBackground from './ui/PaperBackground';
import MascotHero from './ui/MascotHero';
import SparkleGlyph from './ui/SparkleGlyph';
import Headline from './ui/Headline';
import GradientButton from './ui/GradientButton';
import LaunchOverlay from './ui/LaunchOverlay';
```

Remove the `import mascotHalfbodyUrl …` line from `App.jsx` — it's now only used inside `MascotHero.tsx`.

- [ ] **Step 9: Build and smoke test**

```bash
just build
```
Expected: zero errors.

```bash
just serve
```
Smoke-test focus: Landing screen (uses all 7 primitives) renders identically. Click start → auth screen (LaunchOverlay triggers if implemented there) works. Scroll all other screens to confirm no regressions.

- [ ] **Step 10: Commit**

```bash
git add frontend/src/ui/GlobalStyles.tsx frontend/src/ui/PaperBackground.tsx frontend/src/ui/MascotHero.tsx frontend/src/ui/SparkleGlyph.tsx frontend/src/ui/Headline.tsx frontend/src/ui/GradientButton.tsx frontend/src/ui/LaunchOverlay.tsx frontend/src/App.jsx
git commit -m "refactor: extract 7 ui primitives (intro/hero) (phase-1/task-4)"
```

---

### Task 5: UI primitives batch B — auth + navigation (3 files)

**Files:**
- Create: `frontend/src/ui/GoogleLogo.tsx`
- Create: `frontend/src/ui/GoogleSpinner.tsx`
- Create: `frontend/src/ui/BottomNav.tsx`
- Modify: `frontend/src/App.jsx`

Follow the extraction template from Task 4.

- [ ] **Step 1: Extract `GoogleLogo` (App.jsx lines 737–763)**

Target: `frontend/src/ui/GoogleLogo.tsx`. Props: none.

- [ ] **Step 2: Extract `GoogleSpinner` (App.jsx lines 765–788)**

Target: `frontend/src/ui/GoogleSpinner.tsx`. Props: none.

- [ ] **Step 3: Extract `BottomNav` (App.jsx lines 1957–2003)**

Target: `frontend/src/ui/BottomNav.tsx`.

Props type:
```ts
type Props = {
  current: string;                  // matches ScreenId values the nav emits
  muted: string;                    // CSS colour
  onNavigate: (screen: string) => void;
};
```

Note: `current` and the `onNavigate` arg are `string` rather than the `ScreenId` union because `BottomNav` only emits a subset (`"home" | "tasks" | "rank" | "me"`). Tightening this union is a nice-to-have but not required — keep it loose to match existing runtime behaviour.

- [ ] **Step 4: Update `App.jsx` imports**

Add:
```js
import GoogleLogo from './ui/GoogleLogo';
import GoogleSpinner from './ui/GoogleSpinner';
import BottomNav from './ui/BottomNav';
```

- [ ] **Step 5: Build and smoke test**

```bash
just build
just serve
```

Focus: Google auth screen (uses `GoogleLogo` + `GoogleSpinner`) renders the sign-in button and the loading spinner. Bottom nav on Home/Tasks/Rank/Me screens renders + navigates correctly.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/ui/GoogleLogo.tsx frontend/src/ui/GoogleSpinner.tsx frontend/src/ui/BottomNav.tsx frontend/src/App.jsx
git commit -m "refactor: extract 3 ui primitives (auth/nav) (phase-1/task-5)"
```

---

### Task 6: UI primitives batch C — form fields + overlays (8 files)

**Files:**
- Create: `frontend/src/ui/FormShell.tsx`
- Create: `frontend/src/ui/FieldLabel.tsx`
- Create: `frontend/src/ui/TextInput.tsx`
- Create: `frontend/src/ui/Textarea.tsx`
- Create: `frontend/src/ui/ChipGroup.tsx`
- Create: `frontend/src/ui/SubmitButton.tsx`
- Create: `frontend/src/ui/MenuRow.tsx`
- Create: `frontend/src/ui/FormSuccessOverlay.tsx`
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Extract `FormShell` (App.jsx lines 8091–8219)**

Target: `frontend/src/ui/FormShell.tsx`.

Open the current definition and read the props destructure. Mirror it in a `Props` type. Common shape (verify against the actual destructure):
```ts
type Props = {
  bg: string;
  fg: string;
  muted: string;
  title: string;
  subtitle?: string;
  onCancel: () => void;
  children: React.ReactNode;
};
```

Imports: `import type { ReactNode } from 'react';` (or use `React.ReactNode` with a type import of `React`).

- [ ] **Step 2: Extract `FieldLabel` (App.jsx lines 8221–8229)**

Target: `frontend/src/ui/FieldLabel.tsx`.

Props:
```ts
type Props = {
  children: React.ReactNode;
  required?: boolean;
};
```

- [ ] **Step 3: Extract `TextInput` (App.jsx lines 8231–8263)**

Target: `frontend/src/ui/TextInput.tsx`.

Props:
```ts
type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};
```

Keep the existing `onChange(e.target.value)` translation — the ambient prop is `(string) => void`, not a React event handler, because that's how callers invoke it in the monolith.

- [ ] **Step 4: Extract `Textarea` (App.jsx lines 8265–8297)**

Target: `frontend/src/ui/Textarea.tsx`.

Props:
```ts
type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;                    // default 3
};
```

- [ ] **Step 5: Extract `ChipGroup` (App.jsx lines 8299–8345)**

Target: `frontend/src/ui/ChipGroup.tsx`.

Props:
```ts
type Props = {
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  multi?: boolean;                  // default true
};
```

- [ ] **Step 6: Extract `SubmitButton` (App.jsx lines 8347–8374)**

Target: `frontend/src/ui/SubmitButton.tsx`.

Props:
```ts
type Props = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  color?: string;                   // default "#cb9f01"
};
```

- [ ] **Step 7: Extract `MenuRow` (App.jsx lines 6373–6450)**

Target: `frontend/src/ui/MenuRow.tsx`.

Read the current destructure to pin the exact prop list. Common shape:
```ts
type Props = {
  icon?: React.ReactNode;
  label: string;
  subtitle?: string;
  danger?: boolean;
  onClick?: () => void;
  rightSlot?: React.ReactNode;
  muted?: string;
  fg?: string;
};
```

Tune fields to match the actual destructure — do not leave any prop untyped.

- [ ] **Step 8: Extract `FormSuccessOverlay` (App.jsx lines 9716–9808)**

Target: `frontend/src/ui/FormSuccessOverlay.tsx`.

Imports: `useEffect` (auto-dismiss timer). Props match the `SuccessData` type from `types.ts` plus an `onDone` callback:
```ts
import type { SuccessData } from '../types';

type Props = SuccessData & { onDone: () => void };
```

In `App.jsx`, the caller spreads `successData` and adds `onDone`: `<FormSuccessOverlay {...successData} onDone={…} />`. `Props = SuccessData & { onDone }` matches.

- [ ] **Step 9: Update `App.jsx` imports**

Add:
```js
import FormShell from './ui/FormShell';
import FieldLabel from './ui/FieldLabel';
import TextInput from './ui/TextInput';
import Textarea from './ui/Textarea';
import ChipGroup from './ui/ChipGroup';
import SubmitButton from './ui/SubmitButton';
import MenuRow from './ui/MenuRow';
import FormSuccessOverlay from './ui/FormSuccessOverlay';
```

- [ ] **Step 10: Build and smoke test**

```bash
just build
just serve
```

Focus flows:
- **Profile setup form** — uses FormShell + FieldLabel + TextInput + ChipGroup + SubmitButton. Fill it in; submit works.
- **Interest form / Ticket form / Team form** — same primitives. Submit each, verify FormSuccessOverlay pops.
- **My screen sign-out menu** — uses `MenuRow`. Opens + closes correctly.

- [ ] **Step 11: Commit**

```bash
git add frontend/src/ui/FormShell.tsx frontend/src/ui/FieldLabel.tsx frontend/src/ui/TextInput.tsx frontend/src/ui/Textarea.tsx frontend/src/ui/ChipGroup.tsx frontend/src/ui/SubmitButton.tsx frontend/src/ui/MenuRow.tsx frontend/src/ui/FormSuccessOverlay.tsx frontend/src/App.jsx
git commit -m "refactor: extract 8 ui primitives (form fields + overlays) (phase-1/task-6)"
```

After this task, **all 18 UI primitives are in `src/ui/`**. The remaining extractions are screens.

---

### Task 7: Extract `TaskCard` (shared screen component)

**Goal:** `TaskCard` is used by both `HomeScreen` and `TasksScreen`. Extracting it first, before those two screens, means the screens will already have `TaskCard` as an import when they're extracted.

**Files:**
- Create: `frontend/src/screens/TaskCard.tsx`
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Extract `TaskCard` (App.jsx lines 886–1202)**

Target: `frontend/src/screens/TaskCard.tsx`.

Imports:
```tsx
import type { Task } from '../types';
import { getEffectiveStatus } from '../utils';
```

Props type (read destructure at line 886–895):
```ts
type Props = {
  t: Task;
  allTasks: Task[];
  cardBg: string;
  cardBorder: string;
  muted: string;
  fg: string;
  index?: number;                   // default 0
  onOpen: (id: number) => void;
};
```

- [ ] **Step 2: Update `App.jsx`**

- Delete the `TaskCard` function.
- Add import: `import TaskCard from './screens/TaskCard';`.

- [ ] **Step 3: Build and smoke test**

```bash
just build
just serve
```

Task cards on Home and Tasks screens render identically (statuses, colors, prerequisite locks, urgency badges).

- [ ] **Step 4: Commit**

```bash
git add frontend/src/screens/TaskCard.tsx frontend/src/App.jsx
git commit -m "refactor: extract TaskCard screen component (phase-1/task-7)"
```

---

### Task 8: Extract the Landing flow (`LandingScreen`, `GoogleAuthScreen`)

**Files:**
- Create: `frontend/src/screens/LandingScreen.tsx`
- Create: `frontend/src/screens/GoogleAuthScreen.tsx`
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Extract `LandingScreen` (App.jsx lines 281–457)**

Target: `frontend/src/screens/LandingScreen.tsx`.

Imports (from what the body uses — verify via Grep of lines 281–457):
```tsx
import { useState, useEffect } from 'react';
import GlobalStyles from '../ui/GlobalStyles';
import PaperBackground from '../ui/PaperBackground';
import MascotHero from '../ui/MascotHero';
import Headline from '../ui/Headline';
import GradientButton from '../ui/GradientButton';
// Add SparkleGlyph and LaunchOverlay if LandingScreen uses them directly;
// otherwise skip. (SparkleGlyph is used inside MascotHero and doesn't need
// re-importing here unless LandingScreen also uses it standalone.)
```

Props type:
```ts
type Props = {
  onStart: () => void;
};
```

- [ ] **Step 2: Extract `GoogleAuthScreen` (App.jsx lines 459–735)**

Target: `frontend/src/screens/GoogleAuthScreen.tsx`.

Imports:
```tsx
import { useState, useEffect } from 'react';
import PaperBackground from '../ui/PaperBackground';
import GoogleLogo from '../ui/GoogleLogo';
import GoogleSpinner from '../ui/GoogleSpinner';
import type { User } from '../types';
```

Props type:
```ts
type Props = {
  onCancel: () => void;
  onSuccess: (user: Pick<User, 'email' | 'name' | 'picture'>) => void;
};
```

Verify `onSuccess`'s arg shape by reading what the component invokes it with — the `handleSignIn` in `App.jsx` takes `rawUser` and derives `id` from email, so the component passes only the Google-sourced fields. Adjust the `Pick<...>` to match exactly what the component emits.

- [ ] **Step 3: Update `App.jsx`**

- Delete both functions.
- Add imports:
  ```js
  import LandingScreen from './screens/LandingScreen';
  import GoogleAuthScreen from './screens/GoogleAuthScreen';
  ```

- [ ] **Step 4: Build and smoke test**

```bash
just build
just serve
```

Focus: Landing → tap start → auth screen renders the Google account picker → select → profile setup.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/screens/LandingScreen.tsx frontend/src/screens/GoogleAuthScreen.tsx frontend/src/App.jsx
git commit -m "refactor: extract Landing + GoogleAuth screens (phase-1/task-8)"
```

---

### Task 9: Extract the Home flow (`NewsBoard`, `HomeScreen`)

**Files:**
- Create: `frontend/src/screens/NewsBoard.tsx`
- Create: `frontend/src/screens/HomeScreen.tsx`
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Extract `NewsBoard` (App.jsx lines 1204–1434)**

Target: `frontend/src/screens/NewsBoard.tsx`.

Imports: `useRef`, `useState`, `useEffect` (scroll carousel uses these — verify).

Props type (read destructure at line 1204):
```ts
type Props = {
  fg: string;
  muted: string;
  cardBg: string;
  cardBorder: string;
};
```

Note: any hard-coded news items inside `NewsBoard` stay inside the file. Do not try to lift them to `data.ts` — they're presentational strings, not domain data, and Phase 4 replaces them with `GET /news`.

- [ ] **Step 2: Extract `HomeScreen` (App.jsx lines 1436–1955)**

Target: `frontend/src/screens/HomeScreen.tsx`.

Imports (verify by reading the body):
```tsx
import { useState, useEffect, useMemo } from 'react';
import PaperBackground from '../ui/PaperBackground';
import BottomNav from '../ui/BottomNav';
import MenuRow from '../ui/MenuRow';
import TaskCard from './TaskCard';
import NewsBoard from './NewsBoard';
import type { User, Task, ScreenId } from '../types';
```

Props type (read destructure around line 1436):
```ts
type Props = {
  user: User | null;
  tasks: Task[];
  onSignOut: () => void;
  onNavigate: (screen: ScreenId) => void;
  onOpenTask: (id: number) => void;
};
```

- [ ] **Step 3: Update `App.jsx`**

- Delete both functions.
- Add imports:
  ```js
  import NewsBoard from './screens/NewsBoard';
  import HomeScreen from './screens/HomeScreen';
  ```

- [ ] **Step 4: Build and smoke test**

```bash
just build
just serve
```

Focus: Home renders mascot greeting, news carousel (auto-scrolls / swipes), task cards in correct order, sign-out menu (via MenuRow).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/screens/NewsBoard.tsx frontend/src/screens/HomeScreen.tsx frontend/src/App.jsx
git commit -m "refactor: extract Home + NewsBoard screens (phase-1/task-9)"
```

---

### Task 10: Extract the Tasks flow (`TasksScreen`, `TaskDetailScreen`)

**Files:**
- Create: `frontend/src/screens/TasksScreen.tsx`
- Create: `frontend/src/screens/TaskDetailScreen.tsx`
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Extract `TasksScreen` (App.jsx lines 2005–2288)**

Target: `frontend/src/screens/TasksScreen.tsx`.

Imports:
```tsx
import { useState, useMemo } from 'react';
import PaperBackground from '../ui/PaperBackground';
import BottomNav from '../ui/BottomNav';
import TaskCard from './TaskCard';
import type { Task, ScreenId } from '../types';
```

Props type (read destructure around line 2005):
```ts
type Props = {
  tasks: Task[];
  onNavigate: (screen: ScreenId) => void;
  onOpenTask: (id: number) => void;
};
```

- [ ] **Step 2: Extract `TaskDetailScreen` (App.jsx lines 2290–3267)**

Target: `frontend/src/screens/TaskDetailScreen.tsx`.

Imports:
```tsx
import { useState, useMemo } from 'react';
import PaperBackground from '../ui/PaperBackground';
import { getEffectiveStatus } from '../utils';
import type { Task } from '../types';
```

Props type (read destructure around line 2290):
```ts
type Props = {
  tasks: Task[];
  taskId: number | null;
  onBack: () => void;
  onOpenTask: (id: number) => void;
  onStartTask: (id: number) => void;
  onGoMe: () => void;
};
```

This file is ~1000 lines — it's the largest single extraction. Move the body verbatim; do not refactor.

- [ ] **Step 3: Update `App.jsx`**

- Delete both functions.
- Add imports:
  ```js
  import TasksScreen from './screens/TasksScreen';
  import TaskDetailScreen from './screens/TaskDetailScreen';
  ```

- [ ] **Step 4: Build and smoke test**

```bash
just build
just serve
```

Focus: Tasks list renders with all four cards. Tap each card → TaskDetail renders with correct summary/steps/CTA. Start task 1 → InterestForm, task 2 → TicketForm. Task 3 "組隊挑戰" detail shows requires-lock until 1 & 2 are completed; then the "邀請組員" / "加入團隊" CTAs appear.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/screens/TasksScreen.tsx frontend/src/screens/TaskDetailScreen.tsx frontend/src/App.jsx
git commit -m "refactor: extract Tasks + TaskDetail screens (phase-1/task-10)"
```

---

### Task 11: Extract TeamCard and its sheets (`RenameTeamSheet`, `ShareSheet`, `TeamCard`)

**Goal:** `TeamCard` is the largest screen component (~1285 lines) and depends on `RenameTeamSheet` and `ShareSheet`. Extract all three together — their dependency relationships are entirely within this group. After this task, `TeamCard` is ready to be imported by the still-inline `MyScreen` in `App.jsx` (extracted in Task 12).

**Files:**
- Create: `frontend/src/screens/RenameTeamSheet.tsx`
- Create: `frontend/src/screens/ShareSheet.tsx`
- Create: `frontend/src/screens/TeamCard.tsx`
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Extract `RenameTeamSheet`**

Locate the function in the shrinking monolith: `grep -n "^function RenameTeamSheet" frontend/src/App.jsx`. In the original monolith it sat at lines 7738–7882.

Target: `frontend/src/screens/RenameTeamSheet.tsx`.

Imports:
```tsx
import { useState, useEffect } from 'react';
import type { Team } from '../types';
```

Props type (read the destructure — do not guess):
```ts
type Props = {
  team: Team;
  onClose: () => void;
  onSave: (alias: string) => void;
  fg: string;
  muted: string;
};
```

- [ ] **Step 2: Extract `ShareSheet`**

Locate via `grep -n "^function ShareSheet" frontend/src/App.jsx`. Original monolith lines 7884–8089.

Target: `frontend/src/screens/ShareSheet.tsx`.

Imports:
```tsx
import { useState, useEffect } from 'react';
import type { Team } from '../types';
```

Props type (read the destructure):
```ts
type Props = {
  team: Team;
  onClose: () => void;
  fg: string;
  muted: string;
  // plus whatever else the destructure shows — verify
};
```

- [ ] **Step 3: Extract `TeamCard`**

Locate via `grep -n "^function TeamCard" frontend/src/App.jsx`. Original monolith lines 6452–7736.

Target: `frontend/src/screens/TeamCard.tsx`.

Imports:
```tsx
import { useState, useEffect, useMemo } from 'react';
import RenameTeamSheet from './RenameTeamSheet';
import ShareSheet from './ShareSheet';
import type { Team, JoinRequest } from '../types';
```

This is the largest screen component (~1285 lines) — it handles leader and member views, the pending-request queue, share, rename. Read the destructure for the full prop list; skeleton:
```ts
type Props = {
  team: Team;
  isLeader: boolean;
  onApproveRequest?: (requestId: string) => void;
  onRejectRequest?: (requestId: string) => void;
  onRename?: (alias: string) => void;
  onLeave?: () => void;
  onCancelRequest?: () => void;
  // plus style/colour props: fg, muted, cardBg, cardBorder, etc. — verify and include every one
};
```

Every prop passed by `MyScreen` (still inline in `App.jsx` until Task 12) must be represented in this type.

- [ ] **Step 4: Update `App.jsx`**

- Delete the three functions `RenameTeamSheet`, `ShareSheet`, and `TeamCard` from `src/App.jsx`.
- Add **one** import at the top: `import TeamCard from './screens/TeamCard';`.
- Do **not** import `RenameTeamSheet` or `ShareSheet` in `App.jsx` — they are consumed only by `TeamCard`, never by `App.jsx` directly. `TeamCard.tsx` handles those imports internally.
- The still-inline `MyScreen` function (and its still-inline `MyRewards` helper) continues to render `<TeamCard …/>`; that reference now resolves to the imported component.

- [ ] **Step 5: Build and smoke test**

```bash
just build
just serve
```

Focus flows (everything outside the Me tab should be unaffected, so the smoke test is scoped):
- Sign in, complete profile, go to 我的. The led-team card renders with its three pending requests.
- Approve one → member count goes up (and task 3 team progress advances). Reject one.
- Tap the pencil icon → `RenameTeamSheet` slides up; save applies the alias.
- Tap the share icon → `ShareSheet` slides up and closes correctly.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/screens/RenameTeamSheet.tsx frontend/src/screens/ShareSheet.tsx frontend/src/screens/TeamCard.tsx frontend/src/App.jsx
git commit -m "refactor: extract TeamCard and its sheets (phase-1/task-11)"
```

---

### Task 12: Extract `MyScreen` and `MyRewards`

**Goal:** With `TeamCard` and its sheets already extracted (Task 11), we can lift `MyScreen` and its co-component `MyRewards` out of the monolith. After this task the Me flow is fully modularised.

**Files:**
- Create: `frontend/src/screens/MyRewards.tsx`
- Create: `frontend/src/screens/MyScreen.tsx`
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Extract `MyRewards`**

Locate via `grep -n "^function MyRewards" frontend/src/App.jsx`. Original monolith lines 4648–5355.

Target: `frontend/src/screens/MyRewards.tsx`.

Imports (verify):
```tsx
import { useMemo, useState } from 'react';
import type { Task } from '../types';
```

Props type (read the destructure — do not guess). Likely shape:
```ts
type Props = {
  fg: string;
  muted: string;
  tasks: Task[];
  // plus callback / colour props — verify and include every one
};
```

- [ ] **Step 2: Extract `MyScreen`**

Locate via `grep -n "^function MyScreen" frontend/src/App.jsx`. Original monolith lines 5546–6371.

Target: `frontend/src/screens/MyScreen.tsx`.

Imports:
```tsx
import { useState, useEffect, useMemo } from 'react';
import PaperBackground from '../ui/PaperBackground';
import BottomNav from '../ui/BottomNav';
import MenuRow from '../ui/MenuRow';
import TeamCard from './TeamCard';
import MyRewards from './MyRewards';
import type { User, Team, Task, ScreenId } from '../types';
```

Props type (read destructure):
```ts
type Props = {
  user: User | null;
  ledTeam: Team | null;
  joinedTeam: Team | null;
  tasks: Task[];
  onSignOut: () => void;
  onNavigate: (screen: ScreenId) => void;
  onBuildTeam: () => void;
  onApproveRequest: (requestId: string) => void;
  onRejectRequest: (requestId: string) => void;
  onRenameTeam: (alias: string) => void;
  onCancelJoinRequest: () => void;
  onLeaveLedTeam: () => void;
  onLeaveJoinedTeam: () => void;
  onSimulateJoinApproved: () => void;
  onOpenTask: (id: number) => void;
};
```

Cross-reference `App.jsx`'s `<MyScreen … />` JSX (the `screen === "me"` branch in the final `App` return) to confirm every prop name and type matches exactly.

- [ ] **Step 3: Update `App.jsx`**

- Delete the two functions `MyRewards` and `MyScreen` from `src/App.jsx`.
- Add imports:
  ```js
  import MyRewards from './screens/MyRewards';
  import MyScreen from './screens/MyScreen';
  ```
- **Remove** the `import TeamCard from './screens/TeamCard';` line added in Task 11 — `App.jsx` no longer references `TeamCard` directly (the only caller, `MyScreen`, now lives in its own file and imports `TeamCard` itself). Leaving the import is dead code; Task 16's cleanup would catch it, but remove it now for hygiene.

- [ ] **Step 4: Build and smoke test**

```bash
just build
just serve
```

Focus: the full Me-flow smoke test from Task 11, plus:
- `MyRewards` section shows earned bonuses from completed tasks (seed by completing tasks 1 and 2 first).
- Bottom-nav from 我的 → all other tabs still works; return to 我的 preserves state.
- "邀請組員" / "加入團隊" CTAs still open the correct forms.
- Join a different team via `TeamForm` → MyScreen shows pending state → `simulateJoinApproved` flips it to approved.
- Sign-out menu (MenuRow) returns to landing.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/screens/MyRewards.tsx frontend/src/screens/MyScreen.tsx frontend/src/App.jsx
git commit -m "refactor: extract MyScreen and MyRewards (phase-1/task-12)"
```

---

### Task 13: Extract Rank + Rewards (`RankScreen`, `RewardsScreen`)

**Files:**
- Create: `frontend/src/screens/RankScreen.tsx`
- Create: `frontend/src/screens/RewardsScreen.tsx`
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Extract `RankScreen` (App.jsx lines 3269–4646)**

Target: `frontend/src/screens/RankScreen.tsx`.

Imports:
```tsx
import { useState, useMemo } from 'react';
import PaperBackground from '../ui/PaperBackground';
import BottomNav from '../ui/BottomNav';
import { MOCK_MEMBERS, MOCK_TEAMS } from '../data';
import type { User, Task, ScreenId } from '../types';
```

Props type (read destructure at line 3269):
```ts
type Props = {
  user: User | null;
  tasks: Task[];
  onNavigate: (screen: ScreenId) => void;
};
```

The `PERIODS` constant at line 3776 stays inside this component.

- [ ] **Step 2: Extract `RewardsScreen` (App.jsx lines 5357–5544)**

Target: `frontend/src/screens/RewardsScreen.tsx`.

Imports:
```tsx
import { useMemo } from 'react';
import PaperBackground from '../ui/PaperBackground';
import type { User, Task } from '../types';
```

Props type (read destructure at line 5357):
```ts
type Props = {
  user: User | null;
  tasks: Task[];
  onBack: () => void;
};
```

- [ ] **Step 3: Update `App.jsx`**

- Delete both functions.
- Add imports:
  ```js
  import RankScreen from './screens/RankScreen';
  import RewardsScreen from './screens/RewardsScreen';
  ```

- [ ] **Step 4: Build and smoke test**

```bash
just build
just serve
```

Focus: Rank tab — switcher (week / month / all-time) works, user leaderboard and team leaderboard both populate from `MOCK_MEMBERS` / `MOCK_TEAMS`. Rewards screen — reachable from Home AND from My (the `rewardsFrom` state drives the back button destination; verify both entry points).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/screens/RankScreen.tsx frontend/src/screens/RewardsScreen.tsx frontend/src/App.jsx
git commit -m "refactor: extract Rank + Rewards screens (phase-1/task-13)"
```

---

### Task 14: Extract Profile flow (`ProfileScreen`, `ProfileSetupForm`)

**Files:**
- Create: `frontend/src/screens/ProfileScreen.tsx`
- Create: `frontend/src/screens/ProfileSetupForm.tsx`
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Extract `ProfileScreen` (App.jsx lines 8376–8687)**

Target: `frontend/src/screens/ProfileScreen.tsx`.

Imports:
```tsx
import { useState } from 'react';
import PaperBackground from '../ui/PaperBackground';
import type { User } from '../types';
```

Props type (read destructure at line 8376):
```ts
type Props = {
  user: User | null;
  onBack: () => void;
  onEdit: () => void;
};
```

The `COUNTRY_FLAG` constant at line 8394 stays inside this component.

- [ ] **Step 2: Extract `ProfileSetupForm` (App.jsx lines 8689–9111)**

Target: `frontend/src/screens/ProfileSetupForm.tsx`.

Imports:
```tsx
import { useState, useMemo } from 'react';
import FormShell from '../ui/FormShell';
import FieldLabel from '../ui/FieldLabel';
import TextInput from '../ui/TextInput';
import ChipGroup from '../ui/ChipGroup';
import SubmitButton from '../ui/SubmitButton';
import type { User } from '../types';
```

Props type (read destructure at line 8689):
```ts
type Props = {
  user: User | null;
  initial?: User | null;            // pre-fill for edit mode
  title?: string;                   // default "填寫個人資料" or similar
  subtitle?: string;
  submitLabel?: string;             // default "下一步"
  onCancel: () => void;
  onSubmit: (profile: Partial<User>) => void;
};
```

Verify the exact default strings by reading the destructure; if `title`/`subtitle`/`submitLabel` have defaults in the destructure, mirror them in the type with `?`. The `REGIONS`, `COUNTRY_DIAL`, `DIAL_OPTIONS`, `COUNTRIES` constants at lines 8721, 8794, 8804, 8826 stay inside this component.

- [ ] **Step 3: Update `App.jsx`**

- Delete both functions.
- Add imports:
  ```js
  import ProfileScreen from './screens/ProfileScreen';
  import ProfileSetupForm from './screens/ProfileSetupForm';
  ```

- [ ] **Step 4: Build and smoke test**

```bash
just build
just serve
```

Focus: First-time sign-in flow routes through ProfileSetupForm. Fill required fields, submit → home. From My → profile link → ProfileScreen renders avatar + info. Tap edit → ProfileSetupForm with `initial` and "儲存變更" submit label. Save → ProfileScreen shows updated info.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/screens/ProfileScreen.tsx frontend/src/screens/ProfileSetupForm.tsx frontend/src/App.jsx
git commit -m "refactor: extract Profile screens (phase-1/task-14)"
```

---

### Task 15: Extract remaining form screens (`InterestForm`, `TicketForm`, `TeamForm`)

**Files:**
- Create: `frontend/src/screens/InterestForm.tsx`
- Create: `frontend/src/screens/TicketForm.tsx`
- Create: `frontend/src/screens/TeamForm.tsx`
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Extract `InterestForm` (App.jsx lines 9113–9249)**

Target: `frontend/src/screens/InterestForm.tsx`.

Imports:
```tsx
import { useState } from 'react';
import FormShell from '../ui/FormShell';
import FieldLabel from '../ui/FieldLabel';
import TextInput from '../ui/TextInput';
import ChipGroup from '../ui/ChipGroup';
import SubmitButton from '../ui/SubmitButton';
```

Props type (read destructure at line 9113):
```ts
type Props = {
  onCancel: () => void;
  onSubmit: () => void;
};
```

- [ ] **Step 2: Extract `TicketForm` (App.jsx lines 9251–9350)**

Target: `frontend/src/screens/TicketForm.tsx`.

Imports: same set as InterestForm, plus Textarea if used.

Props type:
```ts
type Props = {
  onCancel: () => void;
  onSubmit: () => void;
};
```

- [ ] **Step 3: Extract `TeamForm` (App.jsx lines 9459–9714)**

Target: `frontend/src/screens/TeamForm.tsx`.

Imports:
```tsx
import { useState, useMemo } from 'react';
import FormShell from '../ui/FormShell';
import FieldLabel from '../ui/FieldLabel';
import TextInput from '../ui/TextInput';
import SubmitButton from '../ui/SubmitButton';
import { MOCK_TEAMS } from '../data';
import type { Team } from '../types';
```

Props type (read destructure at line 9459):
```ts
type Props = {
  onCancel: () => void;
  onSubmit: (teamData: Omit<Team, 'role'>) => void;
};
```

Read the body to confirm what `onSubmit` is called with — `App.jsx`'s `joinTeam` handler spreads `teamData` and adds `role: "member"`, so `TeamForm` emits a team-ish object without role. Tighten the type if the actual emitted shape differs.

- [ ] **Step 4: Update `App.jsx`**

- Delete all three functions.
- Add imports:
  ```js
  import InterestForm from './screens/InterestForm';
  import TicketForm from './screens/TicketForm';
  import TeamForm from './screens/TeamForm';
  ```

- [ ] **Step 5: Build and smoke test**

```bash
just build
just serve
```

Focus: Complete task 1 via InterestForm, task 2 via TicketForm, task 3 team-join via TeamForm. Each shows FormSuccessOverlay on submit and the state transitions correctly (Task 1 & 2 → completed; TeamForm → joined team in pending state).

- [ ] **Step 6: Commit**

```bash
git add frontend/src/screens/InterestForm.tsx frontend/src/screens/TicketForm.tsx frontend/src/screens/TeamForm.tsx frontend/src/App.jsx
git commit -m "refactor: extract Interest/Ticket/Team forms (phase-1/task-15)"
```

---

### Task 16: Finalize — rename `App.jsx` → `App.tsx`, tighten types, clean up, update docs

**Goal:** After Tasks 1–15, `src/App.jsx` holds only the root `App` component plus a small `userIdFromEmail` helper. Convert it to TypeScript, refine the types of its state and handlers, then update README / docs / ensure no stale files remain.

**Files:**
- Rename: `frontend/src/App.jsx` → `frontend/src/App.tsx`
- Modify: `frontend/src/App.tsx` (add types to state + handlers)
- Modify: `frontend/src/main.tsx` (update import extension)
- Modify: `README.md`
- Modify: `docs/production-launch-plan.md`

- [ ] **Step 1: Rename App.jsx to App.tsx**

Run:
```bash
git mv frontend/src/App.jsx frontend/src/App.tsx
```

- [ ] **Step 2: Update `src/main.tsx` import extension**

Change:
```tsx
import App from './App.jsx';
```
to:
```tsx
import App from './App';
```

(Dropping the explicit `.jsx` extension lets TypeScript resolve `./App.tsx` automatically.)

- [ ] **Step 3: Add types to App state and handlers**

Open `frontend/src/App.tsx` and add imports at the top:
```tsx
import { useState } from 'react';
import { TASKS } from './data';
import GlobalStyles from './ui/GlobalStyles';
import LandingScreen from './screens/LandingScreen';
import GoogleAuthScreen from './screens/GoogleAuthScreen';
import ProfileSetupForm from './screens/ProfileSetupForm';
import ProfileScreen from './screens/ProfileScreen';
import HomeScreen from './screens/HomeScreen';
import TasksScreen from './screens/TasksScreen';
import RankScreen from './screens/RankScreen';
import TaskDetailScreen from './screens/TaskDetailScreen';
import InterestForm from './screens/InterestForm';
import TicketForm from './screens/TicketForm';
import TeamForm from './screens/TeamForm';
import MyScreen from './screens/MyScreen';
import RewardsScreen from './screens/RewardsScreen';
import FormSuccessOverlay from './ui/FormSuccessOverlay';
import type { User, Task, Team, SuccessData, ScreenId } from './types';
```

(Delete any duplicate / legacy imports left over from earlier tasks. The final import list should match what the body references — nothing more.)

Then tighten the `useState` calls:

```tsx
const [screen, setScreen] = useState<ScreenId>("landing");
const [rewardsFrom, setRewardsFrom] = useState<"home" | "me">("home");
const [user, setUser] = useState<User | null>(null);
const [currentTaskId, setCurrentTaskId] = useState<number | null>(null);
const [tasks, setTasks] = useState<Task[]>(TASKS);
const [successData, setSuccessData] = useState<SuccessData | null>(null);
const [ledTeam, setLedTeam] = useState<Team | null>(null);
const [joinedTeam, setJoinedTeam] = useState<Team | null>(null);
```

Add types to the handler functions where inference doesn't cover them. The `navigateTo`, `openTask`, `openTaskForm`, `handleSignIn`, `handleProfileComplete`, `handleProfileUpdate`, `handleSignOut`, `syncTeamTask`, `joinTeam`, `leaveLedTeam`, `leaveJoinedTeam`, `approveRequest`, `rejectRequest`, `renameTeam`, `simulateJoinApproved`, `completeTask`, `userIdFromEmail` — each either uses state setters (which are already typed) or takes/emits explicit params. Add parameter annotations where TypeScript can't infer them (e.g. `const navigateTo = (next: ScreenId) => { … }`; `const completeTask = (id: number) => { … }`).

Keep the component body structurally identical. No logic changes. If TypeScript flags a real type mismatch (e.g. `ScreenId` doesn't include a value a handler uses), widen `ScreenId` in `types.ts` to match runtime rather than suppressing the error.

At the very bottom, ensure the default export is present:
```tsx
export default App;
```

- [ ] **Step 4: Verify nothing else references `.jsx`**

Run:
```bash
grep -rn "App\.jsx\|from './App'\|app\.jsx" frontend/ --include='*.ts' --include='*.tsx' --include='*.html' --include='*.json' --include='*.md' || true
```

Expected: the only match is inside `main.tsx` (`from './App'` — no extension, OK). If any stale `.jsx` reference remains, fix it.

Also verify no `frontend/app.jsx` ghost file exists at repo root or inside `frontend/`:
```bash
ls frontend/app.jsx frontend/src/App.jsx 2>/dev/null && echo "ghost file still present — delete it" || echo "ok"
```

- [ ] **Step 5: Build and full smoke test**

```bash
just build
```
Expected: zero errors. Check `frontend/dist/` exists and contains `index.html` plus hashed JS/CSS/assets.

```bash
just serve
```

Run the FULL smoke-test checklist from the Execution conventions section. Every flow. This is the final verification that the module split preserved the prototype exactly.

- [ ] **Step 6: Update `README.md`**

Replace the current content with:
```markdown
# Golden Abundance Lite 金富有志工

Monorepo-style layout:

- `frontend/` — React 18 + TypeScript + Vite (see `frontend/src/` for source; phase-1 split is complete)
- `backend/` — Python FastAPI service (scaffold; Phase 2 contract in progress)
- `docs/` — production launch plan and design specs

## Run (frontend)

```sh
just install        # install npm deps under frontend/
just serve          # Vite dev server on http://localhost:8000
just build          # tsc -b && vite build → frontend/dist
just tunnel         # https://subvitalized-occupative-katelyn.ngrok-free.dev
```

Requires [`just`](https://github.com/casey/just) and Node 20+.

## Layout (frontend)

- `index.html` — Vite entry (loads `/src/main.tsx`)
- `src/main.tsx` — React root
- `src/App.tsx` — screen orchestration and app state
- `src/types.ts` — client-side data types
- `src/data.ts` — mock TASKS / MOCK_MEMBERS / MOCK_TEAMS
- `src/utils.ts` — pure helpers (e.g. `getEffectiveStatus`)
- `src/ui/` — 18 shared presentational primitives
- `src/screens/` — 19 screen/flow components
- `src/assets/` — static images (fingerprinted by Vite)
```

- [ ] **Step 7: Update `docs/production-launch-plan.md`**

Mark Phase 1 items complete:

```markdown
## Phase 1 — Build system + modules
- [x] Migrate frontend to Vite
- [x] Split `app.jsx` into per-component files
- [x] Add TypeScript; derive types from existing mock data shapes
```

Leave all other phases untouched. In particular, do NOT edit Phase 2 — that's owned by the parallel stream.

- [ ] **Step 8: Final build + commit**

```bash
just build
git add frontend/src/App.tsx frontend/src/main.tsx README.md docs/production-launch-plan.md
git status
```

Expected modified files: `frontend/src/App.tsx` (renamed + retyped), `frontend/src/main.tsx` (extension update), `README.md` (rewritten), `docs/production-launch-plan.md` (checkboxes ticked). The rename from `App.jsx` may appear as `R100` in git status depending on how many edits landed in the rename.

Commit:
```bash
git commit -m "$(cat <<'EOF'
refactor: finalize App.tsx, update docs (phase-1/task-16)

- rename App.jsx → App.tsx
- type useState calls and handler signatures
- rewrite README to describe the new frontend/ layout
- mark Phase 1 complete in docs/production-launch-plan.md

Phase 1 split is complete: frontend is Vite + TypeScript with
19 screens and 18 ui primitives under src/. Next phase is 3
(routing) or 4 (API wiring) after Phase 2's contract lands.
EOF
)"
```

---

### Task 17: Format with Prettier

**Goal:** Add Prettier for consistent code style across the frontend tree. Format all sources once — this single whitespace-only commit becomes the style baseline for all subsequent phases. Adds a `format` / `format:check` npm script, a `just fmt` recipe, and a `.git-blame-ignore-revs` entry so the reformat doesn't pollute blame.

**Files:**
- Create: `frontend/.prettierrc.json`
- Create: `frontend/.prettierignore`
- Modify: `frontend/package.json`
- Modify: `justfile`
- Modify: `README.md`
- Modify: `docs/production-launch-plan.md`
- Create: `.git-blame-ignore-revs` (repo root)
- Modify (via `prettier --write`): every `.ts`, `.tsx`, `.json`, `.html` under `frontend/`

This task produces **three commits** (the only multi-commit task in the plan) because a blame-friendly rollout has three logically distinct parts:

- `17a` — Prettier tooling (config, scripts, docs).
- `17b` — the formatting diff itself; whitespace/line-wrap only, produced by `npm run format`.
- `17c` — `.git-blame-ignore-revs` pointing at `17b`'s SHA, so `git blame` and GitHub's blame UI skip past it.

---

#### 17a: Prettier tooling

- [ ] **Step 1: Install Prettier**

```bash
npm --prefix frontend install --save-dev prettier
```

Expected: `prettier` appears in `frontend/package.json`'s `devDependencies` at the latest 3.x version, and `frontend/package-lock.json` updates.

- [ ] **Step 2: Create `frontend/.prettierrc.json`**

Content:
```json
{
  "printWidth": 100
}
```

Everything else stays at Prettier's defaults — double quotes (`singleQuote: false`), trailing commas everywhere (`trailingComma: "all"`), 2-space indent, semicolons, no tabs. These match the existing codebase's ambient style, so the reformat diff stays modest.

- [ ] **Step 3: Create `frontend/.prettierignore`**

Content:
```
node_modules
dist
dist-ssr
.vite
package-lock.json
src/assets
```

Prettier 3 reads `.gitignore` by default as well, but the explicit list is clearer. `src/assets` is excluded so Prettier never touches the mascot PNG.

- [ ] **Step 4: Add scripts to `frontend/package.json`**

Inside the `"scripts"` object, add two entries so the block reads:
```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "preview": "vite preview",
  "format": "prettier --write --ignore-unknown .",
  "format:check": "prettier --check --ignore-unknown ."
}
```

`--ignore-unknown` is Prettier's safety flag: it skips files it can't parse instead of erroring, so adding a new file type later never breaks `just fmt`.

- [ ] **Step 5: Add `fmt` recipes to `justfile`**

Append after the `build` recipe:
```
# Format frontend sources with Prettier
fmt: install
    npm --prefix frontend run format

# Verify formatting (CI-ready; exits non-zero on drift)
fmt-check: install
    npm --prefix frontend run format:check
```

- [ ] **Step 6: Update `README.md`**

Under the "Run (frontend)" block, append:
```sh
just fmt            # format frontend sources with Prettier
just fmt-check      # verify no drift (exits non-zero if anything needs formatting)
```

- [ ] **Step 7: Update `docs/production-launch-plan.md`**

Phase 1 currently has three checked bullets (written in Task 16). Add a fourth:

```markdown
## Phase 1 — Build system + modules
- [x] Migrate frontend to Vite
- [x] Split `app.jsx` into per-component files
- [x] Add TypeScript; derive types from existing mock data shapes
- [x] Format with Prettier
```

This is an addendum to the original Phase 1 spec — added mid-stream after Task 16's code review. Leave every other phase untouched.

- [ ] **Step 8: Verify build still passes**

```bash
just build
```

Expected: zero errors. Prettier isn't part of the build graph; this confirms the `package.json` edit didn't break anything.

- [ ] **Step 9: Commit 17a**

```bash
git add frontend/.prettierrc.json frontend/.prettierignore frontend/package.json frontend/package-lock.json justfile README.md docs/production-launch-plan.md
git commit -m "chore: add Prettier tooling (phase-1/task-17a)"
```

---

#### 17b: Run the formatter

- [ ] **Step 10: Run Prettier on the whole frontend tree**

```bash
just fmt
```

Prettier prints every file it rewrites. Expect many files: `printWidth: 100` differs from the prototype's organic wrapping, and Prettier will normalise trailing commas and a few quote styles along the way.

- [ ] **Step 11: High-level diff review**

```bash
git diff --stat frontend/
```

Expected: every touched file sits under `frontend/`. Nothing under `backend/` or `docs/` should appear — those directories are outside `prettier --write .`'s scope (which runs rooted at `frontend/`).

Spot-check two or three representative files with `git diff <file>` — changes should be line-wrap, quote flips, and trailing-comma edits **only**. No identifier changes, no JSX restructuring, no semantic edits. If anything looks semantic, stop and investigate before committing; Prettier should never change behaviour.

- [ ] **Step 12: Verify build still passes**

```bash
just build
```

Expected: zero errors.

- [ ] **Step 13: Smoke test (quick)**

```bash
just serve
```

Load `/` in the browser. If the landing page renders, Prettier hasn't broken anything. A full click-through isn't required — compiler success plus a single render is sufficient because the transformation is guaranteed-equivalent by Prettier's contract.

- [ ] **Step 14: Commit 17b and capture the SHA**

```bash
git add frontend/
git status
# Expected: everything staged is under frontend/; no unexpected files.
git commit -m "$(cat <<'EOF'
style: apply Prettier to frontend/ sources (phase-1/task-17b)

This commit is pure formatting — no semantic changes. It is
recorded in .git-blame-ignore-revs (added in 17c) so git blame
and GitHub's blame view skip past it.
EOF
)"
git rev-parse HEAD      # capture this SHA for step 15
```

Record the SHA printed by `git rev-parse HEAD` — you'll paste it into `.git-blame-ignore-revs` in the next sub-commit.

---

#### 17c: Git blame escape hatch

- [ ] **Step 15: Create `.git-blame-ignore-revs`**

At the **repo root** (not inside `frontend/`), create `.git-blame-ignore-revs`:
```
# Revisions to ignore when running `git blame` and in GitHub's blame UI.
# Add reformat-only commits here so blame points to the original authorship.
# See https://git-scm.com/docs/git-blame#Documentation/git-blame.txt---ignore-revs-fileltfilegt
# and https://docs.github.com/en/repositories/working-with-files/using-files/viewing-a-file#ignore-commits-in-the-blame-view

# phase-1/task-17b — Prettier reformat of frontend/
<SHA FROM STEP 14>
```

Replace `<SHA FROM STEP 14>` with the full 40-character hash you captured. Abbreviated SHAs work but full SHAs are the canonical form.

- [ ] **Step 16: Update `README.md` with the blame-ignore workflow**

Append a new section at the end of `README.md`:
````markdown
## Blame-friendly commits

Reformat-only commits are listed in `.git-blame-ignore-revs`. Run once per
clone so local `git blame` skips them:

```sh
git config blame.ignoreRevsFile .git-blame-ignore-revs
```

GitHub's blame UI honours the file automatically — no configuration needed.
````

(The outer backtick fence in the plan above is a four-backtick fence so the inner triple-backtick code block renders correctly inside the markdown. When you write into `README.md`, use triple backticks as shown in the rendered content.)

- [ ] **Step 17: Commit 17c**

```bash
git add .git-blame-ignore-revs README.md
git commit -m "chore: ignore Prettier reformat in git blame (phase-1/task-17c)"
```

---

With Task 17 done, Phase 1 is complete: the frontend is on Vite + TypeScript, split into focused modules, Prettier-formatted, with a clean commit history that supports `git blame` across the reformat.

---

## Self-review checklist (performed before saving this plan)

**Spec coverage:**
- Migrate to Vite — Task 1.
- Split `app.jsx` per-component — Tasks 2–15 extract all 42 top-level symbols from the monolith into `types.ts`, `data.ts`, `utils.ts`, 18 files under `ui/`, and 19 files under `screens/`.
- Add TypeScript, derive types from mock-data shapes — Task 2 writes `types.ts`; Tasks 4+ type every extracted component's props; Task 16 types `App.tsx` state and handlers.
- Prettier formatting (addendum, not in the original Phase 1 spec) — Task 17 adds tooling, applies a whitespace-only reformat, and records the reformat commit in `.git-blame-ignore-revs` so blame stays useful.
- Repo-structure change (`frontend/` subdir) — every task scopes to `frontend/src/`.
- Keep `docs/production-launch-plan.md` up to date — Task 16 ticks the original three bullets; Task 17 appends and ticks a fourth (Prettier).
- Don't touch `backend/` — stated in Coordination notes; no task writes under `backend/`.

**Placeholder scan:** No "TBD", "implement later", "similar to…" placeholders. Extraction tasks tell the engineer to read the specific line ranges for the destructure (the source of truth for prop names) rather than restating them — this is legitimate pointing at existing code, not a placeholder.

**Type consistency:** `ScreenId`, `User`, `Task`, `Team`, `TeamMemberRef`, `JoinRequest`, `SuccessData`, `MockMember`, `MockTeam` — all defined in Task 2 and used with the same name across Tasks 4–15. `EffectiveTaskStatus` used by `TaskCard` (Task 7) matches the return type of `getEffectiveStatus` (Task 3).

**Risks flagged:**
- StrictMode double-invocation (Task 1, Step 14).
- Vite `host: true` for ngrok compatibility (Task 1, Step 3).
- `allowJs: true` + `checkJs: false` until Task 16 (Task 1, Step 4).
- Phase 2 may touch frontend line numbers — mitigated by keeping `backend/` out of scope and treating the Phase 2 spec's line references as historical.

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-19-phase-1-vite-ts-split.md`. Two execution options:

1. **Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks. Good for a 17-task plan: each subagent gets a clean context and the diff stays small enough to review. Task 17 has three commits internally; plan for that subagent to produce all three before handing back.
2. **Inline Execution** — execute tasks in this session using `superpowers:executing-plans`, batch with checkpoints for review.

Which approach?

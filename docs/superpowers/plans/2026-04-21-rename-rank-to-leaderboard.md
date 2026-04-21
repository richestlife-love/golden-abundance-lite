# Rename `rank` → `leaderboard` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify backend and frontend naming by renaming the **feature name** `rank` to `leaderboard` across API routes, Pydantic contracts, backend services/routers/tests, frontend API client, React Query options, the screen component, the bottom-nav tab key, and test fixtures. Preserve the **domain field** `rank: int` (meaning "position ordinal") everywhere it appears.

**Architecture:** One-shot rename across two layers. Backend changes land first and regenerate the OpenAPI schema; frontend then updates imports, function/type names, route paths, and cache keys. Two commit boundaries — backend + schema in commit 1, frontend in commit 2 — keep each commit logically coherent and reviewable.

**Tech Stack:** FastAPI + Pydantic 2 (backend), React + TanStack Router + TanStack Query + openapi-typescript (frontend), pytest + vitest + MSW (tests).

---

## Scoping Decisions (read first)

**Two buckets of `rank` references:**
- **Bucket A — FEATURE NAME (rename):** `/rank` route prefix, `UserRankEntry`/`TeamRankEntry`/`RankPeriod`, `listUserRank`/`listTeamRank`, `rankUsersInfiniteQueryOptions`, `rankUsers`/`rankTeams` cache-key builders, cache-key prefix `["rank", ...]`, `RankScreen`, `RankIcon`, BottomNav tab key `"rank"`, file/module names, example JSON filenames, MSW handler paths, test-function names.
- **Bucket B — POSITION FIELD (keep):** `rank: int` Pydantic fields on entries, `rank: int | None` on `Team`, `rank=start_idx + offset + 1` assignments in service, `rankLabels = ["2","1","3"]` for podium display, `r.rank`/`entry.rank`/`team.rank` reads, `myRank`/`teamRank` locals, and the `"rank"` JSON field inside example fixtures.

**URL change:** `/api/v1/rank/users` → `/api/v1/leaderboard/users`, same for `/teams`. No alembic migration needed (no DB column rename).

**OpenAPI regen:** `frontend/src/api/schema.d.ts` is gitignored and regenerated via `just gen-types` (root justfile). Run after backend changes.

**Test function renames:** Rename `test_rank_*` → `test_leaderboard_*` for consistency. The feature name appears in every test name, so leaving them means permanent drift — matching the code is cheap here because the tests live in one file.

**BottomNav Chinese label:** The UI label `"排行"` (ranking) stays. Only the internal `TabKey` string `"rank"` changes to `"leaderboard"` — the label is what the user reads.

**Podium display:** `rankLabels = ["2","1","3"]` — keep. These are ordinal labels, not the feature name.

---

## File Structure

**Renames (git mv):**
- `backend/src/backend/contract/rank.py` → `backend/src/backend/contract/leaderboard.py`
- `backend/src/backend/contract/examples/rank_users_week.json` → `backend/src/backend/contract/examples/leaderboard_users_week.json`
- `backend/src/backend/contract/examples/rank_teams_week.json` → `backend/src/backend/contract/examples/leaderboard_teams_week.json`
- `backend/src/backend/services/rank.py` → `backend/src/backend/services/leaderboard.py`
- `backend/src/backend/routers/rank.py` → `backend/src/backend/routers/leaderboard.py`
- `backend/tests/routers/test_rank.py` → `backend/tests/routers/test_leaderboard.py`
- `frontend/src/api/rank.ts` → `frontend/src/api/leaderboard.ts`
- `frontend/src/queries/rank.ts` → `frontend/src/queries/leaderboard.ts`
- `frontend/src/screens/RankScreen.tsx` → `frontend/src/screens/LeaderboardScreen.tsx`

**Modified in place (no rename):**
- `backend/src/backend/contract/__init__.py` — re-export names
- `backend/src/backend/contract/README.md` — docs
- `backend/src/backend/contract/endpoints.md` — docs
- `backend/src/backend/contract/validate_examples.py` — fixture map + imports
- `backend/src/backend/server.py` — router import + include
- `backend/tests/routers/test_tasks_submit.py` — URL assertions
- `frontend/src/api/index.ts` — re-export
- `frontend/src/queries/keys.ts` — import + builder names + cache-key prefix
- `frontend/src/routes/_authed.leaderboard.tsx` — imports + component ref
- `frontend/src/mutations/tasks.ts` — invalidation prefix
- `frontend/src/mutations/teams.ts` — invalidation prefix (two sites)
- `frontend/src/mutations/__tests__/me.test.tsx` — invalidation prefix assertions (three sites)
- `frontend/src/queries/__tests__/keys.test.ts` — builder names + prefix assertions
- `frontend/src/test/msw/handlers.ts` — URL paths (two sites)
- `frontend/src/ui/BottomNav.tsx` — TabKey, TAB_TO_PATH, TAB_ACCENT, ITEMS, RankIcon comment + component name

**Unchanged (Bucket B — position fields):**
- `backend/src/backend/contract/team.py` — `rank: int | None` stays
- `frontend/src/screens/TeamCard.tsx` — `team.rank`, `teamRank`, stats comment
- `frontend/src/test/msw/fixtures.ts` — `rank: null` in Team fixture

**Symbol rename table:**
| Old | New |
|---|---|
| `UserRankEntry` | `UserLeaderboardEntry` |
| `TeamRankEntry` | `TeamLeaderboardEntry` |
| `RankPeriod` | `LeaderboardPeriod` |
| `rank_users` (router fn) | `leaderboard_users` (router fn, shadows service fn; rename router to `leaderboard_users_route` to avoid conflict — see Task 3) |
| `rank_teams` (router fn) | `leaderboard_teams` (same) |
| `leaderboard_users` (service fn) | unchanged — already correct |
| `leaderboard_teams` (service fn) | unchanged — already correct |
| `listUserRank` | `listUserLeaderboard` |
| `listTeamRank` | `listTeamLeaderboard` |
| `RankParams` | `LeaderboardParams` |
| `rankUsersInfiniteQueryOptions` | `leaderboardUsersInfiniteQueryOptions` |
| `rankTeamsInfiniteQueryOptions` | `leaderboardTeamsInfiniteQueryOptions` |
| `qk.rankUsers` | `qk.leaderboardUsers` |
| `qk.rankTeams` | `qk.leaderboardTeams` |
| cache-key prefix `["rank", ...]` | `["leaderboard", ...]` |
| `RankScreen` (file + default export) | `LeaderboardScreen` |
| `RankIcon` | `LeaderboardIcon` |
| `TabKey = "rank"` | `TabKey = "leaderboard"` |
| `export * as rank from "./rank"` | `export * as leaderboard from "./leaderboard"` |
| OpenAPI `tags=["rank"]` | `tags=["leaderboard"]` |
| URL `/rank/users` / `/rank/teams` | `/leaderboard/users` / `/leaderboard/teams` |
| Fixture files `rank_{users,teams}_week.json` | `leaderboard_{users,teams}_week.json` |

**Router-function-name collision note:** The new router handler name `leaderboard_users` collides with the imported service function `leaderboard_users` (they're currently distinct because the router is `rank_users`). To avoid the shadow, **rename the router function to `get_leaderboard_users` / `get_leaderboard_teams`** (standard FastAPI verb-prefixed naming). See Task 3 Step 2 for exact code.

---

## Task 1: Backend contract — rename module, classes, period type

**Files:**
- Rename: `backend/src/backend/contract/rank.py` → `backend/src/backend/contract/leaderboard.py`
- Modify: `backend/src/backend/contract/__init__.py`

- [ ] **Step 1: Git-rename the contract module**

```bash
cd /Users/Jet/Developer/golden-abundance/.claude/worktrees/rename-rank-to-leaderboard
git mv backend/src/backend/contract/rank.py backend/src/backend/contract/leaderboard.py
```

- [ ] **Step 2: Update class names and type alias in the renamed file**

Edit `backend/src/backend/contract/leaderboard.py`:

```python
"""Leaderboard shapes — one per user, one per team, both filterable by
period ("week" / "month" / "all_time"). Wrapped in Paginated[T] at the
endpoint level.
"""

from typing import Literal

from backend.contract.common import StrictModel, TeamRef, UserRef

LeaderboardPeriod = Literal["week", "month", "all_time"]


class UserLeaderboardEntry(StrictModel):
    """Single entry in the user leaderboard."""

    user: UserRef
    rank: int
    points: int
    week_points: int


class TeamLeaderboardEntry(StrictModel):
    """Single entry in the team leaderboard."""

    team: TeamRef
    rank: int
    points: int
    week_points: int
```

Note: the `rank: int` fields remain — these are position ordinals (Bucket B).

- [ ] **Step 3: Update `backend/src/backend/contract/__init__.py` re-exports**

Change the line:
```python
from backend.contract.rank import RankPeriod, TeamRankEntry, UserRankEntry
```
To:
```python
from backend.contract.leaderboard import LeaderboardPeriod, TeamLeaderboardEntry, UserLeaderboardEntry
```

And in `__all__`, replace:
- `"RankPeriod"` → `"LeaderboardPeriod"`
- `"TeamRankEntry"` → `"TeamLeaderboardEntry"`
- `"UserRankEntry"` → `"UserLeaderboardEntry"`

(Keep `__all__` alphabetically sorted: `LeaderboardPeriod` sorts after `JoinRequest`; `TeamLeaderboardEntry` sorts after `TeamChallengeProgress` and before `TeamRef`; `UserLeaderboardEntry` sorts after `User` and before `UserRef`.)

- [ ] **Step 4: Do NOT run tests yet — service/router still import old names; fix them in Tasks 2–3**

## Task 2: Backend service — update imports and identifiers

**Files:**
- Rename: `backend/src/backend/services/rank.py` → `backend/src/backend/services/leaderboard.py`

- [ ] **Step 1: Git-rename the service module**

```bash
git mv backend/src/backend/services/rank.py backend/src/backend/services/leaderboard.py
```

- [ ] **Step 2: Update imports and type annotations in the renamed file**

In `backend/src/backend/services/leaderboard.py`:

Replace the import block:
```python
from backend.contract import (
    Paginated,
    RankPeriod,
    TeamRankEntry,
    TeamRef,
    UserRankEntry,
    UserRef,
)
```
With:
```python
from backend.contract import (
    LeaderboardPeriod,
    Paginated,
    TeamLeaderboardEntry,
    TeamRef,
    UserLeaderboardEntry,
    UserRef,
)
```

Then inside the file replace these identifiers globally (keep `rank=start_idx + offset + 1` — Bucket B):
- `RankPeriod` → `LeaderboardPeriod` (in `_since`, `_user_points_window_and_week`, and both public functions' signatures)
- `UserRankEntry` → `UserLeaderboardEntry` (three occurrences: import, list-annotation, constructor, return annotation)
- `TeamRankEntry` → `TeamLeaderboardEntry` (four occurrences: import, two return annotations, constructor, list-annotation)
- Error message text `"rank cursor missing/invalid pts/id"` → `"leaderboard cursor missing/invalid pts/id"`

Also update the docstring line 14–16:
```
For Phase-5 data volume we still rank in Python after loading rows;
```
→ leave unchanged — "rank" here is a verb ("to rank"), not the feature name.

Line 18–22 (`TODO(phase-6): ...``ROW_NUMBER() OVER (ORDER BY points DESC, id ASC) ... as ``rank``...`) — leave unchanged; that's describing the SQL column alias `rank` (ordinal).

## Task 3: Backend router — rename module, URL prefix, handler function names

**Files:**
- Rename: `backend/src/backend/routers/rank.py` → `backend/src/backend/routers/leaderboard.py`
- Modify: `backend/src/backend/server.py`

- [ ] **Step 1: Git-rename the router module**

```bash
git mv backend/src/backend/routers/rank.py backend/src/backend/routers/leaderboard.py
```

- [ ] **Step 2: Rewrite the router body**

Replace the entire contents of `backend/src/backend/routers/leaderboard.py` with:

```python
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from backend.auth.dependencies import current_user
from backend.contract import LeaderboardPeriod, Paginated, TeamLeaderboardEntry, UserLeaderboardEntry
from backend.db.models import UserRow
from backend.db.session import get_session
from backend.services.leaderboard import leaderboard_teams, leaderboard_users

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])


@router.get("/users", response_model=Paginated[UserLeaderboardEntry])
async def get_leaderboard_users(
    period: LeaderboardPeriod = "week",
    cursor: str | None = None,
    limit: int = Query(default=50, ge=1, le=100),
    _: UserRow = Depends(current_user),
    session: AsyncSession = Depends(get_session),
) -> Paginated[UserLeaderboardEntry]:
    return await leaderboard_users(session, period=period, cursor=cursor, limit=limit)


@router.get("/teams", response_model=Paginated[TeamLeaderboardEntry])
async def get_leaderboard_teams(
    period: LeaderboardPeriod = "week",
    cursor: str | None = None,
    limit: int = Query(default=50, ge=1, le=100),
    _: UserRow = Depends(current_user),
    session: AsyncSession = Depends(get_session),
) -> Paginated[TeamLeaderboardEntry]:
    return await leaderboard_teams(session, period=period, cursor=cursor, limit=limit)
```

Note: router functions are renamed to `get_leaderboard_users` / `get_leaderboard_teams` to avoid shadowing the imported service functions of the same base name.

- [ ] **Step 3: Update `backend/src/backend/server.py`**

Change the import line:
```python
from backend.routers import auth, health, me, news, rank, tasks, teams
```
To:
```python
from backend.routers import auth, health, leaderboard, me, news, tasks, teams
```

And change:
```python
app.include_router(rank.router, prefix=API_V1)
```
To:
```python
app.include_router(leaderboard.router, prefix=API_V1)
```

Keep the `include_router` block in the same alphabetical order it currently uses (health, auth, me, news, leaderboard, tasks, teams — it's already close; move the leaderboard line to where rank was).

## Task 4: Backend tests — rename test file, update URLs and identifiers

**Files:**
- Rename: `backend/tests/routers/test_rank.py` → `backend/tests/routers/test_leaderboard.py`
- Modify: `backend/tests/routers/test_tasks_submit.py`

- [ ] **Step 1: Git-rename the test module**

```bash
git mv backend/tests/routers/test_rank.py backend/tests/routers/test_leaderboard.py
```

- [ ] **Step 2: Inside `test_leaderboard.py`, apply these global replacements**

Use `Edit` with `replace_all: true` (in this order to avoid partial-overlap weirdness):

1. Replace `/api/v1/rank/` → `/api/v1/leaderboard/` (13 occurrences — all URL paths)
2. Replace `test_rank_` → `test_leaderboard_` (13 occurrences — all test function names)
3. Replace `"rank cursor` → `"leaderboard cursor` if any assertion inspects the 400 error message — scan for it. (Task 2 renamed the error message. If test_leaderboard_users_garbage_cursor_returns_400 / wrong_shape_cursor_returns_400 assert on the message substring, update the expected substring. If they only assert `r.status_code == 400`, no change.)

Leave `"rank"` JSON-field asserts like `assert items[0]["rank"] == 1` — those are Bucket B position-field assertions, still correct.

- [ ] **Step 3: Update `test_tasks_submit.py` URLs**

In `backend/tests/routers/test_tasks_submit.py` lines 148–149, replace:

```python
        ("GET", "/api/v1/rank/users"),
        ("GET", "/api/v1/rank/teams"),
```

With:

```python
        ("GET", "/api/v1/leaderboard/users"),
        ("GET", "/api/v1/leaderboard/teams"),
```

## Task 5: Backend fixtures — rename example JSONs, update validator

**Files:**
- Rename: `backend/src/backend/contract/examples/rank_users_week.json` → `leaderboard_users_week.json`
- Rename: `backend/src/backend/contract/examples/rank_teams_week.json` → `leaderboard_teams_week.json`
- Modify: `backend/src/backend/contract/validate_examples.py`

- [ ] **Step 1: Git-rename the example JSON files**

```bash
git mv backend/src/backend/contract/examples/rank_users_week.json backend/src/backend/contract/examples/leaderboard_users_week.json
git mv backend/src/backend/contract/examples/rank_teams_week.json backend/src/backend/contract/examples/leaderboard_teams_week.json
```

JSON contents don't change — `"rank": 1` stays (Bucket B, position field).

- [ ] **Step 2: Update `validate_examples.py` imports and fixture map**

Change the import:
```python
from backend.contract.rank import TeamRankEntry, UserRankEntry
```
To:
```python
from backend.contract.leaderboard import TeamLeaderboardEntry, UserLeaderboardEntry
```

And in the FIXTURES dict, replace:
```python
    "rank_users_week.json": TypeAdapter(Paginated[UserRankEntry]),
    "rank_teams_week.json": TypeAdapter(Paginated[TeamRankEntry]),
```
With:
```python
    "leaderboard_users_week.json": TypeAdapter(Paginated[UserLeaderboardEntry]),
    "leaderboard_teams_week.json": TypeAdapter(Paginated[TeamLeaderboardEntry]),
```

## Task 6: Backend docs — update endpoints.md and contract README.md

**Files:**
- Modify: `backend/src/backend/contract/endpoints.md`
- Modify: `backend/src/backend/contract/README.md`

- [ ] **Step 1: Update `endpoints.md`**

In `backend/src/backend/contract/endpoints.md`, change the whole `## Rank` section:

Replace:
```
## Rank

### `GET /rank/users`

- Query: `period` (`RankPeriod`, default `"week"`), `cursor`, `limit` (default 50, max 100)
- 200: `Paginated[UserRankEntry]`

### `GET /rank/teams`

...
- 200: `Paginated[TeamRankEntry]`
```

With the same block but:
- `## Rank` → `## Leaderboard`
- `GET /rank/users` → `GET /leaderboard/users`
- `GET /rank/teams` → `GET /leaderboard/teams`
- `RankPeriod` → `LeaderboardPeriod`
- `UserRankEntry` → `UserLeaderboardEntry`
- `TeamRankEntry` → `TeamLeaderboardEntry`

- [ ] **Step 2: Update `README.md`**

In `backend/src/backend/contract/README.md`:
- Line 24: `# Rank` → `# Leaderboard`
- Line 25: `UserRankEntry, TeamRankEntry, RankPeriod,` → `UserLeaderboardEntry, TeamLeaderboardEntry, LeaderboardPeriod,`
- Line 43: `| `rank.py`        | `UserRankEntry`, `TeamRankEntry`, `RankPeriod`                                   |` → `| `leaderboard.py` | `UserLeaderboardEntry`, `TeamLeaderboardEntry`, `LeaderboardPeriod`              |` (adjust column padding to keep the table aligned).

## Task 7: Backend verification — lint, typecheck, contract, tests

- [ ] **Step 1: Run backend CI from the repo root**

```bash
cd /Users/Jet/Developer/golden-abundance/.claude/worktrees/rename-rank-to-leaderboard/backend
just ci
```

Expected: ruff/ty/contract/pytest all pass. Specifically the test runner should report `test_leaderboard.py` collected and passing (previously `test_rank.py`).

If ruff complains about unused imports or the `__all__` order, fix and rerun.
If ty/mypy reports `LeaderboardPeriod` not found, check the re-export order in `__init__.py`.
If pytest reports a 404 on `/api/v1/leaderboard/users`, check server.py's `include_router` line.

## Task 8: Regenerate frontend OpenAPI schema

- [ ] **Step 1: Regenerate `frontend/src/api/schema.d.ts`**

```bash
cd /Users/Jet/Developer/golden-abundance/.claude/worktrees/rename-rank-to-leaderboard
just gen-types
```

Expected: writes `frontend/src/api/schema.d.ts` with new path keys `/api/v1/leaderboard/users` and `/api/v1/leaderboard/teams`, and new schema component names `UserLeaderboardEntry` / `TeamLeaderboardEntry`.

Verify by grepping:
```bash
grep -c "leaderboard" frontend/src/api/schema.d.ts
grep -c '"rank"' frontend/src/api/schema.d.ts
```

Expected: first count > 0, second count = 0 for path/operation occurrences (the `rank?: number` position field inside schema entries remains — Bucket B, so some occurrences of "rank" are normal).

The file is gitignored, so it will not appear in `git status`.

## Task 9: Commit the backend half

- [ ] **Step 1: Stage and commit**

```bash
cd /Users/Jet/Developer/golden-abundance/.claude/worktrees/rename-rank-to-leaderboard
git add -A backend/
git commit -m "refactor(backend): rename rank feature to leaderboard

URL prefix /rank → /leaderboard, contract types UserRankEntry/
TeamRankEntry/RankPeriod → UserLeaderboardEntry/TeamLeaderboardEntry/
LeaderboardPeriod, router/service/test/example files renamed
accordingly. Position field 'rank: int' on entries is unchanged."
```

Verify with `git log -1 --stat` that only backend files appear.

## Task 10: Frontend API client — rename module, update identifiers

**Files:**
- Rename: `frontend/src/api/rank.ts` → `frontend/src/api/leaderboard.ts`
- Modify: `frontend/src/api/index.ts`

- [ ] **Step 1: Git-rename the API client module**

```bash
git mv frontend/src/api/rank.ts frontend/src/api/leaderboard.ts
```

- [ ] **Step 2: Rewrite `frontend/src/api/leaderboard.ts`**

Replace the whole file with:

```typescript
// frontend/src/api/leaderboard.ts
import type { components, paths } from "./schema";
import { apiFetch } from "./client";

// Derived from the backend's generated OpenAPI rather than hand-maintained.
// If the backend changes the accepted period set (adds "quarter", drops
// "all_time", etc.), `just gen-types` regenerates `schema.d.ts` and the
// drift lands in every caller at typecheck time — no drift-guard unit
// test needed.
export type LeaderboardPeriod = NonNullable<
  NonNullable<paths["/api/v1/leaderboard/users"]["get"]["parameters"]["query"]>["period"]
>;

type UserLeaderboardEntry = components["schemas"]["UserLeaderboardEntry"];
type TeamLeaderboardEntry = components["schemas"]["TeamLeaderboardEntry"];
type Paginated<T> = { items: T[]; next_cursor: string | null };

interface LeaderboardParams {
  period: LeaderboardPeriod;
  cursor?: string;
  limit?: number;
}

function qs(p: LeaderboardParams): string {
  const usp = new URLSearchParams({ period: p.period });
  if (p.cursor) usp.set("cursor", p.cursor);
  if (p.limit) usp.set("limit", String(p.limit));
  return `?${usp.toString()}`;
}

export const listUserLeaderboard = (p: LeaderboardParams): Promise<Paginated<UserLeaderboardEntry>> =>
  apiFetch<Paginated<UserLeaderboardEntry>>(`/leaderboard/users${qs(p)}`);

export const listTeamLeaderboard = (p: LeaderboardParams): Promise<Paginated<TeamLeaderboardEntry>> =>
  apiFetch<Paginated<TeamLeaderboardEntry>>(`/leaderboard/teams${qs(p)}`);
```

- [ ] **Step 3: Update `frontend/src/api/index.ts`**

Change:
```typescript
export * as rank from "./rank";
```
To:
```typescript
export * as leaderboard from "./leaderboard";
```

Keep the surrounding re-exports in their existing alphabetical or grouped order.

## Task 11: Frontend queries — rename module, update cache-key builders and prefix

**Files:**
- Rename: `frontend/src/queries/rank.ts` → `frontend/src/queries/leaderboard.ts`
- Modify: `frontend/src/queries/keys.ts`

- [ ] **Step 1: Git-rename the queries module**

```bash
git mv frontend/src/queries/rank.ts frontend/src/queries/leaderboard.ts
```

- [ ] **Step 2: Rewrite `frontend/src/queries/leaderboard.ts`**

Replace the whole file with:

```typescript
// frontend/src/queries/leaderboard.ts
import { infiniteQueryOptions } from "@tanstack/react-query";
import * as api from "../api/leaderboard";
import type { LeaderboardPeriod } from "../api/leaderboard";
import { qk } from "./keys";

export const leaderboardUsersInfiniteQueryOptions = (period: LeaderboardPeriod) =>
  infiniteQueryOptions({
    queryKey: qk.leaderboardUsers(period),
    queryFn: ({ pageParam }) => api.listUserLeaderboard({ period, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.next_cursor ?? undefined,
    staleTime: 5 * 60_000,
  });

export const leaderboardTeamsInfiniteQueryOptions = (period: LeaderboardPeriod) =>
  infiniteQueryOptions({
    queryKey: qk.leaderboardTeams(period),
    queryFn: ({ pageParam }) => api.listTeamLeaderboard({ period, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.next_cursor ?? undefined,
    staleTime: 5 * 60_000,
  });
```

- [ ] **Step 3: Rewrite `frontend/src/queries/keys.ts`**

Replace the whole file with:

```typescript
import type { LeaderboardPeriod } from "../api/leaderboard";
import type { TeamSearchParams } from "../api/teams";

export const qk = {
  me: ["me"] as const,
  myTasks: ["me", "tasks"] as const,
  myTeams: ["me", "teams"] as const,
  myRewards: ["me", "rewards"] as const,
  task: (id: string) => ["tasks", id] as const,
  teams: (params: TeamSearchParams) => ["teams", params] as const,
  team: (id: string) => ["teams", id] as const,
  leaderboardUsers: (period: LeaderboardPeriod) => ["leaderboard", "users", period] as const,
  leaderboardTeams: (period: LeaderboardPeriod) => ["leaderboard", "teams", period] as const,
  news: ["news"] as const,
} as const;
```

## Task 12: Frontend mutations — update cache-key invalidation prefix

**Files:**
- Modify: `frontend/src/mutations/tasks.ts`
- Modify: `frontend/src/mutations/teams.ts`

- [ ] **Step 1: Update `tasks.ts`**

At line 28, change:
```typescript
      qc.invalidateQueries({ queryKey: ["rank"] });
```
To:
```typescript
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
```

- [ ] **Step 2: Update `teams.ts` (two sites)**

Use Edit with `replace_all: true` to replace:
```typescript
      qc.invalidateQueries({ queryKey: ["rank"] });
```
With:
```typescript
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
```

Both occurrences (lines 88 and 131) change in one replace_all pass.

## Task 13: Frontend screen — rename file and component

**Files:**
- Rename: `frontend/src/screens/RankScreen.tsx` → `frontend/src/screens/LeaderboardScreen.tsx`

- [ ] **Step 1: Git-rename the screen module**

```bash
git mv frontend/src/screens/RankScreen.tsx frontend/src/screens/LeaderboardScreen.tsx
```

- [ ] **Step 2: Update imports and identifiers inside `LeaderboardScreen.tsx`**

Apply these edits (all Bucket A; Bucket B `rank` fields/locals remain):

1. Replace:
   ```typescript
   import { rankUsersInfiniteQueryOptions, rankTeamsInfiniteQueryOptions } from "../queries/rank";
   import type { RankPeriod } from "../api/rank";
   ```
   With:
   ```typescript
   import { leaderboardUsersInfiniteQueryOptions, leaderboardTeamsInfiniteQueryOptions } from "../queries/leaderboard";
   import type { LeaderboardPeriod } from "../api/leaderboard";
   ```

2. Replace `RankPeriod` → `LeaderboardPeriod` (two remaining occurrences: in `PERIODS` array type and in `useState<RankPeriod>`).

3. Replace `rankUsersInfiniteQueryOptions` → `leaderboardUsersInfiniteQueryOptions` and `rankTeamsInfiniteQueryOptions` → `leaderboardTeamsInfiniteQueryOptions` in the `useInfiniteQuery` calls.

4. Replace the function declaration:
   ```typescript
   export default function RankScreen() {
   ```
   With:
   ```typescript
   export default function LeaderboardScreen() {
   ```

Leave untouched (Bucket B):
- `interface RowCommon { ... rank: number; ... }`
- `rank: entry.rank,` assignments
- `const sorted = [...rows].sort((a, b) => a.rank - b.rank);`
- `const myRank = ... ?.rank ?? null`
- `const rankLabels = ["2", "1", "3"];` — these are podium position labels, Bucket B
- All JSX renderings of `{r.rank}` etc.

## Task 14: Frontend route — update imports

**Files:**
- Modify: `frontend/src/routes/_authed.leaderboard.tsx`

- [ ] **Step 1: Rewrite `_authed.leaderboard.tsx`**

Replace the whole file with:

```typescript
import { createRoute } from "@tanstack/react-router";
import LeaderboardScreen from "../screens/LeaderboardScreen";
import { leaderboardTeamsInfiniteQueryOptions, leaderboardUsersInfiniteQueryOptions } from "../queries/leaderboard";
import { authedRoute } from "./_authed";

export const leaderboardRoute = createRoute({
  getParentRoute: () => authedRoute,
  path: "/leaderboard",
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureInfiniteQueryData(leaderboardUsersInfiniteQueryOptions("week")),
      context.queryClient.ensureInfiniteQueryData(leaderboardTeamsInfiniteQueryOptions("week")),
    ]),
  component: LeaderboardScreen,
});
```

## Task 15: Frontend BottomNav — rename tab key, icon component, accent entry

**Files:**
- Modify: `frontend/src/ui/BottomNav.tsx`

- [ ] **Step 1: Update the TabKey type and maps**

Apply these edits:

1. Line 5 — replace:
   ```typescript
   type TabKey = "home" | "tasks" | "rank" | "me";
   ```
   With:
   ```typescript
   type TabKey = "home" | "tasks" | "leaderboard" | "me";
   ```

2. Lines 10–15 — replace the `TAB_TO_PATH` entry `rank: "/leaderboard",` with `leaderboard: "/leaderboard",`.

3. Lines 41–49 — rename the component from `RankIcon` to `LeaderboardIcon`:
   ```typescript
   const LeaderboardIcon = () => (
     <svg {...iconProps}>
       <path d="M7 3h10v4a5 5 0 0 1-10 0V3z" />
       <path d="M7 5H4v2a3 3 0 0 0 3 3" />
       <path d="M17 5h3v2a3 3 0 0 1-3 3" />
       <path d="M10 14h4v4h-4z" />
       <path d="M8 21h8" />
     </svg>
   );
   ```

4. Line 61 — update the comment from:
   ```
   //   tasks → community (green) · rank → milestone (purple) · me → pioneer (peach)
   ```
   To:
   ```
   //   tasks → community (green) · leaderboard → milestone (purple) · me → pioneer (peach)
   ```

5. Line 65 — replace `rank: "var(--purple-deep)",` with `leaderboard: "var(--purple-deep)",`.

6. Line 72 — replace:
   ```typescript
   { key: "rank", label: "排行", icon: <RankIcon /> },
   ```
   With:
   ```typescript
   { key: "leaderboard", label: "排行", icon: <LeaderboardIcon /> },
   ```

(Chinese label `"排行"` unchanged — user-facing.)

## Task 16: Frontend test fixtures and handlers — update MSW paths

**Files:**
- Modify: `frontend/src/test/msw/handlers.ts`

- [ ] **Step 1: Update MSW handler URLs**

In `frontend/src/test/msw/handlers.ts` lines 18–19, replace:

```typescript
  http.get("/api/v1/rank/users", () => HttpResponse.json({ items: [], next_cursor: null })),
  http.get("/api/v1/rank/teams", () => HttpResponse.json({ items: [], next_cursor: null })),
```

With:

```typescript
  http.get("/api/v1/leaderboard/users", () => HttpResponse.json({ items: [], next_cursor: null })),
  http.get("/api/v1/leaderboard/teams", () => HttpResponse.json({ items: [], next_cursor: null })),
```

`frontend/src/test/msw/fixtures.ts:56` has `rank: null,` in the Team fixture — leave unchanged (Bucket B).

## Task 17: Frontend tests — update key-builder assertions

**Files:**
- Modify: `frontend/src/queries/__tests__/keys.test.ts`
- Modify: `frontend/src/mutations/__tests__/me.test.tsx`

- [ ] **Step 1: Update `keys.test.ts`**

Replace lines 18–21:

```typescript
  it("rank keys share the 'rank' prefix for broad invalidation", () => {
    expect(qk.rankUsers("week").slice(0, 1)).toEqual(["rank"]);
    expect(qk.rankTeams("week").slice(0, 1)).toEqual(["rank"]);
  });
```

With:

```typescript
  it("leaderboard keys share the 'leaderboard' prefix for broad invalidation", () => {
    expect(qk.leaderboardUsers("week").slice(0, 1)).toEqual(["leaderboard"]);
    expect(qk.leaderboardTeams("week").slice(0, 1)).toEqual(["leaderboard"]);
  });
```

- [ ] **Step 2: Update `me.test.tsx`**

Use Edit with `replace_all: true`:

Replace `["rank"]` → `["leaderboard"]` (three occurrences at lines 97, 125, 145 inside `expectedKeys` arrays).

## Task 18: Frontend verification — typecheck, lint, tests, bundle

- [ ] **Step 1: Run frontend CI**

```bash
cd /Users/Jet/Developer/golden-abundance/.claude/worktrees/rename-rank-to-leaderboard/frontend
just ci
```

Expected: pnpm install → lint → format → typecheck → test → build all pass.

Specifically:
- `pnpm run typecheck` should pass — critical, because it proves the OpenAPI schema regen matched the frontend imports.
- `pnpm run test` — `keys.test.ts`, `me.test.tsx` should pass with new prefix; loader tests for the leaderboard route should still pass against new MSW handlers.

If typecheck fails with `Property 'leaderboardUsers' does not exist on type { rankUsers: ... }` — re-run `just gen-types` from repo root and verify `schema.d.ts` has the new paths.

If tests fail on MSW "no handler for /api/v1/rank/users" — search for stale references with `grep -rn '"rank"\|/rank/\|RankPeriod\|RankEntry' frontend/src`. Clean up.

## Task 19: Commit the frontend half

- [ ] **Step 1: Stage and commit**

```bash
cd /Users/Jet/Developer/golden-abundance/.claude/worktrees/rename-rank-to-leaderboard
git add -A frontend/
git commit -m "refactor(frontend): rename rank feature to leaderboard

API client, query options, cache-key builders, screen component, and
BottomNav tab key renamed. The position field 'rank' on entries and
the Chinese UI label '排行' are unchanged."
```

## Task 20: Cross-layer sanity check

- [ ] **Step 1: Grep for any straggling feature-name references**

```bash
cd /Users/Jet/Developer/golden-abundance/.claude/worktrees/rename-rank-to-leaderboard
grep -rn -E 'RankPeriod|RankEntry|rankUsers|rankTeams|RankScreen|RankIcon|listUserRank|listTeamRank|"/rank/|"rank"\]|queryKey.*\["rank"\]' backend frontend
```

Expected: zero hits in backend/**/*.py, frontend/**/*.ts, frontend/**/*.tsx. (Hits inside `node_modules` or `.claude` worktree ignored.)

Remaining legitimate hits (if grep returns anything, verify each is Bucket B):
- `rank: int` / `rank: number` / `rank?: number | null` field definitions
- `rank=...` service assignments
- `.rank` reads (`entry.rank`, `team.rank`, `r.rank`, `myRank`, `teamRank`)
- `"rank": 1` in JSON example fixtures
- `rankLabels` array in the screen
- String "rank" in comments/docstrings that use the word as a verb ("to rank") or SQL column-alias reference

- [ ] **Step 2: Run full CI both layers end-to-end from repo root**

```bash
cd /Users/Jet/Developer/golden-abundance/.claude/worktrees/rename-rank-to-leaderboard
just gen-types
(cd backend && just ci)
(cd frontend && just ci)
```

Expected: both pass. This is the final gate before merging to main.

- [ ] **Step 3: Review commit log**

```bash
git log --oneline main..HEAD
```

Expected:
```
<sha> refactor(frontend): rename rank feature to leaderboard
<sha> refactor(backend): rename rank feature to leaderboard
```

Two commits, backend before frontend. If more than two, that's fine as long as each is logically coherent — squash optional.

## Task 21: Merge back to main

Per project CLAUDE.md: merge with `git merge` (not rebase), then tag.

- [ ] **Step 1: Switch to main and merge the worktree branch**

Do this in the primary working copy (outside the worktree). From the repo root (not the worktree):

```bash
cd /Users/Jet/Developer/golden-abundance
git merge --no-ff worktree-rename-rank-to-leaderboard -m "Merge branch 'worktree-rename-rank-to-leaderboard'

refactor: rename rank feature to leaderboard across backend and frontend"
```

- [ ] **Step 2: Tag the merge commit**

Check existing tag style first:
```bash
git tag -l
```

Then tag with a concise descriptor (project CLAUDE.md convention):
```bash
git tag rank-to-leaderboard
```

- [ ] **Step 3: Exit the worktree and clean up**

Once the merge is confirmed, use ExitWorktree with `action: "remove"` (pass `discard_changes: true` only if git reports stray uncommitted files — should not be the case after step 1).

## Self-review checklist (already applied in this plan)

- ✅ Every task references exact paths.
- ✅ Every code change shows the new code in full, not a diff.
- ✅ Every identifier rename appears in the rename table AND in the task that renames it.
- ✅ Bucket A vs B distinction applied per file (documented in File Structure).
- ✅ Router function name collision resolved explicitly (Task 3 renames to `get_leaderboard_*`).
- ✅ Cache-key prefix change tied to mutations AND tests (Tasks 11, 12, 17).
- ✅ OpenAPI regen step placed between backend commit and frontend edits (Task 8).
- ✅ Schema.d.ts gitignored — no commit of regenerated file.
- ✅ Chinese label `"排行"` explicitly preserved (Task 15).
- ✅ Verification steps at backend (Task 7) and frontend (Task 18) boundaries.
- ✅ Final cross-layer grep (Task 20) to catch stragglers.

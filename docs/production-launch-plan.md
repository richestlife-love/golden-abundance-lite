# Production Launch Plan

High-level phase tracker for the move from single-file prototype to production app (React + FastAPI + Postgres + Supabase Auth).

## Phases

- [x] **Phase 1 — Build system + modules:** Vite, per-component split, TypeScript, Prettier.
- [x] **Phase 2 — API contract first:** Pydantic models in `backend/src/backend/contract/`, endpoint catalog, fixture validation. ([spec](superpowers/specs/2026-04-19-api-contract-design.md))
- [x] **Phase 3 — Routing:** TanStack Router, screens mapped to URLs.
- [x] **Phase 4 — Wire frontend to backend:** TanStack Query (4a), read-side migration (4b), write-side + `AppStateContext` deletion (4c).
- [x] **Phase 5 — Persistence:** SQLModel + Alembic + Postgres; sub-plans [5a foundation](superpowers/plans/2026-04-19-phase-5a-foundation.md), [5b auth-stub](superpowers/plans/2026-04-19-phase-5b-auth.md), [5c teams](superpowers/plans/2026-04-19-phase-5c-teams.md), [5d content](superpowers/plans/2026-04-19-phase-5d-content.md), [5e polish](superpowers/plans/2026-04-19-phase-5e-polish.md). Backend serves every endpoint in `backend/src/backend/contract/endpoints.md`.
- [x] **Phase 6 — Auth:** Supabase Auth + RS256 JWKS verifier; replaces 5b stub. ([spec](superpowers/specs/2026-04-21-phase-6-7-auth-deploy-design.md), [6a](superpowers/plans/2026-04-21-phase-6a-backend-auth.md), [6b](superpowers/plans/2026-04-21-phase-6b-frontend-auth.md))
- [x] **Phase 7 — Deploy:** Vercel (frontend), Railway (backend), managed Postgres, Sentry, GitHub Actions. Dashboard/infra steps in [`phase-7-launch-runbook.md`](phase-7-launch-runbook.md).

## Launch-readiness picklist

Cross-cutting view of items most worth fixing before broader user exposure. Each links to the topical detail in this file or the FR docs — this section is curation, not new findings.

### Correctness & security

- **`profile_complete` enforced frontend-only** — `current_user` doesn't inspect it, so any holder of a valid Supabase JWT can call business endpoints regardless. Fix: one dependency layered on `current_user` that 403s when `profile_complete=False` (excluding `/me/profile`). See [FR `05-roles-permissions.md`](functional-requirements/05-roles-permissions.md).
- **`week_points` semantics drift** — leaderboard `period ∈ {week, month, all_time}` widens the `points` window but `week_points` is always trailing-7d, so `period=month` returns rows where the two numbers measure different windows. Pick one of: rename to `recent_points_7d`, omit outside week view, or make it track `period`. See [FR README → Leaderboard](functional-requirements/README.md).
- **`submit_task` race surfaces 500 instead of 409** — see "Concurrency / races" below.

### User-visible gaps

- **T3 / TeamForm dead-end** — backend ready (`GET /teams`, join-request POST), no `/teams` routes exist; `/tasks/T3/start` 404s and the MyScreen CTA toasts "coming soon". Restores a third of seeded challenge content. See "Frontend feature gaps" below + [FR `10-deferred-scope.md`](functional-requirements/10-deferred-scope.md).
- **`TeamCard` shows fabricated numbers** — synthetic-hash member points + formula-derived team points/rank. Hydrate from `GET /leaderboard/teams`. See "Frontend API layer" below.
- **`totalPoints` re-derived in 4 screens** — no backend `user.points`; tier thresholds also live only in frontend. Promote both to backend so scoring rule changes don't require a 4-screen sweep. See [FR `04-frontend-derivations.md`](functional-requirements/04-frontend-derivations.md).
- **Admin path for tasks + news** — every content edit requires a redeploy + `seed.py` change. Minimal `POST /news` + `PATCH /tasks/{id}` behind an `is_admin` flag unblocks ops. See "Backend feature gaps" below.

### Operational

- **Audit trail missing** — `task_progress` has no `created_at`, T3 completion isn't even persisted (derived in responses only). For a points + rewards system, "when did user X complete task Y?" cannot be answered without Sentry breadcrumbs. Add `created_at`/`completed_at` columns + persist T3 transitions. See "Schema" below.
- **Leaderboard scaling ceiling** — loads every user/team into Python and sorts there. Fine at 6 seeded users; degrades linearly with signups. Explicit `TODO(phase-6)` for SQL `ROW_NUMBER() OVER (...)` rewrite. See "Performance / N+1" below.
- **No E2E coverage on critical paths** — sign-in → profile completion → task submit → reward is the entire user value, covered only by unit tests against MSW. One Playwright spec against a real local backend would catch a class of integration bugs (Supabase callback, JWKS verify, query invalidation race) that unit tests structurally cannot.

### Hardening

- **Token in `localStorage` + CSP `style-src 'unsafe-inline'`** — XSS = token theft is the threat; CSP currently allows inline styles, which weakens the mitigation. See "Auth / session (deferred from Phase 6)" below.
- **`schema.d.ts` gitignored** — fresh checkout fails typecheck until `just gen-types` runs. Either commit it, generate in `postinstall`, or fail loudly when missing. See [Phase 6 hardening "Still deferred"](#auth--session-deferred-from-phase-6).
- **Mixed Traditional / Simplified Chinese** — 社区 in DB/contract, 社區 in UI rewrite; makes error-message-based test grepping fragile and is a visible inconsistency to zh-TW users. See [FR `09-localization.md`](functional-requirements/09-localization.md).

## Open tech debt

Items still actionable. Resolved items have been removed; see git history if archaeology is needed.

### Concurrency / races

- **`display_id` SELECT-then-INSERT race** — [`backend/src/backend/services/display_id.py`](../backend/src/backend/services/display_id.py). Two concurrent first-sign-ins with the same email base can collide on `display_id` (different `sub`s) → 500. The PK collision case is already handled by `current_user`'s `IntegrityError` retry. Fix: `INSERT … ON CONFLICT` with suffix regen, or retry inside `generate_user_display_id`.
- **`create_join_request` non-atomic** — [`backend/src/backend/services/team.py`](../backend/src/backend/services/team.py). Four conflict checks then INSERT; concurrent calls can both pass. Fix: partial unique index `WHERE status='pending'` on `join_requests(user_id)` + `IntegrityError` → 409.
- **`submit_task` check-then-insert race** — [`backend/src/backend/services/task.py`](../backend/src/backend/services/task.py). Loser surfaces raw `IntegrityError` as 500 instead of 409. Fix: catch and retranslate to `TaskSubmitError(409, "Task already completed")`.
- **Seed not race-safe** — [`backend/src/backend/seed.py`](../backend/src/backend/seed.py). Acceptable for dev. If seed ever runs at deploy time across replicas, switch to `ON CONFLICT DO NOTHING`.

### Performance / N+1

- **`leaderboard_users` / `leaderboard_teams` load every row** — [`backend/src/backend/services/rank.py`](../backend/src/backend/services/rank.py). Sort + slice in Python. Rewrite to SQL `ROW_NUMBER() OVER (...)` + keyset pagination via `services.pagination.paginate_keyset`.
- **`row_to_contract_team` N+1 on join-request requesters** — [`backend/src/backend/services/team.py`](../backend/src/backend/services/team.py). Members are batched; requesters aren't. Batch with one `select(UserRow).where(UserRow.id.in_(…))` if `GET /teams/{id}` becomes hot.
- **Reward-cascade N+1 in `approve_join_request`** — [`backend/src/backend/services/team.py`](../backend/src/backend/services/team.py). ~24 queries per 6-member approval. Batch the per-user reward check or move to a background job.
- **`list_caller_tasks` per-task fanout** — [`backend/src/backend/services/task.py`](../backend/src/backend/services/task.py). `_required_ids` / `_steps_for` / progress lookups run once per def. Batch each helper across the full def list when this endpoint becomes hot.

### Schema

- **`TaskProgressRow.form_submission` is `sa.JSON`, not `JSONB`** — [`backend/src/backend/db/models.py`](../backend/src/backend/db/models.py). JSON-path queries and GIN indexing don't work. `ALTER COLUMN … TYPE JSONB USING form_submission::jsonb` when first needed.
- **Python-side `uuid4` + `_utcnow` defaults** — every table in `db/models.py`. Wallclock skew across replicas can produce non-monotonic `created_at`. Fix: `server_default=sa.func.gen_random_uuid()` / `sa.func.now()`.
- **`TaskProgressRow` has no `created_at`** — once any update fires, original enrollment time is lost. Add if a service ever needs to query "when did the user start this task".
- **No event/audit trail for task progression** — combined with T3 completion being derived only (not persisted, no `completed_at`), there is no way to reconstruct "when did user X complete task Y" for support, dispute resolution, or analytics. Either persist T3 transitions + add `completed_at` columns, or add an append-only `task_events` table.
- **`Task.display_id` has no contract regex** — [`backend/src/backend/contract/task.py`](../backend/src/backend/contract/task.py). `User` and `Team` have one. Add `Field(pattern=r"^T[0-9A-Z]+$")` to round-trip with the seed drift guard.

### Backend infra / tooling

- **`alembic/env.py` calls `asyncio.run()` at import time** — [`backend/alembic/env.py`](../backend/alembic/env.py). Tests sidestep via `asyncio.to_thread`. Any import from a running event loop will raise. Switch to a sync invocation via `engine.sync_engine`.
- **`get_session` has no explicit rollback** — [`backend/src/backend/db/session.py`](../backend/src/backend/db/session.py). Relies on autobegin/auto-rollback. Wrap the yield in `try/except: await session.rollback(); raise` if explicit `session.begin()` blocks land.
- **Alembic `path_separator` deprecation warning** — add `path_separator = os` under `[alembic]` in [`backend/alembic.ini`](../backend/alembic.ini).
- **No `just seed-reset` force-refresh path beyond truncate** — [`backend/src/backend/seed.py`](../backend/src/backend/seed.py) is skip-on-conflict; edited seed content needs manual TRUNCATE.
- **Seed bypasses `services.display_id`** — drift guard test exists; if validator tightens, seed silently keeps emitting old shapes.
- **`services/team.py` split pending** — ~229 LOC mixing mapper/search and team lifecycle. Split into `team/queries.py` + `team/lifecycle.py` if either grows further.

### Backend feature gaps

- **No reward-claim transition** — `Reward.status` declares `"earned"` and `"claimed"` but no endpoint moves rows. Add `POST /rewards/{id}/claim` when fulfillment is real.
- **News has no admin publish path** — [`backend/src/backend/routers/news.py`](../backend/src/backend/routers/news.py) exposes only `GET /news`. Needs admin-guarded `POST /news` + `PATCH /news/{id}` once the role system lands.

### Frontend API layer

- **`apiFetch` always sends `Content-Type: application/json`** — [`frontend/src/api/client.ts`](../frontend/src/api/client.ts). Gate on `init.body != null` when tightening.
- **Query-key prefix collision** — [`frontend/src/queries/keys.ts`](../frontend/src/queries/keys.ts). `qk.task(id)` is `["tasks", id]` (plural) but `qk.myTasks` is `["me", "tasks"]`. Invalidating `["tasks"]` doesn't clear `qk.myTasks`. Any new mutation must invalidate both.
- **`RankPeriod` is inlined in generated schema** — [`frontend/src/api/schema.d.ts`](../frontend/src/api/schema.d.ts) emits the union per operation. Backend could expose a named enum to remove the local-union compensation in [`frontend/src/api/rank.ts`](../frontend/src/api/rank.ts).
- **`Paginated<T>` hand-rolled in TS** — generated emits monomorphised variants with optional `next_cursor`; hand-rolled uses required-nullable. Prefer generated when refactoring.
- **Shared default-invalidate map missing** — every `mutations/*.ts` hook inlines `qc.invalidateQueries({...})`. A shared `INVALIDATE_MAP` + `onSuccessFactory(name)` would collapse ~40 lines and dedupe [`mutations/__tests__/me.test.tsx`](../frontend/src/mutations/__tests__/me.test.tsx).
- **`useSubmitTask` + `useCreateJoinRequest` lack `onError` default toast** — failures only surface via `mutation.error`. Wire 409-aware copy when the shared map lands.
- **`qk.team(uuid)` invalidated but never patched optimistically** — [`frontend/src/mutations/teams.ts`](../frontend/src/mutations/teams.ts). Extend `onMutate` to patch `qk.team(teamId)` when a team-detail route ships.

### Frontend feature gaps

- **`TeamForm` is a hard-coded 4-team demo** — [`frontend/src/screens/TeamForm.tsx`](../frontend/src/screens/TeamForm.tsx). Phase 7 hardening disabled the broken T3 path (route throws `notFound()`, MyScreen CTA toasts "coming soon"). Real wiring: `teamsInfiniteQueryOptions` + UUID-keyed `useCreateJoinRequest`. Re-enable T3 in `SUPPORTED_TASK_DISPLAY_IDS` once shipped.
- **"Challenge" rank tab is empty state** — [`frontend/src/screens/RankScreen.tsx`](../frontend/src/screens/RankScreen.tsx). Needs `/rank/challenges` endpoint.
- **Inline toast container in `__root.tsx` is text-only** — replace with a real toast (positioning, fade, auto-dismiss, ARIA live-region) during frontend polish.

### Auth / session (deferred from Phase 6)

- **Token in `localStorage`** — owned by Supabase SDK (`sb-<ref>-auth-token`). XSS → token theft; mitigated by strict CSP. BFF cookie pattern rejected per Phase 6-7 spec §2.
- **No server-side refresh-token revocation** — Supabase SDK auto-refreshes; revoking an active refresh token beyond Supabase's signing-key rotation is deferred. See `docs/functional-requirements/10-deferred-scope.md`.
- **CSP `style-src 'unsafe-inline'`** — codebase-wide inline `style={}` makes nonce migration a separate pass. Phase 6-7 spec §11.9.
- **Stale-email collision** — Supabase delete + recreate yields new `sub` that may collide on `UserRow.email` unique constraint. Requires manual admin action; `current_user` re-raises rather than swallowing.
- **Session-expired handler can fire during hover preload** — `defaultPreload: "intent"` + 401 on a preloaded route can redirect a user who hasn't clicked. `returnTo` derivation is sensible; revisit if it becomes a real UX problem.

### Test infrastructure

- **Node 25 `localStorage` shim** — [`frontend/src/test/setup.ts`](../frontend/src/test/setup.ts). Feature-tests for `getItem` and installs Map-backed Storage. Auto-skips once Node API matures.
- **MSW configured `onUnhandledRequest: "error"`** — [`frontend/src/test/setup.ts`](../frontend/src/test/setup.ts). Every new endpoint needs a default handler in [`frontend/src/test/msw/handlers.ts`](../frontend/src/test/msw/handlers.ts) or a per-test `server.use(...)`.
- **`_truncate_all(engine)` duplicated across backend seed tests** — [`backend/tests/test_seed_demo.py`](../backend/tests/test_seed_demo.py), [`backend/tests/test_seed_display_id_drift.py`](../backend/tests/test_seed_display_id_drift.py). Factor into `conftest.py` when a third copy threatens.
- **No unit tests on `seed_reset.py` / `dump_demo_accounts.py`** — both at 0% coverage.
- **`renderRoute` registers router via `setRouterRef` but never unregisters** — [`frontend/src/test/renderRoute.tsx`](../frontend/src/test/renderRoute.tsx). Add `setRouterRef(null)` in `setup.ts` `afterEach` if a future suite needs strict teardown.
- **`tests/test_jwt.py::test_decode_rejects_tampered_token` ~10% flaky** — [`backend/tests/test_jwt.py`](../backend/tests/test_jwt.py). Flips one base64url char; collisions to the same byte still verify. Fix: flip every char in the signature segment, or base64url-decode first and mutate a middle byte.

### Pre-Phase-4 state architecture (still relevant if `AppStateContext` reappears)

These items predate Phase 4c's deletion of `AppStateContext` but document the design intent for any future shared state:
- Prefer focused stores or React Query selectors over a single context holding the whole domain.
- Don't double-store derivable state (e.g. team progress was mirrored into `tasks[idx]`).
- Don't compose setters inside other setters — React 18 StrictMode invokes them twice.
- Server-issued UUIDs for user/team IDs; never derive from email local-parts (collision-prone).

### UI copy

- **Mixed Traditional / Simplified Chinese** — `LandingScreen`, `BottomNav`, `RewardsScreen` use Simplified; `GoogleAuthScreen`, `data.ts` task titles, `ProfileSetupForm` labels use Traditional. Pick one and sweep.

## Key tradeoffs (historical)

- **Reuse vs. rebuild** — kept components, wrapped new architecture around them.
- **Auth lift** — Supabase chosen over DIY OAuth (hours vs. ~a week).
- **TypeScript timing** — added in Phase 1; retrofitting after Phase 3 would have been painful.

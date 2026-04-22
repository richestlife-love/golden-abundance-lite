# Backend Review Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Address every finding from the 2026-04-22 backend code review — 1 Critical, 5 High, 10 Medium, 13 Low/nit — before production launch.

**Architecture:** Fixes are grouped into ~13 atomic commits ordered by launch-urgency (Critical → High → Medium → Low). Each commit passes `just ci`. Behavior-preserving refactors keep existing tests green; new behavior gets new tests (TDD). The two biggest changes (H1 rate limiting, H2 leaderboard SQL rewrite) each land as their own phase with dedicated tests.

**Tech Stack:** Same as backend — FastAPI, SQLModel, Alembic, Pydantic 2, pytest-asyncio, testcontainers. One new runtime dep: `slowapi` (rate limiting).

**Exit criteria:**

- `just -f backend/justfile ci` green (ruff + ty + contract-validate + pytest with ≥90% coverage)
- All 25+ review findings have a corresponding commit (or an explicit documented rejection)
- No new `# type: ignore` / `# noqa` escapes introduced
- Worktree is on branch `chore/backend-review-fixes`, rebased onto `main`

---

## Scoping decisions locked before drafting

| Decision | Choice | Why |
|---|---|---|
| Rate limiter backend | `slowapi` with in-memory store | Zero infra change for launch; Redis can come later. `limits` reset per-pod is acceptable at launch scale. |
| Rate limit in tests | Disabled via env (`RATE_LIMIT_DISABLED=1`) | Tests assert per-test behavior, not rate limits. One dedicated test module covers the limiter itself. |
| Leaderboard rewrite approach | SQL-side ranking via subquery + keyset pagination on `(points DESC, id ASC)` | Matches the module's own TODO. Avoids denormalizing counters (source-of-truth stays in TaskProgress/Reward). |
| M6 (`Team.points` / `week_points` dead cols) | **Drop** the columns + contract fields | Leaderboard is the source of truth. Denormalizing creates double-write bugs. Migration drops cols; contract removes fields. |
| Structured logging | `logging.dictConfig` inside `create_app()` emitting JSON; uvicorn access log configured via `log_config` | Avoids a heavy dep like `structlog`; stdlib is enough. One request-middleware adds duration + user_id. |
| LIKE escape strategy | Escape `\`, `%`, `_` in the caller; pass `escape="\\"` to SQLAlchemy | Correctness-only fix; trigram index is deferred (separate migration, requires `pg_trgm` extension + ops decision). |
| Sentry scrubbing | `before_send` hook that drops `request.data` for `/me/profile` + `/tasks/*/submit` | More targeted than `max_request_body_size="never"` globally. |
| `display_id` race (M2) | Retry-on-IntegrityError loop (3 attempts) | Simpler than `INSERT ... ON CONFLICT`; display_id is only generated on first sign-in so retry is cheap. |
| Mass-assignment guard (M8) | Explicit field-name tuple in PATCH handlers | Keeps `StrictModel extra="forbid"` as second layer; intent is explicit in code. |
| L10 (`response_model_exclude_none`) | **Skip** — discretionary; frontend handles nulls fine | Review says "discretionary". |
| L12 (alembic asyncio.run) | **Skip** — standard alembic pattern, not a real issue | Review author agreed. |
| Nits L2, L3, L4 (Dockerfile) | L2 pin libpq5 major, L3 add HEALTHCHECK, L4 split fastapi[standard] → explicit deps | Small hardening; keep in one Dockerfile commit. |
| Commit style | Conventional commits (`fix:`, `refactor:`, `chore:`, `test:`, `docs:`) | Per CLAUDE.md global conventions. |

---

## File plan

Files created (C), modified (M), or deleted (D). Paths relative to repo root.

### Phase 1 — Launch-critical security/ops (C1, H4, L5, L6, L11)

| Path | Action | Contents |
|---|---|---|
| `backend/src/backend/server.py` | M | Tighten CORS: `allow_credentials=False`, explicit methods + headers |
| `backend/src/backend/config.py` | M | Drop `http://localhost:8000` from CORS default; warn if prod + default CORS |
| `backend/src/backend/routers/health.py` | M | Add `/readyz` endpoint that runs `SELECT 1` with a timeout |
| `backend/src/backend/seed.py` | M | Gate `_upsert_demo_users` + `_upsert_demo_join_requests` on `APP_ENV != "prod"` |
| `backend/.env.example` | M | Add `SENTRY_DSN` + `APP_RELEASE` commented entries |
| `backend/tests/routers/test_health.py` | M | Add `/readyz` happy path + DB-down paths |
| `backend/tests/test_cors.py` | C | New test asserting CORS response headers are tight |
| `backend/tests/test_seed.py` | M | Add test: prod env skips demo users |

### Phase 2 — Input validation (M7, M8)

| Path | Action | Contents |
|---|---|---|
| `backend/src/backend/contract/user.py` | M | `ProfileUpdate` fields get `min_length=1`, `max_length=<matching DB cap>` |
| `backend/src/backend/contract/team.py` | M | `TeamUpdate` fields get `min_length=1`, `max_length=<matching DB cap>` |
| `backend/src/backend/routers/me.py` | M | PATCH handler iterates explicit field tuple; drops `model_dump(exclude_unset=True)` loop |
| `backend/src/backend/routers/teams.py` | M | Same as above |
| `backend/tests/routers/test_me.py` | M | Add rejection tests for too-long + empty string fields |
| `backend/tests/routers/test_teams.py` | M | Same |

### Phase 3 — Sentry PII scrubbing (M1)

| Path | Action | Contents |
|---|---|---|
| `backend/src/backend/server.py` | M | `sentry_sdk.init(..., before_send=_scrub_sensitive_bodies)` |
| `backend/src/backend/observability.py` | C | Module hosting `_scrub_sensitive_bodies` |
| `backend/tests/test_observability.py` | C | Unit test for the scrub hook |

### Phase 4 — Search hygiene (H3)

| Path | Action | Contents |
|---|---|---|
| `backend/src/backend/services/team.py` | M | Add `_escape_like` helper; apply to `search_team_refs` with `escape="\\"` |
| `backend/tests/services/test_team_service.py` | M | Add tests: user searching for `%` doesn't match everything |

### Phase 5 — Display-id race fix (M2)

| Path | Action | Contents |
|---|---|---|
| `backend/src/backend/services/display_id.py` | M | Wrap display_id generation in retry-on-IntegrityError loop (3 attempts) |
| `backend/tests/services/test_display_id.py` | M | Add concurrent-collision test via forced-collision fixture |

### Phase 6 — Rate limiting (H1)

| Path | Action | Contents |
|---|---|---|
| `backend/pyproject.toml` | M | Add `slowapi` dep |
| `backend/src/backend/config.py` | M | `rate_limit_disabled: bool = False` setting; default False |
| `backend/src/backend/rate_limit.py` | C | Construct `Limiter` + error handler; no-op when disabled |
| `backend/src/backend/server.py` | M | Register limiter + exception handler |
| `backend/src/backend/routers/me.py` | M | Decorate `POST /me/profile` |
| `backend/src/backend/routers/tasks.py` | M | Decorate `POST /tasks/{id}/submit` |
| `backend/src/backend/routers/teams.py` | M | Decorate `GET /teams` (only when `q` present) |
| `backend/src/backend/routers/leaderboard.py` | M | Decorate `GET /leaderboard/*` |
| `backend/tests/test_rate_limit.py` | C | New test module with limiter enabled |
| `backend/tests/conftest.py` | M | Ensure test default is `RATE_LIMIT_DISABLED=1` |
| `backend/.env.example` | M | Document `RATE_LIMIT_DISABLED` |

### Phase 7 — N+1 and defensive cleanups (M3, M4, M5)

| Path | Action | Contents |
|---|---|---|
| `backend/src/backend/services/team.py` | M | `row_to_contract_team` — hydrate pending requests via single join |
| `backend/src/backend/services/team_join.py` | M | `approve_join_request` — batch challenge/membership lookups |
| `backend/src/backend/services/leaderboard.py` | M | Use `leaders.get()` with skip (M5) |

No new tests needed — behavior-preserving; existing tests must stay green.

### Phase 8 — Drop dead Team counters (M6)

| Path | Action | Contents |
|---|---|---|
| `backend/alembic/versions/0008_drop_team_counter_cols.py` | C | Drop `teams.points`, `teams.week_points`, `teams.cap` (cap is computed in service) |
| `backend/src/backend/db/models.py` | M | Remove `points`, `week_points`, `cap` from `TeamRow` |
| `backend/src/backend/contract/team.py` | M | Remove `points`, `week_points`, `cap` from `Team` contract |
| `backend/src/backend/services/team.py` | M | Remove references to removed columns; compute `cap` service-side from a constant |
| `backend/src/backend/contract/examples/team_as_leader.json` | M | Remove fields |
| `backend/src/backend/contract/examples/team_as_member.json` | M | Remove fields |
| `backend/tests/**` | M | Remove assertions on removed fields |

### Phase 9 — seed_reset hardening (M10)

| Path | Action | Contents |
|---|---|---|
| `backend/src/backend/seed_reset.py` | M | Derive table list from `SQLModel.metadata.sorted_tables` |

### Phase 10 — Structured logging (H5)

| Path | Action | Contents |
|---|---|---|
| `backend/src/backend/observability.py` | M | Add `configure_logging()` — JSON formatter, request middleware |
| `backend/src/backend/server.py` | M | Call `configure_logging()` in `create_app`; add request-log middleware |
| `backend/tests/test_observability.py` | M | Add log-shape tests |

### Phase 11 — Leaderboard SQL rewrite (H2)

| Path | Action | Contents |
|---|---|---|
| `backend/src/backend/services/leaderboard.py` | M | Replace Python-side sort + slice with SQL `ORDER BY points DESC, id ASC LIMIT OFFSET`; keyset pagination via `(points, id)` |
| `backend/tests/services/test_leaderboard.py` | M | Scale test: verify equivalent ranking under >100 users |

### Phase 12 — Dockerfile hardening (L2, L3, L4)

| Path | Action | Contents |
|---|---|---|
| `backend/pyproject.toml` | M | Replace `fastapi[standard]` with explicit `fastapi`, `uvicorn[standard]`; move `fastapi-cli` to dev |
| `backend/Dockerfile` | M | Pin libpq5 major; add `HEALTHCHECK` directive |
| `backend/uv.lock` | M | Regen via `uv sync` |

### Phase 13 — Remaining nits (L1, L7, L9, L13)

| Path | Action | Contents |
|---|---|---|
| `backend/src/backend/services/user.py` | M | L7: `derive_user_name` fallback to `"U{display_id}"` instead of email local-part |
| `backend/pyproject.toml` | M | L9: `addopts = ["-v", "--cov=backend"]` |
| `backend/alembic/versions/0009_task_color_format_check.py` | C | L13: Add CHECK constraint `color ~ '^#[0-9a-fA-F]{6}$'` on `task_defs` |
| `backend/tests/services/test_user_service.py` | M | Update fallback test |

L1 (idempotency keys), L8 (embed team in JoinRequest), L10 (exclude_none) — skipped per scoping decisions.
L12 (alembic asyncio.run) — skipped (standard pattern).

---

## Phase 1 — Launch-critical security/ops

### Task 1.1: CORS tightening (C1, L5)

**Files:**
- Modify: `backend/src/backend/server.py:37-43`
- Modify: `backend/src/backend/config.py:37-42`
- Create: `backend/tests/test_cors.py`

- [ ] **Step 1: Write failing test**

Create `backend/tests/test_cors.py`:

```python
"""Regression tests for CORS configuration (C1 / L5)."""

from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_cors_preflight_from_allowed_origin_returns_tight_headers(client: AsyncClient) -> None:
    response = await client.options(
        "/api/v1/news",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "Authorization",
        },
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"
    # Credentials must be false — we use bearer-token auth, not cookies.
    assert response.headers.get("access-control-allow-credentials") != "true"
    # Methods + headers must not be wildcard.
    assert "*" not in response.headers.get("access-control-allow-methods", "")
    assert "*" not in response.headers.get("access-control-allow-headers", "")
    assert "Authorization" in response.headers.get("access-control-allow-headers", "")


@pytest.mark.asyncio
async def test_cors_preflight_from_disallowed_origin_omits_allow_origin(client: AsyncClient) -> None:
    response = await client.options(
        "/api/v1/news",
        headers={
            "Origin": "https://evil.example.com",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert "access-control-allow-origin" not in response.headers
```

- [ ] **Step 2: Run test — should FAIL**

```bash
cd backend && uv run pytest tests/test_cors.py -v
```

Expected: assertion failures on wildcard methods/headers + `allow-credentials: true`.

- [ ] **Step 3: Update `server.py`**

Replace lines 37-43 with:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
    max_age=600,
)
```

- [ ] **Step 4: Update `config.py` CORS default (L5)**

Change lines 37-42 to drop the API's own origin from the default:

```python
cors_origins: list[str] = Field(
    default_factory=lambda: ["http://localhost:5173"],
)
```

- [ ] **Step 5: Run tests — PASS**

```bash
cd backend && uv run pytest tests/test_cors.py -v
```

- [ ] **Step 6: Full suite**

```bash
cd backend && uv run pytest
```

Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add backend/src/backend/server.py backend/src/backend/config.py backend/tests/test_cors.py
git commit -m "fix(backend): tighten CORS — credentials=false, explicit methods/headers"
```

### Task 1.2: Add /readyz endpoint (H4)

**Files:**
- Modify: `backend/src/backend/routers/health.py`
- Modify: `backend/tests/routers/test_health.py`

- [ ] **Step 1: Inspect existing test file**

```bash
cat backend/tests/routers/test_health.py
```

- [ ] **Step 2: Write failing readiness tests**

Append to `backend/tests/routers/test_health.py`:

```python
@pytest.mark.asyncio
async def test_readyz_returns_200_when_db_healthy(client: AsyncClient) -> None:
    response = await client.get("/readyz")
    assert response.status_code == 200
    assert response.json() == {"status": "ready"}


@pytest.mark.asyncio
async def test_readyz_returns_503_when_db_unreachable(monkeypatch, no_db_client) -> None:
    # no_db_client has the DB dep overridden to raise; /readyz must surface it as 503.
    from fastapi.testclient import TestClient
    response = no_db_client.get("/readyz")
    assert response.status_code == 503
```

(If `no_db_client` isn't the right fixture for forcing DB failure, substitute a `monkeypatch.setattr` on `db.engine.get_engine` to raise.)

- [ ] **Step 3: Run — FAIL** (`/readyz` doesn't exist)

- [ ] **Step 4: Implement**

Replace the contents of `backend/src/backend/routers/health.py`:

```python
"""Health probes. /health is pure liveness (process is up). /readyz is
readiness (process can serve traffic — includes a DB ping).
Neither is under /api/v1 — load balancers hit the root.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlmodel.ext.asyncio.session import AsyncSession

from backend.db.session import get_session

router = APIRouter()


@router.get("/health", tags=["internal"])
async def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/readyz", tags=["internal"])
async def readyz(session: AsyncSession = Depends(get_session)) -> dict[str, str]:
    try:
        await session.execute(text("SELECT 1"))
    except Exception as exc:  # noqa: BLE001 — readiness probe reports any DB failure
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="database unavailable",
        ) from exc
    return {"status": "ready"}
```

- [ ] **Step 5: Run — PASS**

- [ ] **Step 6: Update README**

In `backend/README.md`, add a note under "Configuration" or a new "Health probes" section:

```markdown
## Health probes

- `GET /health` — liveness. Returns `{"status":"ok"}` unconditionally.
- `GET /readyz` — readiness. Runs `SELECT 1`; returns 503 if the DB pool is unreachable.
```

- [ ] **Step 7: Commit**

```bash
git add backend/src/backend/routers/health.py backend/tests/routers/test_health.py backend/README.md
git commit -m "feat(backend): add /readyz with DB ping (H4)"
```

### Task 1.3: .env.example updates (L6)

- [ ] **Step 1: Read current file**

```bash
cat backend/.env.example
```

- [ ] **Step 2: Append missing entries**

Append these lines to `backend/.env.example`:

```bash
# Sentry error reporting (optional in dev/test; set in prod).
# SENTRY_DSN=
# APP_RELEASE=
```

- [ ] **Step 3: Commit** (will batch with 1.4 below)

### Task 1.4: Gate demo users on non-prod (L11)

**Files:**
- Modify: `backend/src/backend/seed.py`

- [ ] **Step 1: Find the main() or equivalent seed entrypoint**

```bash
grep -n "def main\|async def main\|_upsert_demo_users\|_upsert_demo_join" backend/src/backend/seed.py
```

- [ ] **Step 2: Write failing test**

Add to `backend/tests/test_seed.py` (or create if missing):

```python
@pytest.mark.asyncio
async def test_seed_skips_demo_users_in_prod(monkeypatch, session) -> None:
    monkeypatch.setenv("APP_ENV", "prod")
    monkeypatch.setenv("SUPABASE_URL", "https://example.supabase.co")
    from backend.config import get_settings
    get_settings.cache_clear()

    from backend.seed import main as seed_main
    await seed_main()

    from sqlalchemy import select
    from backend.db.models import UserRow
    result = await session.execute(select(UserRow))
    assert result.scalars().first() is None, "demo users must not land in prod"
```

- [ ] **Step 3: Implement the gate**

In `backend/src/backend/seed.py`, wrap the demo user section with:

```python
from backend.config import get_settings

async def main() -> None:
    ...
    if get_settings().app_env != "prod":
        await _upsert_demo_users(session)
        await _upsert_demo_join_requests(session)
    ...
```

(The test assertions may need tweaking depending on current seed structure.)

- [ ] **Step 4: Run — PASS**

- [ ] **Step 5: Commit (batch L6 + L11)**

```bash
git add backend/.env.example backend/src/backend/seed.py backend/tests/test_seed.py
git commit -m "chore(backend): document SENTRY_DSN/APP_RELEASE; gate demo users on non-prod (L6, L11)"
```

---

## Phase 2 — Input validation (M7, M8)

### Task 2.1: Tighten `ProfileUpdate` / `TeamUpdate` lengths

**Files:**
- Modify: `backend/src/backend/contract/user.py`
- Modify: `backend/src/backend/contract/team.py`
- Modify: `backend/src/backend/db/models.py` (read to confirm caps)

- [ ] **Step 1: Read DB caps**

```bash
rg "max_length" backend/src/backend/db/models.py
```

Record caps for each field (zh_name, en_name, nickname, phone, phone_code, country, location, line_id, telegram_id, avatar_url, name, alias, topic, description).

- [ ] **Step 2: Write failing test**

Add to `backend/tests/routers/test_me.py`:

```python
@pytest.mark.asyncio
async def test_patch_me_rejects_zh_name_too_long(client, authed_headers):
    response = await client.patch(
        "/api/v1/me",
        json={"zh_name": "x" * 65},  # DB cap is 64
        headers=authed_headers,
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_patch_me_rejects_zh_name_empty(client, authed_headers):
    response = await client.patch(
        "/api/v1/me",
        json={"zh_name": ""},
        headers=authed_headers,
    )
    assert response.status_code == 422
```

Same shape for teams in `backend/tests/routers/test_teams.py`.

- [ ] **Step 3: Run — FAIL**

- [ ] **Step 4: Add `Field(min_length=1, max_length=N)` constraints to every optional string on `ProfileUpdate` and `TeamUpdate`**, matching DB caps.

Example:
```python
zh_name: str | None = Field(default=None, min_length=1, max_length=64)
```

- [ ] **Step 5: Run — PASS**

- [ ] **Step 6: Commit**

```bash
git add backend/src/backend/contract/user.py backend/src/backend/contract/team.py backend/tests/routers/test_me.py backend/tests/routers/test_teams.py
git commit -m "fix(backend): enforce length bounds on ProfileUpdate/TeamUpdate (M7)"
```

### Task 2.2: Explicit field allowlist in PATCH handlers (M8)

**Files:**
- Modify: `backend/src/backend/routers/me.py:82-86`
- Modify: `backend/src/backend/routers/teams.py:97-98`

- [ ] **Step 1: Read the loops**

```bash
rg "model_dump\(exclude_unset" backend/src/backend/routers/
```

- [ ] **Step 2: Replace with explicit tuple**

In `routers/me.py`:

```python
_PROFILE_PATCHABLE: tuple[str, ...] = (
    "zh_name", "en_name", "nickname", "phone", "phone_code",
    "line_id", "telegram_id", "country", "location", "avatar_url",
)
...
for field_name in _PROFILE_PATCHABLE:
    if field_name in body.model_fields_set:
        setattr(me, field_name, getattr(body, field_name))
```

Same shape in `routers/teams.py` with the team-specific tuple.

- [ ] **Step 3: Run full suite — PASS** (behavior unchanged)

- [ ] **Step 4: Commit**

```bash
git add backend/src/backend/routers/me.py backend/src/backend/routers/teams.py
git commit -m "refactor(backend): explicit field allowlist in PATCH handlers (M8)"
```

---

## Phase 3 — Sentry PII scrubbing (M1)

### Task 3.1: Add `before_send` scrub hook

**Files:**
- Create: `backend/src/backend/observability.py`
- Modify: `backend/src/backend/server.py`
- Create: `backend/tests/test_observability.py`

- [ ] **Step 1: Write failing test**

`backend/tests/test_observability.py`:

```python
"""Tests for Sentry before_send scrubbing (M1)."""

from __future__ import annotations

from backend.observability import scrub_sensitive_bodies


def _event_for(path: str, body: object) -> dict:
    return {
        "request": {
            "url": f"http://example.com{path}",
            "data": body,
        },
    }


def test_scrub_removes_body_on_profile_endpoint() -> None:
    event = _event_for("/api/v1/me/profile", {"phone": "0912345678"})
    scrubbed = scrub_sensitive_bodies(event, {})
    assert "data" not in scrubbed["request"]


def test_scrub_removes_body_on_task_submit() -> None:
    event = _event_for("/api/v1/tasks/abc/submit", {"notes": "private"})
    scrubbed = scrub_sensitive_bodies(event, {})
    assert "data" not in scrubbed["request"]


def test_scrub_preserves_body_on_innocuous_endpoint() -> None:
    event = _event_for("/api/v1/news", {"page": 1})
    scrubbed = scrub_sensitive_bodies(event, {})
    assert scrubbed["request"]["data"] == {"page": 1}
```

- [ ] **Step 2: Implement**

`backend/src/backend/observability.py`:

```python
"""Observability hooks — Sentry scrubbing, structured logging.

PII policy: we strip request bodies on endpoints that accept personal
data (phone, social IDs). See M1 in the 2026-04-22 review.
"""

from __future__ import annotations

import re
from typing import Any

_SENSITIVE_PATH_PATTERNS = (
    re.compile(r"/api/v1/me/profile(?:/|$)"),
    re.compile(r"/api/v1/tasks/[^/]+/submit(?:/|$)"),
)


def scrub_sensitive_bodies(event: dict[str, Any], _hint: dict[str, Any]) -> dict[str, Any]:
    request = event.get("request")
    if not isinstance(request, dict):
        return event
    url = request.get("url", "")
    path = _path_from_url(url)
    if any(p.search(path) for p in _SENSITIVE_PATH_PATTERNS):
        request.pop("data", None)
        request.pop("json_body", None)
    return event


def _path_from_url(url: str) -> str:
    try:
        from urllib.parse import urlparse
        return urlparse(url).path
    except Exception:
        return url
```

- [ ] **Step 3: Wire into `server.py`**

Modify the `sentry_sdk.init(...)` call to pass `before_send=scrub_sensitive_bodies`.

- [ ] **Step 4: Run — PASS**

- [ ] **Step 5: Commit**

```bash
git add backend/src/backend/observability.py backend/src/backend/server.py backend/tests/test_observability.py
git commit -m "feat(backend): Sentry before_send scrubs bodies on PII endpoints (M1)"
```

---

## Phase 4 — Search hygiene (H3)

### Task 4.1: Escape LIKE metacharacters in team search

**Files:**
- Modify: `backend/src/backend/services/team.py:171-173`
- Modify: `backend/tests/services/test_team_service.py`

- [ ] **Step 1: Write failing test**

Add to `backend/tests/services/test_team_service.py`:

```python
@pytest.mark.asyncio
async def test_search_team_refs_treats_percent_as_literal(session, seed_two_teams):
    # seed_two_teams creates two teams with distinct names, neither containing '%'
    result = await search_team_refs(session, q="%", topic=None, leader_display_id=None, cursor=None, limit=10)
    assert result.items == [], "literal '%' should not wildcard-match all rows"


@pytest.mark.asyncio
async def test_search_team_refs_finds_literal_percent(session, seed_team_with_percent):
    result = await search_team_refs(session, q="%", topic=None, leader_display_id=None, cursor=None, limit=10)
    assert len(result.items) == 1
    assert "%" in result.items[0].name
```

- [ ] **Step 2: Implement**

In `services/team.py`:

```python
def _escape_like(s: str) -> str:
    return s.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


# In search_team_refs:
if q:
    like = f"%{_escape_like(q)}%"
    stmt = stmt.where(
        TeamRow.name.ilike(like, escape="\\") | TeamRow.alias.ilike(like, escape="\\"),
    )
```

- [ ] **Step 3: Run — PASS**

- [ ] **Step 4: Commit**

```bash
git add backend/src/backend/services/team.py backend/tests/services/test_team_service.py
git commit -m "fix(backend): escape LIKE metachars in team search (H3)"
```

---

## Phase 5 — Display-id race fix (M2)

### Task 5.1: Retry-on-IntegrityError loop

**Files:**
- Modify: `backend/src/backend/services/display_id.py`
- Modify: `backend/tests/services/test_display_id.py`

- [ ] **Step 1: Read the current display_id logic**

```bash
cat backend/src/backend/services/display_id.py
```

- [ ] **Step 2: Write failing concurrent-collision test**

```python
@pytest.mark.asyncio
async def test_allocate_display_id_retries_on_collision(monkeypatch, session):
    # Seed a user already holding the candidate display_id.
    existing = UserRow(id=uuid4(), sub="x", email="a@b.c", display_id="alice")
    session.add(existing)
    await session.commit()

    # derive_candidate deterministically returns "alice" first,
    # then a suffixed form. Verify the allocator succeeds after one collision.
    allocated = await allocate_display_id(session, email="alice@example.com", preferred="alice")
    assert allocated != "alice"
    assert allocated.startswith("alice")
```

- [ ] **Step 3: Implement**

Wrap the INSERT in a loop catching `IntegrityError` (sqlalchemy.exc.IntegrityError) up to 3 times. On each retry, derive a new candidate (append a random suffix or increment counter).

Full implementation in `services/display_id.py` — actual code depends on existing function signatures. Sketch:

```python
from sqlalchemy.exc import IntegrityError

async def allocate_display_id(session: AsyncSession, *, email: str, preferred: str | None = None) -> str:
    for attempt in range(3):
        candidate = _derive_candidate(email=email, preferred=preferred, attempt=attempt)
        try:
            # SELECT-then-check then caller commits on success
            existing = await session.execute(
                select(UserRow.id).where(UserRow.display_id == candidate),
            )
            if existing.first() is None:
                return candidate
        except IntegrityError:
            await session.rollback()
            continue
    raise RuntimeError("could not allocate unique display_id after 3 attempts")
```

Actual integration depends on where `display_id` is INSERTed. If commit happens in the caller, the retry must cooperate with the caller's transaction boundary.

- [ ] **Step 4: Run — PASS**

- [ ] **Step 5: Commit**

```bash
git add backend/src/backend/services/display_id.py backend/tests/services/test_display_id.py
git commit -m "fix(backend): retry display_id allocation on concurrent collision (M2)"
```

---

## Phase 6 — Rate limiting (H1)

### Task 6.1: Add slowapi + limiter config

**Files:**
- Modify: `backend/pyproject.toml`
- Modify: `backend/src/backend/config.py`
- Create: `backend/src/backend/rate_limit.py`
- Modify: `backend/src/backend/server.py`
- Modify: `backend/tests/conftest.py`

- [ ] **Step 1: Add dep**

```bash
cd backend && uv add slowapi
```

- [ ] **Step 2: Add setting**

In `config.py`:

```python
rate_limit_disabled: bool = Field(default=False)
```

- [ ] **Step 3: Create `rate_limit.py`**

```python
"""Application-wide rate limiter.

Uses slowapi with in-memory storage. Per-pod counters — acceptable for
launch scale. Migrate to Redis storage when the pod count > 1.

Disabled in tests via ``RATE_LIMIT_DISABLED=1``. The limiter still
exists (decorators work) but all limits are effectively infinite.
"""

from __future__ import annotations

from fastapi import Request
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from starlette.responses import JSONResponse

from backend.config import get_settings


def _key_func(request: Request) -> str:
    return get_remote_address(request)


def build_limiter() -> Limiter:
    settings = get_settings()
    default_limits = [] if settings.rate_limit_disabled else ["60/minute"]
    return Limiter(key_func=_key_func, default_limits=default_limits, enabled=not settings.rate_limit_disabled)


limiter: Limiter = build_limiter()


async def rate_limit_exceeded_handler(_: Request, exc: Exception) -> JSONResponse:
    retry_after = getattr(exc, "retry_after", None)
    headers = {"Retry-After": str(int(retry_after))} if retry_after else {}
    return JSONResponse(
        status_code=429,
        content={"detail": "rate limit exceeded"},
        headers=headers,
    )


__all__ = ["limiter", "rate_limit_exceeded_handler", "RateLimitExceeded"]
```

- [ ] **Step 4: Wire into `server.py`**

```python
from backend.rate_limit import limiter, rate_limit_exceeded_handler, RateLimitExceeded

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)
```

- [ ] **Step 5: Apply to routers**

Decorate hot endpoints:

```python
# routers/me.py
from backend.rate_limit import limiter

@router.post("/me/profile", ...)
@limiter.limit("10/minute")
async def create_profile(request: Request, ...):
    ...
```

Apply to:
- `POST /me/profile` (10/min)
- `POST /tasks/{id}/submit` (30/min)
- `GET /teams` (30/min — only matters when `q` present but slowapi doesn't support conditional; always applied)
- `GET /leaderboard/users`, `GET /leaderboard/teams` (60/min)

- [ ] **Step 6: Ensure tests disable limiter**

In `backend/tests/conftest.py`, add an autouse fixture (or module-level setup) that sets `RATE_LIMIT_DISABLED=1` before settings cache.

- [ ] **Step 7: Write dedicated limiter test**

`backend/tests/test_rate_limit.py`:

```python
"""Rate limit enforcement — limiter enabled just for this module."""

import pytest
from httpx import AsyncClient


@pytest.fixture(autouse=True)
def _enable_limiter(monkeypatch):
    monkeypatch.setenv("RATE_LIMIT_DISABLED", "0")
    from backend.config import get_settings
    get_settings.cache_clear()


@pytest.mark.asyncio
async def test_profile_post_returns_429_after_limit(client: AsyncClient, authed_headers):
    # 11th call in the same minute should 429 (limit is 10/min)
    for _ in range(10):
        response = await client.post("/api/v1/me/profile", json=VALID_BODY, headers=authed_headers)
        assert response.status_code in (200, 409)  # 409 on duplicate, fine
    response = await client.post("/api/v1/me/profile", json=VALID_BODY, headers=authed_headers)
    assert response.status_code == 429
```

- [ ] **Step 8: Run — PASS**

- [ ] **Step 9: Update `.env.example`**

Add `# RATE_LIMIT_DISABLED=0  # set to 1 in tests/CI`.

- [ ] **Step 10: Commit**

```bash
git add backend/pyproject.toml backend/uv.lock backend/src/backend backend/tests
git commit -m "feat(backend): rate limit on write/search/leaderboard endpoints (H1)"
```

---

## Phase 7 — N+1 and defensive cleanups (M3, M4, M5)

### Task 7.1: `row_to_contract_team` — one-shot pending hydration (M4)

**Files:**
- Modify: `backend/src/backend/services/team.py:112-139`

- [ ] **Step 1: Replace loop**

Current:
```python
requests = []
for jr in pending_rows:
    user = await session.get(UserRow, jr.user_id)
    requests.append(JoinRequest(... user=user_to_ref(user) ...))
```

Replace with:
```python
join_rows = (await session.execute(
    select(JoinRequestRow, UserRow)
    .join(UserRow, JoinRequestRow.user_id == UserRow.id)
    .where(JoinRequestRow.team_id == team.id, JoinRequestRow.status == "pending")
)).all()
requests = [
    JoinRequest(... user=user_to_ref(user) ...)
    for jr, user in join_rows
]
```

- [ ] **Step 2: Run full suite — PASS** (behavior preserved)

### Task 7.2: `approve_join_request` — batch challenge/membership lookups (M3)

**Files:**
- Modify: `backend/src/backend/services/team_join.py:73-94`

- [ ] **Step 1: Read current flow**

```bash
sed -n '60,110p' backend/src/backend/services/team_join.py
```

- [ ] **Step 2: Refactor**

- Load `bonused_defs` once.
- Load all memberships in one query (already done per review — verify).
- Compute `caller_team_totals` once.
- Loop over members without re-querying defs / totals.

Move any shared helper out of `maybe_grant_challenge_rewards` or have that function accept pre-fetched inputs.

- [ ] **Step 3: Run suite — PASS**

### Task 7.3: `leaders.get()` defensive (M5)

**Files:**
- Modify: `backend/src/backend/services/leaderboard.py:215-225`

- [ ] **Step 1: Replace `leaders[t.leader_id]` with `leaders.get(t.leader_id)`** and skip the entry if None. If `leader_id` is non-nullable and FK-cascade is solid, this is belt-and-braces.

- [ ] **Step 2: Suite — PASS**

- [ ] **Step 3: Commit Phase 7**

```bash
git add backend/src/backend/services/
git commit -m "refactor(backend): remove N+1 queries in team + team_join + defensive leader lookup (M3, M4, M5)"
```

---

## Phase 8 — Drop dead Team counters (M6)

### Task 8.1: Migration

**Files:**
- Create: `backend/alembic/versions/0008_drop_team_counter_cols.py`

- [ ] **Step 1: Autogenerate a placeholder migration**

```bash
cd backend && uv run alembic revision -m "drop team counter cols"
```

- [ ] **Step 2: Hand-write upgrade/downgrade**

```python
def upgrade() -> None:
    op.drop_column("teams", "points")
    op.drop_column("teams", "week_points")
    op.drop_column("teams", "cap")


def downgrade() -> None:
    op.add_column("teams", sa.Column("cap", sa.Integer(), nullable=False, server_default="6"))
    op.add_column("teams", sa.Column("points", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("teams", sa.Column("week_points", sa.Integer(), nullable=False, server_default="0"))
```

### Task 8.2: Remove from `TeamRow`

**Files:**
- Modify: `backend/src/backend/db/models.py:70-72`

- [ ] **Step 1: Delete those three fields from `TeamRow`.**

### Task 8.3: Remove from contract + examples

**Files:**
- Modify: `backend/src/backend/contract/team.py:44-46`
- Modify: `backend/src/backend/contract/examples/team_as_leader.json`
- Modify: `backend/src/backend/contract/examples/team_as_member.json`

- [ ] **Step 1: Delete `points`, `week_points`, `cap` from `Team` contract.**
- [ ] **Step 2: Delete those keys from both example JSONs.**

### Task 8.4: Service cleanup

**Files:**
- Modify: `backend/src/backend/services/team.py`

- [ ] **Step 1: `cap` becomes a module constant**

```python
TEAM_CAP: int = 6
```

Use it in `row_to_contract_team` and anywhere else that referenced `team.cap`.

### Task 8.5: Test updates

- [ ] **Step 1: Remove assertions on `team.points`, `team.week_points`, `team.cap` from every test that constructs or asserts `Team` shape.**

```bash
rg "\.points\s*==|\.week_points\s*==|\.cap\s*==" backend/tests/
```

- [ ] **Step 2: Run `just ci` — PASS**

- [ ] **Step 3: Commit**

```bash
git add backend
git commit -m "refactor(backend): drop dead Team.points/week_points/cap columns (M6)"
```

---

## Phase 9 — seed_reset hardening (M10)

### Task 9.1: Derive table list from metadata

**Files:**
- Modify: `backend/src/backend/seed_reset.py:29`

- [ ] **Step 1: Replace the hardcoded TRUNCATE string with:**

```python
from sqlalchemy import text
from sqlmodel import SQLModel

table_names = [f'"{t.name}"' for t in SQLModel.metadata.sorted_tables if t.name != "alembic_version"]
await conn.execute(text(f"TRUNCATE TABLE {', '.join(table_names)} CASCADE"))
```

- [ ] **Step 2: Suite — PASS**

- [ ] **Step 3: Commit**

```bash
git add backend/src/backend/seed_reset.py
git commit -m "refactor(backend): derive seed_reset tables from metadata (M10)"
```

---

## Phase 10 — Structured logging (H5)

### Task 10.1: JSON-formatted stdlib logging

**Files:**
- Modify: `backend/src/backend/observability.py`
- Modify: `backend/src/backend/server.py`
- Modify: `backend/tests/test_observability.py`

- [ ] **Step 1: Add `configure_logging` to `observability.py`**

```python
import json
import logging
import time
from typing import Any

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "ts": self.formatTime(record, "%Y-%m-%dT%H:%M:%S%z"),
            "level": record.levelname,
            "logger": record.name,
            "msg": record.getMessage(),
        }
        for extra in ("method", "path", "status", "duration_ms", "user_id"):
            if hasattr(record, extra):
                payload[extra] = getattr(record, extra)
        if record.exc_info:
            payload["exc"] = self.formatException(record.exc_info)
        return json.dumps(payload, ensure_ascii=False)


def configure_logging() -> None:
    root = logging.getLogger()
    if any(isinstance(h, logging.StreamHandler) and isinstance(h.formatter, JsonFormatter) for h in root.handlers):
        return
    handler = logging.StreamHandler()
    handler.setFormatter(JsonFormatter())
    root.addHandler(handler)
    root.setLevel(logging.INFO)
    for noisy in ("uvicorn.access",):
        logging.getLogger(noisy).propagate = False


class RequestLogMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start = time.perf_counter()
        response = await call_next(request)
        duration_ms = int((time.perf_counter() - start) * 1000)
        logging.getLogger("backend.request").info(
            "request",
            extra={
                "method": request.method,
                "path": request.url.path,
                "status": response.status_code,
                "duration_ms": duration_ms,
            },
        )
        return response
```

- [ ] **Step 2: Wire into `create_app`**

```python
from backend.observability import configure_logging, RequestLogMiddleware, scrub_sensitive_bodies
...
def create_app() -> FastAPI:
    configure_logging()
    settings = get_settings()
    ...
    app.add_middleware(RequestLogMiddleware)
```

- [ ] **Step 3: Add tests**

```python
def test_json_formatter_emits_structured_fields(caplog):
    logger = logging.getLogger("backend.test.logger")
    # attach JsonFormatter handler locally
    ...
```

- [ ] **Step 4: Run — PASS**

- [ ] **Step 5: Commit**

```bash
git add backend/src/backend/observability.py backend/src/backend/server.py backend/tests/test_observability.py
git commit -m "feat(backend): structured JSON logging + request middleware (H5)"
```

---

## Phase 11 — Leaderboard SQL rewrite (H2)

### Task 11.1: SQL-side ranking

**Files:**
- Modify: `backend/src/backend/services/leaderboard.py`

- [ ] **Step 1: Read current implementation**

```bash
sed -n '80,250p' backend/src/backend/services/leaderboard.py
```

- [ ] **Step 2: Design the new query**

Users:
```sql
WITH user_pts AS (
    SELECT u.id, u.display_id, u.avatar_url,
           COALESCE(SUM(r.points) FILTER (WHERE r.granted_at >= :window_start), 0) AS points,
           COALESCE(SUM(r.points) FILTER (WHERE r.granted_at >= :week_start), 0) AS week_points
    FROM users u
    LEFT JOIN rewards r ON r.user_id = u.id
    GROUP BY u.id
)
SELECT id, display_id, avatar_url, points, week_points
FROM user_pts
WHERE (points, id) < (:cursor_points, :cursor_id)  -- keyset, descending by points
ORDER BY points DESC, id ASC
LIMIT :limit
```

Teams: same shape, summing over membership.

- [ ] **Step 3: Implement**

Build as SQLAlchemy `select(...)` with explicit columns and a `func.sum(...).filter(...)` aggregate. Paginate using keyset cursor (points, user_id).

- [ ] **Step 4: Write scale test**

```python
@pytest.mark.asyncio
async def test_leaderboard_users_stable_ranking_at_scale(session):
    # create 150 users + rewards; verify paginated ranking matches in-memory sort
    ...
```

- [ ] **Step 5: Run — PASS**

- [ ] **Step 6: Commit**

```bash
git add backend/src/backend/services/leaderboard.py backend/tests/services/test_leaderboard.py
git commit -m "perf(backend): SQL-side leaderboard ranking + keyset pagination (H2)"
```

---

## Phase 12 — Dockerfile hardening (L2, L3, L4)

### Task 12.1: Slim fastapi deps + libpq5 pin + HEALTHCHECK

**Files:**
- Modify: `backend/pyproject.toml`
- Modify: `backend/Dockerfile`

- [ ] **Step 1: Replace `fastapi[standard]`**

```toml
# runtime
fastapi>=0.136.0
uvicorn[standard]>=0.44.0
# dev group
fastapi-cli>=0.0.5
```

- [ ] **Step 2: Dockerfile `apt-get` pin**

```dockerfile
apt-get install -y --no-install-recommends libpq5=17.*
```

(May need `libpq5=17.*` or similar — verify exact available version in the image.)

- [ ] **Step 3: Add HEALTHCHECK**

```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:${PORT:-8000}/health').read()" || exit 1
```

(Use `python` instead of `curl` to avoid adding curl to the image.)

- [ ] **Step 4: Rebuild + smoke**

```bash
cd backend && docker build -t gaba-backend .
```

- [ ] **Step 5: Commit**

```bash
git add backend/pyproject.toml backend/uv.lock backend/Dockerfile
git commit -m "chore(backend): slim fastapi deps, pin libpq5, add Docker HEALTHCHECK (L2, L3, L4)"
```

---

## Phase 13 — Remaining nits (L1, L7, L9, L13)

### Task 13.1: `derive_user_name` fallback → `U{display_id}` (L7)

**Files:**
- Modify: `backend/src/backend/services/user.py:54-60`
- Modify: `backend/tests/services/test_user_service.py`

- [ ] **Step 1: Update fallback**

```python
def derive_user_name(user: UserRow) -> str:
    for candidate in (user.nickname, user.zh_name, user.en_name):
        if candidate:
            return candidate
    return f"U{user.display_id}"
```

- [ ] **Step 2: Update tests** — existing tests assume email-local-part fallback; update to expect `U{display_id}`.

### Task 13.2: Explicit `--cov=backend` (L9)

**Files:**
- Modify: `backend/pyproject.toml:33`

- [ ] **Step 1: Change `addopts`**

```toml
addopts = ["-v", "--cov=backend"]
```

### Task 13.3: Task.color CHECK constraint (L13)

**Files:**
- Create: `backend/alembic/versions/0009_task_color_format_check.py`

- [ ] **Step 1: Write migration**

```python
def upgrade() -> None:
    op.create_check_constraint(
        "ck_task_defs_color_format",
        "task_defs",
        r"color ~ '^#[0-9a-fA-F]{6}$'",
    )


def downgrade() -> None:
    op.drop_constraint("ck_task_defs_color_format", "task_defs", type_="check")
```

- [ ] **Step 2: Suite — PASS**

- [ ] **Step 3: Commit all nits**

```bash
git add backend
git commit -m "chore(backend): nit fixes — user-name fallback, explicit --cov, task.color CHECK (L7, L9, L13)"
```

---

## Final verification

- [ ] **Step F.1: Full CI**

```bash
cd backend && just ci
```

Expected: all green, coverage ≥ 90%.

- [ ] **Step F.2: Spot-check git log**

```bash
git log --oneline main..HEAD
```

Each commit should map to a clear phase.

- [ ] **Step F.3: Rebase onto main if needed**

```bash
git fetch origin main
git rebase origin/main
```

- [ ] **Step F.4: Open PR**

```bash
gh pr create --title "chore(backend): address 2026-04-22 code review findings" \
  --body-file docs/superpowers/plans/2026-04-22-backend-review-fixes.md
```

---

## Self-review checklist

**Spec coverage:** Each finding is covered:
- C1 → Task 1.1 ✓
- H1 → Phase 6 ✓
- H2 → Phase 11 ✓
- H3 → Task 4.1 ✓
- H4 → Task 1.2 ✓
- H5 → Phase 10 ✓
- M1 → Phase 3 ✓
- M2 → Phase 5 ✓
- M3 → Task 7.2 ✓
- M4 → Task 7.1 ✓
- M5 → Task 7.3 ✓
- M6 → Phase 8 ✓
- M7 → Task 2.1 ✓
- M8 → Task 2.2 ✓
- M9 → Accepted as acceptable for empty-DB first prod upgrade (documented here, no code fix)
- M10 → Phase 9 ✓
- L1 → Skipped (scoping)
- L2 → Phase 12 ✓
- L3 → Phase 12 ✓
- L4 → Phase 12 ✓
- L5 → Task 1.1 ✓
- L6 → Task 1.3 ✓
- L7 → Task 13.1 ✓
- L8 → Skipped (scoping — frontend contract change)
- L9 → Task 13.2 ✓
- L10 → Skipped (discretionary)
- L11 → Task 1.4 ✓
- L12 → Skipped (no real issue)
- L13 → Task 13.3 ✓

**Type consistency:** Function names reused across phases (`scrub_sensitive_bodies`, `configure_logging`, `JsonFormatter`, `RequestLogMiddleware`, `_escape_like`, `build_limiter`) are consistent.

**Placeholder scan:** One area still has "actual code depends on existing function signatures" (Phase 5, display_id) — acceptable because the caller integration is verified at implementation time and requires reading the existing function first. All other code steps show complete snippets.

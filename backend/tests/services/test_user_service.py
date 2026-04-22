"""Tests for backend.services.user."""

from datetime import UTC, datetime
from uuid import UUID

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from backend.db.models import UserRow
from backend.services.user import (
    derive_user_name,
    row_to_contract_user,
    upsert_user_by_supabase_identity,
)


@pytest.mark.asyncio
async def test_upsert_creates_new_row_with_supabase_id(session: AsyncSession) -> None:
    auth_id = UUID(int=1001)
    row = await upsert_user_by_supabase_identity(
        session,
        auth_user_id=auth_id,
        email="jet@example.com",
    )
    assert row.id == auth_id
    assert row.email == "jet@example.com"
    assert row.display_id.startswith("UJET")
    assert row.profile_complete is False


@pytest.mark.asyncio
async def test_upsert_is_idempotent_on_same_auth_id(session: AsyncSession) -> None:
    auth_id = UUID(int=1002)
    r1 = await upsert_user_by_supabase_identity(
        session,
        auth_user_id=auth_id,
        email="jet@example.com",
    )
    await session.commit()
    r2 = await upsert_user_by_supabase_identity(
        session,
        auth_user_id=auth_id,
        email="jet@example.com",
    )
    assert r1.id == r2.id
    assert r1.display_id == r2.display_id


@pytest.mark.asyncio
async def test_upsert_reuses_existing_row_on_auth_id_match(
    session: AsyncSession,
) -> None:
    """If a row with this UUID already exists (e.g., seeded), reuse it rather than create a collision."""
    auth_id = UUID(int=1003)
    session.add(UserRow(id=auth_id, display_id="SEED1", email="seeded@example.com"))
    await session.commit()

    row = await upsert_user_by_supabase_identity(
        session,
        auth_user_id=auth_id,
        email="seeded@example.com",
    )
    assert row.id == auth_id
    assert row.display_id == "SEED1"


def test_derive_user_name_falls_back_to_display_id() -> None:
    """When zh_name and nickname are both empty, fall back to the opaque
    display_id rather than the email local-part — the latter leaked
    user identity to teammates via UserRef.name.
    """
    row = UserRow(id=UUID(int=1), display_id="UJETKAN", email="jet.kan@example.com")
    assert derive_user_name(row) == "UJETKAN"


def test_derive_user_name_prefers_zh_name() -> None:
    row = UserRow(
        id=UUID(int=1),
        display_id="X",
        email="x@example.com",
        zh_name="金杰",
        nickname="Jet",
    )
    assert derive_user_name(row) == "金杰"


def test_row_to_contract_user_maps_every_field() -> None:
    row = UserRow(
        id=UUID(int=1),
        display_id="UJET1",
        email="jet@example.com",
        zh_name="金杰",
        profile_complete=True,
        created_at=datetime(2026, 4, 21, tzinfo=UTC),
    )
    contract = row_to_contract_user(row)
    assert contract.id == row.id
    assert contract.display_id == "UJET1"
    assert contract.zh_name == "金杰"
    assert contract.name == "金杰"
    assert contract.profile_complete is True


def test_row_to_contract_user_maps_every_contract_field() -> None:
    """Drift guard: every non-derived ContractUser field must come from a UserRow column."""
    from backend.contract import User as ContractUser

    contract_fields = set(ContractUser.model_fields) - {"name"}
    row_fields = set(UserRow.model_fields)
    missing = contract_fields - row_fields
    assert not missing, f"Contract fields not in UserRow: {missing}"


@pytest.mark.asyncio
async def test_upsert_retries_on_display_id_collision(
    session: AsyncSession,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Two concurrent first-sign-ins can pick the same display_id.

    If the loser hits the unique constraint, ``upsert_user_by_supabase_identity``
    rolls the savepoint back, re-generates a fresh candidate, and retries
    instead of propagating the IntegrityError.
    """
    # Pre-seed a user holding "UJET" so the first candidate our mock
    # returns will collide on the display_id unique constraint.
    session.add(UserRow(id=UUID(int=9001), display_id="UJET", email="already@taken.com"))
    await session.commit()

    from backend.services import user as user_mod

    attempts: list[str] = []

    async def _mock_generate(_session: AsyncSession, *, email: str) -> str:
        attempts.append(email)
        # First call picks the already-taken id; retry picks a fresh one.
        return "UJET" if len(attempts) == 1 else "UJET42"

    monkeypatch.setattr(user_mod, "generate_user_display_id", _mock_generate)

    new_user = await user_mod.upsert_user_by_supabase_identity(
        session,
        auth_user_id=UUID(int=9002),
        email="jet@newhost.com",
    )
    await session.commit()

    assert new_user.display_id == "UJET42"
    assert len(attempts) == 2, "must retry exactly once"


@pytest.mark.asyncio
async def test_upsert_returns_existing_row_on_pk_race(
    session: AsyncSession,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """When the savepoint flush raises IntegrityError because another
    session committed the same ``sub`` first, the upsert re-fetches by
    PK and returns the winner without retrying.

    Specifically exercises ``except IntegrityError -> session.get(...) ->
    return winner`` — not the early-return-if-exists path, not the
    retry-on-display-id path. We stage ``session.get`` to miss on the
    pre-check (simulating "winner not visible yet") then succeed on the
    error handler lookup, and force ``session.flush`` to raise.
    """
    auth_id = UUID(int=9100)
    winning_row = UserRow(id=auth_id, display_id="UWINNER", email="winner@x.com")

    from sqlalchemy.exc import IntegrityError

    from backend.services import user as user_mod

    async def _mock_generate(*_a: object, **_k: object) -> str:
        return "UMINE"

    monkeypatch.setattr(user_mod, "generate_user_display_id", _mock_generate)

    get_calls = 0

    async def _staged_get(*_a: object, **_k: object) -> UserRow | None:
        nonlocal get_calls
        get_calls += 1
        # First call is the pre-check; pretend the winner isn't visible
        # yet so the function falls through to the insert path. Second
        # call is the error-handler fetch after the flush race.
        return None if get_calls == 1 else winning_row

    monkeypatch.setattr(session, "get", _staged_get)

    async def _raise_integrity(*_a: object, **_k: object) -> None:
        raise IntegrityError("INSERT ...", params=None, orig=Exception("pk collision"))

    monkeypatch.setattr(session, "flush", _raise_integrity)

    result = await user_mod.upsert_user_by_supabase_identity(
        session,
        auth_user_id=auth_id,
        email="winner@x.com",
    )
    assert result is winning_row
    assert get_calls == 2, "pre-check + error-handler fetch"


@pytest.mark.asyncio
async def test_upsert_gives_up_after_repeated_failures(
    session: AsyncSession,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """A persistent unique-constraint failure (e.g., stale-email/new-sub)
    must propagate as IntegrityError after the retry budget is exhausted.
    """
    session.add(UserRow(id=UUID(int=9200), display_id="UTAKEN", email="taken@x.com"))
    await session.commit()

    from backend.services import user as user_mod

    async def _always_collide(_session: AsyncSession, *, email: str) -> str:
        return "UTAKEN"  # always picks the already-taken id

    monkeypatch.setattr(user_mod, "generate_user_display_id", _always_collide)

    from sqlalchemy.exc import IntegrityError

    with pytest.raises(IntegrityError):
        await user_mod.upsert_user_by_supabase_identity(
            session,
            auth_user_id=UUID(int=9201),
            email="newbie@x.com",
        )

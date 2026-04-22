"""Reward service: list + creation on task completion."""

from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from backend.contract import Reward as ContractReward
from backend.db.models import RewardRow, TaskDefRow, UserRow
from backend.services.team import caller_team_totals


async def create_reward_if_bonus(session: AsyncSession, *, user: UserRow, task_def: TaskDefRow) -> RewardRow | None:
    if task_def.bonus is None:
        return None
    row = RewardRow(
        user_id=user.id,
        task_def_id=task_def.id,
        task_title=task_def.title,
        bonus=task_def.bonus,
        status="earned",
    )
    session.add(row)
    await session.flush()
    return row


def row_to_contract_reward(row: RewardRow) -> ContractReward:
    return ContractReward(
        id=row.id,
        user_id=row.user_id,
        task_id=row.task_def_id,
        task_title=row.task_title,
        bonus=row.bonus,
        status=row.status,
        earned_at=row.earned_at,
        claimed_at=row.claimed_at,
    )


async def maybe_grant_challenge_rewards(
    session: AsyncSession,
    *,
    users: Sequence[UserRow],
) -> None:
    """Create ``RewardRow``s for any bonused challenge ``TaskDef`` each
    user in ``users`` now meets cap for. Idempotent. No-op when no
    bonused challenges exist or a user has no team (total == 0).

    Takes a sequence so the bonused-challenge set is fetched once per
    call regardless of how many users are evaluated — the
    approve-join-request flow grants for leader + every member after
    one approval, and this avoids re-querying the defs per user.

    Concurrency: ``ON CONFLICT DO NOTHING`` against
    ``uq_reward_user_task`` keeps this safe under two simultaneous
    approve calls that both cross the cap.
    """
    challenge_defs = (
        (
            await session.execute(
                select(TaskDefRow).where(TaskDefRow.is_challenge.is_(True)).where(TaskDefRow.bonus.is_not(None)),
            )
        )
        .scalars()
        .all()
    )
    if not challenge_defs:
        return

    for user in users:
        led_total, joined_total = await caller_team_totals(session, user)
        total = max(led_total, joined_total)
        for td in challenge_defs:
            cap, bonus = td.cap, td.bonus
            # bonus is non-None by the query filter; cap is non-None for
            # any bonused challenge by convention (see row_to_contract_task).
            # Re-checked so this is safe if those invariants ever slip.
            if cap is None or bonus is None or total < cap:
                continue
            stmt = (
                pg_insert(RewardRow)
                .values(
                    user_id=user.id,
                    task_def_id=td.id,
                    task_title=td.title,
                    bonus=bonus,
                    status="earned",
                )
                .on_conflict_do_nothing(constraint="uq_reward_user_task")
            )
            await session.execute(stmt)
    await session.flush()


async def list_rewards_for(session: AsyncSession, user: UserRow) -> list[ContractReward]:
    rows = (
        (
            await session.execute(
                select(RewardRow).where(RewardRow.user_id == user.id).order_by(RewardRow.earned_at.desc()),
            )
        )
        .scalars()
        .all()
    )
    return [row_to_contract_reward(r) for r in rows]

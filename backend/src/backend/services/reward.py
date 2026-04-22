"""Reward service: list + creation on task completion."""

from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from backend.contract import Reward as ContractReward
from backend.db.models import RewardRow, TaskDefRow, UserRow


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
    team_total: int,
) -> None:
    """Create ``RewardRow``s for any bonused challenge ``TaskDef`` each
    user in ``users`` now meets cap for. Idempotent. No-op when
    ``team_total == 0`` or no bonused challenges exist.

    ``team_total`` is the shared head count across ``users`` — callers
    within a single team context (approve_join_request) pass the team
    size once instead of re-deriving it per user.

    Concurrency: ``ON CONFLICT DO NOTHING`` against
    ``uq_reward_user_task`` keeps this safe under two simultaneous
    approve calls that both cross the cap.
    """
    if team_total == 0:
        return
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
        for td in challenge_defs:
            cap = td.cap
            bonus = td.bonus
            if cap is None or bonus is None or team_total < cap:
                continue
            await session.execute(
                pg_insert(RewardRow)
                .values(
                    user_id=user.id,
                    task_def_id=td.id,
                    task_title=td.title,
                    bonus=bonus,
                    status="earned",
                )
                .on_conflict_do_nothing(constraint="uq_reward_user_task"),
            )
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

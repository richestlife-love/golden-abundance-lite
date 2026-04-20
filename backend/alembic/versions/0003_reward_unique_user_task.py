"""reward unique (user_id, task_def_id)

Revision ID: 0003
Revises: 0002
Create Date: 2026-04-20 10:00:00.000000

Closes the concurrent double-award race in maybe_grant_challenge_rewards
by making the (user_id, task_def_id) pair unique at the DB level. The
application-level "existing reward?" check remains as a fast path; the
constraint is the backstop when two concurrent approve-join-request
calls cross the challenge cap simultaneously.
"""

from collections.abc import Sequence

from alembic import op

revision: str = "0003"
down_revision: str | None = "0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_unique_constraint("uq_reward_user_task", "rewards", ["user_id", "task_def_id"])


def downgrade() -> None:
    op.drop_constraint("uq_reward_user_task", "rewards", type_="unique")

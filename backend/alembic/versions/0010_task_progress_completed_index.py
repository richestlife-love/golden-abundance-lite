"""Partial index on task_progress for leaderboard aggregation.

Revision ID: 0010
Revises: 0009
Create Date: 2026-04-22 15:00:00.000000

The leaderboard reads ``task_progress`` with the filter
``status = 'completed' AND completed_at >= :window_start`` grouped by
``user_id``. Without a supporting index Postgres falls back to a
sequential scan, which scales badly once the table grows.

A partial index keyed on ``(user_id, completed_at DESC)`` and
predicate-restricted to ``status = 'completed'`` satisfies both the
filter and the per-user aggregation — the planner can stream rows in
user/time order without touching non-completed rows at all.
"""

from collections.abc import Sequence

from alembic import op

revision: str = "0010"
down_revision: str | None = "0009"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_index(
        "ix_task_progress_completed_user_time",
        "task_progress",
        ["user_id", "completed_at"],
        postgresql_where="status = 'completed'",
        postgresql_ops={"completed_at": "DESC"},
    )


def downgrade() -> None:
    op.drop_index("ix_task_progress_completed_user_time", table_name="task_progress")

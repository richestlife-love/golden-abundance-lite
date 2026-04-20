"""partial unique index on pending join_requests

Revision ID: c001
Revises: b07d97980abc
Create Date: 2026-04-20 11:00:00.000000

Closes the concurrent-pending-request race in
``services.team_join.create_join_request``. The service's at-most-one-
pending check still runs as a fast path; this partial unique index is
the backstop when two simultaneous join-request calls from the same
user cross the guard. Mirrors the shape of ``uq_reward_user_task``.

Autogenerate doesn't emit partial indexes (no ``postgresql_where``
comparison in ``compare_type``), so this migration is hand-written.
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "c001"
down_revision: str | None = "b07d97980abc"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_index(
        "uq_join_requests_one_pending_per_user",
        "join_requests",
        ["user_id"],
        unique=True,
        postgresql_where=sa.text("status = 'pending'"),
    )


def downgrade() -> None:
    op.drop_index("uq_join_requests_one_pending_per_user", table_name="join_requests")

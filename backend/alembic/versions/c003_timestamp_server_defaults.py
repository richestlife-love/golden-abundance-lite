"""server-side defaults for timestamp columns

Revision ID: c003
Revises: c002
Create Date: 2026-04-20 11:02:00.000000

Every timestamp column previously relied on the SQLAlchemy Python-side
``default=_utcnow`` callable, which only fires when the row is built
through the ORM. Raw ``INSERT`` via psql / seed-reset / future
denormalisation jobs would fail on NOT NULL — the ``server_default``
fills in ``now()`` so those paths work without having to list every
timestamp column explicitly.
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "c003"
down_revision: str | None = "c002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


_COLUMNS: list[tuple[str, str]] = [
    ("users", "created_at"),
    ("teams", "created_at"),
    ("team_memberships", "joined_at"),
    ("join_requests", "requested_at"),
    ("task_defs", "created_at"),
    ("task_progress", "updated_at"),
    ("rewards", "earned_at"),
    ("news_items", "published_at"),
]


def upgrade() -> None:
    for table, column in _COLUMNS:
        op.alter_column(table, column, server_default=sa.text("now()"))


def downgrade() -> None:
    for table, column in reversed(_COLUMNS):
        op.alter_column(table, column, server_default=None)

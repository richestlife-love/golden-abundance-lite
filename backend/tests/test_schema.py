"""Schema-drift regression tests — ensure Alembic migration output matches models.

Phase 5a uses SQLAlchemy `String(16)` (not PG enums) for all `Literal[...]`
fields. A future `alembic revision --autogenerate` must preserve this to avoid
breaking migrations that try to alter a VARCHAR into a PG enum in-place.
"""

from __future__ import annotations

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine
from sqlmodel import SQLModel


async def test_migration_produces_every_model_table(engine: AsyncEngine) -> None:
    expected = {t.name for t in SQLModel.metadata.sorted_tables}
    async with engine.connect() as c:
        rows = await c.execute(text("SELECT tablename FROM pg_tables WHERE schemaname='public'"))
        actual = {r[0] for r in rows}
    missing = expected - actual
    assert not missing, f"Migration missing tables: {missing}"


async def test_literal_columns_persist_as_varchar_16(engine: AsyncEngine) -> None:
    """Guard against a future autogenerate emitting `sa.Enum` for Literal fields."""
    async with engine.connect() as c:
        rows = (
            await c.execute(
                text(
                    """
            SELECT table_name, column_name, data_type, character_maximum_length
            FROM information_schema.columns
            WHERE table_schema='public'
              AND column_name IN ('status', 'tag', 'form_type', 'category')
            ORDER BY table_name, column_name
            """
                )
            )
        ).all()
    assert rows, "Expected at least one Literal-backed column"
    for tbl, col, dtype, maxlen in rows:  # ty: ignore
        assert dtype == "character varying", f"{tbl}.{col} is {dtype}, want varchar"
        assert maxlen == 16, f"{tbl}.{col} maxlen={maxlen}, want 16"


def test_migration_is_downgrade_safe() -> None:
    """`upgrade head → downgrade base → upgrade head` must round-trip cleanly.

    Catches asymmetric migrations where a column/table was added to `upgrade()`
    but the corresponding `drop` was forgotten in `downgrade()`. Runs in an
    isolated short-lived container so it can't disturb the session-scoped
    fixture that other tests share.
    """
    import os
    from alembic import command
    from alembic.config import Config
    from testcontainers.postgres import PostgresContainer

    alembic_ini = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "alembic.ini"))
    with PostgresContainer("postgres:17-alpine") as pg:
        cfg = Config(alembic_ini)
        cfg.set_main_option("sqlalchemy.url", pg.get_connection_url())
        command.upgrade(cfg, "head")
        command.downgrade(cfg, "base")
        command.upgrade(cfg, "head")

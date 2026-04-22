"""Truncate seed-owned tables so the next `just seed` re-creates them.
Refuses to run in production.

The table list is derived from ``SQLModel.metadata.sorted_tables`` at
runtime — adding a new model automatically includes it in the reset,
so this recipe can't drift against the schema (M10).

This is intentionally a hard reset: a partial reset (e.g. only
DEMO_USERS) would leave dangling teams from prior runs and isn't worth
the complexity for a dev-only recipe.
"""

import asyncio

from sqlalchemy import text
from sqlmodel import SQLModel

from backend.config import get_settings
from backend.db import models as _models  # noqa: F401 — populates SQLModel.metadata
from backend.db.engine import get_engine

# Alembic's own bookkeeping table must not be truncated — dropping the
# migration version would force a fresh ``alembic upgrade`` on next boot.
_RESERVED_TABLES = frozenset({"alembic_version"})


async def run() -> None:
    settings = get_settings()
    if settings.app_env == "prod":
        raise SystemExit("seed-reset refused: APP_ENV=prod")
    table_names = [t.name for t in SQLModel.metadata.sorted_tables if t.name not in _RESERVED_TABLES]
    if not table_names:
        print("seed-reset: no tables to truncate")
        return
    quoted = ", ".join(f'"{name}"' for name in table_names)
    engine = get_engine()
    async with engine.begin() as conn:
        await conn.execute(text(f"TRUNCATE TABLE {quoted} CASCADE"))
    print("seed-reset: done")


if __name__ == "__main__":  # pragma: no cover
    asyncio.run(run())

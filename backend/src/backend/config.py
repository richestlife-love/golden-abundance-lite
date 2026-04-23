"""Runtime settings loaded from environment variables.

`Settings` is a pydantic-settings model; `get_settings()` returns a
process-wide cached instance so FastAPI deps can depend on it without
re-reading the environment on every call.

Boot safety: ``get_settings()`` refuses to return a production-env
instance missing ``SUPABASE_URL`` — a deploy that forgets to set it
fails fast at app import rather than silently accepting unverified
tokens.
"""

import logging
from functools import cached_property, lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine.url import make_url

logger = logging.getLogger(__name__)

_LOCAL_DB_HOSTS = frozenset({"localhost", "127.0.0.1", "::1", "postgres", "db"})


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        enable_decoding=False,
        env_ignore_empty=True,
    )

    database_url: str = Field(
        default="postgresql+psycopg://app:app@localhost:5432/app",
        description="SQLAlchemy URL (psycopg3 driver) used by the app at runtime.",
    )
    migration_database_url: str | None = Field(
        default=None,
        description=(
            "Optional SQLAlchemy URL used only by Alembic. When set, migrations "
            "connect with this URL instead of `database_url` — useful when the "
            "runtime role is restricted (e.g. Supabase: `postgres` for migrations, "
            "`app_runtime` for the app). Falls back to `database_url` when unset."
        ),
    )
    supabase_url: str | None = Field(
        default=None,
        description="Supabase project base URL, e.g. https://<ref>.supabase.co. Required when APP_ENV=prod.",
    )
    supabase_jwt_aud: str = Field(default="authenticated")
    app_env: Literal["dev", "test", "prod"] = "dev"
    sentry_dsn: str | None = Field(default=None)
    app_release: str | None = Field(default=None)
    rate_limit_disabled: bool = Field(
        default=False,
        description="Set to True in tests / CI to skip slowapi limits.",
    )

    @cached_property
    def supabase_issuer(self) -> str:
        if self.supabase_url is None:
            raise RuntimeError("SUPABASE_URL is not configured")
        return f"{self.supabase_url.rstrip('/')}/auth/v1"

    @cached_property
    def supabase_jwks_url(self) -> str:
        return f"{self.supabase_issuer}/.well-known/jwks.json"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    settings = Settings()
    if settings.app_env == "prod" and settings.supabase_url is None:
        raise RuntimeError("SUPABASE_URL must be set when APP_ENV=prod")
    if settings.app_env != "prod":
        # Belt-and-suspenders so a local dev run can't accidentally point at a
        # remote DB (e.g. prod creds copied into .env while debugging). Escape
        # hatch is explicit: set APP_ENV=prod.
        host = make_url(settings.database_url).host or ""
        if host not in _LOCAL_DB_HOSTS:
            raise RuntimeError(
                f"DATABASE_URL host '{host}' is not local — refusing to start "
                f"with APP_ENV={settings.app_env}. Set APP_ENV=prod if intentional."
            )
    if settings.app_env == "dev" and settings.supabase_url is None:
        logger.warning(
            "SUPABASE_URL not set — authed endpoints will fail. "
            "Set it in backend/.env to use the frontend sign-in flow."
        )
    return settings

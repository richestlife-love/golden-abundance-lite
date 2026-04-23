"""Settings env parsing + prod-env guard."""

import pathlib
from unittest.mock import patch

import pytest

from backend.config import get_settings


def test_settings_requires_supabase_url_in_prod(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: pathlib.Path,
) -> None:
    # chdir to a temp dir so pydantic-settings doesn't pick up backend/.env
    # (which may have a real SUPABASE_URL on a developer's machine).
    monkeypatch.chdir(tmp_path)
    monkeypatch.setenv("APP_ENV", "prod")
    monkeypatch.delenv("SUPABASE_URL", raising=False)
    get_settings.cache_clear()
    with pytest.raises(RuntimeError, match="SUPABASE_URL"):
        get_settings()


def test_settings_derives_jwks_url_from_supabase_url(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("SUPABASE_URL", "https://abc.supabase.co")
    get_settings.cache_clear()
    settings = get_settings()
    assert settings.supabase_jwks_url == "https://abc.supabase.co/auth/v1/.well-known/jwks.json"
    assert settings.supabase_issuer == "https://abc.supabase.co/auth/v1"
    assert settings.supabase_jwt_aud == "authenticated"


def test_settings_accepts_app_env_test(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("APP_ENV", "test")
    get_settings.cache_clear()
    assert get_settings().app_env == "test"


def test_settings_refuses_non_local_database_url_outside_prod(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("APP_ENV", "dev")
    monkeypatch.setenv(
        "DATABASE_URL",
        "postgresql+psycopg://app:app@db.abc.supabase.co:5432/postgres",
    )
    get_settings.cache_clear()
    with pytest.raises(RuntimeError, match="is not local"):
        get_settings()


def test_settings_allows_non_local_database_url_in_prod(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("APP_ENV", "prod")
    monkeypatch.setenv("SUPABASE_URL", "https://abc.supabase.co")
    monkeypatch.setenv(
        "DATABASE_URL",
        "postgresql+psycopg://app:app@db.abc.supabase.co:5432/postgres",
    )
    get_settings.cache_clear()
    assert get_settings().database_url.startswith("postgresql+psycopg://")


def test_settings_warns_when_dev_supabase_url_unset(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: pathlib.Path,
) -> None:
    # Patch the logger directly rather than caplog: ``configure_logging``
    # (called by other test fixtures) installs a root StreamHandler that
    # races with caplog's capture in the full-suite run. chdir escapes
    # any developer-local backend/.env with a real SUPABASE_URL.
    monkeypatch.chdir(tmp_path)
    monkeypatch.setenv("APP_ENV", "dev")
    monkeypatch.delenv("SUPABASE_URL", raising=False)
    get_settings.cache_clear()
    with patch("backend.config.logger.warning") as mock_warn:
        get_settings()
    assert any("SUPABASE_URL not set" in str(call.args[0]) for call in mock_warn.call_args_list)

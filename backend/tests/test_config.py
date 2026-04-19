"""Tests for backend.config — the `Settings` class and its safeguards."""

from __future__ import annotations

import pytest

from backend.config import _DEV_JWT_SECRET, Settings, get_settings


def test_prod_with_default_secret_refuses_to_load(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("APP_ENV", "prod")
    monkeypatch.setenv("JWT_SECRET", _DEV_JWT_SECRET)
    get_settings.cache_clear()
    with pytest.raises(RuntimeError, match="JWT_SECRET"):
        get_settings()
    get_settings.cache_clear()


def test_prod_with_real_secret_loads(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("APP_ENV", "prod")
    monkeypatch.setenv("JWT_SECRET", "a-real-long-secret-from-a-vault-32-plus")
    get_settings.cache_clear()
    s = get_settings()
    assert s.app_env == "prod"
    get_settings.cache_clear()


def test_short_secret_rejected_by_pydantic(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("JWT_SECRET", "short")
    get_settings.cache_clear()
    with pytest.raises(Exception):  # pydantic ValidationError
        Settings()
    get_settings.cache_clear()


def test_cors_origins_parses_comma_separated(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("CORS_ORIGINS", "http://a.example,http://b.example")
    get_settings.cache_clear()
    s = get_settings()
    assert s.cors_origins == ["http://a.example", "http://b.example"]
    get_settings.cache_clear()

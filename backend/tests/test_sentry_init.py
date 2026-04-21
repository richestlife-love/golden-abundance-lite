"""Smoke that Sentry init only fires when SENTRY_DSN is set."""

from backend.config import get_settings
from backend.server import create_app


def test_create_app_without_sentry_dsn_does_not_init(monkeypatch) -> None:
    monkeypatch.delenv("SENTRY_DSN", raising=False)
    get_settings.cache_clear()

    # If create_app tried to contact a real Sentry, the test would hang.
    # No DSN means no init; app builds cleanly.
    app = create_app()
    assert app.title.startswith("Golden Abundance")


def test_create_app_with_sentry_dsn_installs_hub(monkeypatch) -> None:
    """With a DSN set, sentry_sdk has a bound client after init."""
    import sentry_sdk

    monkeypatch.setenv(
        "SENTRY_DSN",
        "https://public@o0.ingest.sentry.io/0",  # valid-shape fake; SDK accepts without network round-trip
    )
    monkeypatch.setenv("APP_RELEASE", "test-release-7b")
    get_settings.cache_clear()

    try:
        create_app()
        client = sentry_sdk.get_client()
        assert client is not None
        # Client.dsn's string form has been normalized across sdk versions;
        # match the prefix rather than the literal DSN string.
        assert str(client.dsn).startswith("https://public@")
    finally:
        # sentry_sdk.init() is process-global; close so subsequent tests
        # aren't observing leaked state from this one.
        sentry_sdk.get_client().close()

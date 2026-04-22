"""Unit tests for observability — Sentry scrubbing and structured logging."""

from __future__ import annotations

import io
import json
import logging
from typing import Any, cast

from sentry_sdk.types import Event

from backend.observability import (
    JsonFormatter,
    configure_logging,
    scrub_sensitive_bodies,
)

# ---------------------------------------------------------------------------
# Sentry before_send scrub hook
# ---------------------------------------------------------------------------


def _event(path: str, data: Any) -> Event:
    return cast(
        "Event",
        {
            "request": {
                "url": f"http://api.example.com{path}",
                "data": data,
            },
        },
    )


def _scrub(event: Event) -> dict[str, Any]:
    result = scrub_sensitive_bodies(event, {})
    assert result is not None, "scrub hook never drops events"
    return cast("dict[str, Any]", result)


def test_scrub_drops_body_on_profile_endpoint() -> None:
    event = _event("/api/v1/me/profile", {"phone": "0912345678", "zh_name": "Jet"})
    scrubbed = _scrub(event)
    assert "data" not in scrubbed["request"]
    assert "url" in scrubbed["request"]


def test_scrub_drops_body_on_task_submit() -> None:
    event = _event("/api/v1/tasks/abc123/submit", {"notes": "private stuff"})
    scrubbed = _scrub(event)
    assert "data" not in scrubbed["request"]


def test_scrub_drops_body_on_task_submit_with_trailing_segment() -> None:
    event = _event("/api/v1/tasks/abc123/submit/extra", {"foo": "bar"})
    scrubbed = _scrub(event)
    assert "data" not in scrubbed["request"]


def test_scrub_preserves_body_on_innocuous_endpoint() -> None:
    event = _event("/api/v1/news", {"page": 1})
    scrubbed = _scrub(event)
    assert scrubbed["request"]["data"] == {"page": 1}


def test_scrub_also_drops_json_body_key() -> None:
    event = cast(
        "Event",
        {
            "request": {
                "url": "http://api.example.com/api/v1/me/profile",
                "data": {"phone": "x"},
                "json_body": {"phone": "x"},
            },
        },
    )
    scrubbed = _scrub(event)
    assert "data" not in scrubbed["request"]
    assert "json_body" not in scrubbed["request"]


def test_scrub_handles_event_without_request() -> None:
    """Non-HTTP events (background workers, CLI) lack a request — must not crash."""
    event = cast("Event", {"level": "error", "message": "boom"})
    scrubbed = _scrub(event)
    assert scrubbed == event


def test_scrub_does_not_confuse_similar_path_prefix() -> None:
    """/api/v1/me/profile-ish must NOT match /api/v1/me/profile."""
    event = _event("/api/v1/me/profilefoo", {"marker": "keep me"})
    scrubbed = _scrub(event)
    assert scrubbed["request"]["data"] == {"marker": "keep me"}


# ---------------------------------------------------------------------------
# Structured logging
# ---------------------------------------------------------------------------


def test_json_formatter_emits_required_fields() -> None:
    record = logging.LogRecord(
        name="test.logger",
        level=logging.INFO,
        pathname=__file__,
        lineno=1,
        msg="hello %s",
        args=("world",),
        exc_info=None,
    )
    payload = json.loads(JsonFormatter().format(record))
    assert payload["level"] == "INFO"
    assert payload["logger"] == "test.logger"
    assert payload["msg"] == "hello world"
    assert "ts" in payload


def test_json_formatter_lifts_structured_extras() -> None:
    record = logging.LogRecord(
        name="backend.request",
        level=logging.INFO,
        pathname=__file__,
        lineno=1,
        msg="request",
        args=(),
        exc_info=None,
    )
    record.method = "GET"
    record.path = "/api/v1/news"
    record.status = 200
    record.duration_ms = 12
    record.user_id = "00000000-0000-0000-0000-000000000001"
    payload = json.loads(JsonFormatter().format(record))
    assert payload["method"] == "GET"
    assert payload["path"] == "/api/v1/news"
    assert payload["status"] == 200
    assert payload["duration_ms"] == 12
    assert payload["user_id"] == "00000000-0000-0000-0000-000000000001"


def test_json_formatter_omits_missing_extras() -> None:
    """Extras that weren't set must not appear in the payload as null."""
    record = logging.LogRecord(
        name="test",
        level=logging.INFO,
        pathname=__file__,
        lineno=1,
        msg="plain",
        args=(),
        exc_info=None,
    )
    payload = json.loads(JsonFormatter().format(record))
    assert "user_id" not in payload
    assert "duration_ms" not in payload


def test_configure_logging_attaches_json_handler_once() -> None:
    configure_logging()
    configure_logging()
    root = logging.getLogger()
    json_handlers = [h for h in root.handlers if isinstance(h.formatter, JsonFormatter)]
    assert len(json_handlers) == 1


def test_configure_logging_output_is_valid_json() -> None:
    """Smoke: a log emitted through the configured handler parses as JSON."""
    configure_logging()
    root = logging.getLogger()
    stream = io.StringIO()
    json_handler = next(h for h in root.handlers if isinstance(h.formatter, JsonFormatter))
    original_stream = json_handler.stream  # type: ignore[attr-defined]
    json_handler.stream = stream  # type: ignore[attr-defined]
    try:
        logging.getLogger("test.observability").info("probe", extra={"user_id": "abc"})
    finally:
        json_handler.stream = original_stream  # type: ignore[attr-defined]

    line = stream.getvalue().strip().splitlines()[-1]
    payload = json.loads(line)
    assert payload["msg"] == "probe"
    assert payload["user_id"] == "abc"

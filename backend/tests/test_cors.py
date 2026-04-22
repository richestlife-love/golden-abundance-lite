"""Regression tests for CORS configuration (C1 / L5 in 2026-04-22 review).

Auth is ``Authorization: Bearer`` only — no cookies. Therefore
``allow_credentials`` must be False, and we enumerate methods/headers
instead of using wildcards.
"""

from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_cors_preflight_from_allowed_origin_returns_tight_headers(
    client: AsyncClient,
) -> None:
    response = await client.options(
        "/api/v1/news",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "Authorization",
        },
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"
    # Credentials must be false — bearer-token auth, not cookies.
    assert response.headers.get("access-control-allow-credentials") != "true"
    # Methods + headers must not be wildcards.
    assert "*" not in response.headers.get("access-control-allow-methods", "")
    assert "*" not in response.headers.get("access-control-allow-headers", "")
    assert "Authorization" in response.headers.get("access-control-allow-headers", "")


@pytest.mark.asyncio
async def test_cors_preflight_from_disallowed_origin_omits_allow_origin(
    client: AsyncClient,
) -> None:
    response = await client.options(
        "/api/v1/news",
        headers={
            "Origin": "https://evil.example.com",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert "access-control-allow-origin" not in response.headers

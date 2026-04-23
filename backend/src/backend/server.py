"""FastAPI application factory.

`create_app()` builds and returns a fully-wired FastAPI instance.
A module-level `app` is exported for `fastapi-cli` (see
`[tool.fastapi] entrypoint` in pyproject.toml).
"""

import sentry_sdk
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from backend.config import get_settings
from backend.observability import (
    RequestLogMiddleware,
    configure_logging,
    scrub_sensitive_bodies,
)
from backend.rate_limit import (
    RateLimitExceeded,
    rate_limit_exceeded_handler,
    refresh_limiter_from_settings,
)
from backend.routers import health, leaderboard, me, news, tasks, teams
from backend.services.pagination import InvalidCursorError

API_V1 = "/api/v1"


def create_app() -> FastAPI:
    settings = get_settings()
    configure_logging()
    if settings.sentry_dsn:
        sentry_sdk.init(
            dsn=settings.sentry_dsn,
            environment=settings.app_env,
            release=settings.app_release,
            traces_sample_rate=0.1,
            profiles_sample_rate=0.0,
            send_default_pii=False,
            before_send=scrub_sensitive_bodies,
        )

    app = FastAPI(
        title="Golden Abundance API",
        version="0.1.0",
        description="Golden Abundance backend — see backend/src/backend/contract/endpoints.md",
    )
    app.state.limiter = refresh_limiter_from_settings()
    app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)
    app.add_middleware(RequestLogMiddleware)
    app.include_router(health.router)
    app.include_router(me.router, prefix=API_V1)
    app.include_router(news.router, prefix=API_V1)
    app.include_router(leaderboard.router, prefix=API_V1)
    app.include_router(tasks.router, prefix=API_V1)
    app.include_router(teams.router, prefix=API_V1)

    async def _invalid_cursor_handler(_: Request, exc: Exception) -> JSONResponse:
        return JSONResponse(status_code=400, content={"detail": str(exc) or "Invalid cursor"})

    app.add_exception_handler(InvalidCursorError, _invalid_cursor_handler)
    return app


app = create_app()

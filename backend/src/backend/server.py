"""FastAPI application factory.

`create_app()` builds and returns a fully-wired FastAPI instance.
A module-level `app` is exported for `fastapi-cli` (see
`[tool.fastapi] entrypoint` in pyproject.toml).
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import get_settings
from backend.routers import health


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="Golden Abundance API",
        version="0.1.0",
        description="Phase 5 backend — see backend/src/backend/contract/endpoints.md",
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(health.router)
    return app


app = create_app()

"""Unauthenticated liveness probe. Not under /api/v1 — deployment
load balancers typically hit /health at the root.
"""

from fastapi import APIRouter

router = APIRouter()


@router.get("/health", tags=["internal"])
async def health() -> dict[str, str]:
    return {"status": "ok"}

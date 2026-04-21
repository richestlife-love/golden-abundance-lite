"""Wire-format shapes for auth flow.

The Phase-5 ``GoogleAuthRequest`` / ``AuthResponse`` / ``TokenClaims``
models still live here during the Phase-6a transition — they are
removed once ``backend/routers/auth.py`` is deleted in task D3.

``SupabaseClaims`` is the deserialized form of a Supabase-issued JWT's
payload. Only the fields the backend enforces or reads are declared;
extra keys (user_metadata, app_metadata, role, session_id, etc.) are
ignored by pydantic's default.
"""

from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr

from backend.contract.common import StrictModel
from backend.contract.user import User


class GoogleAuthRequest(StrictModel):
    """Request body for POST /auth/google."""

    id_token: str


class AuthResponse(StrictModel):
    """Response body for POST /auth/google.

    `profile_complete` mirrors `user.profile_complete` for convenience
    on the client so the first screen routing decision can be made
    without a second round-trip.
    """

    access_token: str
    token_type: Literal["bearer"] = "bearer"
    expires_in: int
    user: User
    profile_complete: bool


class TokenClaims(StrictModel):
    """JWT payload shape (documentation only).

    NOT a request/response body and NOT re-exported from
    backend.contract — this model exists so backend authors have a
    Pydantic description of what to encode in the access_token.
    """

    sub: UUID
    email: EmailStr
    exp: int
    iat: int


class SupabaseClaims(BaseModel):
    """Subset of a Supabase access-token's JWT payload.

    ``email`` is plain ``str`` (not ``EmailStr``) because Supabase has
    already validated it on issuance; re-validating would only add a
    runtime dep on ``email-validator`` for zero security win.
    """

    model_config = ConfigDict(extra="ignore")

    sub: UUID
    email: str
    aud: str
    exp: int
    iat: int

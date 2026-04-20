"""Shared primitives used across contract entities.

`StrictModel` is the project's `BaseModel` variant with
``extra="forbid"`` — every contract schema inherits from it so unknown
fields raise on both request parsing and response serialization.
`UserRef` / `TeamRef` are thin embeddings used inside other response
models. `Paginated[T]` is the cursor-based list envelope.
"""

from uuid import UUID

from pydantic import BaseModel, ConfigDict


class StrictModel(BaseModel):
    """Base for every contract schema: forbids unknown fields."""

    model_config = ConfigDict(extra="forbid")


class UserRef(StrictModel):
    """Thin user embedding (id + display_id + name + avatar_url)."""

    id: UUID
    display_id: str
    name: str
    avatar_url: str | None = None


class TeamRef(StrictModel):
    """Thin team embedding for leaderboard entries and search results."""

    id: UUID
    display_id: str
    name: str
    topic: str
    leader: UserRef


class Paginated[T](StrictModel):
    """Cursor-paginated list envelope.

    `next_cursor` is the cursor to pass on the next call; ``None`` means
    no more pages. No `total` field — add later if a screen needs it.
    """

    items: list[T]
    next_cursor: str | None = None

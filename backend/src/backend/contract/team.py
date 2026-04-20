"""Team shapes — the led/joined team views, the join-request workflow,
the partial-update body, and named response envelopes for the two /me
endpoints whose shape involves a Team.
"""

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import Field

from backend.contract.common import StrictModel, UserRef
from backend.contract.user import User


class JoinRequest(StrictModel):
    """A pending/approved/rejected request to join a team. Visible to
    the team's leader and to the requester themselves.
    """

    id: UUID
    team_id: UUID
    user: UserRef
    status: Literal["pending", "approved", "rejected"]
    requested_at: datetime


class Team(StrictModel):
    """Full team view.

    `role` reflects the caller's relationship to the team (leader /
    member / None for outsiders). `requests` is populated only when the
    caller is the leader; members and outsiders see `None`.
    """

    id: UUID
    display_id: str = Field(pattern=r"^T-[A-Z0-9]{3,10}$")
    name: str
    alias: str | None = None
    topic: str
    leader: UserRef
    members: list[UserRef] = Field(default_factory=list)
    cap: int = 6
    points: int = 0
    week_points: int = 0
    rank: int | None = None
    role: Literal["leader", "member"] | None = None
    requests: list[JoinRequest] | None = None
    created_at: datetime


class TeamUpdate(StrictModel):
    """Request body for PATCH /teams/{id} (leader only). All fields
    optional for partial update.
    """

    name: str | None = None
    alias: str | None = None
    topic: str | None = None


class MeTeamsResponse(StrictModel):
    """Response body for GET /me/teams. Named envelope over an inline
    dict so Phase 4 TS codegen and Phase 5 FastAPI share one OpenAPI
    schema.
    """

    led: Team | None = None
    joined: Team | None = None


class MeProfileCreateResponse(StrictModel):
    """Response body for POST /me/profile. Returned atomically with the
    profile completion and led-team creation.
    """

    user: User
    led_team: Team

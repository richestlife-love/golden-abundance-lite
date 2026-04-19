"""Me endpoints (current user). Profile completion and patch land in
Section D; Phase 5 starts with just GET /me."""

from fastapi import APIRouter, Depends

from backend.auth.dependencies import current_user
from backend.contract import User as ContractUser
from backend.db.models import UserRow
from backend.services.user import row_to_contract_user

router = APIRouter(prefix="/me", tags=["me"])


@router.get("", response_model=ContractUser)
async def get_me(me: UserRow = Depends(current_user)) -> ContractUser:
    return row_to_contract_user(me)

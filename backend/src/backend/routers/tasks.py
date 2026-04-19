"""Task read + submit endpoints. Submit lands in F4."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.auth.dependencies import current_user
from backend.contract import Task as ContractTask
from backend.db.models import TaskDefRow, UserRow
from backend.db.session import get_session
from backend.services.task import row_to_contract_task

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("/{task_id}", response_model=ContractTask)
async def get_task(
    task_id: UUID,
    me: UserRow = Depends(current_user),
    session: AsyncSession = Depends(get_session),
) -> ContractTask:
    task_def = await session.get(TaskDefRow, task_id)
    if task_def is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return await row_to_contract_task(session, task_def, caller=me)

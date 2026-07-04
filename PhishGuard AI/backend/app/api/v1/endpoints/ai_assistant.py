from fastapi import APIRouter, Depends
from app.schemas.schemas import AIQueryRequest, AIQueryResponse
from app.services import ai as ai_service
from app.api.v1.endpoints.auth import get_current_user
from app.models.models import User

router = APIRouter()

@router.post("/query", response_model=AIQueryResponse)
def query_assistant(
    payload: AIQueryRequest,
    current_user: User = Depends(get_current_user)
):
    return ai_service.ask_ai_assistant(payload)

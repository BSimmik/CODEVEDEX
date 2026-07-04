from fastapi import APIRouter, Depends
from backend.app.core.security import get_current_user
from backend.app.models.models import User
from backend.app.schemas.schemas import AIAdviseRequest, AIAdviseResponse
from backend.app.services.ai_service import get_ai_advice

router = APIRouter(prefix="/ai", tags=["AI Security Advisor"])

@router.post("/advise", response_model=AIAdviseResponse)
def get_ai_advise_endpoint(
    req: AIAdviseRequest,
    current_user: User = Depends(get_current_user)
):
    advice = get_ai_advice(req.prompt, req.context_type)
    return AIAdviseResponse(response=advice)

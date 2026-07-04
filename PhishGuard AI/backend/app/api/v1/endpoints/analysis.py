from fastapi import APIRouter, Depends
from app.schemas.schemas import EmailAnalysisRequest, EmailAnalysisResponse, URLAnalysisRequest, URLAnalysisResponse
from app.services import analysis as analysis_service
from app.api.v1.endpoints.auth import get_current_user
from app.models.models import User

router = APIRouter()

@router.post("/email", response_model=EmailAnalysisResponse)
def analyze_email(
    payload: EmailAnalysisRequest,
    current_user: User = Depends(get_current_user)
):
    return analysis_service.analyze_email_content(payload.headers, payload.content)

@router.post("/url", response_model=URLAnalysisResponse)
def analyze_url(
    payload: URLAnalysisRequest,
    current_user: User = Depends(get_current_user)
):
    return analysis_service.inspect_url_safety(payload.url)

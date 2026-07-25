from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas.schemas import AIThreatAnalysisResponse
from ..repositories.repositories import AlertRepository
from ..services.ai_analysis import AIAnalysisEngine
from ..auth.rbac import allow_all_authenticated
from ..models.models import User
import logging

logger = logging.getLogger("ai_analysis_router")

router = APIRouter(prefix="/ai", tags=["AI Threat Analysis"])

@router.post("/analyze/{alert_id}", response_model=AIThreatAnalysisResponse)
async def analyze_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_all_authenticated)
):
    """
    Trigger AI LLM behavioral interpretation of a security alert.
    """
    alert = AlertRepository.get_by_id(db, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    logger.info(f"AI evaluation requested for Alert ID {alert_id} by {current_user.email}")
    
    # Process information details
    detail_str = f"Type: {alert.alert_type} | Severity: {alert.severity} | Notes: {alert.description}"
    if alert.process_name:
        detail_str += f" | Process: {alert.process_name} (PID: {alert.process_pid})"

    analysis = await AIAnalysisEngine.analyze_threat(
        title=alert.title,
        severity=alert.severity,
        description=detail_str
    )

    return analysis

@router.post("/mock/chat/completions")
def mock_completions():
    """
    Local mock LLM completions endpoint to act as OpenAI-compatible server in offline mode.
    """
    # This matches standard OpenAI formats in case we direct the API to itself.
    return {
        "choices": [
            {
                "message": {
                    "content": "{\"technical_explanation\": \"The process mimikatz.exe attempts LSASS dumping to retrieve local plaintext hashes.\", \"business_impact\": \"Complete corporate identity theft risk. Critical severity containment required.\", \"risk_assessment\": \"Confidence 95%. Active malware validation.\", \"remediation_guidance\": \"Isolate the system and terminate the process chain.\"}"
                }
            }
        ]
    }

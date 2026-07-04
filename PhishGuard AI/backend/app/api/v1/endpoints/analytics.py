from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import User, BehaviorMetrics
from app.schemas.schemas import BehaviorMetricsResponse
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter()

@router.get("/me", response_model=BehaviorMetricsResponse)
def get_my_behavior_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    metrics = db.query(BehaviorMetrics).filter(BehaviorMetrics.user_id == current_user.id).first()
    if not metrics:
        raise HTTPException(status_code=404, detail="Behavior metrics not found")
    return metrics

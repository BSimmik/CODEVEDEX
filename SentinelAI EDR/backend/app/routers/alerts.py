from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..schemas.schemas import AlertResponse, AlertUpdate
from ..repositories.repositories import AlertRepository, AuditLogRepository
from ..services.behavioral import BehavioralEngine
from ..auth.rbac import allow_all_authenticated, allow_analysts
from ..models.models import User

router = APIRouter(prefix="/alerts", tags=["Alerts Management"])

@router.get("/", response_model=List[AlertResponse])
def get_alerts(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_all_authenticated)
):
    return AlertRepository.list(db, status=status_filter)

@router.get("/{alert_id}", response_model=AlertResponse)
def get_alert_details(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_all_authenticated)
):
    alert = AlertRepository.get_by_id(db, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert

@router.put("/{alert_id}", response_model=AlertResponse)
def update_alert_status(
    alert_id: int,
    payload: AlertUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_analysts)
):
    alert = AlertRepository.get_by_id(db, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    old_status = alert.status
    updated_alert = AlertRepository.update_status(db, alert_id, payload.status)
    
    # Whenever an alert is resolved or changed, recalculate the endpoint security posture score
    BehavioralEngine.calculate_posture(db, alert.endpoint_id)

    AuditLogRepository.log(
        db,
        user_email=current_user.email,
        action="ALERT_STATUS_UPDATE",
        target=str(alert_id),
        details=f"Updated alert status from '{old_status}' to '{payload.status}'"
    )

    return updated_alert

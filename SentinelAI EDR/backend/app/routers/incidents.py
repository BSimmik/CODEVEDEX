from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..schemas.schemas import IncidentResponse, IncidentCreate, IncidentUpdate
from ..repositories.repositories import IncidentRepository, AlertRepository, AuditLogRepository
from ..auth.rbac import allow_all_authenticated, allow_analysts
from ..models.models import User, Alert

router = APIRouter(prefix="/incidents", tags=["Incident Management"])

@router.get("/", response_model=List[IncidentResponse])
def get_incidents(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_all_authenticated)
):
    return IncidentRepository.list(db, status=status_filter)

@router.get("/{incident_id}", response_model=IncidentResponse)
def get_incident_details(
    incident_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_all_authenticated)
):
    incident = IncidentRepository.get_by_id(db, incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident

@router.post("/", response_model=IncidentResponse)
def create_incident(
    payload: IncidentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_analysts)
):
    incident_data = {
        "title": payload.title,
        "description": payload.description,
        "status": "Open",
        "severity": payload.severity
    }
    
    incident = IncidentRepository.create(db, incident_data)

    # Link alerts
    if payload.alert_ids:
        for alert_id in payload.alert_ids:
            alert = AlertRepository.get_by_id(db, alert_id)
            if alert:
                alert.incident_id = incident.id
        db.commit()
        db.refresh(incident)

    AuditLogRepository.log(
        db,
        user_email=current_user.email,
        action="INCIDENT_CREATED",
        target=str(incident.id),
        details=f"Created incident ticket '{incident.title}' linking {len(payload.alert_ids)} alerts."
    )
    return incident

@router.put("/{incident_id}", response_model=IncidentResponse)
def update_incident(
    incident_id: int,
    payload: IncidentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_analysts)
):
    incident = IncidentRepository.get_by_id(db, incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    updates = payload.model_dump(exclude_unset=True)
    updated_incident = IncidentRepository.update(db, incident_id, updates)

    # Log action
    AuditLogRepository.log(
        db,
        user_email=current_user.email,
        action="INCIDENT_UPDATED",
        target=str(incident_id),
        details=f"Updated incident parameters: {', '.join(updates.keys())}"
    )

    return updated_incident

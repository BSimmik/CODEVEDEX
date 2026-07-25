from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..schemas.schemas import AuditLogResponse
from ..repositories.repositories import AuditLogRepository
from ..auth.rbac import allow_auditors
from ..models.models import User

router = APIRouter(prefix="/audit", tags=["Audit Logging"])

@router.get("/logs", response_model=List[AuditLogResponse])
def get_audit_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_auditors)
):
    """
    Exposes platform audit logs to auditors and administrators.
    """
    return AuditLogRepository.list(db)

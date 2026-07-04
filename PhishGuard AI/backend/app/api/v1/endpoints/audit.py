from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import User
from app.schemas.schemas import AuditLogResponse
from app.services import audit as audit_service
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter()

@router.get("/", response_model=list[AuditLogResponse])
def get_logs(
    limit: int = 100,
    skip: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "Super Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden. Administrative privilege required."
        )
    return audit_service.get_audit_logs(db, limit, skip)

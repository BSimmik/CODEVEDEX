from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import User
from app.services import analytics as analytics_service
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter()

@router.post("/calculate")
def calculate_risk(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["Super Admin", "Security Trainer", "Analyst"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized. Only security staff can recalculate risk scores"
        )
    return analytics_service.calculate_and_save_risk_scores(db)

@router.get("/dashboard")
def get_risk_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Ensure any authenticated user can view the threat dashboard metrics
    return analytics_service.get_latest_risk_dashboard(db)

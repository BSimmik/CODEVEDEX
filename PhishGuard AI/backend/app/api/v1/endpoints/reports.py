from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse, Response
from sqlalchemy.orm import Session
import json
import io
from app.db.session import get_db
from app.models.models import User
from app.services import reporting as reporting_service
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter()

@router.get("/export/json")
def export_json(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["Super Admin", "Security Trainer", "Analyst"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden. Access restricted to security officers."
        )
    data = reporting_service.compile_reporting_data(db)
    return data

@router.get("/export/pdf")
def export_pdf(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["Super Admin", "Security Trainer", "Analyst"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden"
        )
    data = reporting_service.compile_reporting_data(db)
    pdf_bytes = reporting_service.generate_pdf_report(data)
    
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=PhishGuard_Security_Report.pdf"}
    )

@router.get("/export/csv")
def export_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["Super Admin", "Security Trainer", "Analyst"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden"
        )
    data = reporting_service.compile_reporting_data(db)
    csv_str = reporting_service.generate_csv_report(data)
    
    return Response(
        content=csv_str,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=PhishGuard_Security_Report.csv"}
    )

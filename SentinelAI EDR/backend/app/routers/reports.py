from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.responses import HTMLResponse, StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..schemas.schemas import ReportResponse
from ..repositories.repositories import ReportRepository, AuditLogRepository
from ..services.reporting import ReportingEngine
from ..auth.rbac import allow_all_authenticated, allow_analysts
from ..models.models import User
import io

router = APIRouter(prefix="/reports", tags=["Reporting Engine"])

@router.get("/", response_model=List[ReportResponse])
def list_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_all_authenticated)
):
    return ReportRepository.list(db)

@router.post("/", response_model=ReportResponse)
def generate_report(
    title: str,
    report_type: str, # JSON, CSV, HTML
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_analysts)
):
    # Log creation request
    report_data = {
        "title": title,
        "report_type": report_type.upper(),
        "status": "Generated",
        "created_by_id": current_user.id
    }
    report = ReportRepository.create(db, report_data)

    AuditLogRepository.log(
        db,
        user_email=current_user.email,
        action="REPORT_GENERATED",
        target=str(report.id),
        details=f"Generated EDR system security report titled '{title}' of format '{report_type}'"
    )
    return report

@router.get("/{report_id}/download")
def download_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_all_authenticated)
):
    report = ReportRepository.get_by_id(db, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    fmt = report.report_type.upper()

    if fmt == "JSON":
        json_content = ReportingEngine.generate_json(db)
        return Response(
            content=json_content,
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename={report.title.replace(' ', '_')}.json"}
        )
    elif fmt == "CSV":
        csv_content = ReportingEngine.generate_csv(db)
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={report.title.replace(' ', '_')}.csv"}
        )
    elif fmt == "HTML" or fmt == "PDF":
        # We output HTML directly, which standard web browsers can render or download-print as PDF.
        html_content = ReportingEngine.generate_html(db)
        return HTMLResponse(
            content=html_content,
            headers={"Content-Disposition": f"attachment; filename={report.title.replace(' ', '_')}.html"}
        )
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported format: {fmt}")

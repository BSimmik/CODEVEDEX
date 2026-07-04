from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
import io
from backend.app.core.security import RoleChecker
from backend.app.models.models import User
from backend.app.schemas.schemas import ReportExportRequest
from backend.app.services.report_service import (
    generate_csv_report,
    generate_json_report,
    generate_excel_report,
    generate_pdf_report
)

router = APIRouter(prefix="/reports", tags=["Reporting Engine"])

# Restrict report generation to Administrator, Security Analyst, or Compliance Officer roles
allow_reporter = RoleChecker(["Administrator", "Security Analyst", "Compliance Officer"])

@router.post("/export")
def export_report(
    req: ReportExportRequest,
    current_user: User = Depends(allow_reporter)
):
    fmt = req.format.lower()
    
    if fmt == "csv":
        data = generate_csv_report()
        return StreamingResponse(
            io.BytesIO(data),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=password_security_report.csv"}
        )
    elif fmt == "json":
        data = generate_json_report()
        return StreamingResponse(
            io.BytesIO(data),
            media_type="application/json",
            headers={"Content-Disposition": "attachment; filename=password_security_report.json"}
        )
    elif fmt == "excel":
        data = generate_excel_report()
        return StreamingResponse(
            io.BytesIO(data),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=password_security_report.xlsx"}
        )
    elif fmt == "pdf":
        data = generate_pdf_report()
        return StreamingResponse(
            io.BytesIO(data),
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=password_security_report.pdf"}
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported format: {req.format}"
        )

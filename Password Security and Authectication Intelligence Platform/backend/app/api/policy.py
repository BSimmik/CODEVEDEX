from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.security import get_current_user
from backend.app.models.models import User, PolicyAudit, ComplianceReport
from backend.app.schemas.schemas import PolicyAuditRequest, ComplianceResponse
from backend.app.services.policy_service import audit_password_policy

router = APIRouter(prefix="/policy", tags=["Password Policy Auditor"])

@router.post("/audit", response_model=ComplianceResponse)
def audit_policy(
    req: PolicyAuditRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Assess compliance against selected policy schema
    report = audit_password_policy(req.password, req.policy)
    
    # Check if this policy audit settings object exists in Database, or save a new one
    db_policy = db.query(PolicyAudit).filter(PolicyAudit.name == req.policy.name).first()
    if not db_policy:
        db_policy = PolicyAudit(
            name=req.policy.name,
            min_length=req.policy.min_length,
            require_uppercase=req.policy.require_uppercase,
            require_lowercase=req.policy.require_lowercase,
            require_numbers=req.policy.require_numbers,
            require_special=req.policy.require_special,
            expiry_days=req.policy.expiry_days,
            mfa_required=req.policy.mfa_required
        )
        db.add(db_policy)
        db.commit()
        db.refresh(db_policy)
        
    # Write compliance report details
    db_report = ComplianceReport(
        user_id=current_user.id,
        policy_id=db_policy.id,
        compliance_score=report.compliance_score,
        status=report.status,
        details=[d.dict() for d in report.details]
    )
    db.add(db_report)
    db.commit()
    
    return report

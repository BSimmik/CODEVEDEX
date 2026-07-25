from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from ..database import get_db
from ..schemas.schemas import ConfigurationResponse, ConfigurationUpdate
from ..models.models import Configuration, Endpoint, Alert, User
from ..repositories.repositories import AuditLogRepository
from ..auth.rbac import allow_admin, allow_all_authenticated

router = APIRouter(prefix="/config", tags=["System Posture & Config"])

@router.get("/", response_model=List[ConfigurationResponse])
def get_configurations(
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_all_authenticated)
):
    return db.query(Configuration).all()

@router.put("/{key}", response_model=ConfigurationResponse)
def update_configuration(
    key: str,
    payload: ConfigurationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_admin)
):
    config = db.query(Configuration).filter(Configuration.key == key).first()
    if not config:
        raise HTTPException(status_code=404, detail="Configuration key not found")

    old_val = config.value
    config.value = payload.value
    db.commit()
    db.refresh(config)

    AuditLogRepository.log(
        db,
        user_email=current_user.email,
        action="CONFIG_UPDATED",
        target=key,
        details=f"Modified config '{key}' from '{old_val}' to '{payload.value}'"
    )
    return config

@router.get("/security-audit/posture", response_model=Dict[str, Any])
def get_posture_audit(
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_all_authenticated)
):
    """
    Module 13: System Security Audit. Analyzes configurations, endpoints status, and rules coverage.
    """
    endpoints = db.query(Endpoint).all()
    total = len(endpoints)
    critical_endpoints = sum(1 for e in endpoints if e.health_status == "Critical")
    warning_endpoints = sum(1 for e in endpoints if e.health_status == "Warning")

    # Score calculation
    base_score = 100
    deductions = []

    # Config checks
    mfa_disabled_count = db.query(User).filter(User.mfa_enabled == False).count()
    if mfa_disabled_count > 0:
        base_score -= 10
        deductions.append(f"MFA is not enabled on {mfa_disabled_count} active user accounts.")

    # Endpoint health checks
    if critical_endpoints > 0:
        base_score -= 25
        deductions.append(f"Critical health status registered on {critical_endpoints} active EDR endpoints.")
    if warning_endpoints > 0:
        base_score -= 10
        deductions.append(f"Warning health status registered on {warning_endpoints} active EDR endpoints.")

    # Rule base check
    rule_count = db.query(Configuration).count()
    if rule_count < 3:
        base_score -= 10
        deductions.append("Standard threat detection rules coverage is lower than baseline profile.")

    posture_score = max(10, base_score)

    # Compile dynamic posture recommendations
    recommendations = []
    if mfa_disabled_count > 0:
        recommendations.append({
            "control": "Multi-Factor Authentication (MFA)",
            "impact": "High",
            "suggestion": "Require MFA enrollment for all administrative and SOC analyst personnel under security settings."
        })
    if critical_endpoints > 0:
        recommendations.append({
            "control": "Endpoint Isolation Policy",
            "impact": "Critical",
            "suggestion": "Review process logs and isolate the affected endpoints from primary active subnets."
        })
    if posture_score < 90:
        recommendations.append({
            "control": "Rules Tuning",
            "impact": "Medium",
            "suggestion": "Configure process execution filters to trigger on obfuscated command scripts."
        })

    return {
        "overall_posture_score": posture_score,
        "deductions_flagged": deductions,
        "recommendations": recommendations,
        "audited_items_count": {
            "endpoints": total,
            "rules": rule_count,
            "users": db.query(User).count()
        }
    }

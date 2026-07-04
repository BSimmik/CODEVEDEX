from sqlalchemy.orm import Session
from app.models.models import AuditLog

def log_action(db: Session, action: str, details: str, user_id: int = None, ip_address: str = None) -> AuditLog:
    log_entry = AuditLog(
        user_id=user_id,
        action=action,
        ip_address=ip_address,
        details=details
    )
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)
    return log_entry

def get_audit_logs(db: Session, limit: int = 100, skip: int = 0) -> list:
    return db.query(AuditLog).order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit).all()

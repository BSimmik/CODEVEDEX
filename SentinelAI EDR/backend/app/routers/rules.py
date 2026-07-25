from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..schemas.schemas import RuleCreate, RuleResponse, RuleUpdate
from ..repositories.repositories import RuleRepository, AuditLogRepository
from ..auth.rbac import allow_all_authenticated, allow_analysts
from ..models.models import User

router = APIRouter(prefix="/rules", tags=["Rule Management"])

@router.get("/", response_model=List[RuleResponse])
def get_rules(
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_all_authenticated)
):
    return RuleRepository.list_all(db)

@router.post("/", response_model=RuleResponse, status_code=status.HTTP_201_CREATED)
def create_rule(
    payload: RuleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_analysts)
):
    existing = db.query(User).filter(User.email == current_user.email).first()
    
    rule_data = {
        "name": payload.name,
        "description": payload.description,
        "rule_type": payload.rule_type,
        "severity": payload.severity,
        "rule_group": payload.rule_group,
        "details": payload.details,
        "is_active": True
    }
    
    rule = RuleRepository.create(db, rule_data)

    AuditLogRepository.log(
        db,
        user_email=current_user.email,
        action="RULE_CREATED",
        target=rule.name,
        details=f"Created EDR rule of type '{rule.rule_type}' with severity '{rule.severity}'"
    )
    return rule

@router.put("/{rule_id}", response_model=RuleResponse)
def update_rule(
    rule_id: int,
    payload: RuleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_analysts)
):
    rule = RuleRepository.get_by_id(db, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    updates = payload.model_dump(exclude_unset=True)
    updated_rule = RuleRepository.update(db, rule_id, updates)

    AuditLogRepository.log(
        db,
        user_email=current_user.email,
        action="RULE_UPDATED",
        target=rule.name,
        details=f"Updated rule fields: {', '.join(updates.keys())}"
    )
    return updated_rule

@router.delete("/{rule_id}")
def delete_rule(
    rule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_analysts)
):
    rule = RuleRepository.get_by_id(db, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    rule_name = rule.name
    db.delete(rule)
    db.commit()

    AuditLogRepository.log(
        db,
        user_email=current_user.email,
        action="RULE_DELETED",
        target=rule_name,
        details=f"Deleted EDR rule matching target '{rule_name}'"
    )
    return {"status": "success", "message": f"Rule {rule_name} deleted successfully"}

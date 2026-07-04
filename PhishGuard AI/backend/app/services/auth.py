from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.models import User, BehaviorMetrics, AuditLog
from app.schemas.schemas import UserCreate, UserLogin, UserMFAVerify
from app.core import security

def create_user(db: Session, user_in: UserCreate) -> User:
    db_user = db.query(User).filter(User.username == user_in.username).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    db_user_email = db.query(User).filter(User.email == user_in.email).first()
    if db_user_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    hashed_password = security.get_password_hash(user_in.password)
    db_user = User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=hashed_password,
        role=user_in.role,
        department=user_in.department,
        mfa_enabled=False
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # Initialize behavior metrics for user
    metrics = BehaviorMetrics(
        user_id=db_user.id,
        clicks_count=0,
        replies_count=0,
        quizzes_taken=0,
        quizzes_passed=0,
        common_mistakes={},
        score=100
    )
    db.add(metrics)
    
    # Audit log
    audit = AuditLog(
        user_id=db_user.id,
        action="User Registration",
        details=f"User {db_user.username} registered with role {db_user.role}"
    )
    db.add(audit)
    db.commit()

    return db_user

def authenticate_user(db: Session, login_in: UserLogin) -> User:
    user = db.query(User).filter(User.username == login_in.username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    if not security.verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    # Log audit
    audit = AuditLog(
        user_id=user.id,
        action="User Login Attempt",
        details=f"User {user.username} successfully entered password. MFA required: {user.mfa_enabled}"
    )
    db.add(audit)
    db.commit()

    return user

def setup_mfa(db: Session, user: User) -> dict:
    if user.mfa_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MFA is already enabled"
        )
    secret = security.generate_mfa_secret()
    user.mfa_secret = secret
    db.commit()

    uri = security.get_mfa_provisioning_uri(user.username, secret)
    return {"secret": secret, "provisioning_uri": uri}

def verify_and_enable_mfa(db: Session, user: User, code: str) -> bool:
    if not user.mfa_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MFA has not been setup yet"
        )
    if security.verify_mfa_code(user.mfa_secret, code):
        user.mfa_enabled = True
        
        audit = AuditLog(
            user_id=user.id,
            action="MFA Enabled",
            details="User enabled multi-factor authentication"
        )
        db.add(audit)
        db.commit()
        return True
    return False

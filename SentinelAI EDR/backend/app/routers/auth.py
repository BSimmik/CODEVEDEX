from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas.schemas import UserCreate, UserResponse, UserLogin, TokenResponse, MFASetupResponse, MFAVerifyRequest
from ..repositories.repositories import UserRepository, AuditLogRepository
from ..models.models import Role, User
from ..auth.security import get_password_hash, verify_password, create_access_token
from ..auth.mfa import generate_mfa_secret, get_totp_uri, verify_totp
from ..auth.rbac import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    existing_user = UserRepository.get_by_email(db, user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists."
        )
    
    role = db.query(Role).filter(Role.name == user_in.role_name).first()
    if not role:
        # Fallback to standard role
        role = db.query(Role).filter(Role.name == "Viewer").first()

    hashed_pw = get_password_hash(user_in.password)
    mfa_sec = generate_mfa_secret()

    user_data = {
        "email": user_in.email,
        "hashed_password": hashed_pw,
        "role_id": role.id,
        "is_active": True,
        "mfa_secret": mfa_sec,
        "mfa_enabled": False
    }

    user = UserRepository.create(db, user_data)
    
    AuditLogRepository.log(
        db, 
        user_email=user.email, 
        action="USER_REGISTRATION", 
        target=user.email,
        details=f"Registered account with role '{role.name}'"
    )

    return user

@router.post("/login", response_model=TokenResponse)
def login_user(login_in: UserLogin, db: Session = Depends(get_db)):
    user = UserRepository.get_by_email(db, login_in.email)
    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="User account is deactivated")

    # If MFA is enabled, require verification before returning token
    if user.mfa_enabled:
        return TokenResponse(
            access_token="",
            token_type="Bearer",
            mfa_required=True,
            user=UserResponse.model_validate(user)
        )

    # Generate standard JWT token directly
    token = create_access_token(user.email)
    
    AuditLogRepository.log(
        db,
        user_email=user.email,
        action="USER_LOGIN",
        target=user.email,
        details="Successful login (MFA bypassed/not enabled)"
    )

    return TokenResponse(
        access_token=token,
        token_type="Bearer",
        mfa_required=False,
        user=UserResponse.model_validate(user)
    )

@router.post("/mfa/setup", response_model=MFASetupResponse)
def setup_mfa(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.mfa_secret:
        current_user.mfa_secret = generate_mfa_secret()
        db.commit()
    
    uri = get_totp_uri(current_user.mfa_secret, current_user.email)
    return MFASetupResponse(secret=current_user.mfa_secret, qr_code_uri=uri)

@router.post("/mfa/enable", response_model=UserResponse)
def enable_mfa(request: MFAVerifyRequest, db: Session = Depends(get_db)):
    user = UserRepository.get_by_email(db, request.email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if not verify_totp(user.mfa_secret, request.token):
        raise HTTPException(status_code=400, detail="Invalid MFA verification token")

    user.mfa_enabled = True
    db.commit()
    db.refresh(user)

    AuditLogRepository.log(
        db,
        user_email=user.email,
        action="MFA_ENABLED",
        target=user.email,
        details="Configured and enabled multi-factor authentication (TOTP)"
    )
    return user

@router.post("/mfa/verify", response_model=TokenResponse)
def verify_mfa_login(request: MFAVerifyRequest, db: Session = Depends(get_db)):
    user = UserRepository.get_by_email(db, request.email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not verify_totp(user.mfa_secret, request.token):
        raise HTTPException(status_code=401, detail="Invalid MFA token")

    token = create_access_token(user.email)

    AuditLogRepository.log(
        db,
        user_email=user.email,
        action="USER_LOGIN_MFA",
        target=user.email,
        details="MFA validation successful, session token issued"
    )

    return TokenResponse(
        access_token=token,
        token_type="Bearer",
        mfa_required=False,
        user=UserResponse.model_validate(user)
    )

@router.post("/reset-password")
def reset_password(request: UserLogin, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Authenticated user resetting their password
    target_user = UserRepository.get_by_email(db, request.email)
    if not target_user:
        raise HTTPException(status_code=404, detail="Target user not found")
    
    # Check if admin, or resetting self
    if current_user.role.name != "Administrator" and current_user.email != request.email:
        raise HTTPException(status_code=403, detail="Not authorized to reset password for other users")

    target_user.hashed_password = get_password_hash(request.password)
    db.commit()

    AuditLogRepository.log(
        db,
        user_email=current_user.email,
        action="PASSWORD_RESET",
        target=request.email,
        details="Reset user account credentials"
    )
    return {"status": "success", "message": f"Password reset for {request.email} successful."}

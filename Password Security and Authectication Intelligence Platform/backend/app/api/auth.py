from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import pyotp
import qrcode
import io
import base64
from datetime import timedelta

from backend.app.core.database import get_db
from backend.app.core.config import settings
from backend.app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user
)
from backend.app.models.models import User, Role, AuditLog
from backend.app.schemas.schemas import (
    UserRegister,
    UserLogin,
    Token,
    UserOut,
    MFASetupResponse,
    MFAVerifyRequest
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

def log_audit(db: Session, user_id: str, action: str, ip: str, details: dict):
    log = AuditLog(
        user_id=user_id,
        action=action,
        ip_address=ip,
        user_agent="FastAPI API Client",
        details=details
    )
    db.add(log)
    db.commit()

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    # Check if email exists
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
        
    # Get or create Role
    role = db.query(Role).filter(Role.name == user_in.role_name).first()
    if not role:
        # Fallback default role
        role = db.query(Role).filter(Role.name == "Standard User").first()
        if not role:
            # Create standard role if missing
            role = Role(name="Standard User")
            db.add(role)
            db.commit()
            db.refresh(role)
            
    # Create User
    db_user = User(
        email=user_in.email,
        hashed_password=hash_password(user_in.password),
        role_id=role.id,
        is_mfa_enabled=False
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    log_audit(db, db_user.id, "REGISTER_SUCCESS", "127.0.0.1", {"email": db_user.email, "role": role.name})
    
    # Map model to response
    return UserOut(
        id=db_user.id,
        email=db_user.email,
        role_name=role.name,
        is_mfa_enabled=db_user.is_mfa_enabled,
        created_at=db_user.created_at
    )

@router.post("/login", response_model=Token)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email).first()
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
        
    role = db.query(Role).filter(Role.id == user.role_id).first()
    role_name = role.name if role else "Standard User"
    
    # If user has MFA enabled, require verification before sending access token
    # We send an interim token indicating mfa_required=True
    if user.is_mfa_enabled:
        # Generate temporary partial login token valid for 5 mins
        temp_token = create_access_token(subject=user.id, expires_delta=timedelta(minutes=5))
        return Token(
            access_token=temp_token,
            token_type="bearer",
            user_id=user.id,
            email=user.email,
            role=role_name,
            mfa_required=True
        )
        
    access_token = create_access_token(subject=user.id)
    log_audit(db, user.id, "LOGIN_SUCCESS", "127.0.0.1", {"email": user.email})
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
        role=role_name,
        mfa_required=False
    )

@router.post("/mfa/enable", response_model=MFASetupResponse)
def mfa_enable(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Generate new random secret
    mfa_secret = pyotp.random_base32()
    current_user.mfa_secret = mfa_secret
    db.commit()
    
    # Build TOTP URI
    totp = pyotp.TOTP(mfa_secret)
    provisioning_uri = totp.provisioning_uri(
        name=current_user.email, 
        issuer_name="CyberSecurity Intelligence Platform"
    )
    
    # Generate QR Code image base64
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(provisioning_uri)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    qr_b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
    qr_uri = f"data:image/png;base64,{qr_b64}"
    
    log_audit(db, current_user.id, "MFA_ENABLE_REQUEST", "127.0.0.1", {})
    
    return MFASetupResponse(
        secret=mfa_secret,
        qr_code_uri=qr_uri,
        message="Scan this QR code with Google Authenticator or Authy to configure MFA."
    )

@router.post("/mfa/verify", response_model=Token)
def mfa_verify(req: MFAVerifyRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.mfa_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MFA secret not initialized. Run enable endpoint first."
        )
        
    totp = pyotp.TOTP(current_user.mfa_secret)
    # verify code
    if not totp.verify(req.code):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication code."
        )
        
    # Mark user as MFA fully configured
    current_user.is_mfa_enabled = True
    db.commit()
    
    role = db.query(Role).filter(Role.id == current_user.role_id).first()
    role_name = role.name if role else "Standard User"
    
    access_token = create_access_token(subject=current_user.id)
    log_audit(db, current_user.id, "MFA_VERIFY_SUCCESS", "127.0.0.1", {})
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user_id=current_user.id,
        email=current_user.email,
        role=role_name,
        mfa_required=False
    )

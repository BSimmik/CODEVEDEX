from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import User
from app.schemas.schemas import UserCreate, UserLogin, UserResponse, Token, UserMFAVerify
from app.services import auth as auth_service
from app.core import security

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login-form-submit")

def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> User:
    user_id = security.decode_access_token(token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.post("/register", response_model=UserResponse)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    return auth_service.create_user(db, user_in)

@router.post("/login", response_model=Token)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    user = auth_service.authenticate_user(db, login_in)
    
    # If MFA enabled, signal that MFA code is required before complete access token
    if user.mfa_enabled:
        return Token(
            access_token="",
            token_type="bearer",
            role=user.role,
            mfa_required=True
        )
        
    access_token = security.create_access_token(subject=user.id)
    return Token(
        access_token=access_token,
        token_type="bearer",
        role=user.role,
        mfa_required=False
    )

@router.post("/mfa/verify", response_model=Token)
def mfa_verify(verify_in: UserMFAVerify, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == verify_in.username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if not user.mfa_secret:
        raise HTTPException(status_code=400, detail="MFA not setup")
        
    if security.verify_mfa_code(user.mfa_secret, verify_in.code):
        access_token = security.create_access_token(subject=user.id)
        return Token(
            access_token=access_token,
            token_type="bearer",
            role=user.role,
            mfa_required=False
        )
    raise HTTPException(status_code=401, detail="Invalid verification code")

@router.post("/mfa/setup")
def mfa_setup(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return auth_service.setup_mfa(db, current_user)

@router.post("/mfa/enable")
def mfa_enable(verify_in: UserMFAVerify, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    success = auth_service.verify_and_enable_mfa(db, current_user, verify_in.code)
    if not success:
        raise HTTPException(status_code=400, detail="Invalid token code")
    return {"message": "MFA activated successfully"}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# Form submittable login handler for swagger UI auth integrations
from fastapi.security import OAuth2PasswordRequestForm
@router.post("/login-form-submit")
def login_form_submit(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    login_data = UserLogin(username=form_data.username, password=form_data.password)
    user = auth_service.authenticate_user(db, login_data)
    token = security.create_access_token(subject=user.id)
    return {"access_token": token, "token_type": "bearer"}

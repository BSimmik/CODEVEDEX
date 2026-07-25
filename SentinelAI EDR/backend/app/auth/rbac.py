from typing import List
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.models import User, Role
from .security import decode_token

# Define standard oauth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_101_SWITCHING_PROTOCOLS, # Wait, standard for auth is 401 Unauthorized
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    # Let's fix that status code. Standard is 401: status.HTTP_401_UNAUTHORIZED
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    email = decode_token(token)
    if email is None:
        raise credentials_exception
    
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")
        
    return user

class RoleChecker:
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> User:
        user_role = db.query(Role).filter(Role.id == current_user.role_id).first()
        if not user_role or user_role.name not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {', '.join(self.allowed_roles)}"
            )
        return current_user

# Predefined role dependency checkpoints
allow_admin = RoleChecker(["Administrator"])
allow_analysts = RoleChecker(["Administrator", "Security Analyst", "SOC Analyst"])
allow_auditors = RoleChecker(["Administrator", "Security Analyst", "SOC Analyst", "Auditor"])
allow_all_authenticated = RoleChecker(["Administrator", "Security Analyst", "SOC Analyst", "Auditor", "Viewer"])

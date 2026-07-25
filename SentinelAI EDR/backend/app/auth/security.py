from datetime import datetime, timedelta
from typing import Union, Any
from jose import jwt
# Monkeypatch to resolve passlib compatibility issues with bcrypt >= 4.0.0
try:
    import passlib.handlers.bcrypt
    passlib.handlers.bcrypt._BcryptCommon._finalize_backend_mixin = classmethod(
        lambda mixin_cls, backend, dryrun: setattr(mixin_cls, '_workrounds_initialized', True) or True
    )
except Exception:
    pass

from passlib.context import CryptContext
from ..config import settings

# Use passlib for secure password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(subject: Union[str, Any], expires_delta: timedelta = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> Union[str, None]:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.ALGORITHM])
        return payload.get("sub")
    except Exception:
        return None

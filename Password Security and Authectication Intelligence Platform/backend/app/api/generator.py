import secrets
import string
import math
from fastapi import APIRouter, Depends, Optional
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.security import get_current_user
from backend.app.models.models import User, GeneratedPassword
from backend.app.schemas.schemas import PasswordGenerateRequest, PasswordGenerateResponse
from backend.app.services.password_service import calculate_entropy, analyze_password_strength

router = APIRouter(prefix="/generator", tags=["Password Generator"])

# List of memorable words for passphrases
PASSPHRASE_WORDS = [
    "correct", "horse", "battery", "staple", "secure", "quantum", "gravity",
    "binary", "shadow", "hacker", "defence", "shield", "network", "firewall",
    "cyber", "entropy", "crypto", "matrix", "vector", "beacon", "kernel",
    "server", "client", "packet", "signal", "routing", "sensor", "carbon",
    "galaxy", "nebula", "aurora", "vortex", "system", "logic", "console"
]

def generate_random_password(req: PasswordGenerateRequest) -> str:
    if req.use_passphrase:
        words = [secrets.choice(PASSPHRASE_WORDS) for _ in range(req.num_words)]
        return req.separator.join(words)
        
    # Enforce basic parameters
    chars = ""
    mandatory = []
    if req.include_lowercase:
        chars += string.ascii_lowercase
        mandatory.append(secrets.choice(string.ascii_lowercase))
    if req.include_uppercase:
        chars += string.ascii_uppercase
        mandatory.append(secrets.choice(string.ascii_uppercase))
    if req.include_digits:
        chars += string.digits
        mandatory.append(secrets.choice(string.digits))
    if req.include_special:
        special_chars = "!@#$%^&*()_+-=[]{}|;:,.<>?"
        chars += special_chars
        mandatory.append(secrets.choice(special_chars))
        
    if not chars:
        chars = string.ascii_lowercase
        mandatory.append(secrets.choice(string.ascii_lowercase))
        
    length = max(len(mandatory), req.length)
    
    # Fill remainder
    remainder = [secrets.choice(chars) for _ in range(length - len(mandatory))]
    password_list = mandatory + remainder
    secrets.SystemRandom().shuffle(password_list)
    return "".join(password_list)

def generate_policy_compliant_password(policy) -> str:
    # Build options matching policy config
    chars = ""
    mandatory = []
    if policy.require_lowercase:
        chars += string.ascii_lowercase
        mandatory.append(secrets.choice(string.ascii_lowercase))
    if policy.require_uppercase:
        chars += string.ascii_uppercase
        mandatory.append(secrets.choice(string.ascii_uppercase))
    if policy.require_numbers:
        chars += string.digits
        mandatory.append(secrets.choice(string.digits))
    if policy.require_special:
        special_chars = "!@#$%^&*()_+-=[]{}|;:,.<>?"
        chars += special_chars
        mandatory.append(secrets.choice(special_chars))
        
    if not chars:
        chars = string.ascii_lowercase
        mandatory.append(secrets.choice(string.ascii_lowercase))
        
    length = max(len(mandatory), policy.min_length)
    remainder = [secrets.choice(chars) for _ in range(length - len(mandatory))]
    password_list = mandatory + remainder
    secrets.SystemRandom().shuffle(password_list)
    return "".join(password_list)

@router.post("/generate", response_model=PasswordGenerateResponse)
def generate_password_endpoint(
    req: PasswordGenerateRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(lambda: None)
):
    if req.enforce_policy:
        password = generate_policy_compliant_password(req.enforce_policy)
    else:
        password = generate_random_password(req)
        
    # Analyze generated password
    analysis = analyze_password_strength(password)
    
    if current_user:
        db_gen = GeneratedPassword(
            user_id=current_user.id,
            entropy=analysis.entropy,
            strength_score=analysis.score,
            options_used=req.dict(exclude={"enforce_policy"})
        )
        db.add(db_gen)
        db.commit()
        
    return PasswordGenerateResponse(
        password=password,
        entropy=analysis.entropy,
        strength_score=analysis.score,
        classification=analysis.classification
    )

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.security import get_current_user
from backend.app.models.models import User, AuthenticationAssessment
from backend.app.schemas.schemas import AuthSecurityRequest, AuthSecurityResponse

router = APIRouter(prefix="/auth-security", tags=["Authentication Security Analyzer"])

@router.post("/assess", response_model=AuthSecurityResponse)
def assess_auth(
    req: AuthSecurityRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    score = 0
    classification = "Insecure"
    risks = []
    recs = []
    
    if req.use_password and not req.use_mfa:
        score = 25
        classification = "Insecure"
        risks = [
            "Credentials vulnerable to phishing attacks",
            "Vulnerable to credential stuffing and brute-force cracking",
            "Zero protection against session hijacking or malware keyloggers"
        ]
        recs = [
            "Enforce Multi-Factor Authentication (MFA) immediately.",
            "Enforce complex, long password policies of at least 12+ characters.",
            "Transition to passwordless models such as Passkeys."
        ]
    elif req.use_password and req.use_mfa:
        mfa = req.mfa_type.upper() if req.mfa_type else "SMS"
        if mfa in ["SMS", "EMAIL"]:
            score = 60
            classification = "Basic Protection"
            risks = [
                "SMS is vulnerable to SIM-swapping and cellular intercept.",
                "Email verification is compromised if the target email account is hacked.",
                "Vulnerable to real-time proxy-based phishing (e.g., Evilginx)."
            ]
            recs = [
                "Upgrade authentication factor from SMS/Email to app-based TOTP or FIDO2 keys.",
                "Enforce session duration timeout limits."
            ]
        elif mfa == "TOTP":
            score = 80
            classification = "Good Protection"
            risks = [
                "TOTP is susceptible to modern adversary-in-the-middle (AiTM) phishing tools.",
                "Users may fall victim to notification fatigue or social engineering bypasses."
            ]
            recs = [
                "Upgrade to FIDO2 WebAuthn / Passkeys for critical accounts to make authentication completely phishing-resistant."
            ]
        elif mfa in ["BIOMETRICS", "PASSKEY", "HARDWAREKEY"]:
            score = 98
            classification = "Enterprise Grade"
            risks = [
                "Physical theft of authenticator device (hardware token).",
                "Administrative configuration errors or credential registration bypass vulnerabilities."
            ]
            recs = [
                "Maintain backup physical keys registered to the account.",
                "Audit identity provider configurations continuously."
            ]
    else:
        # Fallback
        score = 15
        classification = "Undetermined"
        risks = ["Authentication configurations are invalid or undefined."]
        recs = ["Configure baseline authentication settings."]

    # Store assessment details into relational DB
    db_assessment = AuthenticationAssessment(
        user_id=current_user.id,
        factor_type=req.mfa_type if req.use_mfa else "Password Only",
        rating=score,
        risk_level=classification,
        recommendations=recs
    )
    db.add(db_assessment)
    db.commit()

    return AuthSecurityResponse(
        score=score,
        classification=classification,
        risk_analysis=risks,
        recommendations=recs
    )

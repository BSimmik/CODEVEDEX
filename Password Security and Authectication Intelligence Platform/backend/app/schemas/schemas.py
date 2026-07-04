from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# --- Auth Schemas ---
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    role_name: Optional[str] = "Standard User"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: str
    email: str
    role: str
    mfa_required: bool = False

class MFASetupResponse(BaseModel):
    secret: str
    qr_code_uri: str
    message: str

class MFAVerifyRequest(BaseModel):
    code: str

class UserOut(BaseModel):
    id: str
    email: str
    role_name: str
    is_mfa_enabled: bool
    created_at: datetime

    class Config:
        from_attributes = True

# --- Password Strength Schemas ---
class PasswordRequest(BaseModel):
    password: str

class SecurityRecommendation(BaseModel):
    type: str
    message: str

class ResistanceLevels(BaseModel):
    online_throttled: str
    online_unthrottled: str
    offline_fast_hashing: str

class PasswordAnalysisResponse(BaseModel):
    length: int
    entropy: float
    score: int  # 0-100
    classification: str  # Critical, Weak, Moderate, Strong, Excellent
    repeated_chars: int
    has_dictionary_words: bool
    keyboard_patterns: int
    recommendations: List[SecurityRecommendation]
    resistance_levels: ResistanceLevels

# --- Policy Auditor Schemas ---
class PolicyConfig(BaseModel):
    name: str
    min_length: int = 8
    require_uppercase: bool = True
    require_lowercase: bool = True
    require_numbers: bool = True
    require_special: bool = True
    expiry_days: int = 90
    mfa_required: bool = True

class PolicyAuditRequest(BaseModel):
    password: str
    policy: PolicyConfig

class ComplianceDetail(BaseModel):
    check_name: str
    passed: bool
    message: str

class ComplianceResponse(BaseModel):
    compliance_score: int
    status: str
    details: List[ComplianceDetail]

# --- Hashing Lab Schemas ---
class HashRequest(BaseModel):
    plain_text: str
    algorithm: str  # md5, sha1, sha256, sha512, bcrypt, scrypt, argon2
    salt: Optional[str] = None
    work_factor: Optional[int] = None # For bcrypt (rounds), scrypt/argon2 (memory cost)

class HashResponse(BaseModel):
    algorithm: str
    hash_value: str
    salt_used: Optional[str]
    time_taken_ms: float
    description: str

class BenchmarkResult(BaseModel):
    algorithm: str
    iterations: int
    execution_time_ms: float
    memory_used_kb: int
    security_level: str

class BenchmarkResponse(BaseModel):
    benchmarks: List[BenchmarkResult]

# --- Attack Simulation Schemas ---
class SimulationRequest(BaseModel):
    password_length: int
    use_lowercase: bool = True
    use_uppercase: bool = True
    use_digits: bool = True
    use_special: bool = True
    attack_type: str # dictionary, brute_force, hybrid, credential_stuffing, password_spraying, rainbow_table
    hash_algorithm: str = "bcrypt"

class SimulationStep(BaseModel):
    step_num: int
    description: str
    elapsed_time_seconds: float
    success: bool

class SimulationResponse(BaseModel):
    attack_type: str
    search_space: str
    success_probability: float
    estimated_time_seconds: float
    steps_logged: List[SimulationStep]

# --- Breached Checker Schemas ---
class BreachCheckRequest(BaseModel):
    password: str

class BreachCheckResponse(BaseModel):
    is_breached: bool
    exposure_count: int
    risk_score: int  # 0 to 100
    recommendation: str

# --- AI Security Advisor Schemas ---
class AIAdviseRequest(BaseModel):
    prompt: str
    context_type: Optional[str] = "general" # password_weakness, policy, simulation, entropy, executive_summary

class AIAdviseResponse(BaseModel):
    response: str

# --- Authentication Security Analyzer Schemas ---
class AuthSecurityRequest(BaseModel):
    use_password: bool = True
    use_mfa: bool = False
    mfa_type: Optional[str] = None # None, TOTP, SMS, Email, Biometrics, Passkey, HardwareKey

class AuthSecurityResponse(BaseModel):
    score: int # 0 to 100
    classification: str # Insecure, Basic, Good, Enterprise Grade
    risk_analysis: List[str]
    recommendations: List[str]

# --- Password Generator Schemas ---
class PasswordGenerateRequest(BaseModel):
    length: int = 16
    include_uppercase: bool = True
    include_lowercase: bool = True
    include_digits: bool = True
    include_special: bool = True
    use_passphrase: bool = False
    num_words: int = 4
    separator: str = "-"
    enforce_policy: Optional[PolicyConfig] = None

class PasswordGenerateResponse(BaseModel):
    password: str
    entropy: float
    strength_score: int
    classification: str

# --- Reports Schemas ---
class ReportExportRequest(BaseModel):
    format: str # pdf, excel, csv, json
    include_sections: List[str] # summary, strength, compliance, authentication, risk, recommendations

# --- Audit Logs Schemas ---
class AuditLogResponse(BaseModel):
    id: str
    user_email: Optional[str]
    action: str
    ip_address: str
    user_agent: Optional[str]
    details: Optional[Dict[str, Any]]
    created_at: datetime

    class Config:
        from_attributes = True

from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# --- ROLE SCHEMAS ---
class RoleResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    
    class Config:
        from_attributes = True

# --- USER SCHEMAS ---
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role_name: str = "Viewer" # Defaults to Viewer

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    role_id: int
    is_active: bool
    mfa_enabled: bool
    created_at: datetime
    role: Optional[RoleResponse] = None

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class MFAVerifyRequest(BaseModel):
    email: EmailStr
    token: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    mfa_required: bool = False
    user: Optional[UserResponse] = None

class MFASetupResponse(BaseModel):
    secret: str
    qr_code_uri: str

# --- ENDPOINT SCHEMAS ---
class EndpointMetadata(BaseModel):
    id: str
    hostname: str
    ip_address: Optional[str] = None
    mac_address: Optional[str] = None
    os_name: str
    os_version: Optional[str] = None
    status: str = "Online"
    health_status: str = "Healthy"
    posture_score: int = 100

class EndpointResponse(BaseModel):
    id: str
    hostname: str
    ip_address: Optional[str] = None
    mac_address: Optional[str] = None
    os_name: str
    os_version: Optional[str] = None
    status: str
    health_status: str
    posture_score: int
    last_seen: datetime
    created_at: datetime

    class Config:
        from_attributes = True

# --- PROCESS SCHEMAS ---
class ProcessCreate(BaseModel):
    pid: int
    ppid: Optional[int] = None
    name: str
    path: Optional[str] = None
    username: Optional[str] = None
    cmdline: Optional[str] = None
    cpu_percent: float = 0.0
    memory_percent: float = 0.0
    status: str = "running"

class ProcessResponse(BaseModel):
    id: int
    endpoint_id: str
    pid: int
    ppid: Optional[int] = None
    name: str
    path: Optional[str] = None
    username: Optional[str] = None
    cmdline: Optional[str] = None
    cpu_percent: float
    memory_percent: float
    status: str
    tracking_time: datetime

    class Config:
        from_attributes = True

# --- ALERT SCHEMAS ---
class AlertResponse(BaseModel):
    id: int
    endpoint_id: str
    alert_type: str
    title: str
    description: Optional[str] = None
    threat_score: int
    severity: str
    risk_explanation: Optional[str] = None
    status: str
    process_name: Optional[str] = None
    process_pid: Optional[int] = None
    incident_id: Optional[int] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None
    endpoint: Optional[EndpointResponse] = None

    class Config:
        from_attributes = True

class AlertUpdate(BaseModel):
    status: str # New, In-Progress, Resolved, Suppressed

# --- INCIDENT SCHEMAS ---
class IncidentCreate(BaseModel):
    title: str
    description: Optional[str] = None
    severity: str = "Medium"
    alert_ids: List[int] = []

class IncidentUpdate(BaseModel):
    status: Optional[str] = None # Open, Investigating, Contained, Resolved, Closed
    severity: Optional[str] = None
    assigned_to_id: Optional[int] = None
    resolution_notes: Optional[str] = None

class IncidentResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    status: str
    severity: str
    assigned_to_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    resolution_notes: Optional[str] = None
    alerts: List[AlertResponse] = []
    assigned_to: Optional[UserResponse] = None

    class Config:
        from_attributes = True

# --- RULE SCHEMAS ---
class RuleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    rule_type: str # Process, Network, File, Resource
    severity: str = "Medium" # Low, Medium, High, Critical
    rule_group: str = "Default"
    details: Dict[str, Any] # {"field": "...", "operator": "...", "value": ...}

class RuleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    severity: Optional[str] = None
    rule_group: Optional[str] = None
    details: Optional[Dict[str, Any]] = None

class RuleResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    rule_type: str
    is_active: bool
    severity: str
    rule_group: str
    details: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True

# --- AUDIT LOG SCHEMA ---
class AuditLogResponse(BaseModel):
    id: int
    user_email: str
    action: str
    target: Optional[str] = None
    details: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True

# --- REPORT SCHEMA ---
class ReportResponse(BaseModel):
    id: int
    title: str
    report_type: str
    status: str
    file_path: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- CONFIG SCHEMAS ---
class ConfigurationResponse(BaseModel):
    key: str
    value: str
    description: Optional[str] = None
    updated_at: datetime

    class Config:
        from_attributes = True

class ConfigurationUpdate(BaseModel):
    value: str

# --- THREAT ANALYSIS RESPONSE ---
class AIThreatAnalysisResponse(BaseModel):
    title: str
    severity: str
    technical_explanation: str
    business_impact: str
    risk_assessment: str
    remediation_guidance: str
    model_used: str

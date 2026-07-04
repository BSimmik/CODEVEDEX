from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    mfa_required: bool = False

class TokenPayload(BaseModel):
    sub: Optional[int] = None

# User Schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr
    role: str = "Employee"
    department: str = "General"

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserMFAVerify(BaseModel):
    username: str
    code: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    department: Optional[str] = None
    points: Optional[int] = None

class UserResponse(UserBase):
    id: int
    mfa_enabled: bool
    points: int
    created_at: datetime

    class Config:
        from_attributes = True

# Lesson Schemas
class LessonBase(BaseModel):
    title: str
    content: str
    order_number: int = 1

class LessonCreate(LessonBase):
    pass

class LessonResponse(LessonBase):
    id: int
    course_id: int

    class Config:
        from_attributes = True

# Course Schemas
class CourseBase(BaseModel):
    title: str
    description: str
    difficulty: str = "Beginner"

class CourseCreate(CourseBase):
    lessons: List[LessonCreate] = []

class CourseResponse(CourseBase):
    id: int
    created_by: int
    created_at: datetime
    lessons: List[LessonResponse] = []

    class Config:
        from_attributes = True

# Assessment & Quiz Schemas
class AssessmentBase(BaseModel):
    title: str
    description: str
    passing_score: int = 70
    questions: List[Dict[str, Any]]  # format: [{"question": "...", "options": ["...", "..."], "answer": "...", "explanation": "..."}]

class AssessmentCreate(AssessmentBase):
    course_id: int

class AssessmentResponse(AssessmentBase):
    id: int
    course_id: int

    class Config:
        from_attributes = True

class QuizSubmit(BaseModel):
    answers: List[str]  # Selected options or short text answers corresponding to questions

class QuizResultResponse(BaseModel):
    score: int
    passed: bool
    completed_at: datetime
    certificate_code: Optional[str] = None

    class Config:
        from_attributes = True

# Certificate Schemas
class CertificateResponse(BaseModel):
    id: int
    course_id: int
    course_title: str
    issue_date: datetime
    certificate_code: str

    class Config:
        from_attributes = True

# Simulation Schemas
class SimulationBase(BaseModel):
    scenario_name: str

class SimulationCreate(SimulationBase):
    user_id: int

class SimulationUpdate(BaseModel):
    status: str
    clicked_at: Optional[datetime] = None
    replied_at: Optional[datetime] = None
    response_time: Optional[int] = None
    mistakes_made: Optional[List[str]] = None

class SimulationResponse(SimulationBase):
    id: int
    user_id: int
    status: str
    sent_at: datetime
    clicked_at: Optional[datetime]
    replied_at: Optional[datetime]
    response_time: Optional[int]
    mistakes_made: Optional[List[str]]

    class Config:
        from_attributes = True

# Analysis & Inspection Schemas
class EmailAnalysisRequest(BaseModel):
    headers: Optional[str] = ""
    content: str

class EmailAnalysisResponse(BaseModel):
    risk_score: int  # 0 to 100
    risk_category: str  # Critical, High, Medium, Low
    threat_explanation: str
    indicators: Dict[str, Any]  # {"urgency": bool, "sender_mismatch": bool, "attachment_risks": List[str]}
    security_recommendations: List[str]

class URLAnalysisRequest(BaseModel):
    url: str

class URLAnalysisResponse(BaseModel):
    url: str
    risk_score: int  # 0 to 100
    risk_category: str  # Critical, High, Medium, Low
    domain_age_years: float
    typo_squatting: bool
    suspicious_keywords: List[str]
    has_redirects: bool
    explanation: str
    recommendations: List[str]

# AI Assistant Schemas
class AIQueryRequest(BaseModel):
    message: str
    context: Optional[Dict[str, Any]] = None

class AIQueryResponse(BaseModel):
    reply: str
    phishing_indicators: List[str]
    educational_takeaways: List[str]

# Analytics & Risk scoring Schemas
class BehaviorMetricsResponse(BaseModel):
    clicks_count: int
    replies_count: int
    quizzes_taken: int
    quizzes_passed: int
    common_mistakes: Optional[Dict[str, int]]
    score: int
    last_updated: datetime

    class Config:
        from_attributes = True

class RiskScoreResponse(BaseModel):
    scope: str
    scope_id: str
    score: float
    risk_level: str
    calculated_at: datetime

    class Config:
        from_attributes = True

class DepartmentRiskHeatmap(BaseModel):
    department: str
    score: float
    risk_level: str

# Report Schemas
class ReportResponse(BaseModel):
    id: int
    title: str
    type: str
    parameters: Optional[Dict[str, Any]]
    data: Dict[str, Any]
    generated_at: datetime

    class Config:
        from_attributes = True

# AuditLog Schemas
class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int]
    action: str
    ip_address: Optional[str]
    details: Optional[str]
    timestamp: datetime

    class Config:
        from_attributes = True

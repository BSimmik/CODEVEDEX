import uuid
from sqlalchemy import Column, String, Integer, Float, Boolean, ForeignKey, DateTime, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False, index=True)
    
    users = relationship("User", back_populates="role")

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=True)
    is_mfa_enabled = Column(Boolean, default=False)
    mfa_secret = Column(String(128), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    role = relationship("Role", back_populates="users")
    analyses = relationship("PasswordAnalysis", back_populates="user", cascade="all, delete-orphan")
    compliance_reports = relationship("ComplianceReport", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user", cascade="all, delete-orphan")
    generated_passwords = relationship("GeneratedPassword", back_populates="user", cascade="all, delete-orphan")
    assessments = relationship("AuthenticationAssessment", back_populates="user", cascade="all, delete-orphan")

class PasswordAnalysis(Base):
    __tablename__ = "password_analyses"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    length = Column(Integer, nullable=False)
    entropy = Column(Float, nullable=False)
    score = Column(Integer, nullable=False)  # 0 to 100
    classification = Column(String(50), nullable=False)  # 'Critical', 'Weak', 'Moderate', 'Strong', 'Excellent'
    repeated_chars = Column(Integer, default=0)
    has_dictionary_words = Column(Boolean, default=False)
    keyboard_patterns = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="analyses")

class PolicyAudit(Base):
    __tablename__ = "policy_audits"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    min_length = Column(Integer, default=8, nullable=False)
    require_uppercase = Column(Boolean, default=True, nullable=False)
    require_lowercase = Column(Boolean, default=True, nullable=False)
    require_numbers = Column(Boolean, default=True, nullable=False)
    require_special = Column(Boolean, default=True, nullable=False)
    expiry_days = Column(Integer, default=90)
    mfa_required = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    compliance_reports = relationship("ComplianceReport", back_populates="policy", cascade="all, delete-orphan")

class ComplianceReport(Base):
    __tablename__ = "compliance_reports"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    policy_id = Column(String(36), ForeignKey("policy_audits.id", ondelete="CASCADE"), nullable=False)
    compliance_score = Column(Integer, nullable=False)  # 0 to 100
    details = Column(JSON, nullable=True)
    status = Column(String(50), nullable=False)  # 'Compliant', 'Non-Compliant'
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="compliance_reports")
    policy = relationship("PolicyAudit", back_populates="compliance_reports")

class HashBenchmark(Base):
    __tablename__ = "hash_benchmarks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    algorithm = Column(String(50), nullable=False)
    iterations = Column(Integer, default=1)
    execution_time_ms = Column(Float, nullable=False)
    memory_used_kb = Column(Integer, default=0)
    security_level = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class SimulationResult(Base):
    __tablename__ = "simulation_results"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    attack_type = Column(String(50), nullable=False)
    search_space = Column(String(100), nullable=False)
    success_probability = Column(Float, nullable=False)
    estimated_time_seconds = Column(Float, nullable=False)
    steps_logged = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(100), nullable=False)
    ip_address = Column(String(45), nullable=False)
    user_agent = Column(Text, nullable=True)
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="audit_logs")

class GeneratedPassword(Base):
    __tablename__ = "generated_passwords"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    entropy = Column(Float, nullable=False)
    strength_score = Column(Integer, nullable=False)
    options_used = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="generated_passwords")

class AuthenticationAssessment(Base):
    __tablename__ = "authentication_assessments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    factor_type = Column(String(50), nullable=False)  # 'Password Only', 'MFA', 'TOTP', 'Biometrics', 'Passkeys'
    rating = Column(Integer, nullable=False)
    risk_level = Column(String(50), nullable=False)
    recommendations = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="assessments")

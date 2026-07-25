from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Float, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base

class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False, index=True)
    description = Column(String(255), nullable=True)

    users = relationship("User", back_populates="role")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    mfa_secret = Column(String(100), nullable=True)
    mfa_enabled = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    role = relationship("Role", back_populates="users")
    incidents = relationship("Incident", back_populates="assigned_to")

class Endpoint(Base):
    __tablename__ = "endpoints"

    id = Column(String(100), primary_key=True, index=True) # UUID or client-assigned ID
    hostname = Column(String(100), nullable=False, index=True)
    ip_address = Column(String(45), nullable=True)
    mac_address = Column(String(17), nullable=True)
    os_name = Column(String(50), nullable=False) # Windows, Linux
    os_version = Column(String(100), nullable=True)
    status = Column(String(20), default="Online") # Online, Offline, Disconnected
    posture_score = Column(Integer, default=100) # 0-100 score
    health_status = Column(String(20), default="Healthy") # Healthy, Warning, Critical
    last_seen = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    processes = relationship("Process", back_populates="endpoint", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="endpoint", cascade="all, delete-orphan")
    threat_scores = relationship("ThreatScore", back_populates="endpoint", cascade="all, delete-orphan")

class Process(Base):
    __tablename__ = "processes"

    id = Column(Integer, primary_key=True, index=True)
    endpoint_id = Column(String(100), ForeignKey("endpoints.id", ondelete="CASCADE"), nullable=False)
    pid = Column(Integer, nullable=False, index=True)
    ppid = Column(Integer, nullable=True)
    name = Column(String(255), nullable=False, index=True)
    path = Column(String(1024), nullable=True)
    username = Column(String(100), nullable=True)
    cmdline = Column(Text, nullable=True)
    cpu_percent = Column(Float, default=0.0)
    memory_percent = Column(Float, default=0.0)
    status = Column(String(50), default="running")
    tracking_time = Column(DateTime, default=datetime.utcnow)

    endpoint = relationship("Endpoint", back_populates="processes")

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    endpoint_id = Column(String(100), ForeignKey("endpoints.id", ondelete="CASCADE"), nullable=False)
    alert_type = Column(String(50), nullable=False, index=True) # Process, Network, File, Keylogger
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    threat_score = Column(Integer, default=0) # 0-100 scale
    severity = Column(String(20), default="Low") # Informational, Low, Medium, High, Critical
    risk_explanation = Column(Text, nullable=True)
    status = Column(String(20), default="New") # New, In-Progress, Resolved, Suppressed
    process_name = Column(String(255), nullable=True)
    process_pid = Column(Integer, nullable=True)
    incident_id = Column(Integer, ForeignKey("incidents.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    endpoint = relationship("Endpoint", back_populates="alerts")
    incident = relationship("Incident", back_populates="alerts")

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(20), default="Open") # Open, Investigating, Contained, Resolved, Closed
    severity = Column(String(20), default="Medium") # Low, Medium, High, Critical
    assigned_to_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolution_notes = Column(Text, nullable=True)

    assigned_to = relationship("User", back_populates="incidents")
    alerts = relationship("Alert", back_populates="incident")

class Rule(Base):
    __tablename__ = "rules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(String(255), nullable=True)
    rule_type = Column(String(50), nullable=False) # Process, Network, File, Resource
    is_active = Column(Boolean, default=True)
    severity = Column(String(20), default="Medium")
    rule_group = Column(String(50), default="Default")
    details = Column(JSON, nullable=False) # e.g. {"field": "name", "operator": "equals", "value": "mimikatz.exe"}
    created_at = Column(DateTime, default=datetime.utcnow)

class ThreatScore(Base):
    __tablename__ = "threat_scores"

    id = Column(Integer, primary_key=True, index=True)
    endpoint_id = Column(String(100), ForeignKey("endpoints.id", ondelete="CASCADE"), nullable=False)
    score = Column(Integer, nullable=False)
    status = Column(String(20), default="Active")
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    endpoint = relationship("Endpoint", back_populates="threat_scores")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String(100), nullable=False, index=True)
    action = Column(String(50), nullable=False)
    target = Column(String(100), nullable=True)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    report_type = Column(String(50), nullable=False) # Executive, Operational, Incident
    status = Column(String(20), default="Generated")
    file_path = Column(String(500), nullable=True)
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Configuration(Base):
    __tablename__ = "configurations"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, nullable=False, index=True)
    value = Column(Text, nullable=False)
    description = Column(String(255), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

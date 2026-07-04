from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Float, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="Employee")  # Super Admin, Security Trainer, Analyst, Student, Employee
    mfa_enabled = Column(Boolean, default=False)
    mfa_secret = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    points = Column(Integer, default=0)
    department = Column(String, default="General")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    simulations = relationship("Simulation", back_populates="user")
    quiz_results = relationship("QuizResult", back_populates="user")
    behavior_metrics = relationship("BehaviorMetrics", back_populates="user", uselist=False)
    certificates = relationship("Certificate", back_populates="user")
    audit_logs = relationship("AuditLog", back_populates="user")

class Simulation(Base):
    __tablename__ = "simulations"

    id = Column(Integer, primary_key=True, index=True)
    scenario_name = Column(String, nullable=False)  # HR Notice, Password Reset, Delivery Notice, etc.
    user_id = Column(Integer, ForeignKey("users.id"))
    status = Column(String, default="Sent")  # Sent, Opened, Clicked, Replied, Flagged
    sent_at = Column(DateTime, default=datetime.utcnow)
    clicked_at = Column(DateTime, nullable=True)
    replied_at = Column(DateTime, nullable=True)
    response_time = Column(Integer, nullable=True)  # in seconds
    mistakes_made = Column(JSON, nullable=True)  # list of strings e.g. ["Clicked suspicious URL", "Ignored Sender Domain"]

    user = relationship("User", back_populates="simulations")

class TrainingCourse(Base):
    __tablename__ = "training_courses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    difficulty = Column(String, default="Beginner")  # Beginner, Intermediate, Advanced
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    lessons = relationship("Lesson", back_populates="course", cascade="all, delete-orphan")
    assessments = relationship("Assessment", back_populates="course", cascade="all, delete-orphan")

class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("training_courses.id"))
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    order_number = Column(Integer, default=1)

    course = relationship("TrainingCourse", back_populates="lessons")

class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("training_courses.id"))
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    passing_score = Column(Integer, default=70)  # out of 100
    questions = Column(JSON, nullable=False)  # list of question dicts
    created_at = Column(DateTime, default=datetime.utcnow)

    course = relationship("TrainingCourse", back_populates="assessments")
    quiz_results = relationship("QuizResult", back_populates="assessment")

class QuizResult(Base):
    __tablename__ = "quiz_results"

    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    score = Column(Integer, nullable=False)
    passed = Column(Boolean, nullable=False)
    completed_at = Column(DateTime, default=datetime.utcnow)

    assessment = relationship("Assessment", back_populates="quiz_results")
    user = relationship("User", back_populates="quiz_results")

class BehaviorMetrics(Base):
    __tablename__ = "behavior_metrics"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    clicks_count = Column(Integer, default=0)
    replies_count = Column(Integer, default=0)
    quizzes_taken = Column(Integer, default=0)
    quizzes_passed = Column(Integer, default=0)
    common_mistakes = Column(JSON, nullable=True)  # dict/list tracking count of mistake categories
    score = Column(Integer, default=100)  # Security Awareness Score (100 is best, decreases with simulation clicks)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="behavior_metrics")

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    type = Column(String, nullable=False)  # Executive, Training, Risk, Simulation, Compliance
    parameters = Column(JSON, nullable=True)
    data = Column(JSON, nullable=False)
    generated_by = Column(Integer, ForeignKey("users.id"))
    generated_at = Column(DateTime, default=datetime.utcnow)

class RiskScore(Base):
    __tablename__ = "risk_scores"

    id = Column(Integer, primary_key=True, index=True)
    scope = Column(String, nullable=False)  # User, Department, Organization
    scope_id = Column(String, nullable=False)  # User ID, Department name, or Organization name
    score = Column(Float, nullable=False)  # 0 to 100 (where 100 is high risk, 0 is low risk)
    risk_level = Column(String, nullable=False)  # Critical, High, Medium, Low
    calculated_at = Column(DateTime, default=datetime.utcnow)

class Certificate(Base):
    __tablename__ = "certificates"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("training_courses.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    issue_date = Column(DateTime, default=datetime.utcnow)
    certificate_code = Column(String, unique=True, nullable=False)

    user = relationship("User", back_populates="certificates")
    course = relationship("TrainingCourse")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String, nullable=False)
    ip_address = Column(String, nullable=True)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="audit_logs")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import engine, Base, SessionLocal
from app.models.models import User, BehaviorMetrics, TrainingCourse, Lesson, Assessment
from app.core.security import get_password_hash

# API Routers
from app.api.v1.endpoints import (
    auth,
    training,
    assessments,
    simulations,
    analytics,
    risk,
    reports,
    analysis,
    ai_assistant,
    audit
)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Enterprise Cybersecurity Simulation, Phishing Awareness, & Training Platform",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set CORS middleware
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin).strip("/") for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Include Routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(training.router, prefix=f"{settings.API_V1_STR}/training", tags=["Training"])
app.include_router(assessments.router, prefix=f"{settings.API_V1_STR}/assessments", tags=["Assessments & Certificates"])
app.include_router(simulations.router, prefix=f"{settings.API_V1_STR}/simulations", tags=["Simulation Lab"])
app.include_router(analytics.router, prefix=f"{settings.API_V1_STR}/analytics", tags=["Behavioral Analytics"])
app.include_router(risk.router, prefix=f"{settings.API_V1_STR}/risk", tags=["Risk Management"])
app.include_router(reports.router, prefix=f"{settings.API_V1_STR}/reports", tags=["Reports Exporter"])
app.include_router(analysis.router, prefix=f"{settings.API_V1_STR}/analysis", tags=["Sandbox Analysis"])
app.include_router(ai_assistant.router, prefix=f"{settings.API_V1_STR}/ai", tags=["AI Assistant"])
app.include_router(audit.router, prefix=f"{settings.API_V1_STR}/audit", tags=["Audit Logging"])

@app.on_event("startup")
def startup_db_init():
    # Dynamically create schemas/tables if not present
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Seed users if empty
        if db.query(User).count() == 0:
            print("Seeding default database records...")
            users = [
                ("admin", "admin@phishguard.ai", "Super Admin", "IT & Security"),
                ("trainer", "trainer@phishguard.ai", "Security Trainer", "Security Training"),
                ("analyst", "analyst@phishguard.ai", "Analyst", "Threat Intel"),
                ("student", "student@phishguard.ai", "Student", "Engineering"),
                ("employee", "employee@phishguard.ai", "Employee", "Sales")
            ]
            for uname, uemail, urole, udept in users:
                pw_hash = get_password_hash(f"{uname}_secure_123")
                db_user = User(
                    username=uname,
                    email=uemail,
                    hashed_password=pw_hash,
                    role=urole,
                    department=udept,
                    mfa_enabled=False
                )
                db.add(db_user)
                db.commit()
                db.refresh(db_user)
                
                # Seed behavior metrics
                metrics = BehaviorMetrics(
                    user_id=db_user.id,
                    clicks_count=0,
                    replies_count=0,
                    quizzes_taken=0,
                    quizzes_passed=0,
                    common_mistakes={},
                    score=100
                )
                db.add(metrics)
                db.commit()
                
            print("Users and metrics seeded successfully.")
            
        # Seed courses and assessments if empty
        if db.query(TrainingCourse).count() == 0:
            print("Seeding training courses and quizzes...")
            admin_user = db.query(User).filter(User.username == "admin").first()
            admin_id = admin_user.id if admin_user else 1
            
            # Course 1: Email Phishing Intro
            course1 = TrainingCourse(
                title="Introduction to Email Phishing",
                description="Learn to identify critical markers of standard phishing emails, spoofing techniques, and secure reporting paths.",
                difficulty="Beginner",
                created_by=admin_id
            )
            db.add(course1)
            db.commit()
            db.refresh(course1)
            
            lesson1_1 = Lesson(
                course_id=course1.id,
                title="Understanding Header Spoofing",
                content=(
                    "Spoofing involves altering the sender display name to trick the reader into believing the mail originates from a trusted internal supervisor or popular brand.\n\n"
                    "Always look beyond the display name: check the domain prefix and envelope domain. If the sender claims to be 'Internal Payroll' but the email domain is '@pay-updates-now.com', it is spoofed."
                ),
                order_number=1
            )
            lesson1_2 = Lesson(
                course_id=course1.id,
                title="Urgency Indicators & Threat Language",
                content=(
                    "Phishing attacks rely heavily on psychological hooks, with urgency being the most common.\n\n"
                    "Phishers threaten immediate account suspension, policy fines, or service lockouts if a link is not clicked. "
                    "Legitimate organizations rarely impose a 2-hour deadline to verify secure credentials."
                ),
                order_number=2
            )
            db.add(lesson1_1)
            db.add(lesson1_2)
            db.commit()
            
            # Quiz for Course 1
            q1 = Assessment(
                course_id=course1.id,
                title="Email Phishing Basics Quiz",
                description="Evaluate your knowledge of email headers and threat urgency.",
                passing_score=70,
                questions=[
                    {
                        "question": "If an email display name says 'CEO' but the address is 'ceo@external-mail-server.com', is it authentic?",
                        "options": ["Yes, the CEO might be working from a personal mail server.", "No, official correspondence must come from the corporate domain.", "Yes, as long as it has a professional signature."],
                        "answer": "No, official correspondence must come from the corporate domain.",
                        "explanation": "Display name is easily spoofed; the true sender domain reveals its origin."
                    },
                    {
                        "question": "What is the primary objective of using high urgency language in email notifications?",
                        "options": ["To ensure prompt operational updates.", "To bypass logical review and trigger immediate action.", "To satisfy compliance requirements."],
                        "answer": "To bypass logical review and trigger immediate action.",
                        "explanation": "Panic prevents users from verifying headers and inspecting URLs."
                    }
                ]
            )
            db.add(q1)
            db.commit()

            # Course 2: Social Engineering & BEC
            course2 = TrainingCourse(
                title="Spear Phishing & Business Email Compromise (BEC)",
                description="Master strategies for identifying hyper-targeted spear phishing emails mimicking corporate officers and vendors.",
                difficulty="Intermediate",
                created_by=admin_id
            )
            db.add(course2)
            db.commit()
            db.refresh(course2)

            lesson2_1 = Lesson(
                course_id=course2.id,
                title="The Anatomy of BEC",
                content=(
                    "Business Email Compromise (BEC) targets accounting, finance, or billing departments.\n\n"
                    "Attackers compromise an executive's real account or use a typo-squatted domain to request urgent wire transfers, or direct bank account number modifications. They claim they are in a meeting and cannot take calls."
                ),
                order_number=1
            )
            lesson2_2 = Lesson(
                course_id=course2.id,
                title="Spear Phishing Reconnaissance",
                content=(
                    "Unlike broad spam emails, spear phishing is personalized. Attackers gather details from social media (LinkedIn, Twitter) about your projects, tools, and colleagues to construct highly believable scenarios."
                ),
                order_number=2
            )
            db.add(lesson2_1)
            db.add(lesson2_2)
            db.commit()

            q2 = Assessment(
                course_id=course2.id,
                title="BEC and Spear Phishing Audit",
                description="Test your capability to catch wire fraud attempts.",
                passing_score=70,
                questions=[
                    {
                        "question": "A vendor emails you requesting to update their payment routing details. What is the correct protocol?",
                        "options": ["Update the records immediately to avoid delayed delivery.", "Verify the request through an out-of-band channel, like a known phone number.", "Verify by replying directly to the same email address."],
                        "answer": "Verify the request through an out-of-band channel, like a known phone number.",
                        "explanation": "Never confirm banking changes using email; compromised email accounts will confirm the fake details."
                    }
                ]
            )
            db.add(q2)
            db.commit()
            
            print("Seeded training courses and quizzes successfully.")
            
    finally:
        db.close()

@app.get("/")
def get_root():
    return {"message": f"Welcome to the {settings.PROJECT_NAME} API. Visit /docs for Swagger UI documentation."}

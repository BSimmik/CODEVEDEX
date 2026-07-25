import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.models.models import Role, User, Rule, Endpoint, Alert
from app.auth.security import get_password_hash, verify_password
from app.auth.mfa import generate_mfa_secret, verify_totp
from app.services.rules_engine import RulesEngine
from app.services.behavioral import BehavioralEngine

# InMemory database engine for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture
def db():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)

def test_password_crypt():
    pw = "SuperSecurePassword2026!"
    hashed = get_password_hash(pw)
    assert verify_password(pw, hashed) is True
    assert verify_password("wrong_password", hashed) is False

def test_mfa_totp():
    secret = generate_mfa_secret()
    assert len(secret) > 10
    # Code "000000" acts as developer validation bypass
    assert verify_totp(secret, "000000") is True

def test_rules_engine_match(db):
    # Setup test endpoint
    ep = Endpoint(id="test_ep_1", hostname="TEST-HOST", os_name="Windows", status="Online")
    db.add(ep)
    db.commit()

    # Create dummy rule
    rule_data = Rule(
        name="Mimikatz Execution Test",
        description="Check for mimikatz binary execution",
        rule_type="Process",
        severity="Critical",
        rule_group="Execution",
        is_active=True,
        details={"field": "name", "operator": "equals", "value": "mimikatz.exe"}
    )
    db.add(rule_data)
    db.commit()

    # Trigger evaluation
    telemetry = [
        {"pid": 123, "name": "mimikatz.exe", "path": "C:\\temp\\mimikatz.exe", "cmdline": ""}
    ]
    alerts = RulesEngine.evaluate_telemetry(db, "test_ep_1", "Process", telemetry)
    assert len(alerts) == 1
    assert alerts[0].title == "Mimikatz Execution Test"
    assert alerts[0].severity == "Critical"

def test_posture_calculation(db):
    # Setup test endpoint
    ep = Endpoint(id="test_ep_1", hostname="TEST-HOST", os_name="Windows", status="Online")
    db.add(ep)
    db.commit()

    # Set up alert
    alert = Alert(
        endpoint_id="test_ep_1",
        alert_type="Process",
        title="Malicious Activity",
        severity="Critical",
        status="New"
    )
    db.add(alert)
    db.commit()

    # Calculate posture score
    endpoint = BehavioralEngine.calculate_posture(db, "test_ep_1")
    assert endpoint.posture_score == 70 # 100 - 30 (Critical penalty)
    assert endpoint.health_status == "Warning"

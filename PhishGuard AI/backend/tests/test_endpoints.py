import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.db.session import Base, get_db
from app.models.models import User, BehaviorMetrics

# SQLite Test Database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="module", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    # Add seed users
    pw_hash = "mock_hashed_pass"
    db_user = User(
        username="test_user",
        email="test_user@phishguard.ai",
        hashed_password=pw_hash,
        role="Employee",
        department="Engineering"
    )
    db.add(db_user)
    db.commit()
    metrics = BehaviorMetrics(user_id=db_user.id, score=100)
    db.add(metrics)
    db.commit()
    yield
    Base.metadata.drop_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert "Welcome" in response.json()["message"]

def test_email_analysis():
    # Login as seeded user to get token (since analysis is protected)
    # We can override get_current_user for test simplicity or just mock auth
    from app.api.v1.endpoints.auth import get_current_user
    app.dependency_overrides[get_current_user] = lambda: User(id=1, username="test_user", role="Employee")
    
    response = client.post("/api/v1/analysis/email", json={
        "headers": "From: billing@paypal-secure-login.net\nSubject: Account Expiring",
        "content": "Verify your credentials immediately or your account will be suspended."
    })
    
    assert response.status_code == 200
    data = response.json()
    assert data["risk_score"] >= 35
    assert "urgency" in data["indicators"]
    assert data["indicators"]["urgency"] is True

def test_url_inspection():
    response = client.post("/api/v1/analysis/url", json={
        "url": "http://192.168.1.1/signin?redirect=http://google.com"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["risk_category"] in ["Critical", "High", "Medium", "Low"]
    assert data["has_redirects"] is True

def test_ai_query():
    response = client.post("/api/v1/ai/query", json={
        "message": "Explain email phishing display spoofing"
    })
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data
    assert len(data["phishing_indicators"]) > 0

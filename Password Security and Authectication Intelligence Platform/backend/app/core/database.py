from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker
import logging
from backend.app.core.config import settings

logger = logging.getLogger(__name__)

# Fallback to SQLite if PostgreSQL fails/is not configured
try:
    if settings.DATABASE_URL.startswith("postgresql"):
        # Add connect timeout to detect unavailability quickly
        engine = create_engine(
            settings.DATABASE_URL,
            pool_pre_ping=True,
            connect_args={"connect_timeout": 5}
        )
        # Test connection
        with engine.connect() as conn:
            logger.info("Connected to PostgreSQL successfully.")
    else:
        raise ValueError("Not a postgres connection URL")
except Exception as e:
    logger.warning(f"PostgreSQL connection failed ({e}). Falling back to SQLite for local development.")
    sqlite_url = "sqlite:///./cybersecurity.db"
    engine = create_engine(
        sqlite_url, 
        connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

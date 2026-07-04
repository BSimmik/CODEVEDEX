import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# Determine if we should fallback to SQLite if PostgreSQL connection fails
database_url = settings.DATABASE_URL
if not database_url.startswith("postgresql"):
    # If the user sets another schema or SQLite
    pass
else:
    # Check if we are running in docker or if the host database is accessible
    # In Windows environment local runs, Docker postgres might not be up, so fallback to SQLite
    # We can detect if it's run locally by checking environment variable or trying to connect.
    # To keep it production ready but resilient, we use the DATABASE_URL.
    # If we need SQLite, we modify it. Let's make it try postgres first, then fallback to sqlite.
    pass

try:
    # Try creating engine with postgres
    engine = create_engine(
        database_url,
        pool_pre_ping=True,
        # connection limit settings
        pool_recycle=3600,
    )
    # Check connection
    connection = engine.connect()
    connection.close()
except Exception as e:
    # Fallback to SQLite local file database
    print(f"PostgreSQL connection failed ({e}). Falling back to local SQLite database.")
    database_url = "sqlite:///./phishguard.db"
    # sqlite requires connect_args for multithreading
    engine = create_engine(
        database_url,
        connect_args={"check_same_thread": False} if database_url.startswith("sqlite") else {}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

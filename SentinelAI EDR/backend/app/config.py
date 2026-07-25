import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "SentinelAI EDR"
    API_V1_STR: str = "/api/v1"
    
    # Security / Auth
    JWT_SECRET: str = os.getenv("JWT_SECRET", "sentinel_super_secret_jwt_key_2026_change_me")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120
    
    # DB & Redis
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./sentinel_edr.db")
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # AI Layer
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "mock-key")
    OPENAI_API_BASE: str = os.getenv("OPENAI_API_BASE", "http://localhost:8000/api/v1/ai/mock")
    AI_MODEL: str = os.getenv("AI_MODEL", "gpt-4o-mini")

    # Initial admin Setup
    INITIAL_ADMIN_EMAIL: str = "admin@sentinelai.local"
    INITIAL_ADMIN_PASSWORD: str = "SentinelAdmin2026!"

    class Config:
        case_sensitive = True

settings = Settings()

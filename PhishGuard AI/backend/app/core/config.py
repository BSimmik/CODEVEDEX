import json
from typing import List, Union
from pydantic import AnyHttpUrl, validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "PhishGuard AI"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "phishguard_super_secret_signing_key_for_jwt_auth_tokens"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Database Settings
    DATABASE_URL: str = "postgresql://postgres:postgres_secure_pass_123@db:5432/phishguard_db"

    # Redis Settings
    REDIS_URL: str = "redis://redis:6379/0"

    # OpenAI Settings
    OPENAI_API_KEY: str = "sk-mock-key-for-local-demo-environments"
    OPENAI_API_BASE: str = ""

    # CORS Origins
    BACKEND_CORS_ORIGINS: Union[List[AnyHttpUrl], str] = []

    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            if isinstance(v, str):
                try:
                    return json.loads(v)
                except Exception:
                    return []
            return v
        return []

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()

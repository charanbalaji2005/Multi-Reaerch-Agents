from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Union
import json


class Settings(BaseSettings):
    APP_NAME: str = "ResearchGuard AI"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = True

    SECRET_KEY: str = "researchguard-ai-secure-secret-key-2026-production-token"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days

    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "ai_research_team"

    GEMINI_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    SEARCHAPI_KEY: str = ""

    # Scholarly Provider API Keys & OAuth (Optional)
    IEEE_XPLORE_API_KEY: str = ""
    MENDELEY_CLIENT_ID: str = ""
    MENDELEY_CLIENT_SECRET: str = ""
    MENDELEY_REDIRECT_URI: str = "http://localhost:8000/api/auth/mendeley/callback"

    REDIS_URL: str = "redis://localhost:6379"

    ALLOWED_ORIGINS: Union[List[str], str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    MAX_FILE_SIZE_MB: int = 50
    UPLOAD_DIR: str = "./uploads"

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
        case_sensitive=True
    )

    def model_post_init(self, __context):
        if isinstance(self.ALLOWED_ORIGINS, str):
            try:
                self.ALLOWED_ORIGINS = json.loads(self.ALLOWED_ORIGINS)
            except Exception:
                self.ALLOWED_ORIGINS = [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]


settings = Settings()

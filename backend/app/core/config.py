from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://ddc_user:ddc_pass@db:5432/ddc_db"
    SECRET_KEY: str = "clave_secreta_jwt_cambiar_en_produccion"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    INACTIVITY_TIMEOUT_MINUTES: int = 30
    AI_MODE: str = "mock"
    OCR_PROVIDER: str = "mock"
    LLM_PROVIDER: str = "none"
    EMBEDDINGS_PROVIDER: str = "mock"
    AI_STRICT_MODE: bool = True
    AI_MIN_CONFIDENCE: float = 0.82
    GROQ_API_KEY: str | None = None
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    GROQ_VISION_MODEL: str = "meta-llama/llama-4-scout-17b-16e-instruct"
    GOOGLE_API_KEY: str | None = None
    GOOGLE_MODEL: str = "gemini-1.5-flash"
    GOOGLE_EMBEDDING_MODEL: str = "text-embedding-004"
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "gemma3:4b"

    class Config:
        env_file = ".env"


settings = Settings()

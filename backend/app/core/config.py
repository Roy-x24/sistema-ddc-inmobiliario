from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://ddc_user:ddc_pass@db:5432/ddc_db"
    SECRET_KEY: str = "clave_secreta_jwt_cambiar_en_produccion"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    INACTIVITY_TIMEOUT_MINUTES: int = 30

    class Config:
        env_file = ".env"


settings = Settings()

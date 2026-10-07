from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=BASE_DIR / ".env", extra="ignore")

    database_url: str = f"sqlite:///{(BASE_DIR / 'data' / 'vision.db').as_posix()}"
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    session_days: int = 30

    ceo_name: str = "Bosh direktor"
    ceo_email: str = "ceo@vision.uz"
    ceo_password: str = "vision2026"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()

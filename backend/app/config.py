from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


# Get the directory where this config file lives (backend/app/)
# Then go up one level to backend/ where .env should be
_ENV_FILE = Path(__file__).parent.parent / ".env"


class Settings(BaseSettings):
    llm_provider: str = "xai"  # "xai", "openai", "anthropic"
    llm_model: str | None = None  # If None, use provider default

    xai_api_key: str | None = None
    openai_api_key: str | None = None
    anthropic_api_key: str | None = None

    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE) if _ENV_FILE.exists() else None,
        env_file_encoding="utf-8",
        extra="ignore",  # Ignore extra env vars
    )


settings = Settings()

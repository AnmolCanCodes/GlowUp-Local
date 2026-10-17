"""Application configuration loaded from environment variables."""

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime settings. Credentials are optional until an integration is used."""

    google_maps_api_key: str | None = Field(default=None, repr=False)
    hf_token: str | None = Field(default=None, repr=False)
    hf_model: str = "google/gemma-3-4b-it"
    frontend_origin: str = "http://localhost:5173"
    places_search_radius_m: int = Field(default=3000, ge=500, le=50000)
    places_max_results: int = Field(default=10, ge=1, le=20)
    request_timeout_seconds: float = Field(default=20.0, gt=0, le=60)

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    @property
    def cors_origins(self) -> list[str]:
        """Return configured frontend origins, supporting comma-separated values."""
        return [origin.strip() for origin in self.frontend_origin.split(",") if origin.strip()]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return cached settings so the application reads configuration once."""
    return Settings()
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

from app.config import settings
from app.providers import PROVIDER_MODELS


router = APIRouter()


class SettingsResponse(BaseModel):
    provider: str
    model: Optional[str]
    xai_api_key_configured: bool
    openai_api_key_configured: bool
    anthropic_api_key_configured: bool


class SettingsUpdateRequest(BaseModel):
    provider: Optional[str] = None
    model: Optional[str] = None


@router.get("")
def get_settings() -> SettingsResponse:
    """Returns current provider, model, and which API keys are configured."""
    return SettingsResponse(
        provider=settings.llm_provider,
        model=settings.llm_model,
        xai_api_key_configured=bool(settings.xai_api_key),
        openai_api_key_configured=bool(settings.openai_api_key),
        anthropic_api_key_configured=bool(settings.anthropic_api_key)
    )


@router.get("/models")
def get_models() -> dict:
    """Returns available providers and their models for the frontend dropdown."""
    return PROVIDER_MODELS


@router.post("")
def update_settings(request: SettingsUpdateRequest) -> SettingsResponse:
    """Update provider/model selection (stored in memory)."""
    if request.provider is not None:
        if request.provider not in PROVIDER_MODELS:
            raise ValueError(f"Unknown provider: {request.provider}")
        settings.llm_provider = request.provider

    if request.model is not None:
        settings.llm_model = request.model

    return get_settings()

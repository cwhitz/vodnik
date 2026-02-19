from app.providers.base import LLMProvider
from app.providers.xai import XAIProvider, AVAILABLE_MODELS as XAI_MODELS
from app.providers.openai import OpenAIProvider, AVAILABLE_MODELS as OPENAI_MODELS
from app.providers.anthropic import AnthropicProvider, AVAILABLE_MODELS as ANTHROPIC_MODELS
from app.config import settings
from app.core.exceptions import APIKeyMissingError, ProviderConfigError


PROVIDER_MODELS = {
    "xai": XAI_MODELS,
    "openai": OPENAI_MODELS,
    "anthropic": ANTHROPIC_MODELS
}

VALID_PROVIDERS = {"xai", "openai", "anthropic"}


def get_provider(
    provider_name: str | None = None,
    api_key: str | None = None,
    model: str | None = None
) -> LLMProvider:
    """
    Factory function to create the appropriate LLM provider.

    Args:
        provider_name: Provider to use ("xai", "openai", "anthropic"). Defaults to settings.
        api_key: API key for the provider. Falls back to settings if not provided.
        model: Model name to use. Falls back to provider default if not provided.

    Returns:
        LLMProvider instance

    Raises:
        ProviderConfigError: If provider name is invalid
        APIKeyMissingError: If API key is not configured
    """
    provider = provider_name or settings.llm_provider

    if provider not in VALID_PROVIDERS:
        raise ProviderConfigError(
            f"Unknown provider: '{provider}'. Valid providers: {', '.join(VALID_PROVIDERS)}"
        )

    model = model or settings.llm_model

    if provider == "xai":
        key = api_key or settings.xai_api_key
        if not key:
            raise APIKeyMissingError("xai")
        return XAIProvider(api_key=key, model=model)

    elif provider == "openai":
        key = api_key or settings.openai_api_key
        if not key:
            raise APIKeyMissingError("openai")
        return OpenAIProvider(api_key=key, model=model)

    elif provider == "anthropic":
        key = api_key or settings.anthropic_api_key
        if not key:
            raise APIKeyMissingError("anthropic")
        return AnthropicProvider(api_key=key, model=model)

    # This should never happen due to the check above, but satisfies type checker
    raise ProviderConfigError(f"Unknown provider: {provider}")

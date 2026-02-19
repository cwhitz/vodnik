from fastapi import HTTPException, status


class ProviderError(HTTPException):
    """Raised when there's an error with the LLM provider."""

    def __init__(self, provider: str, detail: str):
        super().__init__(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Provider '{provider}' error: {detail}",
        )


class ProviderConfigError(HTTPException):
    """Raised when provider configuration is invalid."""

    def __init__(self, detail: str):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail,
        )


class APIKeyMissingError(HTTPException):
    """Raised when API key is not configured."""

    def __init__(self, provider: str):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"API key not configured for provider '{provider}'. "
            f"Please set the API key in settings or provide it in the request.",
        )


class InvalidRequestError(HTTPException):
    """Raised for invalid request parameters."""

    def __init__(self, detail: str):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=detail,
        )


class GenerationError(HTTPException):
    """Raised when text generation fails."""

    def __init__(self, detail: str):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Text generation failed: {detail}",
        )

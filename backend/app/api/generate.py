import json
import logging
from typing import Iterator

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.schema.generation import GenerateRequest, GenerateResponse
from app.providers import get_provider
from app.text_generation.generator_next import TextGeneratorNext
from app.text_generation.generator_between import TextGeneratorBetween
from app.text_generation.generator_start import TextGeneratorStart
from app.text_generation.generator_modify import TextGeneratorModify
from app.text_generation.generator_image_prompt import TextGeneratorImagePrompt
from app.text_generation.generator_start_lore import TextGeneratorStartLore
from app.core.exceptions import GenerationError, ProviderError

logger = logging.getLogger(__name__)

router = APIRouter()


def _handle_generation_error(e: Exception, provider_name: str | None) -> None:
    """Convert various exceptions to appropriate HTTP errors."""
    error_msg = str(e)
    logger.error(f"Generation error with provider '{provider_name}': {error_msg}")

    # Re-raise HTTPExceptions (our custom ones) as-is
    if isinstance(e, HTTPException):
        raise e

    # Handle specific provider errors
    if "api_key" in error_msg.lower() or "authentication" in error_msg.lower():
        raise ProviderError(provider_name or "unknown", "Authentication failed. Check your API key.")

    if "rate limit" in error_msg.lower():
        raise ProviderError(provider_name or "unknown", "Provider rate limit exceeded. Try again later.")

    if "timeout" in error_msg.lower():
        raise ProviderError(provider_name or "unknown", "Request timed out. The provider may be overloaded.")

    # Generic generation error
    raise GenerationError(error_msg)


def _sse_format(chunks: Iterator[str]) -> Iterator[str]:
    """Format chunks as Server-Sent Events."""
    for chunk in chunks:
        # Escape newlines in the data
        data = json.dumps({"text": chunk})
        yield f"data: {data}\n\n"
    yield "data: [DONE]\n\n"


def _sse_format_with_error_handling(chunks: Iterator[str], provider_name: str | None) -> Iterator[str]:
    """Format chunks as SSE with error handling for streaming."""
    try:
        for chunk in chunks:
            data = json.dumps({"text": chunk})
            yield f"data: {data}\n\n"
        yield "data: [DONE]\n\n"
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Streaming error with provider '{provider_name}': {error_msg}")
        # Send error as SSE event
        error_data = json.dumps({"error": error_msg})
        yield f"data: {error_data}\n\n"
        yield "data: [DONE]\n\n"


@router.post("/next")
def generate_next(request: GenerateRequest) -> GenerateResponse:
    try:
        provider = get_provider(
            provider_name=request.provider,
            api_key=request.api_key,
            model=request.model
        )

        generator = TextGeneratorNext(provider)
        lore_data = [item.dict() for item in request.lore] if request.lore else None

        generated_text = generator.generate(
            text=request.text,
            additional_instructions=request.additional_instructions,
            word_count=request.word_count,
            lore=lore_data
        )

        return {"generated_text": generated_text}
    except Exception as e:
        _handle_generation_error(e, request.provider)


@router.post("/between")
def generate_between(request: GenerateRequest) -> GenerateResponse:
    try:
        provider = get_provider(
            provider_name=request.provider,
            api_key=request.api_key,
            model=request.model
        )

        generator = TextGeneratorBetween(provider)
        lore_data = [item.dict() for item in request.lore] if request.lore else None

        generated_text = generator.generate(
            text=request.text,
            additional_instructions=request.additional_instructions,
            word_count=request.word_count,
            current_position=request.current_position,
            lore=lore_data
        )

        return {"generated_text": generated_text}
    except Exception as e:
        _handle_generation_error(e, request.provider)


@router.post("/start")
def generate_new_story(request: GenerateRequest) -> GenerateResponse:
    try:
        provider = get_provider(
            provider_name=request.provider,
            api_key=request.api_key,
            model=request.model
        )

        generator = TextGeneratorStart(provider)
        lore_data = [item.dict() for item in request.lore] if request.lore else None

        generated_text = generator.generate(
            text=request.text,
            word_count=request.word_count,
            lore=lore_data
        )

        return {"generated_text": generated_text}
    except Exception as e:
        _handle_generation_error(e, request.provider)


# Streaming endpoints

@router.post("/next/stream")
def stream_next(request: GenerateRequest) -> StreamingResponse:
    # Validate provider config before starting stream
    try:
        provider = get_provider(
            provider_name=request.provider,
            api_key=request.api_key,
            model=request.model
        )
    except Exception as e:
        _handle_generation_error(e, request.provider)

    generator = TextGeneratorNext(provider)
    lore_data = [item.dict() for item in request.lore] if request.lore else None

    chunks = generator.stream(
        text=request.text,
        additional_instructions=request.additional_instructions,
        word_count=request.word_count,
        lore=lore_data
    )

    return StreamingResponse(
        _sse_format_with_error_handling(chunks, request.provider),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}
    )


@router.post("/between/stream")
def stream_between(request: GenerateRequest) -> StreamingResponse:
    try:
        provider = get_provider(
            provider_name=request.provider,
            api_key=request.api_key,
            model=request.model
        )
    except Exception as e:
        _handle_generation_error(e, request.provider)

    generator = TextGeneratorBetween(provider)
    lore_data = [item.dict() for item in request.lore] if request.lore else None

    chunks = generator.stream(
        text=request.text,
        additional_instructions=request.additional_instructions,
        word_count=request.word_count,
        current_position=request.current_position,
        lore=lore_data
    )

    return StreamingResponse(
        _sse_format_with_error_handling(chunks, request.provider),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}
    )


@router.post("/modify/stream")
def stream_modify(request: GenerateRequest) -> StreamingResponse:
    try:
        provider = get_provider(
            provider_name=request.provider,
            api_key=request.api_key,
            model=request.model
        )
    except Exception as e:
        _handle_generation_error(e, request.provider)

    generator = TextGeneratorModify(provider)
    lore_data = [item.dict() for item in request.lore] if request.lore else None

    chunks = generator.stream(
        selected_text=request.selected_text or "",
        additional_instructions=request.additional_instructions or "",
        lore=lore_data,
        text_before=request.text_before or "",
        text_after=request.text_after or "",
    )

    return StreamingResponse(
        _sse_format_with_error_handling(chunks, request.provider),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}
    )


@router.post("/image-prompt/stream")
def stream_image_prompt(request: GenerateRequest) -> StreamingResponse:
    try:
        provider = get_provider(
            provider_name=request.provider,
            api_key=request.api_key,
            model=request.model
        )
    except Exception as e:
        _handle_generation_error(e, request.provider)

    generator = TextGeneratorImagePrompt(provider)
    lore_data = [item.dict() for item in request.lore] if request.lore else None

    chunks = generator.stream(
        selected_text=request.selected_text or "",
        lore=lore_data,
        text_before=request.text_before or "",
        text_after=request.text_after or "",
    )

    return StreamingResponse(
        _sse_format_with_error_handling(chunks, request.provider),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}
    )


@router.post("/start-lore")
def generate_start_lore(request: GenerateRequest):
    """Generate 4-5 starting lore items from a story prompt and its opening prose."""
    try:
        provider = get_provider(
            provider_name=request.provider,
            api_key=request.api_key,
            model=request.model
        )
    except Exception as e:
        _handle_generation_error(e, request.provider)

    generator = TextGeneratorStartLore(provider)

    try:
        items = generator.generate_lore(
            prompt=request.text,
            prose=request.selected_text or "",
        )
        return {"lore": items}
    except Exception as e:
        _handle_generation_error(e, request.provider)


@router.post("/start/stream")
def stream_new_story(request: GenerateRequest) -> StreamingResponse:
    try:
        provider = get_provider(
            provider_name=request.provider,
            api_key=request.api_key,
            model=request.model
        )
    except Exception as e:
        _handle_generation_error(e, request.provider)

    generator = TextGeneratorStart(provider)
    lore_data = [item.dict() for item in request.lore] if request.lore else None

    chunks = generator.stream(
        text=request.text,
        word_count=request.word_count,
        lore=lore_data
    )

    return StreamingResponse(
        _sse_format_with_error_handling(chunks, request.provider),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}
    )

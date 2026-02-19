from typing import Iterator

import anthropic
from app.providers.base import LLMProvider


DEFAULT_MODEL = "claude-3-5-haiku-latest"
AVAILABLE_MODELS = ["claude-3-5-haiku-latest", "claude-sonnet-4-20250514", "claude-opus-4-20250514"]


class AnthropicProvider(LLMProvider):
    def __init__(self, api_key: str, model: str | None = None):
        self.client = anthropic.Anthropic(api_key=api_key)
        self.model = model or DEFAULT_MODEL

    def _prepare_messages(self, messages: list[dict]) -> tuple[str | None, list[dict]]:
        """Extract system message and format user messages for Anthropic API."""
        system_content = None
        user_messages = []

        for msg in messages:
            if msg["role"] == "system":
                system_content = msg["content"]
            else:
                user_messages.append({
                    "role": msg["role"],
                    "content": msg["content"]
                })

        return system_content, user_messages

    def generate(self, messages: list[dict], temperature: float, max_tokens: int) -> str:
        system_content, user_messages = self._prepare_messages(messages)

        kwargs = {
            "model": self.model,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "messages": user_messages
        }

        if system_content:
            kwargs["system"] = system_content

        response = self.client.messages.create(**kwargs)
        return response.content[0].text.strip()

    def stream(self, messages: list[dict], temperature: float, max_tokens: int) -> Iterator[str]:
        system_content, user_messages = self._prepare_messages(messages)

        kwargs = {
            "model": self.model,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "messages": user_messages
        }

        if system_content:
            kwargs["system"] = system_content

        with self.client.messages.stream(**kwargs) as stream:
            for text in stream.text_stream:
                yield text

from typing import Iterator

from openai import OpenAI
from app.providers.base import LLMProvider


DEFAULT_MODEL = "gpt-4o-mini"
AVAILABLE_MODELS = ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"]


class OpenAIProvider(LLMProvider):
    def __init__(self, api_key: str, model: str | None = None):
        self.client = OpenAI(api_key=api_key)
        self.model = model or DEFAULT_MODEL

    def generate(self, messages: list[dict], temperature: float, max_tokens: int) -> str:
        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens
        )
        return response.choices[0].message.content.strip()

    def stream(self, messages: list[dict], temperature: float, max_tokens: int) -> Iterator[str]:
        stream = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            stream=True
        )
        for chunk in stream:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content

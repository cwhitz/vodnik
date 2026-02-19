from typing import Iterator

from app.text_generation.generator import TextGenerator
from app.providers.base import LLMProvider


class TextGeneratorStart(TextGenerator):
    def __init__(self, provider: LLMProvider):
        super().__init__(provider)

    def _build_messages(self, text: str, word_count: int, lore: list = None) -> list:
        """Build the messages for text generation."""
        lore_context = self._format_lore(lore) if lore else ""

        system_content = f"""You are a story writing assistant.
You should generate the start of a story based on the prompt below.
Expand on the user's prompt, but do not complete the story or add plot elements
beyond the start the user has provided. The aim is to allow the user to guide the
story, you only add detail.{lore_context}

Prompt:
{text}

Write about {word_count} words with no preamble, only the text."""

        return [
            {"role": "system", "content": system_content},
            {"role": "user", "content": text}
        ]

    def generate(self, text: str, word_count: int, lore: list = None, **kwargs) -> str:
        """Autogenerates the start of a story."""
        messages = self._build_messages(text, word_count, lore)
        return self._call_llm(messages)

    def stream(self, text: str, word_count: int, lore: list = None, **kwargs) -> Iterator[str]:
        """Streams the start of a story."""
        messages = self._build_messages(text, word_count, lore)
        yield from self._stream_llm(messages)

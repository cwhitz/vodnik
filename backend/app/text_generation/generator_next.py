from typing import Iterator

from app.text_generation.generator import TextGenerator
from app.providers.base import LLMProvider


class TextGeneratorNext(TextGenerator):
    def __init__(self, provider: LLMProvider):
        super().__init__(provider)

    def _build_messages(self, text: str, additional_instructions: str, word_count: int, lore: list = None) -> list:
        """Build the messages for text generation."""
        lore_context = self._format_lore(lore) if lore else ""

        system_content = f"""You are a story writing assistant.
The user will provide the last lines of text, append it with writing of your own.{lore_context}

The user has also provided some additional instructions on where they want the story to go:
{additional_instructions}

Add about {word_count} words with no preamble, only the text."""

        return [
            {"role": "system", "content": system_content},
            {"role": "user", "content": text}
        ]

    def generate(self, text: str, additional_instructions: str, word_count: int, lore: list = None, **kwargs) -> str:
        """Autogenerates the next line of the text."""
        messages = self._build_messages(text, additional_instructions, word_count, lore)
        return self._call_llm(messages)

    def stream(self, text: str, additional_instructions: str, word_count: int, lore: list = None, **kwargs) -> Iterator[str]:
        """Streams the next line of the text."""
        messages = self._build_messages(text, additional_instructions, word_count, lore)
        yield from self._stream_llm(messages)

from typing import Iterator

from app.text_generation.generator import TextGenerator
from app.providers.base import LLMProvider


class TextGeneratorBetween(TextGenerator):
    def __init__(self, provider: LLMProvider):
        super().__init__(provider)

    def _build_messages(self, text: str, additional_instructions: str, word_count: int, current_position: int, lore: list = None) -> list:
        """Build the messages for text generation."""
        lore_context = self._format_lore(lore) if lore else ""

        system_content = f"""You are a story writing assistant.
The user is asking for you to add {word_count} words of text between two already written segments that they will share.
You must return only your insertions, without any preamble or any of the text provided.{lore_context}

In addition, they have provided these instructions:
{additional_instructions}"""

        return [
            {"role": "system", "content": system_content},
            {"role": "user", "content": f">>> Starting text: {text[:current_position]}. >>> Ending text: {text[current_position:]}"}
        ]

    def generate(self, text: str, additional_instructions: str, word_count: int, current_position: int, lore: list = None, **kwargs) -> str:
        """Autogenerates text between two segments."""
        messages = self._build_messages(text, additional_instructions, word_count, current_position, lore)
        return self._call_llm(messages)

    def stream(self, text: str, additional_instructions: str, word_count: int, current_position: int, lore: list = None, **kwargs) -> Iterator[str]:
        """Streams text between two segments."""
        messages = self._build_messages(text, additional_instructions, word_count, current_position, lore)
        yield from self._stream_llm(messages)

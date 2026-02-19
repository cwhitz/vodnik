from abc import ABC, abstractmethod
from typing import Iterator

from app.providers.base import LLMProvider


class TextGenerator(ABC):
    def __init__(self, provider: LLMProvider):
        self.provider = provider

    @abstractmethod
    def generate(self, text: str, additional_instructions: str, word_count: int, **kwargs) -> str:
        """Generates text based on the provided input."""
        pass

    @abstractmethod
    def stream(self, text: str, additional_instructions: str, word_count: int, **kwargs) -> Iterator[str]:
        """Streams text generation, yielding chunks."""
        pass

    def _format_lore(self, lore_items: list) -> str:
        """Formats lore items into a structured context string for the LLM."""
        if not lore_items:
            return ""

        # Group lore by category
        categories = {}
        for item in lore_items:
            category = item.get('category', 'other')
            if category not in categories:
                categories[category] = []
            categories[category].append(item.get('text', ''))

        # Build formatted string
        lore_text = "\n\nSTORY CONTEXT AND LORE:\n"

        # Map category keys to display names
        category_names = {
            'character': 'Characters',
            'setting': 'Setting',
            'plot point': 'Plot Points'
        }

        for category_key, items in categories.items():
            display_name = category_names.get(category_key, category_key.title())
            lore_text += f"\n{display_name}:\n"
            for item_text in items:
                lore_text += f"• {item_text}\n"

        return lore_text

    def _call_llm(self, messages: list, temperature: float = 0.8, max_tokens: int = 1000) -> str:
        """Call the LLM provider with the given messages."""
        return self.provider.generate(messages, temperature, max_tokens)

    def _stream_llm(self, messages: list, temperature: float = 0.8, max_tokens: int = 1000) -> Iterator[str]:
        """Stream from the LLM provider, yielding text chunks."""
        yield from self.provider.stream(messages, temperature, max_tokens)

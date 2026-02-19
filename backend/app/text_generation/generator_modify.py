from typing import Iterator

from app.text_generation.generator import TextGenerator
from app.providers.base import LLMProvider


class TextGeneratorModify(TextGenerator):
    def __init__(self, provider: LLMProvider):
        super().__init__(provider)

    def _build_messages(self, selected_text: str, additional_instructions: str, lore: list = None, text_before: str = "", text_after: str = "") -> list:
        """Build the messages for section modification."""

        context_block = ""
        if text_before or text_after:
            before_excerpt = text_before[-600:] if len(text_before) > 600 else text_before
            after_excerpt = text_after[:300] if len(text_after) > 300 else text_after
            context_block = f"""
The passage appears in this story context (for reference only — do NOT rewrite this):
{selected_text}

...{before_excerpt}[PASSAGE]{after_excerpt}...
"""

        system_content = f"""You are a story editing assistant. The user has selected a passage from their story and wants you to rewrite it: {context_block}

Instructions from the user:
{additional_instructions}

You should keep your response to approximately the same length as the text being replaced - {len(selected_text.split(' '))} words. 

Return ONLY the rewritten passage — no preamble, no explanation, no surrounding quotes. Match the surrounding prose style unless instructed otherwise."""

        return [
            {"role": "system", "content": system_content},
            {"role": "user", "content": selected_text}
        ]

    def generate(self, selected_text: str, additional_instructions: str, lore: list = None, text_before: str = "", text_after: str = "", **kwargs) -> str:
        """Rewrites the selected passage according to instructions."""
        messages = self._build_messages(selected_text, additional_instructions, lore, text_before, text_after)
        return self._call_llm(messages)

    def stream(self, selected_text: str, additional_instructions: str, lore: list = None, text_before: str = "", text_after: str = "", **kwargs) -> Iterator[str]:
        """Streams the rewritten passage."""
        messages = self._build_messages(selected_text, additional_instructions, lore, text_before, text_after)
        yield from self._stream_llm(messages)

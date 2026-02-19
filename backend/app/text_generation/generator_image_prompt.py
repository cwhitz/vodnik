from typing import Iterator

from app.text_generation.generator import TextGenerator
from app.providers.base import LLMProvider


class TextGeneratorImagePrompt(TextGenerator):
    def __init__(self, provider: LLMProvider):
        super().__init__(provider)

    def _build_messages(self, selected_text: str, lore: list = None, text_before: str = "", text_after: str = "") -> list:
        """Build messages to generate an image prompt from a prose passage."""

        lore_block = ""
        if lore:
            lore_lines = "\n".join(
                f"- [{item['category']}] {item['text']}" for item in lore if item.get("text", "").strip()
            )
            if lore_lines:
                lore_block = f"\n\nStory lore for reference:\n{lore_lines}"

        context_block = ""
        if text_before or text_after:
            before_excerpt = text_before[-400:] if len(text_before) > 400 else text_before
            after_excerpt = text_after[:200] if len(text_after) > 200 else text_after
            context_block = f"\n\nSurrounding context (for reference only):\n...{before_excerpt}[PASSAGE]{after_excerpt}..."

        system_content = (
            "You are an expert prompt engineer for text-to-image AI models such as Stable Diffusion, "
            "Midjourney, and DALL-E.\n\n"
            "The user will give you a passage of prose. Your job is to write a single image generation "
            "prompt that visually illustrates the scene described.\n\n"
            "Rules:\n"
            "- Return ONLY the image prompt — no preamble, no explanation, no quotes\n"
            "- Be specific: describe subjects, setting, lighting, mood, composition, and art style\n"
            "- Use evocative, concrete visual language\n"
            "- Keep it to 2–4 sentences or a rich comma-separated list of descriptors"
            f"{lore_block}{context_block}"
        )

        return [
            {"role": "system", "content": system_content},
            {"role": "user", "content": f"Write an image prompt for this passage:\n\n{selected_text}"},
        ]

    def generate(self, selected_text: str, lore: list = None, text_before: str = "", text_after: str = "", **kwargs) -> str:
        messages = self._build_messages(selected_text, lore, text_before, text_after)
        return self._call_llm(messages)

    def stream(self, selected_text: str, lore: list = None, text_before: str = "", text_after: str = "", **kwargs) -> Iterator[str]:
        messages = self._build_messages(selected_text, lore, text_before, text_after)
        yield from self._stream_llm(messages)

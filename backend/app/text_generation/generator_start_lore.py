import json
import logging

from app.providers.base import LLMProvider

logger = logging.getLogger(__name__)


class TextGeneratorStartLore:
    """Generates 4-5 starting lore items from a story prompt and its opening prose."""

    def __init__(self, provider: LLMProvider):
        self.provider = provider

    def _build_messages(self, prompt: str, prose: str) -> list:
        system_content = (
            "You are a story worldbuilding assistant. You have been given a story prompt "
            "and its opening prose. Extract or invent 4-5 key lore elements that define "
            "this story's world and characters. These notes help a writer continue the story consistently.\n\n"
            "Return ONLY a valid JSON array with this exact structure — no markdown, no explanation:\n"
            '[\n'
            '  {"category": "character", "text": "Description of a key character"},\n'
            '  {"category": "setting", "text": "Description of the world or location"},\n'
            '  ...\n'
            ']\n\n'
            'Valid categories (use only these three): "character", "setting", "plot point"\n\n'
            "Rules:\n"
            "- Return ONLY the JSON array\n"
            "- Each text should be 1-3 sentences, specific to this story\n"
            "- Mix categories for variety — at least one of each where possible\n"
            "- Be concrete, not generic (name characters, describe specific places)"
        )

        user_content = f"Story prompt:\n{prompt}\n\nOpening prose:\n{prose}"

        return [
            {"role": "system", "content": system_content},
            {"role": "user", "content": user_content},
        ]

    def generate_lore(self, prompt: str, prose: str) -> list:
        """Returns a list of {category, text} dicts parsed from the LLM's JSON response."""
        messages = self._build_messages(prompt, prose)
        raw = self.provider.generate(messages, temperature=0.7, max_tokens=800)
        raw = raw.strip()

        # Strip markdown code fences if the model wraps the JSON
        if raw.startswith("```"):
            parts = raw.split("```")
            if len(parts) >= 3:
                raw = parts[1]
            else:
                raw = parts[-1]
            if raw.startswith("json"):
                raw = raw[4:]
            raw = raw.strip()

        items = json.loads(raw)

        valid_categories = {"character", "setting", "plot point"}
        result = []
        for item in items:
            category = item.get("category", "character").lower()
            if category not in valid_categories:
                category = "character"
            text = item.get("text", "").strip()
            if text:
                result.append({"category": category, "text": text})

        return result

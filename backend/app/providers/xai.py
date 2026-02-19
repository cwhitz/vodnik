import json
from typing import Iterator

import requests
from app.providers.base import LLMProvider


DEFAULT_MODEL = "grok-3-mini"
AVAILABLE_MODELS = ["grok-3-mini", "grok-3"]


class XAIProvider(LLMProvider):
    def __init__(self, api_key: str, model: str | None = None):
        self.api_key = api_key
        self.model = model or DEFAULT_MODEL
        self.api_url = "https://api.x.ai/v1/chat/completions"

    def _get_headers(self) -> dict:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

    def generate(self, messages: list[dict], temperature: float, max_tokens: int) -> str:
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }

        resp = requests.post(
            self.api_url,
            headers=self._get_headers(),
            json=payload,
            timeout=120
        )

        if resp.status_code != 200:
            try:
                err = resp.json()
            except Exception:
                err = resp.text
            raise RuntimeError(f"XAI API error: {err}")

        data = resp.json()
        return data["choices"][0]["message"]["content"].strip()

    def stream(self, messages: list[dict], temperature: float, max_tokens: int) -> Iterator[str]:
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": True
        }

        resp = requests.post(
            self.api_url,
            headers=self._get_headers(),
            json=payload,
            timeout=120,
            stream=True
        )

        if resp.status_code != 200:
            try:
                err = resp.json()
            except Exception:
                err = resp.text
            raise RuntimeError(f"XAI API error: {err}")

        for line in resp.iter_lines():
            if line:
                line = line.decode("utf-8")
                if line.startswith("data: "):
                    data_str = line[6:]
                    if data_str == "[DONE]":
                        break
                    try:
                        data = json.loads(data_str)
                        content = data["choices"][0]["delta"].get("content")
                        if content:
                            yield content
                    except json.JSONDecodeError:
                        continue

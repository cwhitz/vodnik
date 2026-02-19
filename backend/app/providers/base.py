from abc import ABC, abstractmethod
from typing import Iterator


class LLMProvider(ABC):
    @abstractmethod
    def generate(self, messages: list[dict], temperature: float, max_tokens: int) -> str:
        """Send messages to LLM and return generated text."""
        pass

    @abstractmethod
    def stream(self, messages: list[dict], temperature: float, max_tokens: int) -> Iterator[str]:
        """Stream messages from LLM, yielding text chunks."""
        pass

from typing import Optional
from app.ai.interface import BaseAIProvider
from app.ai.ollama_provider import OllamaProvider

_active_provider: Optional[BaseAIProvider] = None


def get_ai_provider() -> BaseAIProvider:
    """Retrieve the active local AI provider instance."""
    global _active_provider
    if _active_provider is None:
        _active_provider = OllamaProvider()
    return _active_provider


def set_ai_provider(provider: Optional[BaseAIProvider]) -> None:
    """Override the active AI provider (used for test mocking and dependency injection)."""
    global _active_provider
    _active_provider = provider

from abc import ABC, abstractmethod
from typing import List, Dict, Optional, Any
from enum import Enum
from pydantic import BaseModel, Field


class AIReadinessStatus(str, Enum):
    HEALTHY = "healthy"
    OLLAMA_UNREACHABLE = "ollama_unreachable"
    MODEL_UNCONFIGURED = "model_unconfigured"
    MODEL_MISSING = "model_missing"
    INFERENCE_FAILED = "inference_failed"


class AIReadinessResult(BaseModel):
    """Authoritative diagnostics on local AI daemon, text model, and vision model readiness."""
    status: AIReadinessStatus
    backend_available: bool = True
    ollama_connected: bool = False
    configured_text_model: str = ""
    text_model_available: bool = False
    vision_model: str = ""
    vision_model_available: bool = False
    available_models: List[str] = Field(default_factory=list)
    latency_ms: int = 0
    message: Optional[str] = None
    actionable_message: Optional[str] = None
    error: Optional[str] = None

    # Backward compatibility aliases
    ollama_reachable: bool = False
    configured_model: str = ""
    model_available: bool = False
    inference_ready: bool = False


class DialoguePromptContext(BaseModel):
    """Bounded, sanitized context passed to the AI provider for character dialogue."""
    character_id: str
    character_name: str
    role_type: str
    entity_type: str
    speaking_style: str
    personality: str
    current_trust: int
    current_status: str
    whitelisted_known_facts: List[str] = Field(default_factory=list)
    strictly_forbidden_lore: List[str] = Field(default_factory=list)
    discovered_clues: List[str] = Field(default_factory=list)
    recent_dialogue: List[Dict[str, str]] = Field(default_factory=list)
    player_query: str
    fallback_dialogue: Optional[str] = None
    turn_counter: int
    player_sanity: int
    ectoplasmic_tension: int
    candle_percentage: float


class DialogueGenerationResult(BaseModel):
    """Validated, sanitized output of character speech synthesis."""
    dialogue_text: str
    emotional_cue: str = "Guarded"
    atmospheric_effect: Optional[str] = None
    model_used: str = ""
    latency_ms: int = 0


class VisualEvidenceResult(BaseModel):
    """Subjective, atmospheric visual observation synthesized via local vision model.
    
    CRITICAL: Never automatically unlocks clues, changes mystery state, or determines endings.
    """
    observation: str
    model_used: str = ""
    latency_ms: int = 0
    is_subjective_suggestion: bool = True
    disclaimer: str = "Visual observations are subjective atmospheric impressions and do not alter authoritative case state."


class BaseAIProvider(ABC):
    """Abstract interface for local AI providers.
    
    Adheres strictly to local offline-first constraints.
    Does not pull models or connect to external cloud endpoints.
    """

    @abstractmethod
    async def check_readiness(self) -> AIReadinessResult:
        """Evaluate local server reachability, model existence, and inference readiness."""
        pass

    @abstractmethod
    async def generate_dialogue(self, context: DialoguePromptContext) -> DialogueGenerationResult:
        """Synthesize in-character dialogue adhering strictly to knowledge boundaries."""
        pass

    @abstractmethod
    async def analyze_visual_evidence(
        self,
        image_bytes: bytes,
        mime_type: str = "image/jpeg",
        prompt: Optional[str] = None,
    ) -> VisualEvidenceResult:
        """Synthesize an atmospheric visual description using the configured local vision model."""
        pass

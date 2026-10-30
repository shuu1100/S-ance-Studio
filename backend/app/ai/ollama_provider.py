import base64
import contextlib
import time
from typing import List, Optional
import httpx

from app.config import settings
from app.ai.interface import (
    BaseAIProvider,
    AIReadinessStatus,
    AIReadinessResult,
    DialoguePromptContext,
    DialogueGenerationResult,
    VisualEvidenceResult,
)
from app.ai.exceptions import (
    AIProviderError,
    AIConnectionError,
    AIModelNotFoundError,
    AITimeoutError,
    AIResponseError,
    AIInputValidationError,
)
from app.ai.prompt_builder import PromptBuilder
from app.ai.sanitizer import OutputSanitizer


class OllamaProvider(BaseAIProvider):
    """Authoritative local Ollama provider adhering strictly to local offline-first constraints.
    
    - Never calls external cloud APIs.
    - Never automatically pulls or downloads models.
    - Never silently switches to unconfigured models.
    - Strictly reports accurate reachability and model installation statuses.
    """

    def __init__(
        self,
        base_url: Optional[str] = None,
        model_name: Optional[str] = None,
        vision_model_name: Optional[str] = None,
        timeout_seconds: Optional[float] = None,
        keep_alive: Optional[str] = None,
        client: Optional[httpx.AsyncClient] = None,
    ):
        self.base_url = (base_url or settings.OLLAMA_BASE_URL).rstrip("/")
        self.model_name = model_name if model_name is not None else settings.OLLAMA_MODEL
        self.vision_model_name = (
            vision_model_name
            if vision_model_name is not None
            else getattr(settings, "OLLAMA_VISION_MODEL", "qwen3-vl:8b")
        )
        self.timeout_seconds = (
            timeout_seconds if timeout_seconds is not None else settings.OLLAMA_TIMEOUT_SECONDS
        )
        self.keep_alive = (
            keep_alive if keep_alive is not None else getattr(settings, "OLLAMA_KEEP_ALIVE", "5m")
        )
        self.client = client

    @contextlib.asynccontextmanager
    async def _get_client(self, timeout: float):
        if self.client is not None:
            yield self.client
        else:
            async with httpx.AsyncClient(timeout=timeout) as c:
                yield c

    def _normalize_model_tag(self, name: str) -> str:
        """Strip :latest suffix for robust comparison."""
        return name[:-7] if name.endswith(":latest") else name

    async def check_readiness(self) -> AIReadinessResult:
        """Evaluate local Ollama daemon reachability, model existence, and inference readiness."""
        start_time = time.time()
        available_models: List[str] = []

        # 1. Probe Ollama daemon tags endpoint
        try:
            async with self._get_client(timeout=3.0) as client:
                resp = await client.get(f"{self.base_url}/api/tags")
                if resp.status_code != 200:
                    latency = int((time.time() - start_time) * 1000)
                    msg = f"Local Ollama daemon returned status {resp.status_code}. Ensure Ollama is running properly at {self.base_url}."
                    return AIReadinessResult(
                        status=AIReadinessStatus.OLLAMA_UNREACHABLE,
                        backend_available=True,
                        ollama_connected=False,
                        ollama_reachable=False,
                        configured_text_model=self.model_name,
                        configured_model=self.model_name,
                        text_model_available=False,
                        model_available=False,
                        vision_model=self.vision_model_name,
                        vision_model_available=False,
                        inference_ready=False,
                        latency_ms=latency,
                        error=f"Ollama returned HTTP status {resp.status_code}",
                        message=msg,
                        actionable_message=msg,
                    )
                tags_data = resp.json()
                models_list = tags_data.get("models", [])
                available_models = [m.get("name", "") for m in models_list if m.get("name")]
        except (httpx.ConnectError, httpx.ConnectTimeout) as e:
            latency = int((time.time() - start_time) * 1000)
            msg = f"Ollama server is unreachable at {self.base_url}. Start the Ollama desktop app or run 'ollama serve' in your terminal."
            return AIReadinessResult(
                status=AIReadinessStatus.OLLAMA_UNREACHABLE,
                backend_available=True,
                ollama_connected=False,
                ollama_reachable=False,
                configured_text_model=self.model_name,
                configured_model=self.model_name,
                text_model_available=False,
                model_available=False,
                vision_model=self.vision_model_name,
                vision_model_available=False,
                inference_ready=False,
                latency_ms=latency,
                error=f"Connection refused at {self.base_url}",
                message=msg,
                actionable_message=msg,
            )
        except Exception as e:
            latency = int((time.time() - start_time) * 1000)
            msg = f"Unexpected error communicating with Ollama at {self.base_url}: {str(e)}"
            return AIReadinessResult(
                status=AIReadinessStatus.OLLAMA_UNREACHABLE,
                backend_available=True,
                ollama_connected=False,
                ollama_reachable=False,
                configured_text_model=self.model_name,
                configured_model=self.model_name,
                text_model_available=False,
                model_available=False,
                vision_model=self.vision_model_name,
                vision_model_available=False,
                inference_ready=False,
                latency_ms=latency,
                error=str(e),
                message=msg,
                actionable_message=msg,
            )

        latency = int((time.time() - start_time) * 1000)

        # 2. Check if text model name is configured
        if not self.model_name or not self.model_name.strip():
            msg = "No local model configured in OLLAMA_MODEL. Set OLLAMA_MODEL in your .env file."
            return AIReadinessResult(
                status=AIReadinessStatus.MODEL_UNCONFIGURED,
                backend_available=True,
                ollama_connected=True,
                ollama_reachable=True,
                configured_text_model="",
                configured_model="",
                text_model_available=False,
                model_available=False,
                vision_model=self.vision_model_name,
                vision_model_available=False,
                inference_ready=False,
                available_models=available_models,
                latency_ms=latency,
                message=msg,
                actionable_message=msg,
            )

        # 3. Check installed text model and vision model
        normalized_available = {self._normalize_model_tag(m): m for m in available_models}
        
        normalized_target = self._normalize_model_tag(self.model_name)
        text_model_available = (
            normalized_target in normalized_available or self.model_name in available_models
        )

        normalized_vision = self._normalize_model_tag(self.vision_model_name)
        vision_model_available = (
            normalized_vision in normalized_available or self.vision_model_name in available_models
        )

        if not text_model_available:
            avail_str = f" Installed models: {', '.join(available_models)}" if available_models else " No models currently installed."
            msg = f"Configured text model '{self.model_name}' is not installed.{avail_str} Update OLLAMA_MODEL in .env to an installed model."
            return AIReadinessResult(
                status=AIReadinessStatus.MODEL_MISSING,
                backend_available=True,
                ollama_connected=True,
                ollama_reachable=True,
                configured_text_model=self.model_name,
                configured_model=self.model_name,
                text_model_available=False,
                model_available=False,
                vision_model=self.vision_model_name,
                vision_model_available=vision_model_available,
                inference_ready=False,
                available_models=available_models,
                latency_ms=latency,
                error=f"Model '{self.model_name}' not found in local Ollama repository.",
                message=msg,
                actionable_message=msg,
            )

        # 4. Success: Ready for local inference
        ready_msg = f"Local AI ready. Primary text model '{self.model_name}' active."
        if vision_model_available:
            ready_msg += f" Vision model '{self.vision_model_name}' available."

        return AIReadinessResult(
            status=AIReadinessStatus.HEALTHY,
            backend_available=True,
            ollama_connected=True,
            ollama_reachable=True,
            configured_text_model=self.model_name,
            configured_model=self.model_name,
            text_model_available=True,
            model_available=True,
            vision_model=self.vision_model_name,
            vision_model_available=vision_model_available,
            inference_ready=True,
            available_models=available_models,
            latency_ms=latency,
            message=ready_msg,
            actionable_message=ready_msg,
        )

    async def generate_dialogue(self, context: DialoguePromptContext) -> DialogueGenerationResult:
        """Synthesize in-character dialogue adhering strictly to knowledge boundaries."""
        if not self.model_name:
            raise AIModelNotFoundError("", [])

        messages = PromptBuilder.build_chat_messages(context)
        start_time = time.time()

        payload = {
            "model": self.model_name,
            "messages": messages,
            "stream": False,
            "format": "json",
            "think": False,
            "keep_alive": self.keep_alive,
            "options": {
                "num_predict": 300,
                "temperature": 0.7,
            },
        }

        try:
            async with self._get_client(timeout=self.timeout_seconds) as client:
                resp = await client.post(f"{self.base_url}/api/chat", json=payload)
        except (httpx.ConnectError, httpx.ConnectTimeout) as e:
            raise AIConnectionError(self.base_url, detail=str(e))
        except httpx.TimeoutException:
            raise AITimeoutError(self.timeout_seconds, self.model_name)
        except Exception as e:
            raise AIProviderError(f"HTTP transport failure calling local Ollama: {str(e)}")

        latency_ms = int((time.time() - start_time) * 1000)

        if resp.status_code == 404:
            raise AIModelNotFoundError(self.model_name)
        elif resp.status_code != 200:
            raise AIResponseError(f"Ollama returned HTTP {resp.status_code}: {resp.text[:200]}")

        resp_json = resp.json()
        message_data = resp_json.get("message", {})
        raw_content = message_data.get("content", "")

        # If content is empty (e.g. reasoning token truncation), check thinking
        if not raw_content and "thinking" in message_data:
            raw_content = message_data.get("thinking", "")

        dialogue_text, emotional_cue, atmospheric_effect = OutputSanitizer.parse_and_sanitize(
            raw_content, forbidden_lore=context.strictly_forbidden_lore
        )

        return DialogueGenerationResult(
            dialogue_text=dialogue_text,
            emotional_cue=emotional_cue,
            atmospheric_effect=atmospheric_effect,
            model_used=self.model_name,
            latency_ms=latency_ms,
        )

    async def analyze_visual_evidence(
        self,
        image_bytes: bytes,
        mime_type: str = "image/jpeg",
        prompt: Optional[str] = None,
    ) -> VisualEvidenceResult:
        """Synthesize an atmospheric visual description using the configured local vision model.
        
        CRITICAL CONSTRAINTS:
        - Only calls local Ollama server (strictly zero cloud APIs).
        - Validates image size (<10MB) and MIME type.
        - Avoids logging raw image contents or sensitive paths.
        - Produces subjective impressions only; NEVER alters game state or auto-unlocks clues.
        """
        # 1. Validation
        max_bytes = 10 * 1024 * 1024  # 10 MB limit
        if len(image_bytes) > max_bytes:
            raise AIInputValidationError(f"Visual evidence size ({len(image_bytes)} bytes) exceeds the 10MB limit.")

        allowed_mimes = {"image/jpeg", "image/png", "image/webp"}
        if mime_type.lower() not in allowed_mimes:
            raise AIInputValidationError(f"Unsupported image format '{mime_type}'. Supported: JPEG, PNG, WebP.")

        # 2. Check if vision model is installed
        readiness = await self.check_readiness()
        if not readiness.ollama_connected:
            raise AIConnectionError(self.base_url, detail=readiness.error or "Ollama unreachable")
        if not readiness.vision_model_available:
            raise AIModelNotFoundError(
                self.vision_model_name,
                readiness.available_models,
            )

        start_time = time.time()
        base64_image = base64.b64encode(image_bytes).decode("utf-8")

        vision_instruction = (
            prompt
            or "You are inspecting a piece of forensic evidence or chamber in a Victorian gothic mystery set in 1922. "
            "Describe the visual, atmospheric, and material details you observe (e.g. stains, engravings, dust, light, materials). "
            "Keep your observation concise (2 to 4 sentences), somber, and objective. "
            "Do not claim to know who the murderer is or declare the case solved."
        )

        payload = {
            "model": self.vision_model_name,
            "messages": [
                {
                    "role": "user",
                    "content": vision_instruction,
                    "images": [base64_image],
                }
            ],
            "stream": False,
            "keep_alive": self.keep_alive,
            "options": {
                "num_predict": 250,
                "temperature": 0.5,
            },
        }

        try:
            async with self._get_client(timeout=self.timeout_seconds) as client:
                resp = await client.post(f"{self.base_url}/api/chat", json=payload)
        except (httpx.ConnectError, httpx.ConnectTimeout) as e:
            raise AIConnectionError(self.base_url, detail=str(e))
        except httpx.TimeoutException:
            raise AITimeoutError(self.timeout_seconds, self.vision_model_name)
        except Exception as e:
            raise AIProviderError(f"HTTP transport failure calling local vision model: {str(e)}")

        latency_ms = int((time.time() - start_time) * 1000)

        if resp.status_code == 404:
            raise AIModelNotFoundError(self.vision_model_name)
        elif resp.status_code != 200:
            raise AIResponseError(f"Ollama returned HTTP {resp.status_code}: {resp.text[:200]}")

        resp_json = resp.json()
        message_data = resp_json.get("message", {})
        observation_text = message_data.get("content", "").strip()

        if not observation_text:
            observation_text = "The shadow and grain of the exhibit obscure further discernible impressions."

        return VisualEvidenceResult(
            observation=observation_text,
            model_used=self.vision_model_name,
            latency_ms=latency_ms,
            is_subjective_suggestion=True,
            disclaimer="Visual observations are subjective atmospheric impressions and do not alter authoritative case state.",
        )

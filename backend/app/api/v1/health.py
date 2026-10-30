import base64
import time
from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.config import settings
from app.schemas.common import ApiResponse
from app.ai.factory import get_ai_provider
from app.ai.exceptions import (
    AIConnectionError,
    AIModelNotFoundError,
    AIInputValidationError,
    AITimeoutError,
)

router = APIRouter(tags=["Health & Diagnostics"])


class VisualEvidencePayload(BaseModel):
    image_base64: str
    mime_type: str = "image/jpeg"
    prompt: Optional[str] = None


@router.get("/health")
async def get_health(db: Session = Depends(get_db)):
    """Health check validating SQLite access and local Ollama daemon reachability."""
    db_ok = False
    try:
        db.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False

    provider = get_ai_provider()
    ai_status = await provider.check_readiness()

    overall_status = "healthy" if (db_ok and ai_status.inference_ready) else "degraded" if db_ok else "unhealthy"

    return ApiResponse.ok({
        "status": overall_status,
        "backend_available": True,
        "database_connected": db_ok,
        "ollama_connected": ai_status.ollama_connected,
        "configured_text_model": ai_status.configured_text_model,
        "text_model_available": ai_status.text_model_available,
        "vision_model": ai_status.vision_model,
        "vision_model_available": ai_status.vision_model_available,
        "configured_model": ai_status.configured_model,
        "model_available": ai_status.model_available,
        "inference_ready": ai_status.inference_ready,
        "active_model": ai_status.configured_text_model if ai_status.text_model_available else None,
        "message": ai_status.message,
        "actionable_message": ai_status.actionable_message,
        "offline_strict_mode": settings.OFFLINE_STRICT_MODE,
        "environment": settings.ENVIRONMENT,
    })


@router.get("/ai/status")
async def get_ai_status():
    """Detailed local AI daemon diagnostic status."""
    provider = get_ai_provider()
    status_result = await provider.check_readiness()

    return ApiResponse.ok({
        "status": status_result.status.value,
        "backend_available": status_result.backend_available,
        "ollama_connected": status_result.ollama_connected,
        "connected": status_result.ollama_connected,
        "endpoint": settings.OLLAMA_BASE_URL,
        "configured_text_model": status_result.configured_text_model,
        "configured_model": status_result.configured_model,
        "active_model": status_result.configured_text_model if status_result.text_model_available else None,
        "text_model_available": status_result.text_model_available,
        "model_available": status_result.text_model_available,
        "vision_model": status_result.vision_model,
        "vision_model_available": status_result.vision_model_available,
        "inference_ready": status_result.inference_ready,
        "available_models": status_result.available_models,
        "latency_ms": status_result.latency_ms,
        "auto_download_allowed": settings.ALLOW_MODEL_AUTO_DOWNLOAD,
        "message": status_result.message,
        "actionable_message": status_result.actionable_message,
        "error": status_result.error,
    })


@router.post("/ai/visual-evidence")
async def analyze_visual_evidence(payload: VisualEvidencePayload):
    """Analyze visual evidence using the optional local vision model (qwen3-vl:8b).
    
    CRITICAL CONSTRAINTS:
    - Never alters authoritative game state, unlocks clues, or determines endings.
    - Completely optional; gameplay proceeds with or without vision analysis.
    - Operates purely offline via local loopback.
    """
    try:
        raw_bytes = base64.b64decode(payload.image_base64)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid base64-encoded image payload.",
        )

    provider = get_ai_provider()
    try:
        result = await provider.analyze_visual_evidence(
            image_bytes=raw_bytes,
            mime_type=payload.mime_type,
            prompt=payload.prompt,
        )
        result_data = result.model_dump() if hasattr(result, "model_dump") else result
        return ApiResponse.ok(result_data)
    except (AIConnectionError, AIModelNotFoundError) as ce:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"{ce.message} {ce.actionable_message}".strip(),
        )
    except AIInputValidationError as ive:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{ive.message} {ive.actionable_message}".strip(),
        )
    except AITimeoutError as te:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail=f"{te.message} {te.actionable_message}".strip(),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Visual evidence analysis failed: {str(e)}",
        )

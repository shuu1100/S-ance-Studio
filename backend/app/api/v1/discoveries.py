from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.session import InvestigationSession
from app.models.clue import ClueDefinition
from app.engine.clue_rules import resolve_clue_discovery
from app.engine.state_machine import handle_present_evidence
from app.schemas.clue import DiscoveryCreateRequest, PresentEvidenceRequest, ClueResponse
from app.schemas.dialogue import DialogueMessageResponse
from app.schemas.common import ApiResponse

router = APIRouter(tags=["Discoveries & Evidence Presentation"])


@router.post("/investigations/{session_id}/discoveries", response_model=ApiResponse[ClueResponse], status_code=status.HTTP_201_CREATED)
def record_discovery(
    session_id: str,
    payload: DiscoveryCreateRequest,
    db: Session = Depends(get_db),
):
    """Register an unlocked clue discovery in an active investigation."""
    session = db.query(InvestigationSession).filter_by(id=session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Investigation session '{session_id}' not found.",
        )
    if session.status != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Session is {session.status}. Clues cannot be discovered.",
        )

    try:
        disc, _ = resolve_clue_discovery(
            db, session, payload.clue_id, method=payload.discovery_method
        )
        clue_def = db.query(ClueDefinition).filter_by(id=payload.clue_id).first()
        db.commit()

        return ApiResponse.ok(
            ClueResponse(
                id=clue_def.id,
                title=clue_def.title,
                subtitle=clue_def.subtitle,
                category=clue_def.category,
                status=disc.status,
                description=clue_def.description,
                location_found=clue_def.source,
                associated_suspects=clue_def.associated_suspects or [],
                evidence_marker=clue_def.evidence_marker,
                discovered_at_turn=disc.discovered_at_turn,
                is_key_evidence=clue_def.is_key_evidence,
            )
        )
    except ValueError as ve:
        db.rollback()
        if "unknown" in str(ve).lower() or "not found" in str(ve).lower():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to record clue discovery.",
        ) from e


@router.post("/investigations/{session_id}/present-evidence", response_model=ApiResponse[DialogueMessageResponse])
def present_evidence(
    session_id: str,
    payload: PresentEvidenceRequest,
    db: Session = Depends(get_db),
):
    """Confront a character with a discovered piece of evidence."""
    session = db.query(InvestigationSession).filter_by(id=session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Investigation session '{session_id}' not found.",
        )
    if session.status != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Session is {session.status}. Evidence cannot be presented.",
        )

    try:
        char_msg, _ = handle_present_evidence(
            db, session, payload.character_id, payload.clue_id
        )
        db.commit()

        return ApiResponse.ok(
            DialogueMessageResponse(
                id=char_msg.id,
                sender_id=payload.character_id,
                sender_name=char_msg.sender_name,
                speaker_type=char_msg.speaker_type,
                text=char_msg.content,
                emotional_cue=char_msg.emotional_cue,
                atmospheric_effect=char_msg.atmospheric_effect,
                turn_number=char_msg.turn_number,
                timestamp=char_msg.timestamp.strftime("%I:%M %p"),
                clue_presented_id=payload.clue_id,
            )
        )
    except ValueError as ve:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error presenting evidence.",
        ) from e

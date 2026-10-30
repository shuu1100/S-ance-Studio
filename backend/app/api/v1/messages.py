from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.session import InvestigationSession
from app.models.character import CharacterDefinition
from app.models.dialogue import DialogueMessage
from app.engine.state_machine import advance_turn, handle_present_evidence
from app.schemas.dialogue import SendMessageRequest, DialogueMessageResponse
from app.schemas.common import ApiResponse

from app.ai import (
    DialoguePipeline,
    AIProviderError,
    AIConnectionError,
    AIModelNotFoundError,
    AITimeoutError,
    AIResponseError,
    AIInputValidationError,
)

router = APIRouter(tags=["Dialogue & Interviews"])


@router.get("/investigations/{session_id}/messages", response_model=ApiResponse[List[DialogueMessageResponse]])
def get_dialogue_history(session_id: str, db: Session = Depends(get_db)):
    """Retrieve chronologically ordered dialogue utterances for an investigation."""
    session = db.query(InvestigationSession).filter_by(id=session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Investigation session '{session_id}' not found.",
        )

    messages = (
        db.query(DialogueMessage)
        .filter_by(session_id=session_id)
        .order_by(DialogueMessage.turn_number.asc(), DialogueMessage.timestamp.asc())
        .all()
    )

    results = [
        DialogueMessageResponse(
            id=m.id,
            sender_id=m.character_id or "investigator",
            sender_name=m.sender_name,
            speaker_type=m.speaker_type,
            text=m.content,
            emotional_cue=m.emotional_cue,
            atmospheric_effect=m.atmospheric_effect,
            turn_number=m.turn_number,
            timestamp=m.timestamp.strftime("%I:%M %p"),
            clue_presented_id=m.related_evidence_id,
        )
        for m in messages
    ]
    return ApiResponse.ok(results)


import logging
import time

logger = logging.getLogger("seance.dialogue")


@router.post("/investigations/{session_id}/messages", response_model=ApiResponse[DialogueMessageResponse], status_code=status.HTTP_201_CREATED)
async def send_dialogue_message(
    session_id: str,
    payload: SendMessageRequest,
    db: Session = Depends(get_db),
):
    """Post an interrogation query or present evidence to a character."""
    session = db.query(InvestigationSession).filter_by(id=session_id).first()
    if not session:
        logger.warning(f"Inquiry rejected: session '{session_id}' not found.")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "SESSION_NOT_FOUND",
                "message": f"Investigation session '{session_id}' not found.",
            },
        )
    if session.status != "active":
        logger.warning(f"Inquiry rejected: session '{session_id}' is {session.status} (ending: {session.ending_id}).")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "SESSION_COMPLETED",
                "message": f"Session is {session.status}. No messages can be sent.",
                "details": {
                    "session_status": session.status,
                    "ending_id": session.ending_id,
                },
            },
        )

    start_time = time.monotonic()
    target_char_id = payload.character_id or "char_apparition"
    turn_before = session.turn_counter

    logger.info(
        f"Processing inquiry for session '{session_id}', character '{target_char_id}' at turn {turn_before}."
    )

    try:
        # Check if presenting evidence
        if payload.presented_clue_id and payload.character_id:
            char_msg, _ = handle_present_evidence(
                db, session, payload.character_id, payload.presented_clue_id
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
                    clue_presented_id=payload.presented_clue_id,
                )
            )

        # Idempotency check: if the exact query was already submitted and answered on this turn
        clean_content = payload.content.strip().lower()
        last_player_msg = (
            db.query(DialogueMessage)
            .filter_by(session_id=session_id, role="player")
            .order_by(DialogueMessage.turn_number.desc(), DialogueMessage.timestamp.desc())
            .first()
        )
        if last_player_msg and last_player_msg.content.strip().lower() == clean_content:
            existing_reply = (
                db.query(DialogueMessage)
                .filter_by(session_id=session_id, role="character", turn_number=last_player_msg.turn_number)
                .order_by(DialogueMessage.timestamp.desc())
                .first()
            )
            if existing_reply:
                logger.info(
                    f"Idempotent retry: returning existing character reply for session '{session_id}', turn {last_player_msg.turn_number}."
                )
                return ApiResponse.ok(
                    DialogueMessageResponse(
                        id=existing_reply.id,
                        sender_id=existing_reply.character_id or target_char_id,
                        sender_name=existing_reply.sender_name,
                        speaker_type=existing_reply.speaker_type,
                        text=existing_reply.content,
                        emotional_cue=existing_reply.emotional_cue,
                        atmospheric_effect=existing_reply.atmospheric_effect,
                        turn_number=existing_reply.turn_number,
                        timestamp=existing_reply.timestamp.strftime("%I:%M %p"),
                    )
                )

        # Standard dialogue query through DialoguePipeline
        char_msg, gen_result = await DialoguePipeline.process_player_message(
            db=db,
            session=session,
            character_id=target_char_id,
            message_content=payload.content,
        )

        duration = round(time.monotonic() - start_time, 3)
        logger.info(
            f"Inquiry succeeded for session '{session_id}' in {duration}s. Turn advanced {turn_before} -> {session.turn_counter}."
        )

        return ApiResponse.ok(
            DialogueMessageResponse(
                id=char_msg.id,
                sender_id=target_char_id,
                sender_name=char_msg.sender_name,
                speaker_type=char_msg.speaker_type,
                text=char_msg.content,
                emotional_cue=char_msg.emotional_cue,
                atmospheric_effect=char_msg.atmospheric_effect,
                turn_number=char_msg.turn_number,
                timestamp=char_msg.timestamp.strftime("%I:%M %p"),
            )
        )
    except AIInputValidationError as ive:
        db.rollback()
        logger.warning(f"Inquiry validation error: {ive.message}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "VALIDATION_ERROR",
                "message": f"{ive.message} {ive.actionable_message}".strip(),
            },
        )
    except (AIConnectionError, AIModelNotFoundError) as ce:
        db.rollback()
        err_code = "MODEL_NOT_INSTALLED" if isinstance(ce, AIModelNotFoundError) else "OLLAMA_UNAVAILABLE"
        logger.error(f"Inquiry AI provider error ({err_code}): {ce.message}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": err_code,
                "message": f"{ce.message} {ce.actionable_message}".strip(),
            },
        )
    except AITimeoutError as te:
        db.rollback()
        logger.error(f"Inquiry AI timeout: {te.message}")
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail={
                "code": "MODEL_TIMEOUT",
                "message": f"{te.message} {te.actionable_message}".strip(),
            },
        )
    except AIResponseError as re:
        db.rollback()
        logger.error(f"Inquiry empty or malformed model response: {re.message}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={
                "code": "EMPTY_MODEL_RESPONSE",
                "message": f"{re.message} {re.actionable_message}".strip(),
            },
        )
    except ValueError as ve:
        db.rollback()
        logger.warning(f"Inquiry value error: {str(ve)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "INVALID_CHARACTER" if "character" in str(ve).lower() else "BAD_REQUEST",
                "message": str(ve),
            },
        )
    except Exception as e:
        db.rollback()
        logger.exception(f"Unexpected error processing dialogue message: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "UNEXPECTED_ERROR",
                "message": f"Error processing dialogue message: {str(e)}",
            },
        ) from e

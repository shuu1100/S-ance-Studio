from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.session import InvestigationSession, PlayerChoice
from app.schemas.choice import ChoiceCreateRequest, ChoiceResponse
from app.schemas.common import ApiResponse

router = APIRouter(tags=["Player Choices"])


@router.get("/investigations/{session_id}/choices", response_model=ApiResponse[List[ChoiceResponse]])
def get_choices(session_id: str, db: Session = Depends(get_db)):
    """List historical choices made during an investigation session."""
    session = db.query(InvestigationSession).filter_by(id=session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Investigation session '{session_id}' not found.",
        )

    choices = (
        db.query(PlayerChoice)
        .filter_by(session_id=session_id)
        .order_by(PlayerChoice.turn_number.asc())
        .all()
    )

    results = [
        ChoiceResponse(
            id=c.id,
            choice_id=c.choice_id,
            turn_number=c.turn_number,
            action_type=c.action_type,
            target_id=c.target_id,
            decision_text=c.decision_text,
            impact_text=c.impact_text,
            validated_outcome=c.validated_outcome,
            created_at=c.created_at.isoformat(),
        )
        for c in choices
    ]
    return ApiResponse.ok(results)


@router.post("/investigations/{session_id}/choices", response_model=ApiResponse[ChoiceResponse], status_code=status.HTTP_201_CREATED)
def record_player_choice(
    session_id: str,
    payload: ChoiceCreateRequest,
    db: Session = Depends(get_db),
):
    """Validate and record a player decision with its narrative impact."""
    session = db.query(InvestigationSession).filter_by(id=session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Investigation session '{session_id}' not found.",
        )
    if session.status != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Session is {session.status}. Choices cannot be registered.",
        )
    if not payload.choice_id or not payload.choice_id.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Choice ID cannot be empty.",
        )
    if not payload.decision_text or not payload.decision_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Decision text cannot be empty.",
        )

    try:
        choice = PlayerChoice(
            session_id=session.id,
            choice_id=payload.choice_id,
            turn_number=session.turn_counter,
            action_type=payload.action_type,
            target_id=payload.target_id,
            decision_text=payload.decision_text,
            impact_text=payload.impact_text,
            validated_outcome=f"Executed at turn {session.turn_counter}",
        )
        db.add(choice)
        db.commit()
        db.refresh(choice)

        return ApiResponse.ok(
            ChoiceResponse(
                id=choice.id,
                choice_id=choice.choice_id,
                turn_number=choice.turn_number,
                action_type=choice.action_type,
                target_id=choice.target_id,
                decision_text=choice.decision_text,
                impact_text=choice.impact_text,
                validated_outcome=choice.validated_outcome,
                created_at=choice.created_at.isoformat(),
            )
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to record player choice.",
        ) from e

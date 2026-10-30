from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.session import InvestigationSession
from app.engine.game_state_service import GameStateService
from app.engine.inquiry_service import InquiryService
from app.engine.contradiction_service import ContradictionService
from app.engine.objective_service import ObjectiveService
from app.schemas.inquiry import (
    SuggestedQuestionsResponse,
    TopicResponse,
    ContradictionItem,
    ContradictionChallengePayload,
    ContradictionChallengeResponse,
    ObjectiveItem,
    TheoryPayload,
    TheoryResponse,
)
from app.schemas.common import ApiResponse

router = APIRouter(tags=["Inquiries & Deductive Investigation"])


def _get_active_session_and_scenario(session_id: str, db: Session):
    session = db.query(InvestigationSession).filter_by(id=session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Investigation session '{session_id}' not found.",
        )
    scenario = GameStateService.load_scenario(session.scenario_id)
    return session, scenario


@router.get(
    "/investigations/{session_id}/suggestions",
    response_model=ApiResponse[SuggestedQuestionsResponse],
)
def get_suggested_inquiries(
    session_id: str,
    character_id: str = Query(..., description="ID of the character being interviewed"),
    topic_id: Optional[str] = Query(None, description="Optional topic filter"),
    db: Session = Depends(get_db),
):
    """Retrieve dynamic contextual suggested questions (5-8 items) for the active suspect."""
    session, scenario = _get_active_session_and_scenario(session_id, db)
    res = InquiryService.get_suggested_questions(
        session=session,
        character_id=character_id,
        scenario=scenario,
        db=db,
        active_topic_id=topic_id,
    )
    return ApiResponse.ok(data=res)


@router.get(
    "/investigations/{session_id}/topics",
    response_model=ApiResponse[List[TopicResponse]],
)
def get_investigation_topics(
    session_id: str,
    character_id: Optional[str] = Query(None, description="Optional character context"),
    db: Session = Depends(get_db),
):
    """Retrieve all 10 investigation topics with unlocked state, known facts, and leads."""
    session, scenario = _get_active_session_and_scenario(session_id, db)
    res = InquiryService.get_investigation_topics(
        session=session,
        character_id=character_id,
        scenario=scenario,
        db=db,
    )
    return ApiResponse.ok(data=res)


@router.get(
    "/investigations/{session_id}/contradictions",
    response_model=ApiResponse[List[ContradictionItem]],
)
def get_contradictions(
    session_id: str,
    db: Session = Depends(get_db),
):
    """Retrieve available testimony contradictions and evidence conflict points."""
    session, scenario = _get_active_session_and_scenario(session_id, db)
    res = ContradictionService.get_contradictions(session=session, scenario=scenario, db=db)
    return ApiResponse.ok(data=res)


@router.post(
    "/investigations/{session_id}/contradictions/challenge",
    response_model=ApiResponse[ContradictionChallengeResponse],
)
def challenge_contradiction(
    session_id: str,
    payload: ContradictionChallengePayload,
    db: Session = Depends(get_db),
):
    """Confront a suspect with a discovered contradiction to break their alibi."""
    session, scenario = _get_active_session_and_scenario(session_id, db)
    try:
        res = ContradictionService.challenge_contradiction(
            session=session,
            payload=payload,
            scenario=scenario,
            db=db,
        )
        db.commit()
        return ApiResponse.ok(data=res)
    except ValueError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get(
    "/investigations/{session_id}/objectives",
    response_model=ApiResponse[List[ObjectiveItem]],
)
def get_investigation_objectives(
    session_id: str,
    db: Session = Depends(get_db),
):
    """Retrieve multi-step case progression objectives and current milestone status."""
    session, scenario = _get_active_session_and_scenario(session_id, db)
    res = ObjectiveService.get_objectives(session=session, scenario=scenario, db=db)
    return ApiResponse.ok(data=res)


@router.post(
    "/investigations/{session_id}/theory/evaluate",
    response_model=ApiResponse[TheoryResponse],
)
def evaluate_investigation_theory(
    session_id: str,
    payload: TheoryPayload,
    db: Session = Depends(get_db),
):
    """Evaluate consistency of player's formulated theory against authoritative mystery truth."""
    session, scenario = _get_active_session_and_scenario(session_id, db)
    res = InquiryService.evaluate_theory(
        session=session,
        payload=payload,
        scenario=scenario,
        db=db,
    )
    return ApiResponse.ok(data=res)


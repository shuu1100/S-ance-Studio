from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.session import InvestigationSession
from app.models.scenario import ScenarioDefinition
from app.models.clue import ClueDefinition, DiscoveredClue
from app.engine.seed_data import create_initial_session_entities
from app.engine.state_machine import process_action_payload
from app.schemas.investigation import (
    InvestigationCreateRequest,
    InvestigationSessionResponse,
    InvestigationDetailResponse,
    DecisionMade,
)
from app.schemas.character import CharacterStateResponse
from app.schemas.clue import ClueResponse
from app.schemas.journal import JournalResponse
from app.schemas.dialogue import ActionPayload, ActionResponseData
from app.schemas.common import ApiResponse

router = APIRouter(tags=["Investigations & Sessions"])


def _build_session_response(session: InvestigationSession) -> InvestigationSessionResponse:
    decisions = [
        DecisionMade(
            turn=c.turn_number,
            decision=c.decision_text,
            impact=c.impact_text,
        )
        for c in session.choices
    ]
    return InvestigationSessionResponse(
        id=session.id,
        case_id=session.scenario_id,
        case_title=session.title,
        difficulty=session.difficulty,
        current_act=session.current_act,
        total_acts=session.total_acts,
        turn_counter=session.turn_counter,
        max_turns=session.max_turns,
        candle_percentage=session.candle_percentage,
        player_sanity=session.player_sanity,
        ectoplasmic_tension=session.ectoplasmic_tension,
        active_entity_id=session.active_entity_id,
        current_location=session.current_location,
        objective=session.objective,
        last_saved=session.updated_at.strftime("%B %d, %Y • %I:%M %p"),
        status=session.status,
        ending_achieved=session.ending_id,
        decisions_made=decisions,
    )


@router.get("/investigations", response_model=ApiResponse[List[InvestigationSessionResponse]])
@router.get("/sessions", response_model=ApiResponse[List[InvestigationSessionResponse]], include_in_schema=False)
def list_investigations(db: Session = Depends(get_db)):
    """Retrieve all persisted investigations, sorted by most recently updated."""
    sessions = (
        db.query(InvestigationSession)
        .order_by(InvestigationSession.updated_at.desc())
        .all()
    )
    return ApiResponse.ok([_build_session_response(s) for s in sessions])


@router.post("/investigations", response_model=ApiResponse[InvestigationSessionResponse], status_code=status.HTTP_201_CREATED)
@router.post("/sessions", response_model=ApiResponse[InvestigationSessionResponse], status_code=status.HTTP_201_CREATED, include_in_schema=False)
def create_investigation(
    payload: InvestigationCreateRequest,
    db: Session = Depends(get_db),
):
    """Create a new investigation session with persistent database entities."""
    scenario = db.query(ScenarioDefinition).filter_by(id=payload.scenario_id).first()
    if not scenario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scenario '{payload.scenario_id}' was not found in catalog.",
        )

    try:
        session = InvestigationSession(
            scenario_id=scenario.id,
            title=scenario.title,
            difficulty=payload.difficulty,
            status="active",
            current_location="The Grand Foyer",
            current_act=1,
            total_acts=3,
            turn_counter=1,
            max_turns=int(scenario.max_turns) if str(scenario.max_turns).isdigit() else 30,
            candle_percentage=100.0,
            player_sanity=100,
            ectoplasmic_tension=20,
            active_entity_id="char_eleanor",
            objective=scenario.initial_objective,
        )
        db.add(session)
        db.flush()

        create_initial_session_entities(db, session)
        db.commit()
        db.refresh(session)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to initialize investigation session.",
        ) from e

    return ApiResponse.ok(_build_session_response(session))


def _build_investigation_detail(db: Session, session: InvestigationSession) -> InvestigationDetailResponse:
    # Characters
    char_responses = []
    for rel in session.relationship_states:
        c_def = rel.character
        char_responses.append(
            CharacterStateResponse(
                id=c_def.id,
                name=c_def.name,
                title=c_def.title,
                era=c_def.era,
                type=c_def.entity_type,
                status=rel.status,
                avatar_seed=c_def.avatar_seed,
                short_bio=c_def.short_bio,
                personality=c_def.personality,
                secret_grievance=c_def.secrets,
                trust_level=rel.trust_score,
                location=rel.current_location,
                is_available=rel.is_available,
                known_facts=c_def.known_facts or [],
                flags=rel.flags or {},
            )
        )

    # Clues (all scenario clues mapped with discovery status in session)
    discovered_map = {d.clue_id: d for d in session.discovered_clues}
    all_clues = db.query(ClueDefinition).filter_by(scenario_id=session.scenario_id).all()
    clue_responses = []
    for c in all_clues:
        disc = discovered_map.get(c.id)
        clue_responses.append(
            ClueResponse(
                id=c.id,
                title=c.title,
                subtitle=c.subtitle,
                category=c.category,
                status=disc.status if disc else "undiscovered",
                description=c.description if disc else "Unexamined clue — requires further investigation.",
                location_found=c.source,
                associated_suspects=c.associated_suspects or [],
                evidence_marker=c.evidence_marker,
                discovered_at_turn=disc.discovered_at_turn if disc else None,
                is_key_evidence=c.is_key_evidence,
            )
        )

    # Journal
    journal_responses = [
        JournalResponse(
            id=j.id,
            title=j.title,
            date=j.timestamp.strftime("%B %d, %Y"),
            category=j.event_type,
            entry_type=j.entry_type,
            content=j.summary,
            flagged=j.flagged,
            turn_number=j.turn_number,
        )
        for j in session.journal_events
    ]

    return InvestigationDetailResponse(
        session=_build_session_response(session),
        characters=char_responses,
        clues=clue_responses,
        journal=journal_responses,
    )


@router.get("/investigations/{session_id}", response_model=ApiResponse[InvestigationDetailResponse])
@router.get("/sessions/{session_id}", response_model=ApiResponse[InvestigationDetailResponse], include_in_schema=False)
def get_investigation(session_id: str, db: Session = Depends(get_db)):
    """Retrieve full authoritative state of an active or concluded investigation."""
    session = db.query(InvestigationSession).filter_by(id=session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Investigation session '{session_id}' not found.",
        )
    return ApiResponse.ok(_build_investigation_detail(db, session))


@router.post("/investigations/{session_id}/recover", response_model=ApiResponse[InvestigationDetailResponse])
@router.post("/sessions/{session_id}/recover", response_model=ApiResponse[InvestigationDetailResponse], include_in_schema=False)
@router.post("/investigations/{session_id}/resume", response_model=ApiResponse[InvestigationDetailResponse], include_in_schema=False)
@router.post("/sessions/{session_id}/resume", response_model=ApiResponse[InvestigationDetailResponse], include_in_schema=False)
def recover_investigation(session_id: str, db: Session = Depends(get_db)):
    """Safely restore a prematurely completed investigation session to active state."""
    session = db.query(InvestigationSession).filter_by(id=session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Investigation session '{session_id}' not found.",
        )

    # If already active, return state immediately
    if session.status == "active":
        return ApiResponse.ok(_build_investigation_detail(db, session))

    # Reject recovery for genuine ending conditions
    if session.player_sanity <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session concluded due to insanity collapse (Sanity reached 0). Cannot be reopened.",
        )
    if session.candle_percentage <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session concluded due to candle exhaustion (Candle reached 0%). Cannot be reopened.",
        )
    if session.turn_counter > session.max_turns:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Session exceeded maximum allotted turns ({session.turn_counter}/{session.max_turns}). Cannot be reopened.",
        )

    # Safe recovery: Restore session to active
    try:
        session.status = "active"
        session.ending_id = None
        if session.ending_record:
            db.delete(session.ending_record)
        db.commit()
        db.refresh(session)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to recover investigation session.",
        ) from e

    return ApiResponse.ok(_build_investigation_detail(db, session))


@router.delete("/investigations/{session_id}", response_model=ApiResponse[dict])
@router.delete("/sessions/{session_id}", response_model=ApiResponse[dict], include_in_schema=False)
def delete_investigation(session_id: str, db: Session = Depends(get_db)):
    """Safely remove or abandon an investigation session."""
    session = db.query(InvestigationSession).filter_by(id=session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Investigation session '{session_id}' not found.",
        )

    try:
        db.delete(session)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete investigation session.",
        ) from e

    return ApiResponse.ok({"deleted": True, "session_id": session_id})


@router.post("/investigations/{session_id}/action", response_model=ApiResponse[ActionResponseData])
@router.post("/sessions/{session_id}/action", response_model=ApiResponse[ActionResponseData], include_in_schema=False)
def perform_investigation_action(
    session_id: str,
    payload: ActionPayload,
    db: Session = Depends(get_db),
):
    """Execute generic investigation action payload from frontend client."""
    session = db.query(InvestigationSession).filter_by(id=session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Investigation session '{session_id}' not found.",
        )

    try:
        res = process_action_payload(db, session, payload)
        db.commit()
        return ApiResponse.ok(res)
    except ValueError as ve:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error processing investigation action.",
        ) from e

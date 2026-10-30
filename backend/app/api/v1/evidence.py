from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.session import InvestigationSession
from app.models.clue import ClueDefinition, PermittedConnection, DiscoveredClue
from app.engine.clue_rules import validate_clue_connection
from app.schemas.clue import ClueResponse, PermittedConnectionResponse, EvidenceListResponse
from app.schemas.common import ApiResponse

router = APIRouter(tags=["Evidence Board"])


class ConnectCluesRequest(BaseModel):
    from_clue_id: str
    to_clue_id: str


@router.get("/investigations/{session_id}/evidence", response_model=ApiResponse[EvidenceListResponse])
def get_evidence_board(session_id: str, db: Session = Depends(get_db)):
    """Retrieve discovered clues and valid logical linkages on the evidence board."""
    session = db.query(InvestigationSession).filter_by(id=session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Investigation session '{session_id}' not found.",
        )

    # Discovered clues
    disc_clues = (
        db.query(DiscoveredClue)
        .filter_by(session_id=session_id)
        .all()
    )
    clue_ids = {d.clue_id for d in disc_clues}

    clue_responses = []
    for d in disc_clues:
        c = d.clue
        clue_responses.append(
            ClueResponse(
                id=c.id,
                title=c.title,
                subtitle=c.subtitle,
                category=c.category,
                status=d.status,
                description=c.description,
                location_found=c.source,
                associated_suspects=c.associated_suspects or [],
                evidence_marker=c.evidence_marker,
                discovered_at_turn=d.discovered_at_turn,
                is_key_evidence=c.is_key_evidence,
            )
        )

    # Permitted connections that only involve currently discovered clues
    connections = (
        db.query(PermittedConnection)
        .filter_by(scenario_id=session.scenario_id)
        .all()
    )
    conn_responses = [
        PermittedConnectionResponse(
            id=conn.id,
            from_clue_id=conn.from_clue_id,
            to_clue_id=conn.to_clue_id,
            relationship=conn.relationship,
            label=conn.label,
            reason=conn.reason,
        )
        for conn in connections
        if conn.from_clue_id in clue_ids and conn.to_clue_id in clue_ids
    ]

    return ApiResponse.ok(
        EvidenceListResponse(
            discovered_clues=clue_responses,
            permitted_connections=conn_responses,
        )
    )


@router.post("/investigations/{session_id}/evidence/connect", response_model=ApiResponse[PermittedConnectionResponse])
def connect_evidence_clues(
    session_id: str,
    payload: ConnectCluesRequest,
    db: Session = Depends(get_db),
):
    """Validate a deductive string connection between two clues on the evidence board."""
    session = db.query(InvestigationSession).filter_by(id=session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Investigation session '{session_id}' not found.",
        )

    # Verify both clues are discovered
    disc_ids = {
        d.clue_id
        for d in db.query(DiscoveredClue.clue_id)
        .filter_by(session_id=session_id)
        .all()
    }
    if payload.from_clue_id not in disc_ids or payload.to_clue_id not in disc_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot connect clues that have not yet been discovered.",
        )

    rule = validate_clue_connection(
        db, session.scenario_id, payload.from_clue_id, payload.to_clue_id
    )
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Deductive connection rejected: No valid forensic or logical correlation permitted by the game engine.",
        )

    return ApiResponse.ok(
        PermittedConnectionResponse(
            id=rule.id,
            from_clue_id=rule.from_clue_id,
            to_clue_id=rule.to_clue_id,
            relationship=rule.relationship,
            label=rule.label,
            reason=rule.reason,
        )
    )

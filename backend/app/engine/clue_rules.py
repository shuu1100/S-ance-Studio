from typing import Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.clue import ClueDefinition, PermittedConnection, DiscoveredClue
from app.models.session import InvestigationSession
from app.engine.game_state_service import GameStateService


def validate_clue_connection(
    db: Session,
    scenario_id: str,
    from_clue_id: str,
    to_clue_id: str,
) -> Optional[PermittedConnection]:
    """Verify if a deductive connection between two clues is permitted by the game engine."""
    return (
        db.query(PermittedConnection)
        .filter(
            PermittedConnection.scenario_id == scenario_id,
            or_(
                (PermittedConnection.from_clue_id == from_clue_id)
                & (PermittedConnection.to_clue_id == to_clue_id),
                (PermittedConnection.from_clue_id == to_clue_id)
                & (PermittedConnection.to_clue_id == from_clue_id),
            ),
        )
        .first()
    )


def resolve_clue_discovery(
    db: Session,
    session: InvestigationSession,
    clue_id: str,
    method: str = "INSPECTION",
) -> Tuple[DiscoveredClue, bool]:
    """
    Safely discover a clue in an active session using GameStateService.
    Guarantees idempotency and deterministic prerequisite validation.
    """
    return GameStateService.discover_clue(db, session, clue_id, method=method)

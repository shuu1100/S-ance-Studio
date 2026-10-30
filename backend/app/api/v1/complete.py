from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.session import InvestigationSession
from app.engine.accusation import evaluate_verdict
from app.schemas.ending import AccusationPayload, EndingOutcomeResponse
from app.schemas.common import ApiResponse

router = APIRouter(tags=["Case Conclusion & Accusation"])


@router.post("/investigations/{session_id}/complete", response_model=ApiResponse[EndingOutcomeResponse])
@router.post("/investigations/{session_id}/accuse", response_model=ApiResponse[EndingOutcomeResponse], include_in_schema=False)
@router.post("/sessions/{session_id}/accuse", response_model=ApiResponse[EndingOutcomeResponse], include_in_schema=False)
def complete_investigation(
    session_id: str,
    payload: AccusationPayload,
    db: Session = Depends(get_db),
):
    """Deliver the final accusation deduction matrix and determine the authoritative case verdict."""
    session = db.query(InvestigationSession).filter_by(id=session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Investigation session '{session_id}' not found.",
        )

    try:
        outcome = evaluate_verdict(db, session, payload)
        db.commit()
        return ApiResponse.ok(outcome)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error evaluating case accusation matrix.",
        ) from e

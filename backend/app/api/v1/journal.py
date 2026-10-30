from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.session import InvestigationSession
from app.models.journal import JournalEvent
from app.schemas.journal import JournalCreateRequest, JournalResponse
from app.schemas.common import ApiResponse

router = APIRouter(tags=["Investigation Journal"])


@router.get("/investigations/{session_id}/journal", response_model=ApiResponse[List[JournalResponse]])
def get_journal(
    session_id: str,
    entry_type: Optional[str] = Query(None, description="Filter by 'fact' or 'theory'"),
    search: Optional[str] = Query(None, description="Search term in title or content"),
    db: Session = Depends(get_db),
):
    """Retrieve chronologically ordered journal events, distinguishing confirmed facts from player theories."""
    session = db.query(InvestigationSession).filter_by(id=session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Investigation session '{session_id}' not found.",
        )

    query = db.query(JournalEvent).filter_by(session_id=session_id)
    if entry_type:
        query = query.filter(JournalEvent.entry_type == entry_type)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (JournalEvent.title.ilike(search_pattern))
            | (JournalEvent.summary.ilike(search_pattern))
        )

    events = (
        query
        .order_by(JournalEvent.turn_number.asc(), JournalEvent.timestamp.asc(), JournalEvent.id.asc())
        .all()
    )
    results = [
        JournalResponse(
            id=e.id,
            title=e.title,
            date=e.timestamp.strftime("%B %d, %Y"),
            category=e.event_type,
            entry_type=e.entry_type,
            content=e.summary,
            flagged=e.flagged,
            turn_number=e.turn_number,
        )
        for e in events
    ]
    return ApiResponse.ok(results)


@router.post("/investigations/{session_id}/journal", response_model=ApiResponse[JournalResponse], status_code=status.HTTP_201_CREATED)
def add_journal_entry(
    session_id: str,
    payload: JournalCreateRequest,
    db: Session = Depends(get_db),
):
    """Log a player theory, deduction note, or hypothesis in the investigation journal."""
    session = db.query(InvestigationSession).filter_by(id=session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Investigation session '{session_id}' not found.",
        )
    if session.status != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Session is {session.status}. Journal entries cannot be added.",
        )
    if not payload.title or not payload.title.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Journal entry title cannot be empty.",
        )
    if not payload.content or not payload.content.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Journal entry content cannot be empty.",
        )

    try:
        entry = JournalEvent(
            session_id=session.id,
            event_type=payload.category,
            entry_type=payload.entry_type,
            title=payload.title,
            summary=payload.content,
            flagged=payload.flagged,
            turn_number=session.turn_counter,
        )
        db.add(entry)
        db.commit()
        db.refresh(entry)

        return ApiResponse.ok(
            JournalResponse(
                id=entry.id,
                title=entry.title,
                date=entry.timestamp.strftime("%B %d, %Y"),
                category=entry.event_type,
                entry_type=entry.entry_type,
                content=entry.summary,
                flagged=entry.flagged,
                turn_number=entry.turn_number,
            )
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create journal entry.",
        ) from e

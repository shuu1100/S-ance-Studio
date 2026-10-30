from datetime import datetime, timezone
import uuid
from sqlalchemy import Column, String, Integer, Boolean, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.database import Base


class JournalEvent(Base):
    """Investigation journal timeline events distinguishing confirmed facts from player theories."""
    __tablename__ = "journal_events"

    id = Column(String(64), primary_key=True, default=lambda: f"j_{uuid.uuid4().hex[:12]}")
    session_id = Column(
        String(64), ForeignKey("investigation_sessions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    event_type = Column(String(32), nullable=False)  # lead, autopsy, testimony, occult, choice
    entry_type = Column(String(32), default="fact", nullable=False)  # fact, theory
    title = Column(String(255), nullable=False)
    summary = Column(Text, nullable=False)
    flagged = Column(Boolean, default=False, nullable=False)
    turn_number = Column(Integer, nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    session = relationship("InvestigationSession", back_populates="journal_events")

Index("idx_journal_session_entry_type", JournalEvent.session_id, JournalEvent.entry_type)

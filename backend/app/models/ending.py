from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base


class EndingRecord(Base):
    """Archived conclusive outcome and case verdict for completed investigations."""
    __tablename__ = "ending_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(
        String(64),
        ForeignKey("investigation_sessions.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    ending_id = Column(String(64), nullable=False)
    verdict_type = Column(String(64), nullable=False)  # exemplary_victory, hollow_victory, wrongful_conviction, insanity_defeat, candle_defeat
    culprit_named = Column(String(128), nullable=False)
    final_summary = Column(Text, nullable=False)
    sanity_score = Column(Integer, nullable=False)
    turns_taken = Column(Integer, nullable=False)
    rating = Column(String(64), nullable=False)
    influential_decisions = Column(JSON, default=list, nullable=False)
    completion_timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    session = relationship("InvestigationSession", back_populates="ending_record")

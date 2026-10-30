from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, JSON
from app.database import Base


class ScenarioDefinition(Base):
    """Immutable scenario catalog entry (e.g. Blackwood Manor)."""
    __tablename__ = "scenarios"

    id = Column(String(64), primary_key=True)
    title = Column(String(255), nullable=False)
    subtitle = Column(String(255), nullable=True)
    difficulty = Column(String(32), default="seasoned")
    description = Column(Text, nullable=False)
    era = Column(String(64), default="October 1922")
    max_turns = Column(String(16), default="30")
    true_culprit_id = Column(String(64), nullable=False)
    true_method_id = Column(String(64), nullable=False)
    true_motive_id = Column(String(64), nullable=False)
    initial_objective = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Boolean, Text, DateTime, ForeignKey, JSON, Index, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base


class CharacterDefinition(Base):
    """Static character identity, secrets, and biographical parameters."""
    __tablename__ = "character_definitions"

    id = Column(String(64), primary_key=True)
    scenario_id = Column(String(64), ForeignKey("scenarios.id"), nullable=False, index=True)
    name = Column(String(128), nullable=False)
    title = Column(String(128), nullable=False)
    era = Column(String(64), nullable=False)
    entity_type = Column(String(32), nullable=False)  # spirit, living, medium
    default_status = Column(String(32), default="restless", nullable=False)
    avatar_seed = Column(String(64), nullable=False)
    short_bio = Column(Text, nullable=False)
    secrets = Column(Text, nullable=False)
    personality = Column(Text, nullable=False)
    default_location = Column(String(128), nullable=False)
    initial_trust = Column(Integer, default=50, nullable=False)
    known_facts = Column(JSON, default=list, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


class CharacterRelationshipState(Base):
    """Dynamic per-session trust score, emotional stance, and narrative flags."""
    __tablename__ = "character_relationship_states"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(
        String(64), ForeignKey("investigation_sessions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    character_id = Column(
        String(64), ForeignKey("character_definitions.id"), nullable=False, index=True
    )
    trust_score = Column(Integer, default=50, nullable=False)
    is_available = Column(Boolean, default=True, nullable=False)
    status = Column(String(32), default="calm", nullable=False)
    current_location = Column(String(128), nullable=False)
    flags = Column(JSON, default=dict, nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    session = relationship("InvestigationSession", back_populates="relationship_states")
    character = relationship("CharacterDefinition")

    __table_args__ = (
        UniqueConstraint("session_id", "character_id", name="uq_session_character"),
    )

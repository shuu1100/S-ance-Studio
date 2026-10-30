from datetime import datetime, timezone
import uuid
from sqlalchemy import Column, String, Integer, Float, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.database import Base


class InvestigationSession(Base):
    """Authoritative persistent record of an investigation session."""
    __tablename__ = "investigation_sessions"

    id = Column(String(64), primary_key=True, default=lambda: f"sess_{uuid.uuid4().hex[:12]}")
    scenario_id = Column(String(64), ForeignKey("scenarios.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    difficulty = Column(String(32), default="seasoned", nullable=False)
    status = Column(String(32), default="active", nullable=False, index=True)  # active, completed, abandoned
    current_location = Column(String(128), default="The Grand Foyer", nullable=False)
    current_act = Column(Integer, default=1, nullable=False)
    total_acts = Column(Integer, default=3, nullable=False)
    turn_counter = Column(Integer, default=1, nullable=False)
    max_turns = Column(Integer, default=30, nullable=False)
    candle_percentage = Column(Float, default=100.0, nullable=False)
    player_sanity = Column(Integer, default=100, nullable=False)
    ectoplasmic_tension = Column(Integer, default=20, nullable=False)
    active_entity_id = Column(String(64), nullable=True)
    objective = Column(Text, nullable=False)
    ending_id = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    scenario = relationship("ScenarioDefinition")
    choices = relationship("PlayerChoice", back_populates="session", cascade="all, delete-orphan")
    relationship_states = relationship(
        "CharacterRelationshipState", back_populates="session", cascade="all, delete-orphan"
    )
    dialogue_messages = relationship(
        "DialogueMessage", back_populates="session", cascade="all, delete-orphan", order_by="DialogueMessage.turn_number"
    )
    discovered_clues = relationship(
        "DiscoveredClue", back_populates="session", cascade="all, delete-orphan"
    )
    journal_events = relationship(
        "JournalEvent", back_populates="session", cascade="all, delete-orphan"
    )
    ending_record = relationship(
        "EndingRecord", back_populates="session", uselist=False, cascade="all, delete-orphan"
    )


class PlayerChoice(Base):
    """Validated player choices and their systemic narrative outcomes."""
    __tablename__ = "player_choices"

    id = Column(String(64), primary_key=True, default=lambda: f"choice_{uuid.uuid4().hex[:12]}")
    session_id = Column(
        String(64), ForeignKey("investigation_sessions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    choice_id = Column(String(64), nullable=False)
    turn_number = Column(Integer, nullable=False)
    action_type = Column(String(32), nullable=False)  # TALK, INSPECT, RITUAL, ACCUSE
    target_id = Column(String(64), nullable=True)
    decision_text = Column(Text, nullable=False)
    impact_text = Column(Text, nullable=False)
    validated_outcome = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    session = relationship("InvestigationSession", back_populates="choices")

Index("idx_player_choices_session_turn", PlayerChoice.session_id, PlayerChoice.turn_number)

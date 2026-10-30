from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Boolean, Text, DateTime, ForeignKey, JSON, UniqueConstraint
from sqlalchemy.orm import relationship as orm_relationship
from app.database import Base


class ClueDefinition(Base):
    """Static clue definition and case metadata."""
    __tablename__ = "clue_definitions"

    id = Column(String(64), primary_key=True)
    scenario_id = Column(String(64), ForeignKey("scenarios.id"), nullable=False, index=True)
    title = Column(String(128), nullable=False)
    subtitle = Column(String(128), nullable=False)
    category = Column(String(32), nullable=False)  # physical, testimony, document, paranormal
    description = Column(Text, nullable=False)
    source = Column(String(255), nullable=False)
    prerequisites = Column(JSON, default=dict, nullable=False)
    evidence_marker = Column(String(16), nullable=True)
    is_key_evidence = Column(Boolean, default=False, nullable=False)
    associated_suspects = Column(JSON, default=list, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


class PermittedConnection(Base):
    """Authoritative valid deductive connection between two clues."""
    __tablename__ = "permitted_connections"

    id = Column(Integer, primary_key=True, autoincrement=True)
    scenario_id = Column(String(64), ForeignKey("scenarios.id"), nullable=False, index=True)
    from_clue_id = Column(String(64), ForeignKey("clue_definitions.id"), nullable=False, index=True)
    to_clue_id = Column(String(64), ForeignKey("clue_definitions.id"), nullable=False, index=True)
    relationship = Column(String(32), nullable=False)  # contradicts, implicates, alibi_for, weapon_match
    label = Column(String(128), nullable=False)
    reason = Column(Text, nullable=False)

    from_clue = orm_relationship("ClueDefinition", foreign_keys=[from_clue_id])
    to_clue = orm_relationship("ClueDefinition", foreign_keys=[to_clue_id])

    __table_args__ = (
        UniqueConstraint("from_clue_id", "to_clue_id", name="uq_permitted_connection_pair"),
    )


class DiscoveredClue(Base):
    """Clues discovered within an active session."""
    __tablename__ = "discovered_clues"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(
        String(64), ForeignKey("investigation_sessions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    clue_id = Column(String(64), ForeignKey("clue_definitions.id"), nullable=False, index=True)
    status = Column(String(32), default="revealed", nullable=False)  # revealed, verified, contradicted
    discovery_time = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    discovery_method = Column(String(32), default="INSPECTION", nullable=False)  # INSPECTION, INTERVIEW, DEDUCTION, INITIAL
    discovered_at_turn = Column(Integer, nullable=False)

    session = orm_relationship("InvestigationSession", back_populates="discovered_clues")
    clue = orm_relationship("ClueDefinition")

    __table_args__ = (
        UniqueConstraint("session_id", "clue_id", name="uq_session_clue"),
    )

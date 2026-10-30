from datetime import datetime, timezone
import uuid
from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.database import Base


class DialogueMessage(Base):
    """Dialogue utterance exchanged in séance or interview."""
    __tablename__ = "dialogue_messages"

    id = Column(String(64), primary_key=True, default=lambda: f"msg_{uuid.uuid4().hex[:12]}")
    session_id = Column(
        String(64), ForeignKey("investigation_sessions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    character_id = Column(String(64), ForeignKey("character_definitions.id"), nullable=True, index=True)
    role = Column(String(32), nullable=False)  # player, character, system
    sender_name = Column(String(128), nullable=False)
    speaker_type = Column(String(32), nullable=False)  # spirit, living, medium
    content = Column(Text, nullable=False)
    emotional_cue = Column(String(128), nullable=True)
    atmospheric_effect = Column(String(128), nullable=True)
    turn_number = Column(Integer, nullable=False)
    related_evidence_id = Column(String(64), nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    session = relationship("InvestigationSession", back_populates="dialogue_messages")
    character = relationship("CharacterDefinition")

Index("idx_dialogue_session_turn", DialogueMessage.session_id, DialogueMessage.turn_number)

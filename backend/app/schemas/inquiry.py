from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field


class SuggestedQuestionItem(BaseModel):
    """A contextual suggested question that can be asked to a character."""
    id: str
    text: str
    topic_id: str
    topic_label: str
    character_id: str
    confidence_cost: int = 0
    unlocked: bool = True
    context_hint: Optional[str] = None


class SuggestedQuestionsResponse(BaseModel):
    """Response containing dynamic suggested questions grouped or filtered for a character."""
    character_id: str
    character_name: str
    trust_level: int
    active_topic: Optional[str] = None
    questions: List[SuggestedQuestionItem]


class TopicResponse(BaseModel):
    """Investigation topic details for structured inquiry."""
    id: str
    title: str
    description: str
    category: str
    is_unlocked: bool
    relevant_facts: List[str] = Field(default_factory=list)
    discovered_clues: List[Dict[str, Any]] = Field(default_factory=list)
    available_questions: List[str] = Field(default_factory=list)
    unresolved_lead: str


class ContradictionItem(BaseModel):
    """A detected or discoverable contradiction in testimony/evidence."""
    id: str
    title: str
    target_character_id: str
    target_character_name: str
    statement_summary: str
    contradicting_evidence_id: str
    contradicting_evidence_title: str
    contradiction_detail: str
    is_ready_to_challenge: bool
    is_resolved: bool
    missing_evidence: List[str] = Field(default_factory=list)


class ContradictionChallengePayload(BaseModel):
    """Payload to confront a suspect with a contradiction."""
    contradiction_id: str
    presented_evidence_id: Optional[str] = None


class ContradictionChallengeResponse(BaseModel):
    """Result of challenging a suspect with a contradiction."""
    success: bool
    character_id: str
    character_name: str
    dialogue: str
    emotional_cue: str
    trust_delta: int
    new_trust: int
    revealed_fact: Optional[str] = None
    unlocked_clue_id: Optional[str] = None
    journal_entry_id: Optional[str] = None


class ObjectiveItem(BaseModel):
    """Investigation milestone objective."""
    id: str
    order: int
    title: str
    description: str
    hint: str
    status: str = Field(..., description="completed, active, or pending")
    progress_percent: int = 0


class TheoryPayload(BaseModel):
    """Theory formulation input from the player."""
    suspect_id: str
    weapon_clue_id: str
    motive_clue_id: str
    supporting_clue_ids: List[str] = Field(default_factory=list)
    notes: Optional[str] = None


class TheoryResponse(BaseModel):
    """Authoritative evaluation of formulated theory."""
    status: str = Field(..., description="supported, unsupported, or contradicted")
    consistency_score: int
    strengths: List[str] = Field(default_factory=list)
    vulnerabilities: List[str] = Field(default_factory=list)
    contradictions_detected: List[str] = Field(default_factory=list)
    verdict_readiness: str


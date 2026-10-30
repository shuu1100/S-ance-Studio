from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field, ConfigDict


class KnowledgeBoundaryAsset(BaseModel):
    """Explicit whitelists and blacklists of character awareness."""
    always_known_facts: List[str] = Field(
        default_factory=list,
        description="Core background facts the character knows from the start."
    )
    conditional_facts: Dict[str, str] = Field(
        default_factory=dict,
        description="Mapping from condition key (e.g. clue_id or topic) to the revealed fact text."
    )
    strictly_forbidden_knowledge: List[str] = Field(
        default_factory=list,
        description="Forbidden spoilers the character must never disclose or know."
    )


class EvidenceTriggerAsset(BaseModel):
    """Behavioral reaction when a specific piece of evidence is presented."""
    trust_delta: int = Field(
        default=0,
        description="Signed integer delta applied to character trust (clamped by min/max)."
    )
    response_dialogue: str = Field(
        ...,
        description="In-character spoken reaction to the presented evidence."
    )
    emotional_cue: str = Field(
        ...,
        description="Visual or psychological demeanor (e.g. Defensive Panic)."
    )
    atmospheric_cue: Optional[str] = Field(
        None,
        description="Supernatural or environmental anomaly cue."
    )
    revealed_fact: Optional[str] = Field(
        None,
        description="Fact added to character's whitelisted knowledge when triggered."
    )
    unlocks_topic_id: Optional[str] = Field(
        None,
        description="Dialogue topic unlocked by this presentation."
    )
    unlocks_clue_id: Optional[str] = Field(
        None,
        description="Clue discovered/unlocked as a direct result of this confrontation."
    )
    sets_flags: Dict[str, Any] = Field(
        default_factory=dict,
        description="Session-level or relationship flags set by this trigger."
    )


class DialogueTopicAsset(BaseModel):
    """Inquiry topic that can be presented or questioned."""
    id: str
    label: str
    inquiry_text: str
    response_dialogue: str
    emotional_cue: Optional[str] = None
    min_trust_required: int = Field(default=0)
    required_clue_ids: List[str] = Field(default_factory=list)
    required_flags: Dict[str, Any] = Field(default_factory=dict)
    trust_delta: int = Field(default=0)
    revealed_fact: Optional[str] = None


class CharacterAsset(BaseModel):
    """Authoritative specification for an interviewable character."""
    id: str
    name: str
    title: str
    role_type: str = Field(..., description="caretaker, daughter, or apparition")
    entity_type: str = Field(..., description="living or spirit or medium")
    default_status: str = Field(default="guarded")
    avatar_seed: str
    default_location_id: str
    public_biography: str
    private_secrets: str
    personality: str
    speaking_style: str
    initial_trust: int = Field(ge=0, le=100)
    min_trust: int = Field(default=0, ge=0)
    max_trust: int = Field(default=100, le=100)
    opening_greeting: Optional[str] = Field(
        None,
        description="Spoken initial greeting when first encountering this character."
    )
    fallback_dialogue: Optional[str] = Field(
        None,
        description="Default in-character response when queried about unknown or out-of-scope subjects."
    )
    knowledge_boundaries: KnowledgeBoundaryAsset
    presentation_triggers: Dict[str, EvidenceTriggerAsset] = Field(
        default_factory=dict,
        description="Triggers keyed by clue_id."
    )
    dialogue_topics: List[DialogueTopicAsset] = Field(default_factory=list)


class CluePrerequisiteAsset(BaseModel):
    """Requirements before a clue can be discovered."""
    required_location_id: Optional[str] = None
    required_hotspot_id: Optional[str] = None
    required_clue_ids: List[str] = Field(default_factory=list)
    required_flags: Dict[str, Any] = Field(default_factory=dict)
    min_character_trust: Optional[Dict[str, int]] = Field(
        default=None,
        description="Mapping from character_id to minimum trust required."
    )


class ClueAsset(BaseModel):
    """Authoritative specification for a discoverable clue."""
    id: str
    title: str
    subtitle: str
    category: str = Field(..., description="physical, testimony, document, or paranormal")
    description: str
    source_location: str
    evidence_marker: str
    is_key_evidence: bool = False
    initially_revealed: bool = False
    associated_suspects: List[str] = Field(default_factory=list)
    prerequisites: CluePrerequisiteAsset = Field(default_factory=CluePrerequisiteAsset)
    discovery_effects: Dict[str, Any] = Field(
        default_factory=dict,
        description="Effects triggered on discovery, such as unlocked locations or sanity delta."
    )


class HotspotAsset(BaseModel):
    """Interactable points of interest inside a location."""
    id: str
    label: str
    description: str
    unlocks_clue_id: Optional[str] = None


class LocationUnlockConditionAsset(BaseModel):
    """Conditions that unlock a locked location."""
    required_clue_ids: List[str] = Field(default_factory=list)
    required_choices: List[str] = Field(default_factory=list)
    min_character_trust: Optional[Dict[str, int]] = Field(
        default=None,
        description="Character trust requirement, e.g. {'char_caretaker': 50}"
    )
    required_flags: Dict[str, Any] = Field(default_factory=dict)


class LocationAsset(BaseModel):
    """Authoritative specification for a mansion location."""
    id: str
    name: str
    subtitle: str
    description: str
    unlocked_by_default: bool = True
    unlock_conditions: LocationUnlockConditionAsset = Field(
        default_factory=LocationUnlockConditionAsset
    )
    hotspots: List[HotspotAsset] = Field(default_factory=list)


class PermittedConnectionAsset(BaseModel):
    """Valid deductive connection between two clues."""
    from_clue_id: str
    to_clue_id: str
    relationship: str
    label: str
    reason: str


class EndingPrerequisitesAsset(BaseModel):
    """Deterministic criteria that must be satisfied to achieve an ending."""
    required_suspect_id: Optional[str] = None
    required_weapon_clue_id: Optional[str] = None
    required_motive_clue_id: Optional[str] = None
    min_supporting_clues: int = 0
    required_supporting_clue_ids: List[str] = Field(default_factory=list)
    min_player_sanity: int = 0
    max_tension: Optional[int] = None
    required_flags: Dict[str, Any] = Field(default_factory=dict)
    min_character_trust: Optional[Dict[str, int]] = None


class EndingAsset(BaseModel):
    """Authoritative narrative ending outcome."""
    id: str
    title: str
    subtitle: str
    verdict_type: str = Field(..., description="exemplary_victory, hollow_victory, or wrongful_conviction")
    narrative: str
    epilogue: Optional[str] = Field(
        None,
        description="Concluding reflection or historical aftermath following the verdict."
    )
    rating: str
    prerequisites: EndingPrerequisitesAsset


class ChoiceDefinitionAsset(BaseModel):
    """Authoritative specification for a valid investigation choice."""
    id: str
    label: str
    action_type: str = Field(..., description="INSPECT, QUESTION, PRESENT_EVIDENCE, MOVE, etc.")
    target_id: Optional[str] = None
    decision_text: str
    impact_text: str
    prerequisite_clue_ids: List[str] = Field(default_factory=list)
    prerequisite_flags: Dict[str, Any] = Field(default_factory=dict)
    reveals_clue_id: Optional[str] = None
    unlocks_location_id: Optional[str] = None
    trust_modifiers: Dict[str, int] = Field(default_factory=dict)


class InvestigationTopicAsset(BaseModel):
    """Investigation topic for structured inquiry."""
    id: str
    title: str
    description: str
    category: str = Field(..., description="crime, suspects, occult, or evidence")
    relevant_clue_ids: List[str] = Field(default_factory=list)
    known_facts: List[str] = Field(default_factory=list)
    suggested_questions: List[str] = Field(default_factory=list)
    unresolved_lead: str
    min_trust: int = Field(default=0)
    required_clue_ids: List[str] = Field(default_factory=list)


class ContradictionAsset(BaseModel):
    """Witness contradiction or forensic conflict."""
    id: str
    title: str
    target_character_id: str
    statement_summary: str
    contradicting_evidence_id: str
    contradiction_detail: str
    prerequisite_clue_ids: List[str] = Field(default_factory=list)
    confrontation_dialogue: str
    success_trust_delta: int = Field(default=15)
    penalty_trust_delta: int = Field(default=-10)
    revealed_fact: Optional[str] = None
    unlocks_clue_id: Optional[str] = None


class ObjectiveAsset(BaseModel):
    """Case progression milestone objective."""
    id: str
    order: int
    title: str
    description: str
    hint: str
    prerequisite_clue_ids: List[str] = Field(default_factory=list)
    prerequisite_flags: Dict[str, Any] = Field(default_factory=dict)
    completion_trigger: str = Field(..., description="CLUE_DISCOVERED, LOCATION_UNLOCKED, CONTRADICTION_RESOLVED, EVIDENCE_PRESENTED, VERDICT_DELIVERED")
    target_id: Optional[str] = None


class ScenarioAsset(BaseModel):
    """Complete versioned, data-driven scenario package."""
    model_config = ConfigDict(extra="forbid")

    schema_version: str = "1.0.0"
    id: str
    title: str
    subtitle: str
    era: str
    difficulty: str
    description: str
    opening_narration: Optional[str] = Field(
        None,
        description="Atmospheric narrative introduction setting the scene upon case commencement."
    )
    max_turns: int = 30
    initial_objective: str
    starting_location_id: str
    active_entity_id: str

    characters: List[CharacterAsset]
    clues: List[ClueAsset]
    locations: List[LocationAsset]
    permitted_connections: List[PermittedConnectionAsset]
    choices: List[ChoiceDefinitionAsset] = Field(default_factory=list)
    endings: List[EndingAsset]
    investigation_topics: List[InvestigationTopicAsset] = Field(default_factory=list)
    contradictions: List[ContradictionAsset] = Field(default_factory=list)
    objectives: List[ObjectiveAsset] = Field(default_factory=list)

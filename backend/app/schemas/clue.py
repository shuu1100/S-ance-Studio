from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class ClueResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    subtitle: str
    category: str
    status: str  # undiscovered, revealed, verified, contradicted
    description: str
    location_found: str
    associated_suspects: List[str]
    evidence_marker: Optional[str] = None
    discovered_at_turn: Optional[int] = None
    is_key_evidence: bool = False


class PermittedConnectionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    from_clue_id: str
    to_clue_id: str
    relationship: str
    label: str
    reason: str


class DiscoveryCreateRequest(BaseModel):
    clue_id: str
    discovery_method: str = "INSPECTION"  # INSPECTION, INTERVIEW, DEDUCTION


class PresentEvidenceRequest(BaseModel):
    character_id: str
    clue_id: str


class EvidenceListResponse(BaseModel):
    discovered_clues: List[ClueResponse]
    permitted_connections: List[PermittedConnectionResponse]

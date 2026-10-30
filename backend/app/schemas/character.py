from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict


class CharacterStateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    title: str
    era: str
    type: str  # spirit, living, medium
    status: str
    avatar_seed: str
    short_bio: str
    personality: str
    secret_grievance: str
    trust_level: int
    location: str
    is_available: bool
    known_facts: List[str]
    flags: Optional[Dict[str, Any]] = None


class CharacterUpdateTrustRequest(BaseModel):
    trust_delta: int
    status: Optional[str] = None
    location: Optional[str] = None

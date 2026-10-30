from typing import Optional
from pydantic import BaseModel, ConfigDict


class ChoiceCreateRequest(BaseModel):
    choice_id: str
    action_type: str
    decision_text: str
    impact_text: str
    target_id: Optional[str] = None


class ChoiceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    choice_id: str
    turn_number: int
    action_type: str
    target_id: Optional[str] = None
    decision_text: str
    impact_text: str
    validated_outcome: Optional[str] = None
    created_at: str

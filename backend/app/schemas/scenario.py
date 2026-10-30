from typing import Optional
from pydantic import BaseModel, ConfigDict


class ScenarioResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    subtitle: Optional[str] = None
    difficulty: str
    description: str
    era: str
    max_turns: str
    initial_objective: str

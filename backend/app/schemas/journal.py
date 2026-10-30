from typing import Optional
from pydantic import BaseModel, ConfigDict


class JournalCreateRequest(BaseModel):
    title: str
    category: str = "lead"  # lead, autopsy, testimony, occult, choice
    entry_type: str = "theory"  # fact, theory
    content: str
    flagged: bool = False


class JournalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    date: str
    category: str
    entry_type: str
    content: str
    flagged: bool
    turn_number: Optional[int] = None

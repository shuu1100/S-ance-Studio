from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.schemas.clue import ClueResponse


class DialogueMessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    sender_id: str
    sender_name: str
    speaker_type: str
    text: str
    emotional_cue: Optional[str] = None
    atmospheric_effect: Optional[str] = None
    turn_number: int
    timestamp: str
    clue_presented_id: Optional[str] = None


class SendMessageRequest(BaseModel):
    character_id: Optional[str] = None
    content: str
    presented_clue_id: Optional[str] = None


class ActionPayload(BaseModel):
    actionType: str  # TALK, INSPECT, RITUAL, ACCUSE
    targetId: str
    queryText: Optional[str] = None
    presentedClueId: Optional[str] = None


class ActionResponseData(BaseModel):
    turnNumber: int
    dialogue: Optional[DialogueMessageResponse] = None
    unlockedClue: Optional[ClueResponse] = None
    candlePercentage: float
    playerSanity: int
    ectoplasmicTension: int
    objectiveUpdate: Optional[str] = None
    gameStatus: str  # active, completed, abandoned

from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.character import CharacterStateResponse
from app.schemas.clue import ClueResponse
from app.schemas.journal import JournalResponse


class DecisionMade(BaseModel):
    turn: int
    decision: str
    impact: str


class InvestigationCreateRequest(BaseModel):
    scenario_id: str = "case_blackwood_thirteenth_chime"
    difficulty: str = "seasoned"  # novice, seasoned, skeptic


class InvestigationSessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    case_id: str = Field(alias="caseId")
    case_title: str = Field(alias="caseTitle")
    difficulty: str
    current_act: int = Field(alias="currentAct")
    total_acts: int = Field(alias="totalActs")
    turn_counter: int = Field(alias="turnCounter")
    max_turns: int = Field(alias="maxTurns")
    candle_percentage: float = Field(alias="candlePercentage")
    player_sanity: int = Field(alias="playerSanity")
    ectoplasmic_tension: int = Field(alias="ectoplasmicTension")
    active_entity_id: Optional[str] = Field(alias="activeEntityId", default=None)
    current_location: str = Field(alias="currentLocation", default="The Grand Foyer")
    objective: str
    last_saved: str = Field(alias="lastSaved")
    status: str  # active, completed, abandoned
    ending_achieved: Optional[str] = Field(alias="endingAchieved", default=None)
    decisions_made: List[DecisionMade] = Field(alias="decisionsMade", default_factory=list)


class InvestigationDetailResponse(BaseModel):
    session: InvestigationSessionResponse
    characters: List[CharacterStateResponse]
    clues: List[ClueResponse]
    journal: List[JournalResponse]

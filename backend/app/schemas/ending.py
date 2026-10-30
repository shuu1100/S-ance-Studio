from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class AccusationPayload(BaseModel):
    suspect_id: str = Field(alias="suspectId", default="")
    weapon_id: str = Field(alias="weaponId", default="")
    motive_id: str = Field(alias="motiveId", default="")
    supporting_clue_ids: List[str] = Field(alias="supportingClueIds", default_factory=list)

    model_config = ConfigDict(populate_by_name=True)


class EndingEvidenceItem(BaseModel):
    clue_id: str = Field(alias="clueId")
    title: str
    significance: str
    verified: bool

    model_config = ConfigDict(populate_by_name=True)


class EndingOutcomeResponse(BaseModel):
    id: str
    title: str
    subtitle: str
    verdict_type: str = Field(alias="verdictType")
    culprit_named: str = Field(alias="culpritNamed")
    narrative: str
    epilogue: Optional[str] = Field(alias="epilogue", default=None)
    evidence_summary: List[EndingEvidenceItem] = Field(alias="evidenceSummary", default_factory=list)
    influential_decisions: List[str] = Field(alias="influentialDecisions", default_factory=list)
    sanity_score: int = Field(alias="sanityScore")
    turns_taken: int = Field(alias="turnsTaken")
    rating: str

    model_config = ConfigDict(populate_by_name=True)

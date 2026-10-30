from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.scenario import ScenarioDefinition
from app.schemas.scenario import ScenarioResponse
from app.schemas.common import ApiResponse

router = APIRouter(tags=["Scenarios & Cases"])


@router.get("/scenarios", response_model=ApiResponse[List[ScenarioResponse]])
@router.get("/cases", response_model=ApiResponse[List[ScenarioResponse]], include_in_schema=False)
def list_scenarios(db: Session = Depends(get_db)):
    """List available mystery scenarios in the catalog."""
    scenarios = db.query(ScenarioDefinition).all()
    results = [ScenarioResponse.model_validate(s) for s in scenarios]
    return ApiResponse.ok(results)


@router.get("/scenarios/{scenario_id}", response_model=ApiResponse[ScenarioResponse])
def get_scenario(scenario_id: str, db: Session = Depends(get_db)):
    """Retrieve details for a specific mystery scenario."""
    scenario = db.query(ScenarioDefinition).filter_by(id=scenario_id).first()
    if not scenario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scenario with ID '{scenario_id}' was not found.",
        )
    return ApiResponse.ok(ScenarioResponse.model_validate(scenario))

from typing import List
from sqlalchemy.orm import Session
from app.models.session import InvestigationSession
from app.schemas.scenario_schema import ScenarioAsset
from app.schemas.inquiry import ObjectiveItem
from app.engine.game_state_service import GameStateService


class ObjectiveService:
    """Computes investigation objective states and milestones deterministically."""

    @classmethod
    def get_objectives(
        cls,
        session: InvestigationSession,
        scenario: ScenarioAsset,
        db: Session,
    ) -> List[ObjectiveItem]:
        """Compute the status (completed, active, pending) of all progression objectives."""
        discovered_ids = {c.clue_id for c in session.discovered_clues}
        items: List[ObjectiveItem] = []

        first_incomplete_found = False

        for obj in scenario.objectives:
            is_completed = False

            if obj.id == "obj_begin_inquest":
                # Completed if silver flask is discovered
                is_completed = "clue_silver_flask" in discovered_ids
            elif obj.id == "obj_examine_study":
                # Completed if library is unlocked or entered
                is_completed = GameStateService.is_location_unlocked(session, "room_library", scenario, db=db)
            elif obj.id == "obj_clockwork_tampering":
                is_completed = "clue_thirteenth_chime" in discovered_ids
            elif obj.id == "obj_trace_cordial":
                is_completed = "clue_arsenic_vial" in discovered_ids
            elif obj.id == "obj_uncover_will":
                is_completed = "clue_burned_will" in discovered_ids
            elif obj.id == "obj_infiltrate_crypt":
                is_completed = "clue_crypt_journal" in discovered_ids
            elif obj.id == "obj_deliver_verdict":
                is_completed = session.status == "completed" or session.ending_id is not None

            # Determine status
            if is_completed:
                status = "completed"
                progress = 100
            elif not first_incomplete_found:
                status = "active"
                progress = 30
                first_incomplete_found = True
            else:
                status = "pending"
                progress = 0

            items.append(
                ObjectiveItem(
                    id=obj.id,
                    order=obj.order,
                    title=obj.title,
                    description=obj.description,
                    hint=obj.hint,
                    status=status,
                    progress_percent=progress,
                )
            )

        return items


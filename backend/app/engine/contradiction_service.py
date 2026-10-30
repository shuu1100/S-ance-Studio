from typing import List, Optional
import uuid
from sqlalchemy.orm import Session
from app.models.session import InvestigationSession, PlayerChoice
from app.models.character import CharacterRelationshipState
from app.models.journal import JournalEvent
from app.models.dialogue import DialogueMessage
from app.schemas.scenario_schema import ScenarioAsset, ContradictionAsset
from app.schemas.inquiry import (
    ContradictionItem,
    ContradictionChallengePayload,
    ContradictionChallengeResponse,
)
from app.engine.game_state_service import GameStateService


class ContradictionService:
    """Evaluates testimonies against physical evidence and handles confrontations."""

    @classmethod
    def get_contradictions(
        cls,
        session: InvestigationSession,
        scenario: ScenarioAsset,
        db: Session,
    ) -> List[ContradictionItem]:
        """Compute status for all scenario contradictions against discovered evidence."""
        discovered_ids = {c.clue_id for c in session.discovered_clues}
        
        # Check resolved contradictions from recorded choices
        resolved_contra_ids = {
            c.choice_id for c in session.choices if c.choice_id.startswith("contra_")
        }

        items: List[ContradictionItem] = []
        for contra in scenario.contradictions:
            char_asset = next((c for c in scenario.characters if c.id == contra.target_character_id), None)
            char_name = char_asset.name if char_asset else contra.target_character_id

            evidence_asset = next((c for c in scenario.clues if c.id == contra.contradicting_evidence_id), None)
            ev_title = evidence_asset.title if evidence_asset else contra.contradicting_evidence_id

            missing = [cid for cid in contra.prerequisite_clue_ids if cid not in discovered_ids]
            is_ready = len(missing) == 0
            is_resolved = contra.id in resolved_contra_ids

            items.append(
                ContradictionItem(
                    id=contra.id,
                    title=contra.title,
                    target_character_id=contra.target_character_id,
                    target_character_name=char_name,
                    statement_summary=contra.statement_summary,
                    contradicting_evidence_id=contra.contradicting_evidence_id,
                    contradicting_evidence_title=ev_title,
                    contradiction_detail=contra.contradiction_detail,
                    is_ready_to_challenge=is_ready,
                    is_resolved=is_resolved,
                    missing_evidence=missing,
                )
            )

        return items

    @classmethod
    def challenge_contradiction(
        cls,
        session: InvestigationSession,
        payload: ContradictionChallengePayload,
        scenario: ScenarioAsset,
        db: Session,
    ) -> ContradictionChallengeResponse:
        """Confront a suspect with a detected contradiction in testimony or evidence."""
        contra: Optional[ContradictionAsset] = next(
            (c for c in scenario.contradictions if c.id == payload.contradiction_id), None
        )
        if not contra:
            raise ValueError(f"Contradiction '{payload.contradiction_id}' not found in scenario.")

        char_asset = next((c for c in scenario.characters if c.id == contra.target_character_id), None)
        char_name = char_asset.name if char_asset else contra.target_character_id

        rel_state = (
            db.query(CharacterRelationshipState)
            .filter_by(session_id=session.id, character_id=contra.target_character_id)
            .first()
        )
        min_trust = char_asset.min_trust if char_asset else 0
        max_trust = char_asset.max_trust if char_asset else 100

        discovered_ids = {c.clue_id for c in session.discovered_clues}
        missing_clues = [cid for cid in contra.prerequisite_clue_ids if cid not in discovered_ids]

        # Case 1: Premature challenge without necessary evidence
        if missing_clues:
            # Penalize trust
            if rel_state:
                rel_state.trust_score = max(min_trust, min(max_trust, rel_state.trust_score + contra.penalty_trust_delta))
                new_trust = rel_state.trust_score
            else:
                new_trust = 30

            dismissal_dialogue = (
                f"You level serious accusations without a shred of proof, detective. "
                f"I will not be slandered by baseless speculation in my own home."
            )
            return ContradictionChallengeResponse(
                success=False,
                character_id=contra.target_character_id,
                character_name=char_name,
                dialogue=dismissal_dialogue,
                emotional_cue="Indignant Disdain",
                trust_delta=contra.penalty_trust_delta,
                new_trust=new_trust,
            )

        # Case 2: Successful challenge with conclusive evidence
        if rel_state:
            rel_state.trust_score = max(min_trust, min(max_trust, rel_state.trust_score + contra.success_trust_delta))
            new_trust = rel_state.trust_score
        else:
            new_trust = 55

        # Discover unlocked clue if defined
        unlocked_clue_id = None
        if contra.unlocks_clue_id and contra.unlocks_clue_id not in discovered_ids:
            try:
                GameStateService.discover_clue(db, session, contra.unlocks_clue_id, scenario=scenario)
                unlocked_clue_id = contra.unlocks_clue_id
            except Exception:
                pass

        # Record PlayerChoice
        choice = PlayerChoice(
            id=f"choice_{uuid.uuid4().hex[:12]}",
            session_id=session.id,
            choice_id=contra.id,
            turn_number=session.turn_counter,
            action_type="CONTRADICTION",
            target_id=contra.target_character_id,
            decision_text=f"Challenged {char_name}: {contra.title}",
            impact_text=f"Trust adjusted by +{contra.success_trust_delta}. Discovered confession.",
            validated_outcome=contra.revealed_fact or "Contradiction resolved.",
        )
        db.add(choice)

        # Record Journal Event
        journal = JournalEvent(
            id=f"j_contra_{uuid.uuid4().hex[:12]}",
            session_id=session.id,
            event_type="contradiction",
            entry_type="fact",
            title=f"Contradiction Shattered: {contra.title}",
            summary=contra.revealed_fact or contra.contradiction_detail,
            flagged=True,
            turn_number=session.turn_counter,
        )
        db.add(journal)

        # Record Dialogue Message
        msg = DialogueMessage(
            id=f"msg_contra_{uuid.uuid4().hex[:12]}",
            session_id=session.id,
            character_id=contra.target_character_id,
            role="character",
            sender_name=char_name,
            speaker_type="character",
            content=f"{contra.confrontation_dialogue} {contra.revealed_fact or ''}".strip(),
            emotional_cue="Defensive Breakdown",
            atmospheric_effect="A heavy silence falls as the deceit crumbles.",
            turn_number=session.turn_counter,
            related_evidence_id=contra.contradicting_evidence_id,
        )
        db.add(msg)

        session.turn_counter += 1
        db.flush()

        return ContradictionChallengeResponse(
            success=True,
            character_id=contra.target_character_id,
            character_name=char_name,
            dialogue=f"{contra.confrontation_dialogue} {contra.revealed_fact or ''}".strip(),
            emotional_cue="Defensive Breakdown",
            trust_delta=contra.success_trust_delta,
            new_trust=new_trust,
            revealed_fact=contra.revealed_fact,
            unlocked_clue_id=unlocked_clue_id,
            journal_entry_id=journal.id,
        )

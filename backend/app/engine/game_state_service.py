import json
import re
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified

from app.models.session import InvestigationSession, PlayerChoice
from app.models.character import CharacterRelationshipState
from app.models.clue import DiscoveredClue, ClueDefinition
from app.models.dialogue import DialogueMessage
from app.models.journal import JournalEvent
from app.models.ending import EndingRecord
from app.schemas.scenario_schema import (
    ScenarioAsset,
    CharacterAsset,
    ClueAsset,
    LocationAsset,
    DialogueTopicAsset,
    EndingAsset,
)
from app.schemas.ending import AccusationPayload

# Content root path
CONTENT_DIR = Path(__file__).resolve().parent.parent.parent / "content" / "scenarios"


class GameStateService:
    """Authoritative deterministic story-state engine for mystery investigations."""

    _scenario_cache: Dict[str, ScenarioAsset] = {}

    @classmethod
    def load_scenario(
        cls, scenario_id: str = "case_blackwood_thirteenth_chime", reload: bool = False
    ) -> ScenarioAsset:
        """Load and validate scenario definition from repository JSON assets."""
        if not reload and scenario_id in cls._scenario_cache:
            return cls._scenario_cache[scenario_id]

        # Security: Prevent path traversal in scenario loading
        if not scenario_id or not re.match(r"^[a-zA-Z0-9_-]+$", scenario_id):
            raise ValueError(f"Invalid scenario ID format '{scenario_id}'. Path traversal rejected.")

        resolved_content_dir = CONTENT_DIR.resolve()
        file_path = (resolved_content_dir / f"{scenario_id}.json").resolve()
        if not file_path.is_relative_to(resolved_content_dir):
            raise ValueError(f"Scenario asset path traversal detected: {scenario_id}")

        if not file_path.exists():
            raise FileNotFoundError(f"Scenario asset not found at path: {file_path}")

        with open(file_path, "r", encoding="utf-8") as f:
            raw_data = json.load(f)

        scenario = ScenarioAsset.model_validate(raw_data)
        cls._scenario_cache[scenario_id] = scenario
        return scenario

    @classmethod
    def get_discovered_clue_ids(
        cls, session: InvestigationSession, db: Optional[Session] = None
    ) -> set:
        """Return the set of clue IDs discovered in the active session."""
        ids = {d.clue_id for d in session.discovered_clues} if session.discovered_clues else set()
        if db is not None:
            db_ids = {
                r[0]
                for r in db.query(DiscoveredClue.clue_id)
                .filter_by(session_id=session.id)
                .all()
            }
            ids = ids.union(db_ids)
        return ids

    @classmethod
    def get_relationship_state(
        cls, session: InvestigationSession, character_id: str
    ) -> Optional[CharacterRelationshipState]:
        """Fetch relationship state for a character within the session."""
        for rel in session.relationship_states:
            if rel.character_id == character_id:
                return rel
        return None

    @classmethod
    def get_available_locations(
        cls, session: InvestigationSession, scenario: ScenarioAsset, db: Optional[Session] = None
    ) -> List[Dict[str, Any]]:
        """
        Deterministically determine which mansion locations are unlocked.
        Evaluates explicit unlock conditions against discovered clues, choices, and trust levels.
        """
        discovered_ids = cls.get_discovered_clue_ids(session, db=db)
        choices_made = {c.choice_id for c in session.choices}

        results = []
        for loc in scenario.locations:
            if loc.unlocked_by_default:
                results.append({
                    "id": loc.id,
                    "name": loc.name,
                    "subtitle": loc.subtitle,
                    "description": loc.description,
                    "unlocked": True,
                    "reason": "Default accessible location",
                    "hotspots": [h.model_dump() for h in loc.hotspots],
                })
                continue

            cond = loc.unlock_conditions
            unlocked = True
            missing_reasons = []

            # 1. Check required clues
            for required_clue in cond.required_clue_ids:
                if required_clue not in discovered_ids:
                    unlocked = False
                    missing_reasons.append(f"Requires clue '{required_clue}'")

            # 2. Check required choices
            for required_choice in cond.required_choices:
                if required_choice not in choices_made:
                    unlocked = False
                    missing_reasons.append(f"Requires decision '{required_choice}'")

            # 3. Check character trust requirements
            if cond.min_character_trust:
                for char_id, min_trust in cond.min_character_trust.items():
                    rel = cls.get_relationship_state(session, char_id)
                    current_trust = rel.trust_score if rel else 0
                    if current_trust < min_trust:
                        unlocked = False
                        missing_reasons.append(f"Requires {char_id} trust >= {min_trust}")

            # 4. Check required flags
            if cond.required_flags:
                for flag_key, flag_val in cond.required_flags.items():
                    flag_matched = False
                    for rel in session.relationship_states:
                        if (rel.flags or {}).get(flag_key) == flag_val:
                            flag_matched = True
                            break
                    if not flag_matched:
                        unlocked = False
                        missing_reasons.append(f"Requires flag '{flag_key}={flag_val}'")

            results.append({
                "id": loc.id,
                "name": loc.name,
                "subtitle": loc.subtitle,
                "description": loc.description,
                "unlocked": unlocked,
                "reason": "Unlocked by investigation progress" if unlocked else "; ".join(missing_reasons),
                "hotspots": [h.model_dump() for h in loc.hotspots],
            })

        return results

    @classmethod
    def is_location_unlocked(
        cls, session: InvestigationSession, location_id: str, scenario: ScenarioAsset, db: Optional[Session] = None
    ) -> bool:
        """Check if a single location is currently accessible."""
        locations = cls.get_available_locations(session, scenario, db=db)
        for loc in locations:
            if loc["id"] == location_id:
                return loc["unlocked"]
        return False

    @classmethod
    def get_available_characters(
        cls, session: InvestigationSession, scenario: ScenarioAsset
    ) -> List[Dict[str, Any]]:
        """Return interviewable characters with current live trust and room presence."""
        results = []
        for char in scenario.characters:
            rel = cls.get_relationship_state(session, char.id)
            current_trust = rel.trust_score if rel else char.initial_trust
            current_status = rel.status if rel else char.default_status
            is_available = rel.is_available if rel else True

            results.append({
                "id": char.id,
                "name": char.name,
                "title": char.title,
                "role_type": char.role_type,
                "entity_type": char.entity_type,
                "status": current_status,
                "trust_level": current_trust,
                "is_available": is_available,
                "location_id": char.default_location_id,
                "short_bio": char.public_biography,
                "personality": char.personality,
            })
        return results

    @classmethod
    def get_available_topics(
        cls,
        session: InvestigationSession,
        character_id: str,
        scenario: ScenarioAsset,
        db: Optional[Session] = None,
    ) -> List[DialogueTopicAsset]:
        """
        Calculate available dialogue topics for a character.
        Enforces deterministic unlock thresholds based on trust, clues discovered, and flags.
        """
        char_asset = next((c for c in scenario.characters if c.id == character_id), None)
        if not char_asset:
            return []

        rel = cls.get_relationship_state(session, character_id)
        current_trust = rel.trust_score if rel else char_asset.initial_trust
        discovered_ids = cls.get_discovered_clue_ids(session, db=db)
        rel_flags = rel.flags if rel and rel.flags else {}

        unlocked_topics = []
        for topic in char_asset.dialogue_topics:
            # 1. Trust check
            if current_trust < topic.min_trust_required:
                continue

            # 2. Clue requirement check
            if topic.required_clue_ids:
                if not all(cid in discovered_ids for cid in topic.required_clue_ids):
                    continue

            # 3. Flag requirement check
            if topic.required_flags:
                if not all(rel_flags.get(k) == v for k, v in topic.required_flags.items()):
                    continue

            unlocked_topics.append(topic)

        return unlocked_topics

    @classmethod
    def discover_clue(
        cls,
        db: Session,
        session: InvestigationSession,
        clue_id: str,
        method: str = "INSPECTION",
        scenario: Optional[ScenarioAsset] = None,
    ) -> Tuple[DiscoveredClue, bool]:
        """
        Authoritatively discover a clue within the active session.
        Validates location unlock status and prerequisite clues.
        Idempotent: Duplicate calls return the existing discovery without modifying state.
        """
        if scenario is None:
            scenario = cls.load_scenario(session.scenario_id)

        clue_asset = next((c for c in scenario.clues if c.id == clue_id), None)
        if not clue_asset:
            raise ValueError(f"Unknown clue ID '{clue_id}'. Not defined in scenario.")

        # Check idempotency in DB
        existing_db = (
            db.query(DiscoveredClue)
            .filter_by(session_id=session.id, clue_id=clue_id)
            .first()
        )
        if existing_db:
            return existing_db, False

        # Check idempotency in in-memory session collection
        for existing in session.discovered_clues:
            if existing.clue_id == clue_id:
                return existing, False

        # Validate location unlock
        if clue_asset.prerequisites.required_location_id:
            loc_unlocked = cls.is_location_unlocked(
                session, clue_asset.prerequisites.required_location_id, scenario, db=db
            )
            if not loc_unlocked:
                raise ValueError(
                    f"Cannot discover '{clue_asset.title}': Location "
                    f"'{clue_asset.prerequisites.required_location_id}' is locked."
                )

        # Validate prerequisite clues
        discovered_ids = cls.get_discovered_clue_ids(session, db=db)
        for req_clue in clue_asset.prerequisites.required_clue_ids:
            if req_clue not in discovered_ids:
                raise ValueError(
                    f"Cannot discover '{clue_asset.title}': Missing prerequisite clue '{req_clue}'."
                )

        # Validate prerequisite flags
        if clue_asset.prerequisites.required_flags:
            for flag_k, flag_v in clue_asset.prerequisites.required_flags.items():
                flag_found = False
                for rel in session.relationship_states:
                    if (rel.flags or {}).get(flag_k) == flag_v:
                        flag_found = True
                        break
                if not flag_found:
                    raise ValueError(
                        f"Cannot discover '{clue_asset.title}': Prerequisite flag '{flag_k}' not satisfied."
                    )

        # Ensure ClueDefinition exists in DB
        clue_def = db.query(ClueDefinition).filter_by(id=clue_id).first()
        if not clue_def:
            clue_def = ClueDefinition(
                id=clue_asset.id,
                scenario_id=scenario.id,
                title=clue_asset.title,
                subtitle=clue_asset.subtitle,
                category=clue_asset.category,
                description=clue_asset.description,
                source=clue_asset.source_location,
                evidence_marker=clue_asset.evidence_marker,
                is_key_evidence=clue_asset.is_key_evidence,
                associated_suspects=clue_asset.associated_suspects,
            )
            db.add(clue_def)
            db.flush()

        # Insert DiscoveredClue record
        discovery = DiscoveredClue(
            session=session,
            session_id=session.id,
            clue_id=clue_id,
            status="revealed",
            discovery_time=session.updated_at,
            discovery_method=method,
            discovered_at_turn=session.turn_counter,
        )
        db.add(discovery)
        if discovery not in session.discovered_clues:
            session.discovered_clues.append(discovery)

        # Record in journal as confirmed fact
        journal_event = JournalEvent(
            session=session,
            session_id=session.id,
            event_type="lead" if clue_asset.category != "testimony" else "testimony",
            entry_type="fact",
            title=f"Discovered: {clue_asset.title}",
            summary=f"Recovered from {clue_asset.source_location}: {clue_asset.description}",
            flagged=clue_asset.is_key_evidence,
            turn_number=session.turn_counter,
        )
        db.add(journal_event)
        if journal_event not in session.journal_events:
            session.journal_events.append(journal_event)
        db.flush()

        return discovery, True

    @classmethod
    def present_evidence(
        cls,
        db: Session,
        session: InvestigationSession,
        character_id: str,
        clue_id: str,
        scenario: Optional[ScenarioAsset] = None,
    ) -> Dict[str, Any]:
        """
        Confront a character with evidence.
        Applies clamped trust modifications, records dialogue, and unlocks new clues/flags.
        Guarantees idempotency on trust delta: repeated presentation does not continuously pump or drain trust.
        """
        if scenario is None:
            scenario = cls.load_scenario(session.scenario_id)

        # 1. Verify clue is discovered
        discovered_ids = cls.get_discovered_clue_ids(session, db=db)
        if clue_id not in discovered_ids:
            raise ValueError(f"Cannot present undiscovered clue '{clue_id}'.")

        # 2. Verify character exists
        char_asset = next((c for c in scenario.characters if c.id == character_id), None)
        if not char_asset:
            raise ValueError(f"Unknown character '{character_id}'.")

        rel = cls.get_relationship_state(session, character_id)
        if not rel:
            raise ValueError(f"Character relationship state missing for '{character_id}'.")

        clue_asset = next((c for c in scenario.clues if c.id == clue_id), None)
        clue_title = clue_asset.title if clue_asset else clue_id

        # 3. Check presentation trigger
        trigger = char_asset.presentation_triggers.get(clue_id)
        rel_flags = dict(rel.flags or {})
        already_presented_key = f"presented_{clue_id}"
        is_first_presentation = not rel_flags.get(already_presented_key, False)

        unlocked_clue_obj = None
        if trigger:
            response_text = trigger.response_dialogue
            emotional_cue = trigger.emotional_cue
            atmospheric_cue = trigger.atmospheric_cue

            # Only apply trust delta and effects on the first presentation
            if is_first_presentation:
                # Clamp trust between character min and max
                new_trust = max(
                    char_asset.min_trust,
                    min(char_asset.max_trust, rel.trust_score + trigger.trust_delta),
                )
                rel.trust_score = new_trust

                # Apply flags
                rel_flags[already_presented_key] = True
                if trigger.sets_flags:
                    rel_flags.update(trigger.sets_flags)
                rel.flags = dict(rel_flags)
                flag_modified(rel, "flags")

                # Trigger chained clue discovery if specified
                if trigger.unlocks_clue_id:
                    unlocked_clue_obj, _ = cls.discover_clue(
                        db, session, trigger.unlocks_clue_id, method="TESTIMONY", scenario=scenario
                    )
        else:
            # Default response
            response_text = (
                f"I have examined the {clue_title}, but I fail to see what it has to do with my duties."
            )
            emotional_cue = "Guarded"
            atmospheric_cue = None
            if is_first_presentation:
                rel_flags[already_presented_key] = True
                rel.flags = dict(rel_flags)
                flag_modified(rel, "flags")

        # Record player presentation utterance
        p_msg = DialogueMessage(
            session_id=session.id,
            character_id=None,
            role="player",
            sender_name="Investigator",
            speaker_type="living",
            content=f"[Presents {clue_title}] What can you tell me regarding this evidence?",
            turn_number=session.turn_counter,
            related_evidence_id=clue_id,
        )
        db.add(p_msg)

        # Record character response utterance
        c_msg = DialogueMessage(
            session_id=session.id,
            character_id=character_id,
            role="character",
            sender_name=char_asset.name,
            speaker_type=char_asset.entity_type,
            content=response_text,
            emotional_cue=emotional_cue,
            atmospheric_effect=atmospheric_cue,
            turn_number=session.turn_counter,
            related_evidence_id=clue_id,
        )
        db.add(c_msg)

        # Record decision
        choice = PlayerChoice(
            session_id=session.id,
            choice_id=f"present_{clue_id}_to_{character_id}_{session.turn_counter}",
            turn_number=session.turn_counter,
            action_type="PRESENT_EVIDENCE",
            target_id=character_id,
            decision_text=f"Presented {clue_title} to {char_asset.name}.",
            impact_text=f"Trust now at {rel.trust_score}%. Demeanor: {emotional_cue}.",
            validated_outcome=response_text,
        )
        db.add(choice)
        db.flush()

        return {
            "dialogue_message": c_msg,
            "character_trust": rel.trust_score,
            "emotional_cue": emotional_cue,
            "atmospheric_cue": atmospheric_cue,
            "unlocked_clue": unlocked_clue_obj,
            "is_first_presentation": is_first_presentation,
        }

    @classmethod
    def apply_player_choice(
        cls,
        db: Session,
        session: InvestigationSession,
        choice_id: str,
        action_type: str,
        decision_text: str,
        impact_text: str,
        target_id: Optional[str] = None,
    ) -> PlayerChoice:
        """Persistently register a validated player decision."""
        if session.status != "active":
            raise ValueError(f"Session is {session.status}. Choices cannot be registered.")

        choice = PlayerChoice(
            session_id=session.id,
            choice_id=choice_id,
            turn_number=session.turn_counter,
            action_type=action_type,
            target_id=target_id,
            decision_text=decision_text,
            impact_text=impact_text,
            validated_outcome=f"Executed at turn {session.turn_counter}",
        )
        db.add(choice)
        db.flush()
        return choice

    @classmethod
    def calculate_unlocked_endings(
        cls,
        session: InvestigationSession,
        accusation: AccusationPayload,
        scenario: Optional[ScenarioAsset] = None,
        db: Optional[Session] = None,
    ) -> EndingAsset:
        """
        Pure deterministic evaluation of the three possible endings.
        Evaluates suspect, weapon, motive, supporting evidence count, character trust, and player sanity.
        """
        if scenario is None:
            scenario = cls.load_scenario(session.scenario_id)

        # Catastrophic failure state: Sanity zero
        if session.player_sanity <= 0:
            return next(e for e in scenario.endings if e.id == "END_SPECTRAL_WRATH")

        suspect = accusation.suspect_id.strip()
        weapon = accusation.weapon_id.strip()
        motive = accusation.motive_id.strip()

        discovered_ids = cls.get_discovered_clue_ids(session, db=db)
        verified_supporting_ids = [
            cid for cid in accusation.supporting_clue_ids if cid in discovered_ids
        ]

        # Fetch ending definitions
        ending_true = next(e for e in scenario.endings if e.id == "END_TRUE_RESTITUTION")
        ending_coverup = next(e for e in scenario.endings if e.id == "END_TRAGIC_COVERUP")
        ending_wrath = next(e for e in scenario.endings if e.id == "END_SPECTRAL_WRATH")

        # Check Ending 1: True Restitution (Exemplary Victory)
        # Suspect must be Julian
        is_julian = suspect == "char_julian" or "julian" in suspect.lower()
        is_correct_weapon = weapon in ["clue_silver_flask", "clue_arsenic_vial"]
        is_correct_motive = motive == "clue_burned_will"

        if is_julian and is_correct_weapon and is_correct_motive:
            # Check prerequisites for True Restitution:
            # 1. At least 3 verified supporting clues
            has_enough_supporting = len(verified_supporting_ids) >= ending_true.prerequisites.min_supporting_clues
            # 2. Must include required key clues (e.g. poison ledger)
            has_poison_ledger = "clue_crypt_journal" in discovered_ids
            # 3. Minimum sanity
            has_sanity = session.player_sanity >= ending_true.prerequisites.min_player_sanity
            # 4. Character trust thresholds
            caretaker_rel = cls.get_relationship_state(session, "char_caretaker")
            daughter_rel = cls.get_relationship_state(session, "char_daughter")
            caretaker_trust = caretaker_rel.trust_score if caretaker_rel else 0
            daughter_trust = daughter_rel.trust_score if daughter_rel else 0

            trust_satisfied = (
                caretaker_trust >= ending_true.prerequisites.min_character_trust.get("char_caretaker", 50)
                and daughter_trust >= ending_true.prerequisites.min_character_trust.get("char_daughter", 55)
            )

            if has_enough_supporting and has_poison_ledger and has_sanity and trust_satisfied:
                return ending_true
            else:
                return ending_coverup

        # If incorrect suspect accused (e.g. Caretaker, Daughter, Finch), triggers Ending 3: Spectral Wrath
        return ending_wrath

    @classmethod
    def get_safe_ai_context(
        cls,
        session: InvestigationSession,
        character_id: str,
        scenario: Optional[ScenarioAsset] = None,
        db: Optional[Session] = None,
    ) -> Dict[str, Any]:
        """
        Generate a safe, whitelisted context summary for local LLM dialogue synthesis.
        Guarantees that unrevealed clues, forbidden knowledge, and other characters' secrets are never leaked.
        """
        if scenario is None:
            scenario = cls.load_scenario(session.scenario_id)

        char_asset = next((c for c in scenario.characters if c.id == character_id), None)
        if not char_asset:
            raise ValueError(f"Unknown character '{character_id}'.")

        rel = cls.get_relationship_state(session, character_id)
        current_trust = rel.trust_score if rel else char_asset.initial_trust
        discovered_ids = cls.get_discovered_clue_ids(session, db=db)

        # 1. Compile whitelisted known facts
        whitelisted_facts = list(char_asset.knowledge_boundaries.always_known_facts)

        # Add conditional facts if the prerequisite clue has been discovered
        for cond_clue_id, fact_text in char_asset.knowledge_boundaries.conditional_facts.items():
            if cond_clue_id in discovered_ids:
                whitelisted_facts.append(fact_text)

        # 2. Compile strictly forbidden knowledge
        forbidden_lore = list(char_asset.knowledge_boundaries.strictly_forbidden_knowledge)

        # Add all undiscovered clues as explicitly forbidden topics
        for clue in scenario.clues:
            if clue.id not in discovered_ids:
                forbidden_lore.append(f"Existence and details of {clue.title} ({clue.id})")

        return {
            "character_id": char_asset.id,
            "character_name": char_asset.name,
            "role_type": char_asset.role_type,
            "entity_type": char_asset.entity_type,
            "current_trust": current_trust,
            "current_status": rel.status if rel else char_asset.default_status,
            "speaking_style": char_asset.speaking_style,
            "personality": char_asset.personality,
            "whitelisted_known_facts": whitelisted_facts,
            "strictly_forbidden_lore": forbidden_lore,
            "turn_counter": session.turn_counter,
            "player_sanity": session.player_sanity,
            "candle_percentage": session.candle_percentage,
            "ectoplasmic_tension": session.ectoplasmic_tension,
        }

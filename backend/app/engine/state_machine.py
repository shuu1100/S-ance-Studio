from typing import Optional, Tuple
from sqlalchemy.orm import Session
from app.models.session import InvestigationSession, PlayerChoice
from app.models.character import CharacterRelationshipState, CharacterDefinition
from app.models.dialogue import DialogueMessage
from app.models.clue import ClueDefinition
from app.engine.game_state_service import GameStateService
from app.schemas.dialogue import DialogueMessageResponse, ActionResponseData, ActionPayload
from app.schemas.clue import ClueResponse


def advance_turn(
    db: Session,
    session: InvestigationSession,
    sanity_delta: int = 0,
    tension_delta: int = 0,
) -> None:
    """Advance session turn counter, burn candle, and adjust psychological gauges."""
    session.turn_counter += 1
    # 2.5% candle burn per turn (reaches 25% at 30 turns)
    session.candle_percentage = max(0.0, round(session.candle_percentage - 2.5, 1))
    session.player_sanity = max(0, min(100, session.player_sanity + sanity_delta))
    session.ectoplasmic_tension = max(0, min(100, session.ectoplasmic_tension + tension_delta))

    if session.player_sanity <= 0:
        session.status = "completed"
        session.ending_id = "END_VESSEL_OF_THE_DAMNED"
    elif session.candle_percentage <= 0 or session.turn_counter > session.max_turns:
        session.status = "completed"
        session.ending_id = "END_THE_COLD_DARK"


def handle_present_evidence(
    db: Session,
    session: InvestigationSession,
    character_id: str,
    clue_id: str,
) -> Tuple[DialogueMessage, CharacterRelationshipState]:
    """Present a discovered piece of evidence to a character using the authoritative GameStateService."""
    scenario = GameStateService.load_scenario(session.scenario_id)

    # Check for character alias (e.g. char_eleanor -> char_apparition)
    effective_char_id = character_id
    char_ids_in_scenario = {c.id for c in scenario.characters}
    if character_id not in char_ids_in_scenario:
        if character_id == "char_eleanor":
            effective_char_id = "char_apparition"

    advance_turn(db, session, sanity_delta=-1, tension_delta=+3)

    result = GameStateService.present_evidence(
        db=db,
        session=session,
        character_id=effective_char_id,
        clue_id=clue_id,
        scenario=scenario,
    )

    rel = GameStateService.get_relationship_state(session, effective_char_id)
    return result["dialogue_message"], rel


def process_action_payload(
    db: Session,
    session: InvestigationSession,
    payload: ActionPayload,
) -> ActionResponseData:
    """Execute generic investigation action payload from frontend client."""
    if session.status != "active":
        raise ValueError(f"Investigation session is {session.status}. No further actions permitted.")

    scenario = GameStateService.load_scenario(session.scenario_id)
    action_type = payload.actionType.upper()
    unlocked_clue_resp: Optional[ClueResponse] = None
    dialogue_resp: Optional[DialogueMessageResponse] = None

    if action_type == "INSPECT":
        target = payload.targetId
        hotspot_to_clue = {
            "hs_clock": "clue_thirteenth_chime",
            "hs_hearth": "clue_burned_will",
            "hs_armchair": "clue_silver_flask",
            "hs_botanicals": "clue_arsenic_vial",
            "hs_threshold": "clue_torn_velvet",
            "hs_barrel_rack": "clue_crypt_journal",
            "hs_satchel": "clue_arsenic_vial",
            "hs_gramophone": "clue_thirteenth_chime",
            "hs_gate": "clue_crypt_journal",
        }
        clue_id_to_find = hotspot_to_clue.get(target, target)

        clue_def = db.query(ClueDefinition).filter_by(id=clue_id_to_find).first()
        if clue_def:
            disc, is_new = GameStateService.discover_clue(
                db=db,
                session=session,
                clue_id=clue_def.id,
                method="INSPECTION",
                scenario=scenario,
            )
            advance_turn(db, session, sanity_delta=0, tension_delta=+2)
            unlocked_clue_resp = ClueResponse(
                id=clue_def.id,
                title=clue_def.title,
                subtitle=clue_def.subtitle,
                category=clue_def.category,
                status="revealed",
                description=clue_def.description,
                location_found=clue_def.source,
                associated_suspects=clue_def.associated_suspects or [],
                evidence_marker=clue_def.evidence_marker,
                discovered_at_turn=disc.discovered_at_turn,
                is_key_evidence=clue_def.is_key_evidence,
            )
            choice = PlayerChoice(
                session_id=session.id,
                choice_id=f"inspect_{target}_{session.turn_counter}",
                turn_number=session.turn_counter,
                action_type="INSPECT",
                target_id=target,
                decision_text=f"Inspected {target}.",
                impact_text=f"Uncovered {clue_def.title}.",
                validated_outcome="Clue added to evidence board.",
            )
            db.add(choice)

    elif action_type == "TALK":
        target = payload.targetId
        effective_target = target
        char_ids_in_scenario = {c.id for c in scenario.characters}
        if target not in char_ids_in_scenario and target == "char_eleanor":
            effective_target = "char_apparition"

        if payload.presentedClueId:
            char_msg, _ = handle_present_evidence(db, session, effective_target, payload.presentedClueId)
            dialogue_resp = DialogueMessageResponse(
                id=char_msg.id,
                sender_id=target,
                sender_name=char_msg.sender_name,
                speaker_type=char_msg.speaker_type,
                text=char_msg.content,
                emotional_cue=char_msg.emotional_cue,
                atmospheric_effect=char_msg.atmospheric_effect,
                turn_number=char_msg.turn_number,
                timestamp=char_msg.timestamp.strftime("%I:%M %p"),
                clue_presented_id=payload.presentedClueId,
            )
        else:
            char_asset = next((c for c in scenario.characters if c.id == effective_target), None)
            if not char_asset:
                char_def = db.query(CharacterDefinition).filter_by(id=target).first()
                if not char_def:
                    raise ValueError(f"Unknown character target: '{target}'")
                speaker_name = char_def.name
                speaker_type = char_def.entity_type
                reply_text = char_def.known_facts[0] if char_def.known_facts else "I have nothing to say."
                emotional_cue = char_def.default_status.capitalize()
            else:
                speaker_name = char_asset.name
                speaker_type = char_asset.entity_type
                # Whitelisted known facts from safe AI context
                context = GameStateService.get_safe_ai_context(session, effective_target, scenario)
                reply_text = (
                    f"{context['whitelisted_known_facts'][0]}"
                    if context["whitelisted_known_facts"]
                    else "I have nothing further to disclose."
                )
                emotional_cue = context["current_status"].capitalize()

            advance_turn(
                db,
                session,
                sanity_delta=-2 if speaker_type == "spirit" else 0,
                tension_delta=+4,
            )

            p_msg = DialogueMessage(
                session_id=session.id,
                character_id=None,
                role="player",
                sender_name="Investigator",
                speaker_type="living",
                content=payload.queryText or "What happened on the night of the thirteenth chime?",
                turn_number=session.turn_counter,
            )
            db.add(p_msg)

            c_msg = DialogueMessage(
                session_id=session.id,
                character_id=effective_target,
                role="character",
                sender_name=speaker_name,
                speaker_type=speaker_type,
                content=reply_text,
                emotional_cue=emotional_cue,
                atmospheric_effect="Chamber temperature shifts subtly in the candlelight",
                turn_number=session.turn_counter,
            )
            db.add(c_msg)
            dialogue_resp = DialogueMessageResponse(
                id=c_msg.id,
                sender_id=target,
                sender_name=speaker_name,
                speaker_type=speaker_type,
                text=reply_text,
                emotional_cue=c_msg.emotional_cue,
                atmospheric_effect=c_msg.atmospheric_effect,
                turn_number=c_msg.turn_number,
                timestamp=c_msg.timestamp.strftime("%I:%M %p"),
            )

    db.flush()

    return ActionResponseData(
        turnNumber=session.turn_counter,
        dialogue=dialogue_resp,
        unlockedClue=unlocked_clue_resp,
        candlePercentage=session.candle_percentage,
        playerSanity=session.player_sanity,
        ectoplasmicTension=session.ectoplasmic_tension,
        objectiveUpdate=session.objective,
        gameStatus=session.status,
    )

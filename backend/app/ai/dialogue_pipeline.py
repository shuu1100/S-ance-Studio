from typing import Optional, Tuple
from sqlalchemy.orm import Session

from app.models.session import InvestigationSession
from app.models.dialogue import DialogueMessage
from app.engine.game_state_service import GameStateService
from app.engine.state_machine import advance_turn
from app.ai.interface import BaseAIProvider, DialoguePromptContext, DialogueGenerationResult
from app.ai.exceptions import AIInputValidationError
from app.ai.factory import get_ai_provider


class DialoguePipeline:
    """Orchestrates character dialogue synthesis using local AI while preserving authoritative game state."""

    @classmethod
    async def process_player_message(
        cls,
        db: Session,
        session: InvestigationSession,
        character_id: str,
        message_content: str,
        provider: Optional[BaseAIProvider] = None,
    ) -> Tuple[DialogueMessage, DialogueGenerationResult]:
        """
        Execute full pipeline:
        1. Validate inputs (character existence, message length).
        2. Load authoritative state and safe context from GameStateService.
        3. Build bounded prompt context with strictly whitelisted facts and redacted lore.
        4. Synthesize speech via local AI provider.
        5. Persist dialogue utterances and advance turn.
        """
        # 1. Input validation
        if not message_content or not message_content.strip():
            raise AIInputValidationError("Message content cannot be empty.")
        if len(message_content) > 1000:
            raise AIInputValidationError(f"Message exceeds maximum allowed length of 1000 characters (received {len(message_content)}).")

        scenario = GameStateService.load_scenario(session.scenario_id)

        # Handle character alias mapping (e.g. char_eleanor -> char_apparition)
        effective_char_id = character_id
        char_ids_in_scenario = {c.id for c in scenario.characters}
        if character_id not in char_ids_in_scenario and character_id == "char_eleanor":
            effective_char_id = "char_apparition"

        char_asset = next((c for c in scenario.characters if c.id == effective_char_id), None)
        if not char_asset:
            raise ValueError(f"Character '{character_id}' does not exist in scenario.")

        # 2. Extract safe AI context from authoritative engine
        safe_context = GameStateService.get_safe_ai_context(session, effective_char_id, scenario, db=db)
        discovered_clues = list(GameStateService.get_discovered_clue_ids(session, db=db))

        # 3. Retrieve recent dialogue history for conversational continuity (bounded to last 6 messages)
        recent_records = (
            db.query(DialogueMessage)
            .filter_by(session_id=session.id)
            .order_by(DialogueMessage.turn_number.desc(), DialogueMessage.timestamp.desc())
            .limit(6)
            .all()
        )
        recent_records.reverse()

        recent_dialogue = []
        for rec in recent_records:
            recent_dialogue.append({
                "role": rec.role,
                "speaker": rec.sender_name,
                "text": rec.content,
                "emotional_cue": rec.emotional_cue or "Guarded",
            })

        # 4. Construct prompt context
        prompt_ctx = DialoguePromptContext(
            character_id=effective_char_id,
            character_name=char_asset.name,
            role_type=char_asset.role_type,
            entity_type=char_asset.entity_type,
            speaking_style=char_asset.speaking_style,
            personality=char_asset.personality,
            current_trust=safe_context["current_trust"],
            current_status=safe_context["current_status"],
            whitelisted_known_facts=safe_context["whitelisted_known_facts"],
            strictly_forbidden_lore=safe_context["strictly_forbidden_lore"],
            discovered_clues=discovered_clues,
            recent_dialogue=recent_dialogue,
            player_query=message_content,
            fallback_dialogue=char_asset.fallback_dialogue,
            turn_counter=session.turn_counter,
            player_sanity=session.player_sanity,
            ectoplasmic_tension=session.ectoplasmic_tension,
            candle_percentage=session.candle_percentage,
        )

        # 5. Call local AI provider (raises real errors if unreachable, missing model, timeout)
        ai_provider = provider or get_ai_provider()
        gen_result = await ai_provider.generate_dialogue(prompt_ctx)

        # 6. Authoritative state transition: Advance turn and adjust gauges
        sanity_penalty = -1 if char_asset.entity_type == "spirit" else 0
        advance_turn(db, session, sanity_delta=sanity_penalty, tension_delta=+3)

        # 7. Persist player message
        p_msg = DialogueMessage(
            session_id=session.id,
            character_id=None,
            role="player",
            sender_name="Investigator",
            speaker_type="living",
            content=message_content.strip(),
            turn_number=session.turn_counter,
        )
        db.add(p_msg)

        # 8. Persist character reply
        c_msg = DialogueMessage(
            session_id=session.id,
            character_id=effective_char_id,
            role="character",
            sender_name=char_asset.name,
            speaker_type=char_asset.entity_type,
            content=gen_result.dialogue_text,
            emotional_cue=gen_result.emotional_cue,
            atmospheric_effect=gen_result.atmospheric_effect,
            turn_number=session.turn_counter,
        )
        db.add(c_msg)
        db.commit()

        return c_msg, gen_result

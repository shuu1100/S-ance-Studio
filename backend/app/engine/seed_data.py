from sqlalchemy.orm import Session
from app.models.scenario import ScenarioDefinition
from app.models.character import CharacterDefinition, CharacterRelationshipState
from app.models.clue import ClueDefinition, PermittedConnection, DiscoveredClue
from app.models.journal import JournalEvent
from app.models.dialogue import DialogueMessage
from app.models.session import InvestigationSession, PlayerChoice
from app.engine.game_state_service import GameStateService

SCENARIO_ID = "case_blackwood_thirteenth_chime"


def seed_scenario_catalog(db: Session) -> None:
    """Populate scenario catalog, characters, clues, and connection rules from versioned asset."""
    scenario_asset = GameStateService.load_scenario(SCENARIO_ID)

    # 1. Seed or update ScenarioDefinition
    scenario = db.query(ScenarioDefinition).filter_by(id=SCENARIO_ID).first()
    if not scenario:
        scenario = ScenarioDefinition(
            id=scenario_asset.id,
            title=scenario_asset.title,
            subtitle=scenario_asset.subtitle,
            difficulty=scenario_asset.difficulty,
            description=scenario_asset.description,
            era=scenario_asset.era,
            max_turns=str(scenario_asset.max_turns),
            true_culprit_id="char_julian",
            true_method_id="clue_silver_flask",
            true_motive_id="clue_burned_will",
            initial_objective=scenario_asset.initial_objective,
        )
        db.add(scenario)
        db.flush()

    # 2. Seed Characters from Asset
    for char_asset in scenario_asset.characters:
        char_record = db.query(CharacterDefinition).filter_by(id=char_asset.id).first()
        if not char_record:
            char_record = CharacterDefinition(
                id=char_asset.id,
                scenario_id=SCENARIO_ID,
                name=char_asset.name,
                title=char_asset.title,
                era=scenario_asset.era,
                entity_type=char_asset.entity_type,
                default_status=char_asset.default_status,
                avatar_seed=char_asset.avatar_seed,
                short_bio=char_asset.public_biography,
                secrets=char_asset.private_secrets,
                personality=char_asset.personality,
                default_location=char_asset.default_location_id,
                initial_trust=char_asset.initial_trust,
                known_facts=char_asset.knowledge_boundaries.always_known_facts,
            )
            db.add(char_record)

    # Also keep char_eleanor as alias to char_apparition if not present for backwards compatibility
    if not db.query(CharacterDefinition).filter_by(id="char_eleanor").first():
        app_asset = next(c for c in scenario_asset.characters if c.id == "char_apparition")
        db.add(
            CharacterDefinition(
                id="char_eleanor",
                scenario_id=SCENARIO_ID,
                name=app_asset.name,
                title=app_asset.title,
                era=scenario_asset.era,
                entity_type=app_asset.entity_type,
                default_status=app_asset.default_status,
                avatar_seed=app_asset.avatar_seed,
                short_bio=app_asset.public_biography,
                secrets=app_asset.private_secrets,
                personality=app_asset.personality,
                default_location=app_asset.default_location_id,
                initial_trust=app_asset.initial_trust,
                known_facts=app_asset.knowledge_boundaries.always_known_facts,
            )
        )

    # 3. Seed Clues from Asset
    for clue_asset in scenario_asset.clues:
        clue_record = db.query(ClueDefinition).filter_by(id=clue_asset.id).first()
        if not clue_record:
            clue_record = ClueDefinition(
                id=clue_asset.id,
                scenario_id=SCENARIO_ID,
                title=clue_asset.title,
                subtitle=clue_asset.subtitle,
                category=clue_asset.category,
                description=clue_asset.description,
                source=clue_asset.source_location,
                prerequisites=clue_asset.prerequisites.model_dump(),
                evidence_marker=clue_asset.evidence_marker,
                is_key_evidence=clue_asset.is_key_evidence,
                associated_suspects=clue_asset.associated_suspects,
            )
            db.add(clue_record)

    db.flush()

    # 4. Seed Permitted Connections
    for conn_asset in scenario_asset.permitted_connections:
        existing_conn = (
            db.query(PermittedConnection)
            .filter_by(
                scenario_id=SCENARIO_ID,
                from_clue_id=conn_asset.from_clue_id,
                to_clue_id=conn_asset.to_clue_id,
            )
            .first()
        )
        if not existing_conn:
            db.add(
                PermittedConnection(
                    scenario_id=SCENARIO_ID,
                    from_clue_id=conn_asset.from_clue_id,
                    to_clue_id=conn_asset.to_clue_id,
                    relationship=conn_asset.relationship,
                    label=conn_asset.label,
                    reason=conn_asset.reason,
                )
            )

    db.commit()


def create_initial_session_entities(db: Session, session: InvestigationSession) -> None:
    """Initialize relationship states, starting clues, journal entries, and intro dialogues for a new session."""
    scenario_asset = GameStateService.load_scenario(session.scenario_id)

    # 1. Initialize character relationship states for all characters in scenario
    for char_asset in scenario_asset.characters:
        rel = CharacterRelationshipState(
            session_id=session.id,
            character_id=char_asset.id,
            trust_score=char_asset.initial_trust,
            is_available=True,
            status=char_asset.default_status,
            current_location=char_asset.default_location_id,
            flags={},
        )
        db.add(rel)

    # 2. Add starting revealed clues (clues marked initially_revealed: true)
    starting_clues = [c for c in scenario_asset.clues if c.initially_revealed]
    for turn_idx, c_asset in enumerate(starting_clues, 1):
        disc = DiscoveredClue(
            session_id=session.id,
            clue_id=c_asset.id,
            status="verified" if c_asset.id == "clue_silver_flask" else "revealed",
            discovered_at_turn=turn_idx,
            discovery_method="INITIAL",
        )
        db.add(disc)

    # 3. Add initial journal entries
    initial_journal = [
        {
            "id": f"j_init_1_{session.id}",
            "session_id": session.id,
            "event_type": "autopsy",
            "entry_type": "fact",
            "title": "Autopsy Finding: Cyanosis & Bitter Almond",
            "summary": "Eleanor Blackwood died within 20 minutes of ingesting a lethal cordial. Chemical swab confirms concentrated arsenic trioxide.",
            "flagged": True,
            "turn_number": 1,
        },
        {
            "id": f"j_init_2_{session.id}",
            "session_id": session.id,
            "event_type": "lead",
            "entry_type": "fact",
            "title": "Financial Motive: Disinheritance of Lord Julian",
            "summary": "Recovered will fragment confirms Eleanor removed Julian from her estate due to his £8,500 London gambling debts.",
            "flagged": True,
            "turn_number": 2,
        },
        {
            "id": f"j_init_3_{session.id}",
            "session_id": session.id,
            "event_type": "occult",
            "entry_type": "fact",
            "title": "Séance Trance: The Thirteenth Chime",
            "summary": "Lady Eleanor's spirit confirms the clock chimed thirteen times when the cordial was placed in her hands by a figure in crimson velvet.",
            "flagged": True,
            "turn_number": 3,
        },
    ]
    for j in initial_journal:
        db.add(JournalEvent(**j))

    # 4. Add initial intro dialogue messages
    initial_dialogues = [
        {
            "id": f"msg_init_1_{session.id}",
            "session_id": session.id,
            "character_id": "char_caretaker",
            "role": "character",
            "sender_name": "Arthur Briggs",
            "speaker_type": "living",
            "content": "Storm's howling outside, detective. Mind your step in the corridors—this old manor has eyes and ears.",
            "emotional_cue": "Guarded",
            "atmospheric_effect": "Distant thunder rumbles across the grounds",
            "turn_number": 1,
        },
        {
            "id": f"msg_init_2_{session.id}",
            "session_id": session.id,
            "character_id": "char_apparition",
            "role": "character",
            "sender_name": "Lady Eleanor's Apparition",
            "speaker_type": "spirit",
            "content": "Why have you disturbed my rest? The cold in my chest will not cease... someone took my breath while the clock struck thirteen.",
            "emotional_cue": "Sorrowful & Chilled",
            "atmospheric_effect": "Room temperature drops noticeably",
            "turn_number": 2,
        },
    ]
    for d in initial_dialogues:
        db.add(DialogueMessage(**d))

    # 5. Add initial choices
    initial_choices = [
        {
            "id": f"choice_init_1_{session.id}",
            "session_id": session.id,
            "choice_id": "inspect_flask",
            "turn_number": 1,
            "action_type": "INSPECT",
            "target_id": "clue_silver_flask",
            "decision_text": "Inspected Eleanor's cordial flask before questioning suspects.",
            "impact_text": "Preserved forensic chemical residue.",
            "validated_outcome": "Discovered Exhibit A-1",
        },
        {
            "id": f"choice_init_2_{session.id}",
            "session_id": session.id,
            "choice_id": "confront_apparition",
            "turn_number": 2,
            "action_type": "TALK",
            "target_id": "char_apparition",
            "decision_text": "Confronted Lady Eleanor's spirit directly regarding the thirteenth chime.",
            "impact_text": "Sanity decreased by 2; unlocked spectral memory.",
            "validated_outcome": "Apparition trust confirmed at 60%",
        },
    ]
    for c in initial_choices:
        db.add(PlayerChoice(**c))

    db.flush()

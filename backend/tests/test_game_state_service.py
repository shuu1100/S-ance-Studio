import pytest
from app.models.session import InvestigationSession
from app.engine.game_state_service import GameStateService
from app.engine.seed_data import create_initial_session_entities
from app.schemas.ending import AccusationPayload


@pytest.fixture
def active_session(db_session):
    """Fixture providing a fresh active investigation session with initial entities."""
    session = InvestigationSession(
        scenario_id="case_blackwood_thirteenth_chime",
        title="Blackwood Manor",
        difficulty="seasoned",
        status="active",
        current_location="The Grand Foyer",
        current_act=1,
        total_acts=3,
        turn_counter=1,
        max_turns=30,
        candle_percentage=100.0,
        player_sanity=100,
        ectoplasmic_tension=20,
        objective="Investigate the manor.",
    )
    db_session.add(session)
    db_session.flush()
    create_initial_session_entities(db_session, session)
    db_session.commit()
    return session


def test_scenario_loading_and_validation():
    """Verify data-driven scenario asset loads and passes Pydantic validation."""
    scenario = GameStateService.load_scenario("case_blackwood_thirteenth_chime", reload=True)
    assert scenario.id == "case_blackwood_thirteenth_chime"
    assert len(scenario.characters) == 3
    assert len(scenario.clues) == 6
    assert len(scenario.locations) == 5
    assert len(scenario.endings) == 3

    # Unknown scenario should raise FileNotFoundError
    with pytest.raises(FileNotFoundError):
        GameStateService.load_scenario("case_non_existent_ghost_mystery_404")


def test_room_unlock_progression(active_session, db_session):
    """Verify locations remain locked until explicit deterministic conditions are satisfied."""
    scenario = GameStateService.load_scenario()

    # Initial state: Foyer and Séance Parlor unlocked; Library, Conservatory, Cellar locked
    assert GameStateService.is_location_unlocked(active_session, "room_foyer", scenario) is True
    assert GameStateService.is_location_unlocked(active_session, "room_seance", scenario) is True
    assert GameStateService.is_location_unlocked(active_session, "room_library", scenario) is True # Will discovered initially and Caretaker trust=40
    assert GameStateService.is_location_unlocked(active_session, "room_conservatory", scenario) is False # Caretaker trust 40 < 50
    assert GameStateService.is_location_unlocked(active_session, "room_cellar", scenario) is False # Daughter trust 35 < 60 and no crypt key

    # Raise Caretaker trust by presenting clockwork clue
    GameStateService.discover_clue(db_session, active_session, "clue_thirteenth_chime", scenario=scenario)
    GameStateService.present_evidence(db_session, active_session, "char_caretaker", "clue_thirteenth_chime", scenario=scenario)

    # Conservatory now unlocks because Caretaker trust is 55 (>= 50) and silver flask is discovered
    assert GameStateService.is_location_unlocked(active_session, "room_conservatory", scenario) is True

    # Cellar is still locked
    assert GameStateService.is_location_unlocked(active_session, "room_cellar", scenario) is False

    # Discover torn velvet and present to Victoria
    GameStateService.discover_clue(db_session, active_session, "clue_torn_velvet", scenario=scenario)
    GameStateService.present_evidence(db_session, active_session, "char_daughter", "clue_torn_velvet", scenario=scenario)
    # Also present burned will to Victoria to boost her trust above 60
    GameStateService.present_evidence(db_session, active_session, "char_daughter", "clue_burned_will", scenario=scenario)

    # Cellar now unlocks because Victoria trust is 70 (>= 60), torn velvet is discovered, and crypt key is granted
    assert GameStateService.is_location_unlocked(active_session, "room_cellar", scenario) is True


def test_clue_prerequisites_enforcement(active_session, db_session):
    """Reject discovery of clues whose location or prerequisites are unsatisfied."""
    scenario = GameStateService.load_scenario()

    # Attempting to discover crypt journal while cellar is locked raises ValueError
    with pytest.raises(ValueError) as excinfo:
        GameStateService.discover_clue(db_session, active_session, "clue_crypt_journal", scenario=scenario)
    assert "locked" in str(excinfo.value).lower()

    # Unknown clue ID raises ValueError
    with pytest.raises(ValueError) as excinfo2:
        GameStateService.discover_clue(db_session, active_session, "clue_phantom_alien_relic", scenario=scenario)
    assert "unknown clue" in str(excinfo2.value).lower()


def test_clue_discovery_idempotency(active_session, db_session):
    """Ensure duplicate discovery requests do not duplicate records or journal facts."""
    scenario = GameStateService.load_scenario()

    # Discover clockwork clue first time
    disc1, is_new1 = GameStateService.discover_clue(
        db_session, active_session, "clue_thirteenth_chime", scenario=scenario
    )
    assert is_new1 is True

    initial_discovered_count = len(active_session.discovered_clues)
    initial_journal_count = len(active_session.journal_events)

    # Discover second time
    disc2, is_new2 = GameStateService.discover_clue(
        db_session, active_session, "clue_thirteenth_chime", scenario=scenario
    )
    assert is_new2 is False
    assert disc1.id == disc2.id

    # Verify counts did not increase
    assert len(active_session.discovered_clues) == initial_discovered_count
    assert len(active_session.journal_events) == initial_journal_count


def test_character_knowledge_boundaries(active_session, db_session):
    """Verify characters only know whitelisted facts and strictly conceal forbidden knowledge."""
    scenario = GameStateService.load_scenario()

    # Safe AI context for Arthur Briggs (Caretaker)
    context_caretaker = GameStateService.get_safe_ai_context(active_session, "char_caretaker", scenario)
    assert "thirteen times" in " ".join(context_caretaker["whitelisted_known_facts"]).lower()

    # Strictly forbidden knowledge must not be in known facts
    forbidden = context_caretaker["strictly_forbidden_lore"]
    assert any("will" in f.lower() for f in forbidden)
    for f in forbidden:
        assert f not in context_caretaker["whitelisted_known_facts"]

    # Undiscovered clues must be listed as forbidden
    assert any("clue_crypt_journal" in f for f in forbidden)


def test_trust_limits_and_clamping(active_session, db_session):
    """Ensure trust delta remains strictly clamped within character bounds and idempotent on repeated presentation."""
    scenario = GameStateService.load_scenario()

    caretaker_rel = GameStateService.get_relationship_state(active_session, "char_caretaker")
    assert caretaker_rel.trust_score == 40  # Initial trust

    # Discover clockwork and present to Caretaker
    GameStateService.discover_clue(db_session, active_session, "clue_thirteenth_chime", scenario=scenario)
    res1 = GameStateService.present_evidence(
        db_session, active_session, "char_caretaker", "clue_thirteenth_chime", scenario=scenario
    )
    assert res1["is_first_presentation"] is True
    assert caretaker_rel.trust_score == 55  # 40 + 15

    # Second presentation of same clue should be idempotent and NOT repeatedly increment trust
    res2 = GameStateService.present_evidence(
        db_session, active_session, "char_caretaker", "clue_thirteenth_chime", scenario=scenario
    )
    assert res2["is_first_presentation"] is False
    assert caretaker_rel.trust_score == 55  # Remains 55, not 70!


def test_dialogue_topic_unlock_conditions(active_session, db_session):
    """Dialogue topics are hidden until prerequisite trust and clues are gathered."""
    scenario = GameStateService.load_scenario()

    # Initially Caretaker only has basic topic (requires trust 30)
    topics_init = GameStateService.get_available_topics(active_session, "char_caretaker", scenario)
    topic_ids = [t.id for t in topics_init]
    assert "topic_grounds_patrol" in topic_ids
    assert "topic_clock_tampering" not in topic_ids  # Requires clock clue and trust 50

    # Discover clockwork and raise trust
    GameStateService.discover_clue(db_session, active_session, "clue_thirteenth_chime", scenario=scenario)
    GameStateService.present_evidence(db_session, active_session, "char_caretaker", "clue_thirteenth_chime", scenario=scenario)

    topics_after = GameStateService.get_available_topics(active_session, "char_caretaker", scenario)
    topic_ids_after = [t.id for t in topics_after]
    assert "topic_clock_tampering" in topic_ids_after


# ==============================================================================
# Complete Playthrough Tests for All 3 Endings
# ==============================================================================

def test_complete_playthrough_ending_1_true_restitution(active_session, db_session):
    """
    Complete Playthrough Ending 1: True Restitution (Exemplary Victory).
    Reachable by systematically securing physical evidence, witness corroboration,
    unlocking all rooms, and exposing Julian's complete conspiracy.
    """
    scenario = GameStateService.load_scenario()

    # 1. Discover Clockwork in Grand Foyer
    GameStateService.discover_clue(db_session, active_session, "clue_thirteenth_chime", scenario=scenario)

    # 2. Present clockwork to Caretaker (Arthur trust: 40 -> 55, unlocks conservatory)
    GameStateService.present_evidence(db_session, active_session, "char_caretaker", "clue_thirteenth_chime", scenario=scenario)
    assert GameStateService.is_location_unlocked(active_session, "room_conservatory", scenario) is True

    # 3. Enter Conservatory and discover Arsenic Vial
    GameStateService.discover_clue(db_session, active_session, "clue_arsenic_vial", scenario=scenario)

    # 4. Present burned will to Victoria (Victoria trust: 35 -> 55)
    GameStateService.present_evidence(db_session, active_session, "char_daughter", "clue_burned_will", scenario=scenario)

    # 5. Enter Library and discover Torn Velvet
    GameStateService.discover_clue(db_session, active_session, "clue_torn_velvet", scenario=scenario)

    # 6. Present torn velvet to Victoria (Victoria trust: 55 -> 70, provides crypt key)
    GameStateService.present_evidence(db_session, active_session, "char_daughter", "clue_torn_velvet", scenario=scenario)
    assert GameStateService.is_location_unlocked(active_session, "room_cellar", scenario) is True

    # 7. Enter Cellar and discover Julian's Poison Ledger
    GameStateService.discover_clue(db_session, active_session, "clue_crypt_journal", scenario=scenario)

    # 8. Present poison ledger to the Apparition (Apparition trust: 60 -> 75, transfigured peace)
    GameStateService.present_evidence(db_session, active_session, "char_apparition", "clue_crypt_journal", scenario=scenario)

    # 9. Deliver formal accusation matrix naming Julian with full corroborating evidence
    accusation = AccusationPayload(
        suspectId="char_julian",
        weaponId="clue_silver_flask",
        motiveId="clue_burned_will",
        supportingClueIds=[
            "clue_thirteenth_chime",
            "clue_arsenic_vial",
            "clue_crypt_journal",
        ],
    )
    ending = GameStateService.calculate_unlocked_endings(active_session, accusation, scenario)

    # Verify Exemplary Victory
    assert ending.id == "END_TRUE_RESTITUTION"
    assert ending.verdict_type == "exemplary_victory"
    assert "Scotland Yard" in ending.narrative
    assert ending.rating == "Master Occult Detective (Rank S)"


def test_complete_playthrough_ending_2_tragic_coverup(active_session, db_session):
    """
    Complete Playthrough Ending 2: Tragic Coverup (Hollow Victory).
    Occurs when the investigator identifies Julian but rushes to accusation without
    securing the crypt ledger or gaining witness trust, allowing Julian to evade justice.
    """
    scenario = GameStateService.load_scenario()

    # Investigator only gathers initial clues without unlocking the cellar or confronting Victoria
    accusation = AccusationPayload(
        suspectId="char_julian",
        weaponId="clue_silver_flask",
        motiveId="clue_burned_will",
        supportingClueIds=["clue_burned_will"],
    )
    ending = GameStateService.calculate_unlocked_endings(active_session, accusation, scenario)

    # Verify Hollow Victory
    assert ending.id == "END_TRAGIC_COVERUP"
    assert ending.verdict_type == "hollow_victory"
    assert "morning steamer" in ending.narrative
    assert ending.rating == "Inconclusive Inquest (Rank C)"


def test_complete_playthrough_ending_3_wrongful_conviction(active_session, db_session):
    """
    Complete Playthrough Ending 3: Spectral Wrath (Wrongful Conviction).
    Occurs when an innocent ally (Caretaker or Daughter) is wrongfully condemned.
    """
    scenario = GameStateService.load_scenario()

    # Wrongfully accuse Caretaker Arthur Briggs
    accusation = AccusationPayload(
        suspectId="char_caretaker",
        weaponId="clue_silver_flask",
        motiveId="clue_burned_will",
        supportingClueIds=["clue_silver_flask"],
    )
    ending = GameStateService.calculate_unlocked_endings(active_session, accusation, scenario)

    # Verify Catastrophic Defeat
    assert ending.id == "END_SPECTRAL_WRATH"
    assert ending.verdict_type == "wrongful_conviction"
    assert "poltergeist storm" in ending.narrative
    assert ending.rating == "Tragic Miscarriage of Inquest (Rank F)"


def test_complete_playthrough_ending_3_sanity_collapse(active_session, db_session):
    """
    Ending 3 also triggers if player sanity drops to 0 due to supernatural strain.
    """
    scenario = GameStateService.load_scenario()
    active_session.player_sanity = 0

    accusation = AccusationPayload(
        suspectId="char_julian",
        weaponId="clue_silver_flask",
        motiveId="clue_burned_will",
        supportingClueIds=["clue_silver_flask"],
    )
    ending = GameStateService.calculate_unlocked_endings(active_session, accusation, scenario)
    assert ending.id == "END_SPECTRAL_WRATH"
    assert ending.verdict_type == "wrongful_conviction"

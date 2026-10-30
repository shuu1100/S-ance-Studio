"""
Automated validation test suite for Blackwood Manor: The Thirteenth Chime story content.
Validates narrative consistency, graph dependencies, character boundaries, and playthrough solvability.
"""

from typing import Set, Dict, List
from app.engine.game_state_service import GameStateService
from app.schemas.scenario_schema import ScenarioAsset
from app.schemas.ending import AccusationPayload


def test_scenario_metadata_and_narration():
    """Verify scenario metadata completeness and atmospheric opening narration."""
    scenario: ScenarioAsset = GameStateService.load_scenario("case_blackwood_thirteenth_chime", reload=True)

    assert scenario.id == "case_blackwood_thirteenth_chime"
    assert "Blackwood Manor" in scenario.title
    assert "Thirteenth Chime" in scenario.title
    assert scenario.era == "October 1922"
    assert scenario.max_turns >= 25
    assert len(scenario.description) > 50

    # Opening narration must be richly atmospheric Victorian prose
    assert scenario.opening_narration is not None
    assert len(scenario.opening_narration) > 150
    assert "thirteenth chime" in scenario.opening_narration.lower()
    assert "ward candle" in scenario.opening_narration.lower()


def test_character_profiles_and_dialogue_guidance():
    """Verify all 3 characters have profiles, greetings, fallbacks, and knowledge boundaries."""
    scenario = GameStateService.load_scenario("case_blackwood_thirteenth_chime")

    expected_chars = {"char_caretaker", "char_daughter", "char_apparition"}
    actual_chars = {c.id for c in scenario.characters}
    assert actual_chars == expected_chars

    for char in scenario.characters:
        assert len(char.name) > 3
        assert len(char.public_biography) > 30
        assert len(char.personality) > 15
        assert len(char.speaking_style) > 15
        assert 0 <= char.initial_trust <= 100
        assert char.min_trust <= char.initial_trust <= char.max_trust

        # Spoken opening greeting and fallback dialogue
        assert char.opening_greeting is not None, f"Missing opening_greeting for {char.id}"
        assert len(char.opening_greeting) > 20
        assert char.fallback_dialogue is not None, f"Missing fallback_dialogue for {char.id}"
        assert len(char.fallback_dialogue) > 20

        # Knowledge boundaries
        kb = char.knowledge_boundaries
        assert len(kb.always_known_facts) >= 2, f"Insufficient always_known_facts for {char.id}"
        assert len(kb.strictly_forbidden_knowledge) >= 2, f"Insufficient forbidden lore for {char.id}"

        # Presentation triggers & dialogue topics
        assert len(char.presentation_triggers) >= 2, f"Too few triggers for {char.id}"
        assert len(char.dialogue_topics) >= 2, f"Too few topics for {char.id}"

        for topic in char.dialogue_topics:
            assert len(topic.inquiry_text) > 10
            assert len(topic.response_dialogue) > 15


def test_clue_inventory_and_sources():
    """Verify all 6 clues match required specifications and map to distinct evidence sources."""
    scenario = GameStateService.load_scenario("case_blackwood_thirteenth_chime")

    expected_clues = {
        "clue_silver_flask",
        "clue_burned_will",
        "clue_thirteenth_chime",
        "clue_arsenic_vial",
        "clue_torn_velvet",
        "clue_crypt_journal",
    }
    actual_clues = {c.id for c in scenario.clues}
    assert actual_clues == expected_clues

    markers = set()
    for clue in scenario.clues:
        assert len(clue.title) > 5
        assert len(clue.subtitle) > 5
        assert len(clue.description) > 30
        assert len(clue.source_location) > 5
        assert clue.evidence_marker not in markers, f"Duplicate marker: {clue.evidence_marker}"
        markers.add(clue.evidence_marker)


def test_location_and_hotspot_graph_integrity():
    """Verify that all locations, hotspots, and unlock conditions form a coherent graph."""
    scenario = GameStateService.load_scenario("case_blackwood_thirteenth_chime")

    location_ids = {loc.id for loc in scenario.locations}
    clue_ids = {c.id for c in scenario.clues}

    assert "room_foyer" in location_ids
    assert "room_seance" in location_ids
    assert "room_library" in location_ids
    assert "room_conservatory" in location_ids
    assert "room_cellar" in location_ids

    # Validate hotspots map to real clues or valid descriptions
    for loc in scenario.locations:
        for hs in loc.hotspots:
            if hs.unlocks_clue_id:
                assert hs.unlocks_clue_id in clue_ids, f"Hotspot {hs.id} references invalid clue {hs.unlocks_clue_id}"

        # Validate unlock conditions
        for req_clue in loc.unlock_conditions.required_clue_ids:
            assert req_clue in clue_ids, f"Location {loc.id} requires non-existent clue {req_clue}"


def test_clue_dependency_graph_reachability():
    """
    Validate that the clue dependency graph has no cycles and every clue can be discovered
    starting from the initially available locations (Foyer and Séance Parlor).
    """
    scenario = GameStateService.load_scenario("case_blackwood_thirteenth_chime")
    all_clues = {c.id: c for c in scenario.clues}

    # Simulate discovery reachability
    discovered: Set[str] = set()
    unlocked_rooms: Set[str] = {"room_foyer", "room_seance"}
    flags: Dict[str, bool] = {}

    # Initial room clues
    for loc in scenario.locations:
        if loc.id in unlocked_rooms:
            for hs in loc.hotspots:
                if hs.unlocks_clue_id:
                    discovered.add(hs.unlocks_clue_id)

    # Iteratively resolve unlocks and discoveries
    changed = True
    iterations = 0
    max_iterations = 20

    while changed and iterations < max_iterations:
        changed = False
        iterations += 1

        # Check room unlocks
        for loc in scenario.locations:
            if loc.id in unlocked_rooms:
                continue
            cond = loc.unlock_conditions
            clues_met = all(cid in discovered for cid in cond.required_clue_ids)
            flags_met = all(flags.get(k) == v for k, v in cond.required_flags.items())
            if clues_met and flags_met:
                unlocked_rooms.add(loc.id)
                changed = True
                # Discover clues in newly unlocked room
                for hs in loc.hotspots:
                    if hs.unlocks_clue_id and hs.unlocks_clue_id not in discovered:
                        clue_obj = all_clues[hs.unlocks_clue_id]
                        reqs = clue_obj.prerequisites
                        if all(rc in discovered for rc in reqs.required_clue_ids):
                            discovered.add(hs.unlocks_clue_id)

        # Check character presentation triggers that yield flags or clues
        for char in scenario.characters:
            for clue_id, trigger in char.presentation_triggers.items():
                if clue_id in discovered:
                    for fk, fv in trigger.sets_flags.items():
                        if flags.get(fk) != fv:
                            flags[fk] = fv
                            changed = True
                    if trigger.unlocks_clue_id and trigger.unlocks_clue_id not in discovered:
                        discovered.add(trigger.unlocks_clue_id)
                        changed = True

    assert len(discovered) == 6, f"Not all clues were reachable! Discovered: {discovered}"
    assert len(unlocked_rooms) == 5, f"Not all rooms were unlocked! Unlocked: {unlocked_rooms}"


def test_endings_and_epilogues_integrity():
    """Verify that all 3 endings have rich narratives, distinct epilogues, and valid prerequisites."""
    scenario = GameStateService.load_scenario("case_blackwood_thirteenth_chime")

    expected_endings = {"END_TRUE_RESTITUTION", "END_TRAGIC_COVERUP", "END_SPECTRAL_WRATH"}
    actual_endings = {e.id for e in scenario.endings}
    assert actual_endings == expected_endings

    for ending in scenario.endings:
        assert len(ending.title) > 10
        assert len(ending.narrative) > 100
        # Epilogue requirement
        assert ending.epilogue is not None, f"Missing epilogue for {ending.id}"
        assert len(ending.epilogue) > 100
        assert ending.rating.startswith("Master") or ending.rating.startswith("Inconclusive") or ending.rating.startswith("Tragic")


def test_choice_definitions_inventory():
    """Verify defined choices have valid actions, targets, and consequences."""
    scenario = GameStateService.load_scenario("case_blackwood_thirteenth_chime")
    assert len(scenario.choices) >= 8

    choice_ids = set()
    for ch in scenario.choices:
        assert ch.id not in choice_ids, f"Duplicate choice ID: {ch.id}"
        choice_ids.add(ch.id)
        assert ch.action_type in ["INSPECT", "MOVE", "QUESTION", "PRESENT_EVIDENCE", "ACCUSE"]
        assert len(ch.decision_text) > 10
        assert len(ch.impact_text) > 10


def test_full_playthrough_solvability(client):
    """
    Simulate a complete, deterministic playthrough through the API:
    1. Create investigation.
    2. Inspect foyer clock and hearth.
    3. Present burned will to Caretaker -> unlocks Library.
    4. Inspect library armchair and door threshold.
    5. Present torn velvet to Victoria -> receive crypt key.
    6. Present silver flask and arsenic to Caretaker -> unlocks Conservatory.
    7. Inspect aconite bed -> discovers arsenic vial.
    8. Enter crypt with Father's brass key -> discover poison ledger.
    9. Deliver final accusation -> achieves True Restitution Rank S with complete epilogue.
    """
    create_res = client.post("/api/v1/investigations", json={"scenario_id": "case_blackwood_thirteenth_chime"})
    assert create_res.status_code == 201
    session_id = create_res.json()["data"]["id"]

    # 1. Inspect foyer hotspots
    act1 = client.post(f"/api/v1/investigations/{session_id}/action", json={"actionType": "INSPECT", "targetId": "hs_clock"})
    assert act1.status_code == 200
    assert act1.json()["data"]["unlockedClue"]["id"] == "clue_thirteenth_chime"

    act2 = client.post(f"/api/v1/investigations/{session_id}/action", json={"actionType": "INSPECT", "targetId": "hs_hearth"})
    assert act2.status_code == 200

    # 2. Present clock to Arthur Briggs -> boosts trust
    pres1 = client.post(f"/api/v1/investigations/{session_id}/present-evidence", json={
        "character_id": "char_caretaker",
        "clue_id": "clue_thirteenth_chime"
    })
    assert pres1.status_code == 200

    # 3. Present burned will to Victoria
    pres2 = client.post(f"/api/v1/investigations/{session_id}/present-evidence", json={
        "character_id": "char_daughter",
        "clue_id": "clue_burned_will"
    })
    assert pres2.status_code == 200

    # 4. Inspect Library hotspots
    act3 = client.post(f"/api/v1/investigations/{session_id}/action", json={"actionType": "INSPECT", "targetId": "hs_armchair"})
    assert act3.status_code == 200
    assert act3.json()["data"]["unlockedClue"]["id"] == "clue_silver_flask"

    act4 = client.post(f"/api/v1/investigations/{session_id}/action", json={"actionType": "INSPECT", "targetId": "hs_threshold"})
    assert act4.status_code == 200
    assert act4.json()["data"]["unlockedClue"]["id"] == "clue_torn_velvet"

    # 5. Present torn velvet to Victoria -> grants has_crypt_key
    pres3 = client.post(f"/api/v1/investigations/{session_id}/present-evidence", json={
        "character_id": "char_daughter",
        "clue_id": "clue_torn_velvet"
    })
    assert pres3.status_code == 200

    # 6. Present silver flask to Arthur -> Arthur trust boosts
    pres4 = client.post(f"/api/v1/investigations/{session_id}/present-evidence", json={
        "character_id": "char_caretaker",
        "clue_id": "clue_silver_flask"
    })
    assert pres4.status_code == 200

    # 7. Inspect Conservatory aconite bed -> discovers arsenic vial
    act5 = client.post(f"/api/v1/investigations/{session_id}/action", json={"actionType": "INSPECT", "targetId": "hs_botanicals"})
    assert act5.status_code == 200
    assert act5.json()["data"]["unlockedClue"]["id"] == "clue_arsenic_vial"

    # 8. Present arsenic to Arthur -> boosts trust to > 60
    pres5 = client.post(f"/api/v1/investigations/{session_id}/present-evidence", json={
        "character_id": "char_caretaker",
        "clue_id": "clue_arsenic_vial"
    })
    assert pres5.status_code == 200

    # 9. Inspect Crypt barrel rack 12 -> discovers poison ledger
    act6 = client.post(f"/api/v1/investigations/{session_id}/action", json={"actionType": "INSPECT", "targetId": "hs_barrel_rack"})
    assert act6.status_code == 200
    assert act6.json()["data"]["unlockedClue"]["id"] == "clue_crypt_journal"

    # 10. Deliver final accusation
    accuse_payload = {
        "suspectId": "char_julian",
        "weaponId": "clue_silver_flask",
        "motiveId": "clue_burned_will",
        "supportingClueIds": ["clue_thirteenth_chime", "clue_arsenic_vial", "clue_crypt_journal"]
    }
    accuse_res = client.post(f"/api/v1/investigations/{session_id}/complete", json=accuse_payload)
    assert accuse_res.status_code == 200
    outcome = accuse_res.json()["data"]

    assert outcome["id"] == "END_TRUE_RESTITUTION"
    assert outcome["verdictType"] == "exemplary_victory"
    assert "Julian" in outcome["culpritNamed"]
    assert "Rank S" in outcome["rating"]
    assert outcome["epilogue"] is not None
    assert len(outcome["epilogue"]) > 50
    assert "Old Bailey" in outcome["epilogue"]

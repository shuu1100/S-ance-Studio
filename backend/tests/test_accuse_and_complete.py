from app.engine.game_state_service import GameStateService
from app.models.session import InvestigationSession


def test_accuse_true_restitution(client, db_session):
    """Test Ending 1: Complete restitution achieved when all evidence and trust thresholds are satisfied."""
    create_res = client.post(
        "/api/v1/investigations",
        json={"scenario_id": "case_blackwood_thirteenth_chime"},
    )
    session_id = create_res.json()["data"]["id"]

    # 1. Inspect and discover Clockwork clue
    client.post(
        f"/api/v1/investigations/{session_id}/discoveries",
        json={"clue_id": "clue_thirteenth_chime"},
    )

    # 2. Present clockwork clue to Caretaker to raise his trust from 40 to 55 (unlocks conservatory)
    client.post(
        f"/api/v1/investigations/{session_id}/present-evidence",
        json={"character_id": "char_caretaker", "clue_id": "clue_thirteenth_chime"},
    )

    # 3. Discover arsenic vial in conservatory
    client.post(
        f"/api/v1/investigations/{session_id}/discoveries",
        json={"clue_id": "clue_arsenic_vial"},
    )

    # 4. Present burned will to Daughter Victoria to raise her trust from 35 to 55
    client.post(
        f"/api/v1/investigations/{session_id}/present-evidence",
        json={"character_id": "char_daughter", "clue_id": "clue_burned_will"},
    )

    # 5. Discover torn velvet and grant crypt key
    client.post(
        f"/api/v1/investigations/{session_id}/discoveries",
        json={"clue_id": "clue_torn_velvet"},
    )
    client.post(
        f"/api/v1/investigations/{session_id}/present-evidence",
        json={"character_id": "char_daughter", "clue_id": "clue_torn_velvet"},
    )

    # 6. Discover crypt journal
    client.post(
        f"/api/v1/investigations/{session_id}/discoveries",
        json={"clue_id": "clue_crypt_journal"},
    )

    # 7. Submit formal accusation matrix
    accusation_payload = {
        "suspectId": "char_julian",
        "weaponId": "clue_silver_flask",
        "motiveId": "clue_burned_will",
        "supportingClueIds": [
            "clue_thirteenth_chime",
            "clue_arsenic_vial",
            "clue_crypt_journal",
        ],
    }

    accuse_res = client.post(
        f"/api/v1/investigations/{session_id}/complete",
        json=accusation_payload,
    )
    assert accuse_res.status_code == 200
    outcome = accuse_res.json()["data"]
    assert outcome["id"] == "END_TRUE_RESTITUTION"
    assert outcome["verdictType"] == "exemplary_victory"
    assert "Julian" in outcome["culpritNamed"]
    assert "Master Occult Detective" in outcome["rating"]

    # Verify session is marked completed with ending
    detail_res = client.get(f"/api/v1/investigations/{session_id}")
    assert detail_res.json()["data"]["session"]["status"] == "completed"
    assert detail_res.json()["data"]["session"]["endingAchieved"] == "END_TRUE_RESTITUTION"


def test_accuse_tragic_coverup_hollow_victory(client):
    """Test Ending 2: Hollow victory achieved when Julian is accused prematurely without complete corroborating proof."""
    create_res = client.post(
        "/api/v1/investigations",
        json={"scenario_id": "case_blackwood_thirteenth_chime"},
    )
    session_id = create_res.json()["data"]["id"]

    # Accuse Julian with only starting clues and zero crypt journal proof
    accusation_payload = {
        "suspectId": "char_julian",
        "weaponId": "clue_silver_flask",
        "motiveId": "clue_burned_will",
        "supportingClueIds": ["clue_burned_will"],
    }

    accuse_res = client.post(
        f"/api/v1/investigations/{session_id}/complete",
        json=accusation_payload,
    )
    assert accuse_res.status_code == 200
    outcome = accuse_res.json()["data"]
    assert outcome["id"] == "END_TRAGIC_COVERUP"
    assert outcome["verdictType"] == "hollow_victory"
    assert "Inconclusive Inquest" in outcome["rating"]


def test_accuse_spectral_wrath_wrongful_conviction(client):
    """Test Ending 3: Catastrophic defeat when an innocent ally is falsely accused."""
    create_res = client.post(
        "/api/v1/investigations",
        json={"scenario_id": "case_blackwood_thirteenth_chime"},
    )
    session_id = create_res.json()["data"]["id"]

    # Accuse the Caretaker (Arthur Briggs)
    accusation_payload = {
        "suspectId": "char_caretaker",
        "weaponId": "clue_silver_flask",
        "motiveId": "clue_burned_will",
        "supportingClueIds": ["clue_silver_flask"],
    }

    accuse_res = client.post(
        f"/api/v1/investigations/{session_id}/complete",
        json=accusation_payload,
    )
    assert accuse_res.status_code == 200
    outcome = accuse_res.json()["data"]
    assert outcome["id"] == "END_SPECTRAL_WRATH"
    assert outcome["verdictType"] == "wrongful_conviction"
    assert "Tragic Miscarriage" in outcome["rating"]

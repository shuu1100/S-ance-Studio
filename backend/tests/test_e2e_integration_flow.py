"""End-to-End Acceptance Test for Séance Studio Phase 7.

Validates the full player journey across all 10 core integration requirements:
1. Start a new investigation.
2. Enter the manor.
3. Interview a character.
4. Discover a clue.
5. Present evidence.
6. Unlock a room or dialogue topic.
7. Make a consequential choice.
8. Close and reopen the application (listing sessions).
9. Resume the same investigation (loading detail & history).
10. Reach an ending based on actual game state.
"""

import pytest


def test_full_investigation_lifecycle_e2e(client):
    # -------------------------------------------------------------------------
    # 1. Start a new investigation
    # -------------------------------------------------------------------------
    create_payload = {
        "scenario_id": "case_blackwood_thirteenth_chime",
        "difficulty": "seasoned",
    }
    create_res = client.post("/api/v1/investigations", json=create_payload)
    assert create_res.status_code == 201
    create_data = create_res.json()["data"]

    session_id = create_data["id"]
    assert session_id.startswith("sess_")
    assert create_data["caseId"] == "case_blackwood_thirteenth_chime"
    assert create_data["status"] == "active"
    assert create_data["turnCounter"] == 1
    assert create_data["candlePercentage"] == 100.0
    assert create_data["playerSanity"] == 100

    # -------------------------------------------------------------------------
    # 2. Enter the manor / inspect a room
    # -------------------------------------------------------------------------
    action_payload = {
        "actionType": "INSPECT",
        "targetId": "room_library",
    }
    action_res = client.post(f"/api/v1/investigations/{session_id}/action", json=action_payload)
    assert action_res.status_code == 200
    action_data = action_res.json()["data"]
    assert action_data["turnNumber"] >= 1
    assert action_data["gameStatus"] == "active"

    # -------------------------------------------------------------------------
    # 3. Interview a character (Arthur Briggs)
    # -------------------------------------------------------------------------
    inquiry_payload = {
        "character_id": "char_caretaker",
        "content": "Arthur, did you observe anyone near the west gallery at midnight?",
    }
    msg_res = client.post(f"/api/v1/investigations/{session_id}/messages", json=inquiry_payload)
    assert msg_res.status_code == 201
    msg_data = msg_res.json()["data"]
    assert msg_data["sender_id"] == "char_caretaker"
    assert len(msg_data["text"]) > 5
    assert msg_data["turn_number"] >= 2

    # -------------------------------------------------------------------------
    # 4. Discover a clue (Grand Foyer Clockwork)
    # -------------------------------------------------------------------------
    disc_clock_res = client.post(
        f"/api/v1/investigations/{session_id}/discoveries",
        json={"clue_id": "clue_thirteenth_chime", "discovery_method": "INSPECTION"},
    )
    assert disc_clock_res.status_code == 201
    disc_clock_data = disc_clock_res.json()["data"]
    assert disc_clock_data["id"] == "clue_thirteenth_chime"
    assert disc_clock_data["status"] in ["revealed", "verified"]

    # Also discover silver flask from library
    disc_res = client.post(
        f"/api/v1/investigations/{session_id}/discoveries",
        json={"clue_id": "clue_silver_flask", "discovery_method": "INSPECTION"},
    )
    assert disc_res.status_code == 201

    # -------------------------------------------------------------------------
    # 5. Present evidence to characters (Caretaker Arthur & Lady Eleanor)
    # -------------------------------------------------------------------------
    # Present clock clue to Arthur Briggs to raise trust from 40 to 55 (unlocks conservatory)
    caretaker_pres = client.post(
        f"/api/v1/investigations/{session_id}/present-evidence",
        json={"character_id": "char_caretaker", "clue_id": "clue_thirteenth_chime"},
    )
    assert caretaker_pres.status_code == 200
    assert len(caretaker_pres.json()["data"]["text"]) > 10

    # Present silver flask to Lady Eleanor's apparition
    present_res = client.post(
        f"/api/v1/investigations/{session_id}/present-evidence",
        json={"character_id": "char_eleanor", "clue_id": "clue_silver_flask"},
    )
    assert present_res.status_code == 200
    present_data = present_res.json()["data"]
    assert present_data["clue_presented_id"] == "clue_silver_flask"
    assert "flask" in present_data["text"].lower() or "cordial" in present_data["text"].lower() or len(present_data["text"]) > 10

    # -------------------------------------------------------------------------
    # 6. Unlock a room or discovery progression (Arsenic Vial in Conservatory)
    # -------------------------------------------------------------------------
    arsenic_res = client.post(
        f"/api/v1/investigations/{session_id}/discoveries",
        json={"clue_id": "clue_arsenic_vial", "discovery_method": "INSPECTION"},
    )
    assert arsenic_res.status_code == 201

    # Connect them on evidence board
    connect_res = client.post(
        f"/api/v1/investigations/{session_id}/evidence/connect",
        json={"from_clue_id": "clue_silver_flask", "to_clue_id": "clue_arsenic_vial"},
    )
    assert connect_res.status_code == 200
    assert connect_res.json()["data"]["relationship"] == "weapon_match"

    # -------------------------------------------------------------------------
    # 7. Make a consequential choice
    # -------------------------------------------------------------------------
    choice_payload = {
        "choice_id": "confront_julian_will",
        "action_type": "TALK",
        "target_id": "char_julian",
        "decision_text": "Confronted Lord Julian regarding Eleanor's revised codicil.",
        "impact_text": "Lord Julian's alibi falters; tension spikes.",
    }
    choice_res = client.post(f"/api/v1/investigations/{session_id}/choices", json=choice_payload)
    assert choice_res.status_code == 201
    choice_data = choice_res.json()["data"]
    assert choice_data["choice_id"] == "confront_julian_will"
    assert choice_data["decision_text"] == "Confronted Lord Julian regarding Eleanor's revised codicil."

    # Record a journal entry
    journal_res = client.post(
        f"/api/v1/investigations/{session_id}/journal",
        json={
            "title": "Suspect Alibi Compromised",
            "category": "testimony",
            "entry_type": "theory",
            "content": "Julian was observed fleeing the study before the chime.",
            "flagged": True,
        },
    )
    assert journal_res.status_code == 201

    # -------------------------------------------------------------------------
    # 8. Close and reopen the application: list investigations
    # -------------------------------------------------------------------------
    list_res = client.get("/api/v1/investigations")
    assert list_res.status_code == 200
    sessions_list = list_res.json()["data"]
    assert any(s["id"] == session_id for s in sessions_list)

    # -------------------------------------------------------------------------
    # 9. Resume the same investigation: fetch full detail & messages
    # -------------------------------------------------------------------------
    detail_res = client.get(f"/api/v1/investigations/{session_id}")
    assert detail_res.status_code == 200
    detail_data = detail_res.json()["data"]

    # Verify state was accurately preserved in database
    assert detail_data["session"]["id"] == session_id
    assert len(detail_data["session"]["decisionsMade"]) >= 1

    # Verify discovered clues contain both silver flask and arsenic vial
    revealed_ids = {c["id"] for c in detail_data["clues"] if c["status"] in ["revealed", "verified"]}
    assert "clue_silver_flask" in revealed_ids
    assert "clue_arsenic_vial" in revealed_ids

    # Verify persisted dialogue history is retrieved
    history_res = client.get(f"/api/v1/investigations/{session_id}/messages")
    assert history_res.status_code == 200
    messages = history_res.json()["data"]
    assert len(messages) >= 2  # Inquiry + Response

    # -------------------------------------------------------------------------
    # 10. Reach an ending based on actual game state
    # -------------------------------------------------------------------------
    # Discover burned will and torn velvet
    res_will = client.post(
        f"/api/v1/investigations/{session_id}/discoveries",
        json={"clue_id": "clue_burned_will", "discovery_method": "INSPECTION"},
    )
    assert res_will.status_code in [200, 201]

    # Present burned will to Victoria to raise trust
    res_pres_will = client.post(
        f"/api/v1/investigations/{session_id}/present-evidence",
        json={"character_id": "char_daughter", "clue_id": "clue_burned_will"},
    )
    assert res_pres_will.status_code == 200

    res_velvet = client.post(
        f"/api/v1/investigations/{session_id}/discoveries",
        json={"clue_id": "clue_torn_velvet", "discovery_method": "INSPECTION"},
    )
    assert res_velvet.status_code == 201

    # Present torn velvet to Victoria to gain crypt key
    res_pres_velvet = client.post(
        f"/api/v1/investigations/{session_id}/present-evidence",
        json={"character_id": "char_daughter", "clue_id": "clue_torn_velvet"},
    )
    assert res_pres_velvet.status_code == 200

    # Discover crypt journal
    res_crypt = client.post(
        f"/api/v1/investigations/{session_id}/discoveries",
        json={"clue_id": "clue_crypt_journal", "discovery_method": "INSPECTION"},
    )
    assert res_crypt.status_code == 201

    # Accuse Lord Julian with arsenic cordial and disinheritance debt
    accusation_payload = {
        "suspectId": "char_julian",
        "weaponId": "clue_silver_flask",
        "motiveId": "clue_burned_will",
        "supportingClueIds": ["clue_thirteenth_chime", "clue_arsenic_vial", "clue_crypt_journal"],
    }
    accuse_res = client.post(f"/api/v1/investigations/{session_id}/accuse", json=accusation_payload)
    print("ACCUSE_RES:", accuse_res.status_code, accuse_res.json())
    assert accuse_res.status_code == 200
    ending_data = accuse_res.json()["data"]

    # Authoritative ending evaluation
    assert ending_data["id"] == "END_TRUE_RESTITUTION"
    assert ending_data["verdictType"] == "exemplary_victory"
    assert "Julian" in ending_data["culpritNamed"]
    assert len(ending_data["evidenceSummary"]) >= 2

    # Verify session status is updated to completed
    final_session_res = client.get(f"/api/v1/investigations/{session_id}")
    final_session = final_session_res.json()["data"]["session"]
    assert final_session["status"] == "completed"
    assert final_session["endingAchieved"] == "END_TRUE_RESTITUTION"

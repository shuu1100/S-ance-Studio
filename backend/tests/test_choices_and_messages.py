def test_record_player_choice(client):
    create_res = client.post(
        "/api/v1/investigations",
        json={"scenario_id": "case_blackwood_thirteenth_chime"},
    )
    session_id = create_res.json()["data"]["id"]

    choice_payload = {
        "choice_id": "examine_armchair",
        "action_type": "INSPECT",
        "target_id": "hs_armchair",
        "decision_text": "Examined the armchair upholstery.",
        "impact_text": "Noted cold ectoplasmic resonance.",
    }
    choice_res = client.post(f"/api/v1/investigations/{session_id}/choices", json=choice_payload)
    assert choice_res.status_code == 201
    choice_data = choice_res.json()["data"]
    assert choice_data["choice_id"] == "examine_armchair"
    assert choice_data["action_type"] == "INSPECT"


def test_dialogue_interaction(client):
    create_res = client.post(
        "/api/v1/investigations",
        json={"scenario_id": "case_blackwood_thirteenth_chime"},
    )
    session_id = create_res.json()["data"]["id"]

    msg_payload = {
        "character_id": "char_eleanor",
        "content": "Where were you when the clock struck thirteen?",
    }
    msg_res = client.post(f"/api/v1/investigations/{session_id}/messages", json=msg_payload)
    assert msg_res.status_code == 201
    reply = msg_res.json()["data"]
    assert reply["sender_id"] == "char_eleanor"
    assert reply["speaker_type"] == "spirit"
    assert len(reply["text"]) > 10


def test_action_endpoint_inspect(client):
    create_res = client.post(
        "/api/v1/investigations",
        json={"scenario_id": "case_blackwood_thirteenth_chime"},
    )
    session_id = create_res.json()["data"]["id"]

    # Perform action inspecting the clock hotspot
    action_payload = {
        "actionType": "INSPECT",
        "targetId": "hs_clock",
    }
    action_res = client.post(f"/api/v1/investigations/{session_id}/action", json=action_payload)
    assert action_res.status_code == 200
    action_data = action_res.json()["data"]
    assert action_data["turnNumber"] == 2
    assert action_data["candlePercentage"] < 100.0
    assert action_data["unlockedClue"] is not None
    assert action_data["unlockedClue"]["id"] == "clue_thirteenth_chime"

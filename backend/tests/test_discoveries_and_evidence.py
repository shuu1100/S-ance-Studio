def test_discover_clue_success(client):
    create_res = client.post(
        "/api/v1/investigations",
        json={"scenario_id": "case_blackwood_thirteenth_chime"},
    )
    session_id = create_res.json()["data"]["id"]

    # Discover clockwork clue in the unlocked Grand Foyer
    disc_res = client.post(
        f"/api/v1/investigations/{session_id}/discoveries",
        json={"clue_id": "clue_thirteenth_chime", "discovery_method": "INSPECTION"},
    )
    assert disc_res.status_code == 201
    data = disc_res.json()["data"]
    assert data["id"] == "clue_thirteenth_chime"
    assert data["status"] == "revealed"


def test_discover_clue_locked_location_rejection(client):
    create_res = client.post(
        "/api/v1/investigations",
        json={"scenario_id": "case_blackwood_thirteenth_chime"},
    )
    session_id = create_res.json()["data"]["id"]

    # Attempt to discover arsenic vial in the locked conservatory before unlocking it
    disc_res = client.post(
        f"/api/v1/investigations/{session_id}/discoveries",
        json={"clue_id": "clue_arsenic_vial", "discovery_method": "INSPECTION"},
    )
    assert disc_res.status_code == 400
    assert "locked" in disc_res.json()["error"]["message"].lower()


def test_discover_clue_idempotency_duplicate_safety(client):
    create_res = client.post(
        "/api/v1/investigations",
        json={"scenario_id": "case_blackwood_thirteenth_chime"},
    )
    session_id = create_res.json()["data"]["id"]

    # First discovery of clockwork clue
    res1 = client.post(
        f"/api/v1/investigations/{session_id}/discoveries",
        json={"clue_id": "clue_thirteenth_chime", "discovery_method": "INSPECTION"},
    )
    assert res1.status_code == 201

    # Second discovery of the exact same clue (idempotent, no crash or duplicate entry)
    res2 = client.post(
        f"/api/v1/investigations/{session_id}/discoveries",
        json={"clue_id": "clue_thirteenth_chime", "discovery_method": "INSPECTION"},
    )
    assert res2.status_code == 201
    assert res2.json()["data"]["id"] == "clue_thirteenth_chime"


def test_discover_clue_unknown_id(client):
    create_res = client.post(
        "/api/v1/investigations",
        json={"scenario_id": "case_blackwood_thirteenth_chime"},
    )
    session_id = create_res.json()["data"]["id"]

    res = client.post(
        f"/api/v1/investigations/{session_id}/discoveries",
        json={"clue_id": "clue_fictional_alien_relic_999"},
    )
    assert res.status_code == 404
    assert res.json()["success"] is False


def test_evidence_board_permitted_connections(client):
    create_res = client.post(
        "/api/v1/investigations",
        json={"scenario_id": "case_blackwood_thirteenth_chime"},
    )
    session_id = create_res.json()["data"]["id"]

    # Starting session already has clue_burned_will and clue_silver_flask
    conn_res = client.post(
        f"/api/v1/investigations/{session_id}/evidence/connect",
        json={
            "from_clue_id": "clue_burned_will",
            "to_clue_id": "clue_silver_flask",
        },
    )
    assert conn_res.status_code == 200
    conn_data = conn_res.json()["data"]
    assert conn_data["relationship"] == "implicates"
    assert "Motive" in conn_data["label"]


def test_evidence_board_rejects_unpermitted_connection(client):
    create_res = client.post(
        "/api/v1/investigations",
        json={"scenario_id": "case_blackwood_thirteenth_chime"},
    )
    session_id = create_res.json()["data"]["id"]

    # Discover clockwork clue so both are discovered
    client.post(
        f"/api/v1/investigations/{session_id}/discoveries",
        json={"clue_id": "clue_thirteenth_chime"},
    )

    # Connecting burned will directly to clockwork is unpermitted in the rules
    conn_res = client.post(
        f"/api/v1/investigations/{session_id}/evidence/connect",
        json={
            "from_clue_id": "clue_burned_will",
            "to_clue_id": "clue_thirteenth_chime",
        },
    )
    assert conn_res.status_code == 400
    data = conn_res.json()
    assert data["success"] is False
    assert "rejected" in data["error"]["message"].lower()


def test_present_evidence_to_character(client):
    create_res = client.post(
        "/api/v1/investigations",
        json={"scenario_id": "case_blackwood_thirteenth_chime"},
    )
    session_id = create_res.json()["data"]["id"]

    # First discover clockwork clue
    client.post(
        f"/api/v1/investigations/{session_id}/discoveries",
        json={"clue_id": "clue_thirteenth_chime"},
    )

    # Present clockwork clue to the Caretaker (Arthur Briggs)
    pres_res = client.post(
        f"/api/v1/investigations/{session_id}/present-evidence",
        json={"character_id": "char_caretaker", "clue_id": "clue_thirteenth_chime"},
    )
    assert pres_res.status_code == 200
    msg = pres_res.json()["data"]
    assert msg["sender_name"] == "Arthur Briggs"
    assert "escapement" in msg["text"].lower() or "file" in msg["text"].lower()

    # Verify Caretaker's trust increased from initial 40 to 55
    detail_res = client.get(f"/api/v1/investigations/{session_id}")
    caretaker = next(c for c in detail_res.json()["data"]["characters"] if c["id"] == "char_caretaker")
    assert caretaker["trust_level"] == 55

    # Present burned will to Victoria Blackwood
    pres_will = client.post(
        f"/api/v1/investigations/{session_id}/present-evidence",
        json={"character_id": "char_daughter", "clue_id": "clue_burned_will"},
    )
    assert pres_will.status_code == 200
    detail_res2 = client.get(f"/api/v1/investigations/{session_id}")
    daughter = next(c for c in detail_res2.json()["data"]["characters"] if c["id"] == "char_daughter")
    assert daughter["trust_level"] == 55

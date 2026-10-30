def test_journal_creation_and_filtering(client):
    create_res = client.post(
        "/api/v1/investigations",
        json={"scenario_id": "case_blackwood_thirteenth_chime"},
    )
    session_id = create_res.json()["data"]["id"]

    # Add a theory entry
    entry_payload = {
        "title": "Suspect alibi conflict",
        "category": "lead",
        "entry_type": "theory",
        "content": "Julian claimed to be in the billiard room, but the corridor carpet carries wet footprints.",
        "flagged": True,
    }
    post_res = client.post(f"/api/v1/investigations/{session_id}/journal", json=entry_payload)
    assert post_res.status_code == 201
    entry_data = post_res.json()["data"]
    assert entry_data["entry_type"] == "theory"
    assert entry_data["flagged"] is True

    # Retrieve filtered by entry_type='theory'
    get_theories = client.get(f"/api/v1/investigations/{session_id}/journal?entry_type=theory")
    assert get_theories.status_code == 200
    theories = get_theories.json()["data"]
    assert len(theories) >= 1
    assert all(t["entry_type"] == "theory" for t in theories)

    # Retrieve filtered by search term
    search_res = client.get(f"/api/v1/investigations/{session_id}/journal?search=billiard")
    assert search_res.status_code == 200
    search_results = search_res.json()["data"]
    assert len(search_results) >= 1
    assert "billiard" in search_results[0]["content"].lower()

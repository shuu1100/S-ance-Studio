def test_create_investigation_success(client):
    payload = {
        "scenario_id": "case_blackwood_thirteenth_chime",
        "difficulty": "seasoned",
    }
    response = client.post("/api/v1/investigations", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    session_data = data["data"]
    assert session_data["caseId"] == "case_blackwood_thirteenth_chime"
    assert session_data["candlePercentage"] == 100.0
    assert session_data["playerSanity"] == 100
    assert session_data["turnCounter"] == 1
    assert session_data["status"] == "active"
    assert len(session_data["id"]) > 0


def test_create_investigation_invalid_scenario(client):
    payload = {
        "scenario_id": "non_existent_case_999",
        "difficulty": "seasoned",
    }
    response = client.post("/api/v1/investigations", json=payload)
    assert response.status_code == 404
    data = response.json()
    assert data["success"] is False
    assert "not found" in data["error"]["message"].lower()


def test_create_investigation_malformed_payload(client):
    # Invalid data type for payload
    response = client.post("/api/v1/investigations", json={"scenario_id": 12345, "difficulty": None})
    assert response.status_code == 422
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "VALIDATION_ERROR"


def test_get_investigation_detail(client):
    # First create session
    create_res = client.post(
        "/api/v1/investigations",
        json={"scenario_id": "case_blackwood_thirteenth_chime", "difficulty": "skeptic"},
    )
    session_id = create_res.json()["data"]["id"]

    # Fetch details
    get_res = client.get(f"/api/v1/investigations/{session_id}")
    assert get_res.status_code == 200
    detail = get_res.json()["data"]

    # Verify session summary
    assert detail["session"]["id"] == session_id
    assert detail["session"]["difficulty"] == "skeptic"

    # Verify initialized character relationship states (Caretaker, Daughter, Apparition)
    assert len(detail["characters"]) == 3
    char_ids = {c["id"] for c in detail["characters"]}
    assert "char_caretaker" in char_ids
    assert "char_daughter" in char_ids
    assert "char_apparition" in char_ids

    # Verify starting revealed clues
    revealed_clues = [c for c in detail["clues"] if c["status"] in ["revealed", "verified"]]
    assert len(revealed_clues) >= 2

    # Verify journal events
    assert len(detail["journal"]) >= 3


def test_get_investigation_not_found(client):
    response = client.get("/api/v1/investigations/sess_invalid_ghost_id")
    assert response.status_code == 404
    data = response.json()
    assert data["success"] is False


def test_delete_investigation(client):
    create_res = client.post(
        "/api/v1/investigations",
        json={"scenario_id": "case_blackwood_thirteenth_chime"},
    )
    session_id = create_res.json()["data"]["id"]

    # Delete session
    del_res = client.delete(f"/api/v1/investigations/{session_id}")
    assert del_res.status_code == 200
    assert del_res.json()["data"]["deleted"] is True

    # Confirm it no longer exists
    get_res = client.get(f"/api/v1/investigations/{session_id}")
    assert get_res.status_code == 404


def test_persistence_after_restart(tmp_path):
    """Verify that an investigation session created in SQLite persists across connection teardown."""
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from app.database import Base
    from app.models.session import InvestigationSession
    from app.engine.seed_data import seed_scenario_catalog, create_initial_session_entities

    db_path = tmp_path / "persistence_test.db"
    db_url = f"sqlite:///{db_path.as_posix()}"

    # First run: initialize DB and create session
    engine1 = create_engine(db_url)
    Base.metadata.create_all(bind=engine1)
    Session1 = sessionmaker(bind=engine1)

    with Session1() as db1:
        seed_scenario_catalog(db1)
        session = InvestigationSession(
            scenario_id="case_blackwood_thirteenth_chime",
            title="Blackwood Manor",
            difficulty="seasoned",
            status="active",
            current_location="The Grand Foyer",
            current_act=1,
            total_acts=3,
            turn_counter=5,
            max_turns=30,
            candle_percentage=87.5,
            player_sanity=85,
            ectoplasmic_tension=40,
            objective="Inspect the fireplace.",
        )
        db1.add(session)
        db1.flush()
        saved_id = session.id
        create_initial_session_entities(db1, session)
        db1.commit()

    # Dispose first engine simulating process termination
    engine1.dispose()

    # Second run: new engine simulating application restart
    engine2 = create_engine(db_url)
    Session2 = sessionmaker(bind=engine2)

    with Session2() as db2:
        reloaded = db2.query(InvestigationSession).filter_by(id=saved_id).first()
        assert reloaded is not None
        assert reloaded.id == saved_id
        assert reloaded.turn_counter == 5
        assert reloaded.candle_percentage == 87.5
        assert reloaded.player_sanity == 85
        assert len(reloaded.relationship_states) == 3
        assert len(reloaded.discovered_clues) >= 2
        assert len(reloaded.journal_events) >= 3

    engine2.dispose()

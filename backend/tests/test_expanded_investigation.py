import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.session import InvestigationSession
from app.engine.game_state_service import GameStateService
from app.engine.inquiry_service import InquiryService
from app.engine.contradiction_service import ContradictionService
from app.engine.objective_service import ObjectiveService
from app.engine.seed_data import create_initial_session_entities
from app.schemas.inquiry import ContradictionChallengePayload, TheoryPayload


@pytest.fixture
def active_session(db_session):
    """Fixture providing a fresh active investigation session."""
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


def test_suggested_questions_generation(active_session, db_session):
    """Ensure dynamic suggested questions return 5-8 questions per suspect with topic metadata."""
    scenario = GameStateService.load_scenario()

    # Caretaker questions
    res_caretaker = InquiryService.get_suggested_questions(
        session=active_session,
        character_id="char_caretaker",
        scenario=scenario,
        db=db_session,
    )
    assert 5 <= len(res_caretaker.questions) <= 8
    assert res_caretaker.character_id == "char_caretaker"
    assert any(q.topic_id == "thirteenth_chime" for q in res_caretaker.questions)

    # Daughter questions
    res_daughter = InquiryService.get_suggested_questions(
        session=active_session,
        character_id="char_daughter",
        scenario=scenario,
        db=db_session,
    )
    assert 5 <= len(res_daughter.questions) <= 8
    assert any(q.topic_id == "relationships" for q in res_daughter.questions)

    # Apparition questions
    res_app = InquiryService.get_suggested_questions(
        session=active_session,
        character_id="char_apparition",
        scenario=scenario,
        db=db_session,
    )
    assert 5 <= len(res_app.questions) <= 8
    assert any(q.topic_id == "supernatural_events" for q in res_app.questions)

    # Topic filtering
    res_filtered = InquiryService.get_suggested_questions(
        session=active_session,
        character_id="char_caretaker",
        scenario=scenario,
        db=db_session,
        active_topic_id="thirteenth_chime",
    )
    assert all(q.topic_id == "thirteenth_chime" for q in res_filtered.questions)


def test_investigation_topics(active_session, db_session):
    """Verify all 10 topics are present and their unlocked state respects discovered clues."""
    scenario = GameStateService.load_scenario()

    topics = InquiryService.get_investigation_topics(
        session=active_session,
        character_id="char_caretaker",
        scenario=scenario,
        db=db_session,
    )
    assert len(topics) == 10
    expected_ids = {
        "death", "thirteenth_chime", "clock", "poison", "will",
        "alibis", "relationships", "physical_evidence", "contradictions", "supernatural_events"
    }
    actual_ids = {t.id for t in topics}
    assert actual_ids == expected_ids

    death_topic = next(t for t in topics if t.id == "death")
    assert death_topic.is_unlocked is True
    assert len(death_topic.relevant_facts) >= 2


def test_contradiction_premature_and_successful_challenge(active_session, db_session):
    """Verify premature contradiction challenge fails with trust penalty, and succeeds with evidence."""
    scenario = GameStateService.load_scenario()

    # Get contradiction list
    contras = ContradictionService.get_contradictions(active_session, scenario, db_session)
    assert len(contras) == 5

    target_contra = next(c for c in contras if c.id == "contra_clock_file_vs_spontaneous")
    # clock clue not yet discovered, so ready is False
    assert target_contra.is_ready_to_challenge is False

    # 1. Premature challenge
    payload_premature = ContradictionChallengePayload(
        contradiction_id="contra_clock_file_vs_spontaneous"
    )
    res_fail = ContradictionService.challenge_contradiction(
        session=active_session,
        payload=payload_premature,
        scenario=scenario,
        db=db_session,
    )
    assert res_fail.success is False
    assert res_fail.trust_delta < 0
    assert "baseless" in res_fail.dialogue.lower() or "proof" in res_fail.dialogue.lower()

    # 2. Discover prerequisite clue
    GameStateService.discover_clue(db_session, active_session, "clue_thirteenth_chime", scenario=scenario)

    # 3. Successful challenge
    res_success = ContradictionService.challenge_contradiction(
        session=active_session,
        payload=payload_premature,
        scenario=scenario,
        db=db_session,
    )
    assert res_success.success is True
    assert res_success.trust_delta > 0
    assert res_success.revealed_fact is not None


def test_objective_progression_tracking(active_session, db_session):
    """Verify objective states progress dynamically from active to completed."""
    scenario = GameStateService.load_scenario()

    objs = ObjectiveService.get_objectives(active_session, scenario, db_session)
    assert len(objs) == 7

    obj_begin = next(o for o in objs if o.id == "obj_begin_inquest")
    # In active_session, silver flask is discovered initially
    assert obj_begin.status == "completed"

    obj_study = next(o for o in objs if o.id == "obj_examine_study")
    assert obj_study.status in ("completed", "active")


def test_theory_formulation_evaluator(active_session, db_session):
    """Verify theory evaluator detects contradictions for innocent suspects and rewards evidence."""
    scenario = GameStateService.load_scenario()

    # Accuse innocent Caretaker
    innocent_theory = TheoryPayload(
        suspect_id="char_caretaker",
        weapon_clue_id="clue_silver_flask",
        motive_clue_id="clue_burned_will",
        supporting_clue_ids=[],
    )
    eval_innocent = InquiryService.evaluate_theory(active_session, innocent_theory, scenario, db_session)
    assert eval_innocent.status == "contradicted"
    assert len(eval_innocent.contradictions_detected) >= 1

    # Accuse Julian with partial evidence
    julian_theory = TheoryPayload(
        suspect_id="char_julian",
        weapon_clue_id="clue_silver_flask",
        motive_clue_id="clue_burned_will",
        supporting_clue_ids=["clue_thirteenth_chime"],
    )
    eval_julian = InquiryService.evaluate_theory(active_session, julian_theory, scenario, db_session)
    assert eval_julian.status == "supported"
    assert eval_julian.consistency_score >= 50


def test_inquiry_api_endpoints(client, active_session):
    """Test all new inquiry REST API endpoints via TestClient."""
    # 1. Suggestions endpoint
    res_sugg = client.get(f"/api/v1/investigations/{active_session.id}/suggestions?character_id=char_caretaker")
    assert res_sugg.status_code == 200
    data_sugg = res_sugg.json()
    assert data_sugg["success"] is True
    assert len(data_sugg["data"]["questions"]) >= 5

    # 2. Topics endpoint
    res_topics = client.get(f"/api/v1/investigations/{active_session.id}/topics")
    assert res_topics.status_code == 200
    data_topics = res_topics.json()
    assert data_topics["success"] is True
    assert len(data_topics["data"]) == 10

    # 3. Contradictions endpoint
    res_contra = client.get(f"/api/v1/investigations/{active_session.id}/contradictions")
    assert res_contra.status_code == 200
    data_contra = res_contra.json()
    assert data_contra["success"] is True
    assert len(data_contra["data"]) == 5

    # 4. Objectives endpoint
    res_obj = client.get(f"/api/v1/investigations/{active_session.id}/objectives")
    assert res_obj.status_code == 200
    data_obj = res_obj.json()
    assert data_obj["success"] is True
    assert len(data_obj["data"]) == 7

    # 5. Theory evaluate endpoint
    res_theory = client.post(
        f"/api/v1/investigations/{active_session.id}/theory/evaluate",
        json={
            "suspect_id": "char_julian",
            "weapon_clue_id": "clue_silver_flask",
            "motive_clue_id": "clue_burned_will",
            "supporting_clue_ids": ["clue_thirteenth_chime"],
        },
    )
    assert res_theory.status_code == 200
    data_theory = res_theory.json()
    assert data_theory["success"] is True
    assert data_theory["data"]["status"] == "supported"

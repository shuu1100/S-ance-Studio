import pytest
import httpx
from app.config import settings, Settings
from app.ai.interface import (
    DialoguePromptContext,
    AIReadinessStatus,
)
from app.ai.exceptions import AIConnectionError, AITimeoutError
from app.ai.factory import set_ai_provider
from tests.conftest import MockAIProvider


# ==============================================================================
# 1. Investigation Session Lifecycle Tests
# ==============================================================================

def test_session_lifecycle_create_persists_valid_session(client):
    """Creating an investigation creates and persists an authoritative backend session."""
    payload = {
        "scenario_id": "case_blackwood_thirteenth_chime",
        "difficulty": "seasoned",
    }
    res = client.post("/api/v1/investigations", json=payload)
    assert res.status_code == 201
    body = res.json()
    assert body["success"] is True
    session_id = body["data"]["id"]
    assert session_id.startswith("sess_")
    assert session_id != "sess_blackwood_thirteenth_chime"

    # Immediately retrieve the session using the returned ID
    detail_res = client.get(f"/api/v1/investigations/{session_id}")
    assert detail_res.status_code == 200
    detail = detail_res.json()["data"]
    assert detail["session"]["id"] == session_id
    assert detail["session"]["caseId"] == "case_blackwood_thirteenth_chime"
    assert detail["session"]["status"] == "active"
    assert detail["session"]["turnCounter"] == 1


def test_session_lifecycle_dialogue_with_returned_session_id(client):
    """Dialogue endpoints execute successfully using the dynamically returned session ID."""
    # 1. Create session
    create_res = client.post(
        "/api/v1/investigations",
        json={"scenario_id": "case_blackwood_thirteenth_chime", "difficulty": "skeptic"},
    )
    session_id = create_res.json()["data"]["id"]

    # 2. Communicate with Lady Eleanor (supports char_eleanor alias and char_apparition)
    dialogue_res = client.post(
        f"/api/v1/investigations/{session_id}/messages",
        json={
            "character_id": "char_eleanor",
            "content": "What do you remember about the thirteenth chime?",
        },
    )
    assert dialogue_res.status_code == 201
    data = dialogue_res.json()["data"]
    assert data["sender_id"] in ["char_eleanor", "char_apparition"]
    assert "text" in data
    assert len(data["text"]) > 0
    assert "[Deterministic Fallback]" not in data["text"]

    # 3. Check dialogue history was recorded
    history_res = client.get(f"/api/v1/investigations/{session_id}/messages")
    assert history_res.status_code == 200
    messages = history_res.json()["data"]
    assert len(messages) >= 2
    # Player message was stored
    player_msgs = [m for m in messages if m["sender_id"] == "investigator"]
    assert len(player_msgs) >= 1
    assert player_msgs[0]["text"] == "What do you remember about the thirteenth chime?"
    # Character message was stored
    char_msgs = [m for m in messages if m["sender_id"] in ["char_eleanor", "char_apparition"]]
    assert len(char_msgs) >= 1


def test_session_lifecycle_invalid_session_id_returns_structured_404(client):
    """Invalid session IDs produce a structured 404 response with actionable error message."""
    invalid_id = "sess_blackwood_thirteenth_chime"
    res = client.get(f"/api/v1/investigations/{invalid_id}")
    assert res.status_code == 404
    body = res.json()
    assert body["success"] is False
    assert body["error"]["code"] in ["HTTP_404", "NOT_FOUND", "SESSION_NOT_FOUND"]
    assert "not found" in body["error"]["message"].lower()

    # Also dialogue to invalid session must 404
    dialogue_res = client.post(
        f"/api/v1/investigations/{invalid_id}/messages",
        json={
            "character_id": "char_eleanor",
            "content": "Can you hear me?",
        },
    )
    assert dialogue_res.status_code == 404
    d_body = dialogue_res.json()
    assert d_body["success"] is False
    assert d_body["error"]["code"] in ["HTTP_404", "NOT_FOUND", "SESSION_NOT_FOUND"]
    assert invalid_id in d_body["error"]["message"]


def test_session_lifecycle_multiple_investigations_isolated(client):
    """Multiple investigations maintain separate sessions, turn counters, and history."""
    res1 = client.post("/api/v1/investigations", json={"scenario_id": "case_blackwood_thirteenth_chime"})
    sess1 = res1.json()["data"]["id"]

    res2 = client.post("/api/v1/investigations", json={"scenario_id": "case_blackwood_thirteenth_chime"})
    sess2 = res2.json()["data"]["id"]

    assert sess1 != sess2

    # Send message in sess1
    client.post(
        f"/api/v1/investigations/{sess1}/messages",
        json={"character_id": "char_caretaker", "content": "Did you see anyone enter?"},
    )

    # Check history in sess2 has no player messages
    history_sess2 = client.get(f"/api/v1/investigations/{sess2}/messages").json()["data"]
    player_sess2 = [m for m in history_sess2 if m["sender_id"] == "investigator"]
    assert len(player_sess2) == 0

    # History in sess1 has 1 player message
    history_sess1 = client.get(f"/api/v1/investigations/{sess1}/messages").json()["data"]
    player_sess1 = [m for m in history_sess1 if m["sender_id"] == "investigator"]
    assert len(player_sess1) == 1


def test_sqlite_configuration_canonical_path():
    """Verify backend settings resolve SQLite relative path to canonical backend/data path."""
    resolved = Settings._resolve_database_url()
    assert "backend" in resolved or "data" in resolved
    assert resolved.startswith("sqlite:///")
    assert not resolved.endswith("/.")


# ==============================================================================
# 2. Dialogue & Inquest Engine Tests
# ==============================================================================

def test_dialogue_mock_ollama_response_and_non_caching(client):
    """Different queries receive distinct contextual responses without stale caching."""
    create_res = client.post("/api/v1/investigations", json={"scenario_id": "case_blackwood_thirteenth_chime"})
    session_id = create_res.json()["data"]["id"]

    # First question
    res1 = client.post(
        f"/api/v1/investigations/{session_id}/messages",
        json={"character_id": "char_caretaker", "content": "What are your duties here?"},
    )
    assert res1.status_code == 201
    t1 = res1.json()["data"]["text"]

    # Second question to daughter
    res2 = client.post(
        f"/api/v1/investigations/{session_id}/messages",
        json={"character_id": "char_daughter", "content": "Where were you when the clock struck?"},
    )
    assert res2.status_code == 201
    t2 = res2.json()["data"]["text"]

    # Responses must be character-specific and distinct
    assert t1 != t2
    assert "estate" in t1.lower() or "arthur" in res1.json()["data"].get("atmospheric_effect", "").lower()
    assert "julian" in t2.lower() or "affairs" in t2.lower()


def test_dialogue_model_failure_reported_honestly(client):
    """When the AI provider throws a connection error, dialogue endpoint returns 503 rather than fake dialogue."""
    create_res = client.post("/api/v1/investigations", json={"scenario_id": "case_blackwood_thirteenth_chime"})
    session_id = create_res.json()["data"]["id"]

    # Inject connection error into MockAIProvider
    error_mock = MockAIProvider(
        simulate_error=AIConnectionError("http://127.0.0.1:11434", detail="Connection refused")
    )
    set_ai_provider(error_mock)

    try:
        res = client.post(
            f"/api/v1/investigations/{session_id}/messages",
            json={"character_id": "char_eleanor", "content": "Speak to me, spirit!"},
        )
        # Must report 503 Service Unavailable honestly
        assert res.status_code == 503
        body = res.json()
        assert body["success"] is False
        assert body["error"]["code"] in ["HTTP_503", "AI_CONNECTION_ERROR", "OLLAMA_UNAVAILABLE"]
        assert "unreachable" in body["error"]["message"].lower()
    finally:
        # Reset AI provider for subsequent checks
        set_ai_provider(MockAIProvider())


def test_dialogue_model_timeout_reported_honestly(client):
    """When model times out, dialogue endpoint returns 504 Gateway Timeout honestly."""
    create_res = client.post("/api/v1/investigations", json={"scenario_id": "case_blackwood_thirteenth_chime"})
    session_id = create_res.json()["data"]["id"]

    timeout_mock = MockAIProvider(
        simulate_error=AITimeoutError(timeout_seconds=45.0)
    )
    set_ai_provider(timeout_mock)

    try:
        res = client.post(
            f"/api/v1/investigations/{session_id}/messages",
            json={"character_id": "char_eleanor", "content": "Tell me everything."},
        )
        # Must report 504 Gateway Timeout honestly
        assert res.status_code == 504
        body = res.json()
        assert body["success"] is False
        assert body["error"]["code"] in ["HTTP_504", "AI_TIMEOUT_ERROR", "MODEL_TIMEOUT"]
    finally:
        # Reset AI provider
        set_ai_provider(MockAIProvider())


def test_character_knowledge_restrictions_effective():
    """Character prompts strictly whitelist allowed facts and forbid unauthorized secrets."""
    from app.ai.prompt_builder import PromptBuilder
    ctx = DialoguePromptContext(
        character_id="char_caretaker",
        character_name="Arthur Briggs",
        role_type="caretaker",
        entity_type="living",
        speaking_style="Gruff Victorian",
        personality="Pragmatic",
        current_trust=30,
        current_status="neutral",
        whitelisted_known_facts=["The cellar door was locked with the brass padlock."],
        strictly_forbidden_lore=["Lady Eleanor was poisoned with arsenic in her cordial."],
        discovered_clues=[],
        recent_dialogue=[],
        player_query="Who poisoned the cordial?",
        turn_counter=2,
        player_sanity=100,
        ectoplasmic_tension=20,
        candle_percentage=85.0,
    )
    system_prompt = PromptBuilder.build_system_prompt(ctx)
    assert "The cellar door was locked with the brass padlock" in system_prompt
    assert "Lady Eleanor was poisoned with arsenic in her cordial" in system_prompt
    assert "STRICTLY FORBIDDEN SECRETS" in system_prompt


# ==============================================================================
# 3. Optional Live Ollama Integration Test
# ==============================================================================

@pytest.mark.asyncio
async def test_live_ollama_dialogue_integration():
    """Live integration test against actual local Ollama server if running."""
    ollama_url = settings.OLLAMA_BASE_URL
    model_name = settings.OLLAMA_MODEL

    try:
        async with httpx.AsyncClient(timeout=2.0) as http_client:
            resp = await http_client.get(f"{ollama_url}/api/tags")
            if resp.status_code != 200:
                pytest.skip("Local Ollama server not responding on /api/tags")
            models = [m.get("name", "") for m in resp.json().get("models", [])]
            if not any(model_name in m for m in models):
                pytest.skip(f"Model '{model_name}' not installed in local Ollama")
    except Exception:
        pytest.skip("Local Ollama server offline or unreachable")

    from app.ai.ollama_provider import OllamaProvider
    live_provider = OllamaProvider(
        base_url=ollama_url,
        model_name=model_name,
        vision_model_name=settings.OLLAMA_VISION_MODEL,
        timeout_seconds=30.0,
    )

    ctx = DialoguePromptContext(
        character_id="char_eleanor",
        character_name="Lady Eleanor Blackwood",
        role_type="victim",
        entity_type="spirit",
        speaking_style="Melancholic, spectral, Victorian cadence",
        personality="Mournful, seeking justice",
        current_trust=60,
        current_status="communicative",
        whitelisted_known_facts=["The clock struck thirteen times before darkness fell."],
        strictly_forbidden_lore=["The exact location of the arsenic vial."],
        discovered_clues=[],
        recent_dialogue=[],
        player_query="What do you remember about the thirteenth chime?",
        turn_counter=1,
        player_sanity=95,
        ectoplasmic_tension=30,
        candle_percentage=90.0,
    )

    res = await live_provider.generate_dialogue(ctx)
    assert res is not None
    assert len(res.dialogue_text) > 0
    # Must not contain raw thinking tags
    assert "<think>" not in res.dialogue_text
    assert "</think>" not in res.dialogue_text
    assert res.model_used.startswith(model_name)


# ==============================================================================
# 4. Critical Bug Fix Regression Tests (Session Completed, Idempotency & Turn Control)
# ==============================================================================

def test_dialogue_completed_session_rejected_with_session_completed_code(client):
    """A completed session returns structured 400 error with code SESSION_COMPLETED."""
    create_res = client.post("/api/v1/investigations", json={"scenario_id": "case_blackwood_thirteenth_chime"})
    session_id = create_res.json()["data"]["id"]

    # Legitimate completion through accusation
    accuse_res = client.post(
        f"/api/v1/investigations/{session_id}/accuse",
        json={
            "suspectId": "char_caretaker",
            "weaponId": "clue_silver_flask",
            "motiveId": "clue_torn_letter",
            "supportingClueIds": ["clue_arsenic_vial"],
        },
    )
    assert accuse_res.status_code == 200

    # Inquire on the completed session
    res = client.post(
        f"/api/v1/investigations/{session_id}/messages",
        json={"character_id": "char_eleanor", "content": "Are you still here?"},
    )
    assert res.status_code == 400
    body = res.json()
    assert body["success"] is False
    assert body["error"]["code"] == "SESSION_COMPLETED"
    assert "completed" in body["error"]["message"].lower()


def test_dialogue_temporary_failure_preserves_active_session_and_allows_retry(client):
    """Ollama failures do not mark investigation completed and subsequent retries succeed."""
    create_res = client.post("/api/v1/investigations", json={"scenario_id": "case_blackwood_thirteenth_chime"})
    session_id = create_res.json()["data"]["id"]

    # Inject temporary connection error
    error_mock = MockAIProvider(
        simulate_error=AIConnectionError("http://127.0.0.1:11434", detail="Ollama daemon restarting")
    )
    set_ai_provider(error_mock)

    try:
        fail_res = client.post(
            f"/api/v1/investigations/{session_id}/messages",
            json={"character_id": "char_eleanor", "content": "Spirit, answer me!"},
        )
        assert fail_res.status_code == 503
        assert fail_res.json()["error"]["code"] == "OLLAMA_UNAVAILABLE"
    finally:
        # Restore provider
        set_ai_provider(MockAIProvider())

    # Session must still be active and playable
    session_check = client.get(f"/api/v1/investigations/{session_id}")
    assert session_check.status_code == 200
    assert session_check.json()["data"]["session"]["status"] == "active"

    # Retry the inquest
    retry_res = client.post(
        f"/api/v1/investigations/{session_id}/messages",
        json={"character_id": "char_eleanor", "content": "Spirit, answer me!"},
    )
    assert retry_res.status_code == 201
    assert retry_res.json()["success"] is True
    assert len(retry_res.json()["data"]["text"]) > 0


def test_dialogue_turn_counter_increments_once_per_inquiry(client):
    """Each new valid inquiry increments the session turn counter by exactly one."""
    create_res = client.post("/api/v1/investigations", json={"scenario_id": "case_blackwood_thirteenth_chime"})
    session_id = create_res.json()["data"]["id"]

    initial = client.get(f"/api/v1/investigations/{session_id}").json()["data"]["session"]
    initial_turn = initial["turnCounter"]

    # Inquiry 1
    res1 = client.post(
        f"/api/v1/investigations/{session_id}/messages",
        json={"character_id": "char_eleanor", "content": "Tell me of the clock."},
    )
    assert res1.status_code == 201
    turn_after_1 = client.get(f"/api/v1/investigations/{session_id}").json()["data"]["session"]["turnCounter"]
    assert turn_after_1 == initial_turn + 1

    # Inquiry 2 with a different question
    res2 = client.post(
        f"/api/v1/investigations/{session_id}/messages",
        json={"character_id": "char_caretaker", "content": "Where were you at midnight?"},
    )
    assert res2.status_code == 201
    turn_after_2 = client.get(f"/api/v1/investigations/{session_id}").json()["data"]["session"]["turnCounter"]
    assert turn_after_2 == turn_after_1 + 1


def test_dialogue_idempotent_retry_prevents_duplicate_turns(client):
    """Submitting the exact same inquiry in the current turn does not advance the turn again."""
    create_res = client.post("/api/v1/investigations", json={"scenario_id": "case_blackwood_thirteenth_chime"})
    session_id = create_res.json()["data"]["id"]

    # First inquiry
    res1 = client.post(
        f"/api/v1/investigations/{session_id}/messages",
        json={"character_id": "char_eleanor", "content": "Who poisoned the tea?"},
    )
    assert res1.status_code == 201
    turn_count_1 = client.get(f"/api/v1/investigations/{session_id}").json()["data"]["session"]["turnCounter"]

    # Immediate network retry with identical content and character
    res2 = client.post(
        f"/api/v1/investigations/{session_id}/messages",
        json={"character_id": "char_eleanor", "content": "Who poisoned the tea?"},
    )
    assert res2.status_code in [200, 201]  # Idempotent success
    turn_count_2 = client.get(f"/api/v1/investigations/{session_id}").json()["data"]["session"]["turnCounter"]

    # Turn count must NOT increment again
    assert turn_count_2 == turn_count_1


def test_character_changes_do_not_mix_dialogue_histories(client):
    """Dialogues for different characters are stored with distinct character_id metadata."""
    create_res = client.post("/api/v1/investigations", json={"scenario_id": "case_blackwood_thirteenth_chime"})
    session_id = create_res.json()["data"]["id"]

    # Dialogue with Eleanor
    client.post(
        f"/api/v1/investigations/{session_id}/messages",
        json={"character_id": "char_eleanor", "content": "Did you see who struck you?"},
    )

    # Dialogue with Arthur Briggs
    client.post(
        f"/api/v1/investigations/{session_id}/messages",
        json={"character_id": "char_caretaker", "content": "Who held the cellar key?"},
    )

    history = client.get(f"/api/v1/investigations/{session_id}/messages").json()["data"]

    eleanor_msgs = [m for m in history if m["sender_id"] in ["char_eleanor", "char_apparition"]]
    caretaker_msgs = [m for m in history if m["sender_id"] == "char_caretaker"]

    assert len(eleanor_msgs) >= 1
    assert len(caretaker_msgs) >= 1
    # Each character message only belongs to that character
    for m in eleanor_msgs:
        assert m["sender_id"] in ["char_eleanor", "char_apparition"]
    for m in caretaker_msgs:
        assert m["sender_id"] == "char_caretaker"


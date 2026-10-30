import pytest
from app.models.session import InvestigationSession
from app.models.journal import JournalEvent
from app.models.clue import DiscoveredClue


def test_transaction_rollback_on_session_error(client, db_session):
    """Verify that an error in multi-step processing rolls back cleanly without partial writes."""
    initial_session_count = db_session.query(InvestigationSession).count()
    initial_journal_count = db_session.query(JournalEvent).count()

    # Attempt to create session with invalid scenario ID
    res = client.post(
        "/api/v1/investigations",
        json={"scenario_id": "non_existent_invalid_scenario_id_xyz"},
    )
    assert res.status_code == 404

    # Ensure no partial session or journal entities were persisted
    assert db_session.query(InvestigationSession).count() == initial_session_count
    assert db_session.query(JournalEvent).count() == initial_journal_count


def test_sql_injection_resilience(client):
    """Verify that parameterized access through SQLAlchemy safely handles hostile input."""
    malicious_inputs = [
        "'; DROP TABLE investigation_sessions; --",
        "' OR '1'='1",
        "admin'--",
        "<script>alert('xss')</script>",
    ]

    for bad_input in malicious_inputs:
        # Search journal with injection payload
        search_res = client.get(f"/api/v1/investigations/sess_sample/journal?search={bad_input}")
        # Should return 404 (session not found) or clean 200 without SQL execution errors
        assert search_res.status_code in [200, 404]

        # Get non-existent session with SQL injection ID
        session_res = client.get(f"/api/v1/investigations/{bad_input}")
        assert session_res.status_code == 404
        assert session_res.json()["success"] is False

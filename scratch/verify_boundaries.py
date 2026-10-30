import asyncio
import sys
import httpx
sys.path.insert(0, "backend")

BASE_URL = "http://127.0.0.1:8000"

async def test_boundaries_and_reloading():
    print("=== TESTING TURN BOUNDARY & SAVED INVESTIGATION RELOAD ===")
    async with httpx.AsyncClient(timeout=10.0) as client:
        # 1. Create a session
        create_resp = await client.post(f"{BASE_URL}/api/v1/investigations", json={
            "scenario_id": "case_blackwood_thirteenth_chime",
            "difficulty": "novice"
        })
        session = create_resp.json()["data"]
        session_id = session["id"]
        print(f"[+] Created session {session_id}, max_turns={session['maxTurns']}")

        # 2. Add a message
        msg_resp = await client.post(f"{BASE_URL}/api/v1/investigations/{session_id}/messages", json={
            "character_id": "char_eleanor",
            "content": "Can you hear my call?"
        })
        assert msg_resp.status_code == 201

        # 3. Reload the session as if the player refreshed the page or resumed from Case Archives
        reload_resp = await client.get(f"{BASE_URL}/api/v1/investigations/{session_id}")
        assert reload_resp.status_code == 200
        reloaded = reload_resp.json()["data"]["session"]
        assert reloaded["id"] == session_id
        assert reloaded["status"] == "active"
        assert reloaded["turnCounter"] == 2

        # Verify transcript restoration
        history_resp = await client.get(f"{BASE_URL}/api/v1/investigations/{session_id}/messages")
        assert history_resp.status_code == 200
        msgs = history_resp.json()["data"]
        assert len(msgs) >= 2
        print(f"[+] Session reloaded successfully with {len(msgs)} transcript entries and status '{reloaded['status']}'.")

        # 4. Test max turn ceiling boundary
        # Artificially set turn_counter to max_turns - 1 to test the exact boundary transition
        from app.database import SessionLocal
        from app.models.session import InvestigationSession
        with SessionLocal() as db:
            s = db.query(InvestigationSession).filter_by(id=session_id).first()
            s.turn_counter = s.max_turns  # On the next turn, turn_counter becomes max_turns + 1
            db.commit()

        # Inquire one more time, which causes turn_counter to exceed max_turns
        turn_boundary_resp = await client.post(f"{BASE_URL}/api/v1/investigations/{session_id}/messages", json={
            "character_id": "char_eleanor",
            "content": "Is the candle extinguishing?"
        })
        assert turn_boundary_resp.status_code == 201

        # Verify the session legitimately concluded with END_THE_COLD_DARK
        final_sess = (await client.get(f"{BASE_URL}/api/v1/investigations/{session_id}")).json()["data"]["session"]
        print(f"[+] Final session status after reaching turn ceiling: status='{final_sess['status']}', ending='{final_sess.get('endingAchieved')}'")
        assert final_sess["status"] == "completed"
        assert final_sess.get("endingAchieved") == "END_THE_COLD_DARK"

        # Subsequent messages must be blocked
        subsequent = await client.post(f"{BASE_URL}/api/v1/investigations/{session_id}/messages", json={
            "character_id": "char_eleanor",
            "content": "Are we trapped in the dark?"
        })
        assert subsequent.status_code == 400
        assert subsequent.json()["error"]["code"] == "SESSION_COMPLETED"
        print("[+] Subsequent inquiry rejected with SESSION_COMPLETED as required.")

    print("=== BOUNDARY & RESTORATION TESTS PASSED ===")

if __name__ == "__main__":
    asyncio.run(test_boundaries_and_reloading())

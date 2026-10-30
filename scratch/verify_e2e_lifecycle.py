import asyncio
import httpx
import json
import sys

BASE_URL = "http://127.0.0.1:8000"
OLLAMA_URL = "http://127.0.0.1:11434"

async def main():
    print("=== SÉANCE STUDIO END-TO-END VERIFICATION ===")
    
    # 0. Check Backend & Ollama health
    async with httpx.AsyncClient(timeout=10.0) as client:
        health_resp = await client.get(f"{BASE_URL}/api/v1/health")
        print(f"[*] Backend health: {health_resp.status_code} - {health_resp.json()}")
        assert health_resp.status_code == 200

        ai_status = await client.get(f"{BASE_URL}/api/v1/ai/status")
        print(f"[*] AI Status: {ai_status.status_code} - {ai_status.json()['data']['configured_model']}")
        assert ai_status.status_code == 200

        # 1. Start a new development investigation
        print("\n--- Step 1: Create New Investigation ---")
        create_resp = await client.post(f"{BASE_URL}/api/v1/investigations", json={
            "scenario_id": "case_blackwood_thirteenth_chime",
            "difficulty": "seasoned"
        })
        assert create_resp.status_code == 201, f"Create failed: {create_resp.text}"
        session_data = create_resp.json()["data"]
        session_id = session_data["id"]
        print(f"[+] Investigation created: id={session_id}, status={session_data['status']}, turn={session_data['turnCounter']}, maxTurns={session_data['maxTurns']}")

        # 2. Select character (Lady Eleanor) and ask question 1
        print("\n--- Step 2: Inquire with Lady Eleanor (Real Local Ollama qwen3:4b) ---")
        inq1_resp = await client.post(f"{BASE_URL}/api/v1/investigations/{session_id}/messages", json={
            "character_id": "char_eleanor",
            "content": "Lady Eleanor, what occurred when the clock struck thirteen?"
        }, timeout=60.0)
        assert inq1_resp.status_code == 201, f"Inquiry 1 failed: {inq1_resp.text}"
        inq1_data = inq1_resp.json()["data"]
        print(f"[+] Eleanor's response received ({len(inq1_data['text'])} chars):")
        print(f"    \"{inq1_data['text'][:120]}...\"")
        print(f"    Atmosphere: {inq1_data.get('atmospheric_effect')}")
        print(f"    Turn number: {inq1_data.get('turn_number')}")
        assert "[Deterministic Fallback]" not in inq1_data["text"]

        # 3. Follow-up Question 2 (Different question to Lady Eleanor)
        print("\n--- Step 3: Follow-up Question 2 to Lady Eleanor ---")
        inq2_resp = await client.post(f"{BASE_URL}/api/v1/investigations/{session_id}/messages", json={
            "character_id": "char_eleanor",
            "content": "Did you suspect someone in the manor before you perished?"
        }, timeout=60.0)
        assert inq2_resp.status_code == 201, f"Inquiry 2 failed: {inq2_resp.text}"
        inq2_data = inq2_resp.json()["data"]
        print(f"[+] Eleanor's second response ({len(inq2_data['text'])} chars):")
        print(f"    \"{inq2_data['text'][:120]}...\"")
        print(f"    Turn number: {inq2_data.get('turn_number')}")
        assert inq2_data["text"] != inq1_data["text"]

        # 4. Follow-up Question 3 (Question to Arthur Briggs, testing character isolation)
        print("\n--- Step 4: Follow-up Question 3 to Arthur Briggs (Caretaker) ---")
        inq3_resp = await client.post(f"{BASE_URL}/api/v1/investigations/{session_id}/messages", json={
            "character_id": "char_caretaker",
            "content": "Arthur, did you lock the conservatory door on that stormy evening?"
        }, timeout=60.0)
        assert inq3_resp.status_code == 201, f"Inquiry 3 failed: {inq3_resp.text}"
        inq3_data = inq3_resp.json()["data"]
        print(f"[+] Arthur's response ({len(inq3_data['text'])} chars):")
        print(f"    \"{inq3_data['text'][:120]}...\"")
        print(f"    Turn number: {inq3_data.get('turn_number')}")

        # 5. Verify Turn State and Playability
        print("\n--- Step 5: Verify Session State & Dialogue History ---")
        sess_resp = await client.get(f"{BASE_URL}/api/v1/investigations/{session_id}")
        assert sess_resp.status_code == 200
        sess_info = sess_resp.json()["data"]["session"]
        print(f"[+] Authoritative session status: {sess_info['status']}")
        print(f"[+] Current Turn: {sess_info['turnCounter']} (Initial: 1, 3 questions asked -> now at {sess_info['turnCounter']})")
        print(f"[+] Player Sanity: {sess_info['playerSanity']}, Candle: {sess_info['candlePercentage']}%")
        assert sess_info["status"] == "active"
        assert sess_info["turnCounter"] == 4

        history_resp = await client.get(f"{BASE_URL}/api/v1/investigations/{session_id}/messages")
        messages = history_resp.json()["data"]
        print(f"[+] Persisted messages in database: {len(messages)} (3 player + 3 character replies)")
        assert len(messages) >= 6

        # 6. Test Idempotency (Submitting duplicate query does NOT advance turn)
        print("\n--- Step 6: Test Retry Idempotency ---")
        dup_resp = await client.post(f"{BASE_URL}/api/v1/investigations/{session_id}/messages", json={
            "character_id": "char_caretaker",
            "content": "Arthur, did you lock the conservatory door on that stormy evening?"
        })
        assert dup_resp.status_code in [200, 201]
        sess_after_dup = (await client.get(f"{BASE_URL}/api/v1/investigations/{session_id}")).json()["data"]["session"]
        print(f"[+] Turn after duplicate submission: {sess_after_dup['turnCounter']} (should remain 4)")
        assert sess_after_dup["turnCounter"] == 4

        # 7. Test Completed Session Enforcement
        print("\n--- Step 7: Legitimate Case Accusation & Session Completion ---")
        accuse_resp = await client.post(f"{BASE_URL}/api/v1/investigations/{session_id}/accuse", json={
            "suspectId": "char_caretaker",
            "weaponId": "clue_silver_flask",
            "motiveId": "clue_torn_letter",
            "supportingClueIds": ["clue_arsenic_vial"]
        })
        assert accuse_resp.status_code == 200
        ending_data = accuse_resp.json()["data"]
        print(f"[+] Accusation resolved: Title='{ending_data['title']}', Verdict='{ending_data['verdictType']}'")

        # Verify session is now marked completed on backend
        completed_sess = (await client.get(f"{BASE_URL}/api/v1/investigations/{session_id}")).json()["data"]["session"]
        print(f"[+] Session status after accusation: {completed_sess['status']}")
        assert completed_sess["status"] == "completed"

        # Attempting an inquiry on this completed session MUST return HTTP 400 with SESSION_COMPLETED
        print("\n--- Step 8: Inquire On Completed Session (Must Reject with SESSION_COMPLETED) ---")
        rejected_inq = await client.post(f"{BASE_URL}/api/v1/investigations/{session_id}/messages", json={
            "character_id": "char_eleanor",
            "content": "Eleanor, can you still speak to me?"
        })
        print(f"[*] Response status: {rejected_inq.status_code}")
        print(f"[*] Response body: {rejected_inq.json()}")
        assert rejected_inq.status_code == 400
        assert rejected_inq.json()["error"]["code"] == "SESSION_COMPLETED"
        assert "completed" in rejected_inq.json()["error"]["message"].lower()

        # 9. Verify Saved Case Archives
        print("\n--- Step 9: Saved Investigations Listing ---")
        list_resp = await client.get(f"{BASE_URL}/api/v1/investigations")
        assert list_resp.status_code == 200
        saved_list = list_resp.json()["data"]
        this_case = next((s for s in saved_list if s["id"] == session_id), None)
        assert this_case is not None
        print(f"[+] Case archived: id={this_case['id']}, status={this_case['status']}, ending={this_case.get('ending_id')}")

    print("\n=== ALL END-TO-END VERIFICATION CHECKS PASSED SUCCESSFULLY ===")

if __name__ == "__main__":
    asyncio.run(main())

# Séance Studio — REST API Reference

The Séance Studio backend is an offline-first REST API running on `http://127.0.0.1:8000` under prefix `/api/v1`.

Interactive Swagger documentation is available at `http://127.0.0.1:8000/docs`.

---

## Standard Response Envelope

All API endpoints return responses encapsulated in the standard `ApiResponse` envelope:

```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "timestamp": "2026-10-27T22:00:00Z"
}
```

On validation failure or client error:
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Detailed sanitized failure message.",
    "details": { ... }
  },
  "timestamp": "2026-10-27T22:00:00Z"
}
```

---

## 1. System Health & AI Diagnostics

### `GET /api/v1/health`
Probes database reachability and local Ollama daemon status.
- **Response:**
  ```json
  {
    "status": "healthy",
    "backend_available": true,
    "database_connected": true,
    "ollama_connected": true,
    "configured_text_model": "qwen3:4b",
    "text_model_available": true,
    "vision_model": "qwen3-vl:8b",
    "vision_model_available": true,
    "inference_ready": true,
    "offline_strict_mode": true
  }
  ```

### `GET /api/v1/ai/status`
Retrieves detailed diagnostic metrics from the local Ollama runtime.
- **Response:**
  ```json
  {
    "status": "healthy",
    "ollama_connected": true,
    "endpoint": "http://127.0.0.1:11434",
    "configured_text_model": "qwen3:4b",
    "available_models": ["qwen3:4b", "qwen3-vl:8b"],
    "latency_ms": 12,
    "auto_download_allowed": false
  }
  ```

### `POST /api/v1/ai/visual-evidence`
Performs optional local vision-language analysis via `qwen3-vl:8b`.
- **Request Body:**
  ```json
  {
    "image_base64": "<base64-encoded-image>",
    "mime_type": "image/jpeg",
    "prompt": "Inspect the engraving on this silver flask."
  }
  ```
- **Response:**
  ```json
  {
    "observation": "A tarnished silver flask bearing a crest. Residue clings to the threaded cap.",
    "model_used": "qwen3-vl:8b",
    "latency_ms": 420,
    "is_subjective_suggestion": true
  }
  ```

---

## 2. Investigation Sessions

### `GET /api/v1/investigations`
Lists all persisted investigation sessions for the Continue screen.

### `POST /api/v1/investigations`
Initializes a new persistent SQLite investigation session.
- **Request Body:**
  ```json
  {
    "scenario_id": "case_blackwood_thirteenth_chime",
    "difficulty": "seasoned"
  }
  ```
- **Response:** Returns `InvestigationSessionResponse` with `id`, `turnCounter: 1`, `candlePercentage: 100.0`, `playerSanity: 100`.

### `GET /api/v1/investigations/{session_id}`
Retrieves the complete authoritative game state including session meters, discovered clues, character trust, and journal entries.

### `DELETE /api/v1/investigations/{session_id}`
Deletes a saved investigation session and all associated relational records.

---

## 3. Room Actions & Navigation

### `POST /api/v1/investigations/{session_id}/action`
Executes an authoritative room transition, hotspot examination, or ritual action.
- **Request Body:**
  ```json
  {
    "actionType": "INSPECT",
    "targetId": "room_library"
  }
  ```
- **Response:**
  ```json
  {
    "turnNumber": 2,
    "candlePercentage": 96.7,
    "playerSanity": 100,
    "ectoplasmicTension": 15,
    "gameStatus": "active"
  }
  ```

---

## 4. Character Dialogue & Interviews

### `GET /api/v1/investigations/{session_id}/messages`
Retrieves chronologically ordered dialogue utterances for an investigation.

### `POST /api/v1/investigations/{session_id}/messages`
Submits an in-character interrogation query to a suspect.
- **Request Body:**
  ```json
  {
    "character_id": "char_caretaker",
    "content": "Arthur, did you see anyone near the library around midnight?"
  }
  ```
- **Response:**
  ```json
  {
    "id": "msg_f3b9c1",
    "sender_id": "char_caretaker",
    "sender_name": "Arthur Briggs",
    "speaker_type": "character",
    "text": "I was checking the courtyard shutters against the storm when the lights flickered.",
    "emotional_cue": "Guarded",
    "atmospheric_effect": null,
    "turn_number": 3,
    "timestamp": "12:05 AM"
  }
  ```

---

## 5. Discoveries & Evidence Board

### `POST /api/v1/investigations/{session_id}/discoveries`
Authoritatively discovers a clue in an unlocked location.
- **Request Body:**
  ```json
  {
    "clue_id": "clue_thirteenth_chime",
    "discovery_method": "INSPECTION"
  }
  ```

### `POST /api/v1/investigations/{session_id}/present-evidence`
Presents physical evidence to a character to elicit testimony and raise trust.
- **Request Body:**
  ```json
  {
    "character_id": "char_caretaker",
    "clue_id": "clue_thirteenth_chime"
  }
  ```

### `GET /api/v1/investigations/{session_id}/evidence`
Retrieves discovered clues and permitted string connection linkages.

### `POST /api/v1/investigations/{session_id}/evidence/connect`
Links two clues on the Evidence Board. Rejected if no logical correlation exists.
- **Request Body:**
  ```json
  {
    "from_clue_id": "clue_silver_flask",
    "to_clue_id": "clue_arsenic_vial"
  }
  ```
- **Response:**
  ```json
  {
    "relationship": "weapon_match",
    "label": "Toxicity Match",
    "reason": "Arsenic trioxide from the potting bench matches the residue inside the flask."
  }
  ```

---

## 6. Player Choices & Deduction

### `GET /api/v1/investigations/{session_id}/choices`
Lists historical story decisions made by the player.

### `POST /api/v1/investigations/{session_id}/choices`
Records a consequential decision with validated narrative impact.
- **Request Body:**
  ```json
  {
    "choice_id": "confront_julian_will",
    "action_type": "TALK",
    "decision_text": "Confronted Lord Julian regarding Eleanor's revised codicil.",
    "impact_text": "Julian's composure falters under scrutiny."
  }
  ```

---

## 7. Investigator's Journal

### `GET /api/v1/investigations/{session_id}/journal`
Retrieves chronologically ordered journal entries. Supports `?entry_type=theory` and `?search=keyword` query filters.

### `POST /api/v1/investigations/{session_id}/journal`
Logs a detective hypothesis or custom observation.
- **Request Body:**
  ```json
  {
    "title": "Suspect Alibi Compromised",
    "category": "testimony",
    "entry_type": "theory",
    "content": "Julian was observed fleeing the study before the chime.",
    "flagged": true
  }
  ```

---

## 8. Case Conclusion & Accusation

### `POST /api/v1/investigations/{session_id}/complete` *(or `/accuse`)*
Submits the final accusation deduction matrix to conclude the inquest.
- **Request Body:**
  ```json
  {
    "suspectId": "char_julian",
    "weaponId": "clue_silver_flask",
    "motiveId": "clue_burned_will",
    "supportingClueIds": ["clue_thirteenth_chime", "clue_arsenic_vial", "clue_crypt_journal"]
  }
  ```
- **Response:**
  ```json
  {
    "id": "END_TRUE_RESTITUTION",
    "title": "True Restitution • The Chime Silenced",
    "verdictType": "exemplary_victory",
    "culpritNamed": "Lord Julian Blackwood",
    "rating": "Master Occult Detective (Rank S)",
    "narrative": "With the filed escapement, arsenic vial, and London poison ledger presented before the magistrate...",
    "epilogue": "Dawn breaks over the Welsh cliffs as the storm dissipates..."
  }
  ```

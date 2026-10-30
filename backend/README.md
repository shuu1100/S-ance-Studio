# Séance Studio — Authoritative Backend Service

FastAPI authoritative game engine, SQLite relational persistence, and local AI coordinator for **Séance Studio**.

---

## Technical Stack
- **Runtime**: Python 3.11 / 3.12 / 3.14 (Verified on Python 3.14.6 Windows 64-bit).
- **Web Framework**: FastAPI `>= 0.115.0`, Uvicorn `>= 0.30.0`.
- **Validation**: Pydantic `>= 2.8.0`.
- **Database & ORM**: SQLite with WAL (Write-Ahead Logging) and foreign keys enabled, SQLAlchemy `>= 2.0.30`.
- **Schema Migrations**: Alembic `>= 1.13.0`.
- **Testing**: Pytest `>= 8.0.0` with `pytest-asyncio`.
- **Local AI Provider**: Ollama HTTP API (`http://127.0.0.1:11434`, default model `qwen3:4b`).

---

## Directory Structure
```
backend/
├── app/
│   ├── config.py             # Environment configuration, loopback bindings, air-gap flags
│   ├── database.py           # SQLAlchemy Engine, SessionLocal, WAL & foreign key pragmas
│   ├── models/               # Relational database models
│   │   ├── scenario.py       # ScenarioDefinition (immutable case catalog)
│   │   ├── session.py        # InvestigationSession, PlayerChoice
│   │   ├── character.py      # CharacterDefinition, CharacterRelationshipState
│   │   ├── clue.py           # ClueDefinition, PermittedConnection, DiscoveredClue
│   │   ├── dialogue.py       # DialogueMessage (transcript history)
│   │   ├── journal.py        # JournalEvent (facts vs theories)
│   │   └── ending.py         # EndingRecord (case outcome archive)
│   ├── schemas/              # Pydantic v2 validation contracts
│   │   ├── common.py         # Standard ApiResponse[T] envelope
│   │   ├── investigation.py  # Session creation, summary, and detail contracts
│   │   ├── character.py      # Trust update and character state schemas
│   │   ├── clue.py           # Clue response, discovery request, connection schemas
│   │   ├── dialogue.py       # Message exchange and ActionPayload schemas
│   │   ├── choice.py         # Player choice registration schemas
│   │   ├── journal.py        # Journal entry and search filter schemas
│   │   └── ending.py         # Accusation payload and verdict outcome schemas
│   ├── engine/               # Authoritative game logic
│   │   ├── state_machine.py  # Turn counter, candle burn, sanity deltas, action runner
│   │   ├── clue_rules.py     # Deductive connection validator and idempotent discoveries
│   │   ├── accusation.py     # Authoritative 5-ending deduction matrix evaluator
│   │   └── seed_data.py      # Scenario catalog and initial session entity seeding
│   ├── api/
│   │   ├── router.py         # Main /api/v1 router aggregation
│   │   └── v1/               # Version 1 route endpoints
│   │       ├── health.py     # /health, /ai/status
│   │       ├── scenarios.py  # /scenarios, /cases
│   │       ├── investigations.py # /investigations, /sessions, /action
│   │       ├── messages.py   # /investigations/{id}/messages
│   │       ├── choices.py    # /investigations/{id}/choices
│   │       ├── discoveries.py# /investigations/{id}/discoveries, /present-evidence
│   │       ├── evidence.py   # /investigations/{id}/evidence, /evidence/connect
│   │       ├── journal.py    # /investigations/{id}/journal
│   │       └── complete.py   # /investigations/{id}/complete, /accuse
│   └── main.py               # FastAPI application setup, CORS, lifespan, sanitized handlers
├── alembic/                  # Database migration management
│   ├── env.py
│   ├── script.py.mako
│   └── versions/
│       └── 2026_10_27_1608-3227c7bc6021_initial_schema.py
├── data/
│   └── seance_studio.db      # Persistent SQLite database file
├── tests/                    # Pytest test suite (25 tests covering all domains)
│   ├── conftest.py           # In-memory test SQLite fixtures and TestClient
│   ├── test_health.py        # Health, diagnostics, root probes
│   ├── test_investigations.py# CRUD, invalid IDs, malformed requests, restart persistence
│   ├── test_discoveries_and_evidence.py # Discoveries, idempotency, connections, presentation
│   ├── test_choices_and_messages.py     # Choices, dialogue history, action runner
│   ├── test_journal.py       # Journal creation, fact vs theory, search filtering
│   ├── test_accuse_and_complete.py      # Verdict outcomes (True Justice, Hollow, Wrongful)
│   └── test_database_transactions.py    # Transaction rollbacks and SQL injection defense
├── alembic.ini
├── requirements.txt
└── pyproject.toml
```

---

## API Endpoints (Version 1)

All endpoints return a uniform envelope:
```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "timestamp": "2026-10-27T10:35:00.000000Z"
}
```

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/health` | SQLite read/write probe, Ollama connectivity, active model. |
| `GET` | `/api/v1/ai/status` | Detailed local Ollama model catalog and latency. |
| `GET` | `/api/v1/scenarios` | List available mystery cases (aliased to `/api/v1/cases`). |
| `POST` | `/api/v1/investigations` | Create a new investigation session (aliased to `/sessions`). |
| `GET` | `/api/v1/investigations/{id}` | Retrieve complete authoritative state (characters, clues, journal). |
| `DELETE` | `/api/v1/investigations/{id}` | Safely abandon/remove an investigation session. |
| `POST` | `/api/v1/investigations/{id}/action` | Unified turn execution action (`TALK`, `INSPECT`, `RITUAL`). |
| `POST` | `/api/v1/investigations/{id}/messages` | Send an interrogation query or present evidence. |
| `GET` | `/api/v1/investigations/{id}/messages` | Retrieve chronological dialogue utterance history. |
| `POST` | `/api/v1/investigations/{id}/choices` | Record and validate a player decision. |
| `GET` | `/api/v1/investigations/{id}/choices` | List historical choices made during the inquest. |
| `POST` | `/api/v1/investigations/{id}/discoveries` | Discover a clue; idempotent handling prevents duplicates. |
| `GET` | `/api/v1/investigations/{id}/evidence` | List discovered clues and valid board linkages. |
| `POST` | `/api/v1/investigations/{id}/evidence/connect` | Validate and register a deductive clue connection. |
| `POST` | `/api/v1/investigations/{id}/present-evidence` | Present evidence to a suspect or medium. |
| `GET` | `/api/v1/investigations/{id}/journal` | Query journal events with fact/theory and search filters. |
| `POST` | `/api/v1/investigations/{id}/journal` | Record a player theory or note. |
| `POST` | `/api/v1/investigations/{id}/complete` | Submit formal accusation matrix (aliased to `/accuse`). |

---

## Running the Backend

### 1. Launch development server
```powershell
powershell -File .\scripts\dev-backend.ps1
```
The server will run on `http://127.0.0.1:8000`. Interactive documentation is available at `http://127.0.0.1:8000/docs`.

### 2. Run backend tests
```powershell
powershell -File .\scripts\test-backend.ps1
```
All 25 unit and integration tests run with exit code 0.

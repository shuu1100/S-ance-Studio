# Séance Studio — Implementation Plan & Phase Roadmap
**Document Version:** 1.0.0  
**Status:** Approved for Implementation  
**Execution Context:** Windows 10/11 Local Environment

---

## 1. Executive Summary & Audit Baseline

### 1.1. Current Workspace Audit
An inspection of the workspace root (`c:\local_disc_D\Hackathan\week_4`) and local system revealed:
- **Workspace State**: Empty directory (`week_4`), no previous source files, build artifacts, or configuration files present. There is zero legacy code to break or overwrite.
- **Runtimes Detected**:
  - **Node.js**: `v24.20.0` with `npm 11.19.0`.
  - **Python**: `Python 3.14.6 (64-bit)`.
  - **Git**: Installed and functional (`git version 2.x`).
  - **Ollama**: `0.40.11` actively running on port `11434`.
  - **Available Local Models**: `qwen3:4b` (2.5 GB) and `qwen3-vl:8b` (6.1 GB) pre-installed locally.
  - **Hardware Profile**: Windows 11 Home, 16 GB Physical RAM, NVIDIA GeForce RTX 4060 Laptop GPU (8 GB VRAM).
- **Runtime Risk & Note on Python 3.14**: Python 3.14 is a bleeding-edge release. Certain compiled C-extension wheels (e.g. earlier `pydantic-core`, `greenlet`, or `grpcio`) may require pure-Python fallbacks or specific wheel builds. The backend will specify strict compatible dependency pins and verify clean imports during Phase 1 setup.

---

## 2. Target Repository Tree Structure

The project will follow a modular, decoupled monorepo layout separating the Next.js frontend, FastAPI backend, shared case definitions, and tests:

```text
seance-studio/
├── .env.example                     # Environment template (offline defaults)
├── .gitignore                       # Git exclusions (node_modules, .venv, *.db)
├── README.md                        # Project quickstart and setup instructions
├── docs/                            # Architectural and design documentation
│   ├── ARCHITECTURE.md              # Authoritative technical architecture
│   ├── IMPLEMENTATION_PLAN.md       # Roadmap, checklist, and acceptance criteria
│   └── CASES_DESIGN.md              # Mystery case storylines, clues, and entities
├── backend/                         # FastAPI Python Backend
│   ├── .python-version              # Python version pin
│   ├── pyproject.toml               # Project metadata and dependencies (Poetry/Pip)
│   ├── requirements.txt             # Pinned pip requirements
│   ├── alembic.ini                  # Alembic database migration config
│   ├── alembic/                     # Database migration versions
│   │   ├── env.py
│   │   └── versions/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                  # FastAPI entry point, lifespan, CORS
│   │   ├── config.py                # Pydantic Settings (.env loader)
│   │   ├── api/                     # REST API route handlers
│   │   │   ├── __init__.py
│   │   │   ├── v1/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── router.py        # Master API v1 router
│   │   │   │   ├── health.py        # System health & Ollama probe
│   │   │   │   ├── cases.py         # Mystery case catalog & metadata
│   │   │   │   ├── sessions.py      # Game session lifecycle & actions
│   │   │   │   ├── journal.py       # Player clues & notes
│   │   │   │   └── accuse.py        # Final deduction submission
│   │   ├── engine/                  # Authoritative Deterministic Game Engine
│   │   │   ├── __init__.py
│   │   │   ├── state_machine.py     # Session FSM (Turns, Sanity, Candle)
│   │   │   ├── rules.py             # Action rules and resource calculations
│   │   │   ├── clue_resolver.py     # Clue triggers and graph progression
│   │   │   └── accusation.py        # Victory/defeat verdict evaluator
│   │   ├── ai/                      # Local AI Integration & Guardrails
│   │   │   ├── __init__.py
│   │   │   ├── client.py            # Local Ollama httpx client
│   │   │   ├── prompts.py           # Character persona & knowledge boundary prompts
│   │   │   ├── guardrails.py        # Anti-hallucination & spoiler filter
│   │   │   └── fallbacks.py         # Scripted deterministic backup responses
│   │   ├── models/                  # SQLAlchemy 2.0 ORM Models
│   │   │   ├── __init__.py
│   │   │   ├── base.py
│   │   │   ├── session.py
│   │   │   ├── clue.py
│   │   │   ├── action_log.py
│   │   │   └── note.py
│   │   ├── schemas/                 # Pydantic v2 Request/Response Schemas
│   │   │   ├── __init__.py
│   │   │   ├── action.py
│   │   │   ├── game_state.py
│   │   │   ├── journal.py
│   │   │   └── accusation.py
│   │   └── content/                 # Declarative Case Definitions (JSON/YAML)
│   │       ├── case_01_blackwood/
│   │       │   ├── meta.json
│   │       │   ├── entities.json
│   │       │   ├── clues.json
│   │       │   └── truth_matrix.json
│   │       └── case_02_asylum/
│   └── tests/                       # Backend Pytest Suite
│       ├── conftest.py
│       ├── test_health.py
│       ├── test_engine_rules.py
│       ├── test_clue_triggers.py
│       ├── test_knowledge_boundaries.py
│       └── test_accusation.py
├── frontend/                        # Next.js App Router Client
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts           # Bespoke Gothic/Occult color palette
│   ├── postcss.config.mjs
│   ├── next.config.mjs
│   ├── public/                      # Static assets (fonts, audio, icons)
│   │   ├── fonts/                   # Self-hosted WOFF2 fonts
│   │   ├── audio/                   # Atmospheric ambient loops & stingers
│   │   └── textures/                # Subtle parchment and vignette overlays
│   └── src/
│       ├── app/                     # Next.js App Router
│       │   ├── layout.tsx           # Global root layout (dark theme, fonts)
│       │   ├── page.tsx             # Title screen & Case selection
│       │   ├── seance/[sessionId]/  # Active Séance Chamber view
│       │   └── globals.css          # Tailwind base & custom animations
│       ├── components/              # Modular UI Components
│       │   ├── chamber/             # Séance table, candle flame, pendulum
│       │   ├── spirit-board/        # Ouija / planchette interface
│       │   ├── dialogue/            # Spirit transcript & message feed
│       │   ├── journal/             # Detective dossier & clue connector
│       │   ├── audio/               # Atmospheric ambient sound player
│       │   └── accusation/          # Final verdict deduction board
│       ├── hooks/                   # React hooks (useAudio, useGameState)
│       ├── lib/                     # API client & local helpers
│       │   ├── api.ts               # Local fetch wrapper with timeout
│       │   └── types.ts             # TypeScript mirrors of backend schemas
│       └── store/                   # Zustand state management
│           └── gameStore.ts
└── scripts/                         # Local Developer & Windows Run Scripts
    ├── dev-backend.ps1              # Run FastAPI with uvicorn reload
    ├── dev-frontend.ps1             # Run Next.js dev server
    ├── run-all.ps1                  # Single launcher for full stack
    └── run-tests.ps1                # Execute Pytest & frontend tests
```

---

## 3. Ordered Phase Roadmap

### Phase 0: Repository Audit and Architecture (Current Phase)
- [x] Inspect workspace and system environment (Windows 11, Node 24, Python 3.14, Ollama with `qwen3:4b`).
- [x] Confirm clean workspace state without legacy conflicts.
- [x] Produce comprehensive `docs/ARCHITECTURE.md`.
- [x] Produce actionable `docs/IMPLEMENTATION_PLAN.md`.
- [x] Produce template `.env.example`.
- [ ] Present audit findings and architectural recommendations to the user.

---

### Phase 1: Premium Gothic UI Design System & Frontend Architecture
- [x] Scaffold Next.js 16+ App Router, TypeScript, and Tailwind CSS.
- [x] Install local icon library (`lucide-react`).
- [x] Implement bespoke Victorian Gothic visual design system (Obsidian, Charcoal, Parchment, Antique Brass, Restrained Candle Amber, Blood Crimson).
- [x] Implement 100% offline local typography stack (zero remote Google Font CDN fetches).
- [x] Create complete suite of reusable UI components:
  - App shell and responsive navigation ribbon.
  - Buttons (Primary, Secondary, Destructive, Ghost, Parchment).
  - Badges (Chapter medallions, Clue categories, Entity statuses).
  - Dialogs & confirmation prompts (Modal, ConfirmationDialog).
  - Tooltips and atmospheric notification toast system.
  - States (Loading, Error, Empty, Offline air-gap badge, Disabled).
  - Animated SVG CandleGauge with wax level meter and flame flicker.
  - SanityMeter with psychic strain tracking and tension gauge.
  - Procedural Web Audio API sound engine (Rain, Vinyl crackle, Resonant drone, Séance bell, Planchette friction) — strictly muted by default.
  - Cameo daguerreotype Character Portraits with vector SVG artwork.
  - Gothic Dialogue Bubbles with speaker titles and manifestation cues.
  - Forensic Clue Cards with wax seals, evidence markers, and suspect tags.
- [x] Implement the 7 authoritative main game screens:
  1. Title Screen & Portal
  2. Case Archives & Session Browser
  3. Blackwood Manor Floor Plan & Room Inspector
  4. Séance Chamber & Interrogation Panel
  5. Deductive Evidence Board & Accusation Matrix
  6. Investigator's Field Dossier & Ledger
  7. Studio Settings & Local Ollama Diagnostic
- [x] Add automated domain tests (`node --test tests/*.test.mjs`) — 100% pass rate.
- [x] Verify ESLint and Next.js production build (`npm run lint`, `npm run build`) with zero errors.
- [x] Add Windows PowerShell launcher (`scripts/dev-frontend.ps1`).

---

### Phase 2: Interactive Frontend & Mystery Scenarios (Completed)
- [x] Initial Mystery Scenario Implementation: *Blackwood Manor: The Thirteenth Chime*.
- [x] Title Screen: Victorian manor vector artwork, New/Continue buttons with disabled state when no save exists, Credits modal with historical fiction disclaimer, actionable AI readiness badge.
- [x] Investigation Setup: Create new inquest, historical fiction disclaimer, accessibility toggles (reduced motion, high contrast), optional audio settings, confirmation before superseding existing sessions.
- [x] Mansion Dashboard: Floor plan map with unlockable wings, POI hotspot examination, discovered vs concealed clues (zero spoiler leakage), character locations, current objective, and Story Summary modal.
- [x] Character Interviews: Cameo portraits, biographies, live trust level tracker (0-100%), dialogue history, state-valid suggested questions, presenting discovered clues, loading state to prevent duplicate submissions, and retryable error handling.
- [x] Evidence Board: Discovered clues inspection modal, game-engine enforced string connections (rejects invalid linkages), accusation deduction builder.
- [x] Investigation Journal: Dossier timeline with search capability, visual distinction between Confirmed Story Facts and Investigator Theories, and Past Decisions review.
- [x] Endings Screen: Narrative chronicles for 5 outcomes (Exemplary Victory, Hollow Victory, Wrongful Conviction, Vessel of the Damned, The Cold Dark), evidence verification breakdown, influential decision log, and safe restart prompt.
- [x] API Integration Readiness: Typed client functions (`checkBackendHealth`, `submitActionApi`, `submitAccusationApi`) with development fixture isolation when backend is offline.
- [x] 100% test pass rate (`npm run test`) and zero ESLint / TypeScript build errors.

---

### Phase 3: FastAPI Backend and Persistent Database (Completed)
- [x] Python 3.14 compatible environment setup with FastAPI, Uvicorn, SQLAlchemy 2.0, Alembic, Pydantic v2, and Pytest.
- [x] Normalized relational database schema in SQLite with WAL mode and foreign key constraints:
  - `investigation_sessions` (turns, sanity, candle percentage, objective, act, status)
  - `player_choices` (choice ID, action type, decision, impact, validated outcome)
  - `character_definitions` (static bio, personality, secrets, known facts whitelist)
  - `character_relationship_states` (session-specific trust score, stance, flags)
  - `dialogue_messages` (utterance transcript, roles, emotional & atmosphere cues, presented clues)
  - `clue_definitions` (category, description, source, evidence marker, key evidence flag)
  - `permitted_connections` (engine-permitted deductive pairs, relationships, validation reasons)
  - `discovered_clues` (session-specific revealed clues, discovery turn, method)
  - `journal_events` (distinguished confirmed facts from player theories, search indexes)
  - `ending_records` (conclusive case outcome, verdict type, rating, influential decisions)
- [x] Version-controlled Alembic migrations (`alembic/versions/2026_10_27_1608-3227c7bc6021_initial_schema.py`).
- [x] Authoritative game engine layer (`app/engine/`):
  - Deterministic state machine (turn progression, candle burn, sanity/tension calculations)
  - Permitted connection validator and idempotent clue discovery resolver
  - Authoritative 5-ending deduction matrix evaluator (`END_TRUE_JUSTICE`, `END_HOLLOW_ACCUSATION`, `END_WRONGFUL_CONVICTION`, `END_VESSEL_OF_THE_DAMNED`, `END_THE_COLD_DARK`)
  - Initial scenario and entity catalog seeding for *Blackwood Manor: The Thirteenth Chime*
- [x] Comprehensive Pytest test suite (25 tests covering CRUD, restart persistence, malformed payloads, 404s, duplicate discoveries, invalid choices, transactions, SQL injection defense).
- [x] ASCII-safe Windows PowerShell runners (`scripts/dev-backend.ps1`, `scripts/test-backend.ps1`).

---

### Phase 4: Deterministic Mystery and Branching Engine
- [x] Authoritative data-driven scenario asset format (`backend/content/scenarios/case_blackwood_thirteenth_chime.json`):
  - 3 interviewable characters (`char_caretaker`, `char_daughter`, `char_apparition`).
  - 6 discoverable clues (`clue_silver_flask`, `clue_burned_will`, `clue_thirteenth_chime`, `clue_arsenic_vial`, `clue_torn_velvet`, `clue_crypt_journal`).
  - 5 locations with deterministic unlock conditions (`room_foyer`, `room_seance`, `room_library`, `room_conservatory`, `room_cellar`).
  - Character knowledge boundaries, conditional facts, and strictly forbidden knowledge.
  - Evidence presentation triggers with clamped trust changes, dialogue, and chained unlocks.
  - 3 branching canonical endings (`END_TRUE_RESTITUTION`, `END_TRAGIC_COVERUP`, `END_SPECTRAL_WRATH`).
- [x] Reusable authoritative engine (`backend/app/engine/game_state_service.py`):
  - `load_scenario`: Loads and caches validated scenario asset.
  - `get_available_locations` / `is_location_unlocked`: Evaluates clue, choice, trust, and flag prerequisites.
  - `get_available_topics`: Enforces trust and clue requirements for conversation topics.
  - `discover_clue`: Authoritatively validates prerequisites and provides zero-duplicate idempotency.
  - `present_evidence`: Confronts suspect, clamps trust within limits, updates flags, and records utterances.
  - `apply_player_choice`: Persistently registers choices.
  - `calculate_unlocked_endings`: Evaluates suspect, weapon, motive, supporting evidence, trust, and sanity.
  - `get_safe_ai_context`: Generates safe, whitelisted prompt context for LLM, redacting unrevealed clues and forbidden lore.
- [x] Documentation & Authoring Guide:
  - Created `docs/SCENARIO_SCHEMA.md` documenting JSON schema, authoring rules, and verification checklist.
- [x] Deterministic test suite (`backend/tests/test_game_state_service.py`):
  - 11 comprehensive tests verifying clue prerequisites, room unlocks, trust limits, knowledge boundaries, idempotency, and full complete playthroughs for all 3 endings.
  - Entire backend test suite passes: 37/37 tests passing.

---

### Phase 5: Local AI Provider and Character Dialogue
- [x] Reusable AI provider interface (`backend/app/ai/interface.py`):
  - `BaseAIProvider` abstract contract.
  - `AIReadinessResult` distinguishing backend availability, server reachability, model existence, and inference readiness.
  - `DialoguePromptContext` and `DialogueGenerationResult` typed data models.
- [x] Local Ollama implementation (`backend/app/ai/ollama_provider.py`):
  - Strict loopback binding (`http://127.0.0.1:11434`), configurable via `OLLAMA_BASE_URL` and `OLLAMA_MODEL`.
  - Zero cloud dependencies, zero telemetry, zero automatic model downloads, zero silent model switching.
  - Instantaneous dialogue with `"think": false` for reasoning models like `qwen3:4b`.
- [x] Safe prompt builder and input isolation (`backend/app/ai/prompt_builder.py`):
  - Separates trusted scenario facts from untrusted player input (`<player_utterance>`).
  - Neutralizes XML injection tags and enforces 1,000-character input bounds.
- [x] Output sanitizer and anti-spoiler filter (`backend/app/ai/sanitizer.py`):
  - Robust JSON and markdown code block extraction.
  - Automatically redacts leaked clue IDs (e.g. `clue_crypt_journal`) to `[unsubstantiated rumor]`.
- [x] Dialogue Pipeline (`backend/app/ai/dialogue_pipeline.py`):
  - Coordinates authoritative context gathering, bounded history window, local inference, and database persistence.
- [x] Error handling & transparent diagnostics (`backend/app/ai/exceptions.py`):
  - Structured HTTP exceptions: 503 for unreachable Ollama or missing model, 504 for timeout, 400 for input validation.
  - Actionable guidance messages without leaking stack traces or internal secrets.
- [x] Comprehensive test suite (`backend/tests/test_ai_provider.py`):
  - 14 tests covering healthy readiness, unreachable Ollama, missing models, oversized inputs, empty inputs, timeouts, character consistency, and live Ollama smoke test.
  - All 51 backend tests passing (100% pass rate).
- [x] Operator documentation (`docs/LOCAL_AI_GUIDE.md`):
  - Step-by-step setup, readiness verification, manual API testing, and offline troubleshooting guide.

---

### Phase 6: Testing, Polish, Offline Hardening & Packaging
- [ ] Complete Pytest suite covering all engine edge cases, session persistence, and API contracts.
- [ ] Frontend testing (Vitest/React Testing Library) for UI state transitions and store mutations.
- [ ] Offline verification test: Disconnect network adapters; verify that the game runs without errors, warnings, or external network requests.
- [ ] Create Windows unified launch script (`scripts/run-all.ps1`) that checks Ollama status, starts FastAPI backend, and starts Next.js frontend.
- [ ] Write user guide and case documentation in `README.md`.

---

## 4. Phase Acceptance Criteria

| Phase | Core Deliverable | Acceptance Criteria |
| :--- | :--- | :--- |
| **Phase 0** | Architecture & Audit | `docs/ARCHITECTURE.md`, `docs/IMPLEMENTATION_PLAN.md`, and `.env.example` created; runtime profile confirmed; zero code overwritten. |
| **Phase 1** | Scaffolding & Health API | Backend starts on `127.0.0.1:8000`; `/api/v1/health` returns 200 with DB + Ollama status; Frontend renders Gothic theme on `127.0.0.1:3000` with zero external network requests. |
| **Phase 2** | Game Engine & DB | Alembic migrations apply cleanly; State Machine deterministically updates turns, candle, sanity; Clue resolver unlocks clues given valid triggers; Pytest suite passes without AI. |
| **Phase 3** | Local AI Guardrails | Local Ollama responds with valid JSON conforming to Pydantic schemas; spoiler tokens are filtered; fallback generator engages seamlessly when Ollama is stopped. |
| **Phase 4** | Interactive UI | Séance chamber renders candle animation, sanity vignette, transcript feed, and journal; responsive on standard 1080p and laptop screens. |
| **Phase 5** | Playable Mystery | A full playthrough of Case 1 can be completed from start to finish, culminating in one of 5 distinct ending states based on evidence presented. |
| **Phase 6** | Hardened Local Release | 100% offline operation verified; all tests pass; single-command PowerShell launch script starts entire suite cleanly. |

---

## 5. Risk Analysis & Unresolved Architectural Decisions

### 5.1. Identified Risks & Mitigations
1. **Python 3.14 Binary Wheel Compatibility**:
   - *Risk*: Python 3.14.6 is installed on the user workstation. Standard binary wheels for certain dependencies might require compiling from source if wheels are not yet published for 3.14.
   - *Mitigation*: Select mainstream, pure-Python or pre-compiled packages (`fastapi`, `pydantic`, `uvicorn`, `sqlalchemy[sqlite]`, `httpx`). If compiler issues arise, use `py -3.12` or pure-Python alternatives.
2. **Local LLM Latency & VRAM Contention**:
   - *Risk*: If the user runs larger models (e.g. 8B parameter) on a laptop GPU, inference time per turn might exceed 10 seconds.
   - *Mitigation*: Default to `qwen3:4b` (2.5 GB, already installed), cap `num_predict` / `max_tokens` to 150 tokens (concise dialogue suits Victorian spiritualism), and display an animated spirit board planchette "communing" state during inference.
3. **LLM Hallucination of False Evidence**:
   - *Risk*: The language model might invent nonexistent murder weapons or suspects not tracked by the game engine.
   - *Mitigation*: Prompts enforce that the spirit only speaks in sensory impressions, emotional reflections, and whitelisted facts; the game engine remains the sole source of truth for discovered clues.

### 5.2. Unresolved Architectural Decisions (For User Alignment)
1. **Dialogue Generation Style**: Should spirit responses be streamed token-by-token (Server-Sent Events) for a typewriter effect, or sent as complete structured JSON packets with client-side typing animation? (Recommended: Complete JSON packets with client-side typewriter animation, because structured JSON validation is much cleaner and avoids partial JSON parsing complexities).
2. **Audio Asset Source**: Should the game use synthesized Web Audio API soundscapes (zero file size, 100% procedural) or lightweight local WAV/MP3 ambient recordings? (Recommended: Hybrid — procedural drone/crackle via Web Audio API + local bundled ambient rain loop).

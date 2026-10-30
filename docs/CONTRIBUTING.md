# Contributing to Séance Studio 🕯️

Welcome, and thank you for considering contributing to **Séance Studio**! Whether you are participating in **Hacktoberfest**, adding new Gothic mystery scenarios, refining the deterministic story engine, or enhancing UI atmosphere, your contributions are welcome.

---

## 1. Core Contribution Invariants

Before writing code or authoring new scenarios, please review our inviolable architectural principles:
1. **Strictly Offline-First**: No external cloud APIs (OpenAI, Anthropic, Google), remote CDNs, or external telemetry are permitted. Everything must execute on the local workstation.
2. **Zero Unsolicited Network Downloads**: Never add automatic model pulling or background asset downloading.
3. **Deterministic Mystery Engine Authority**: Generative LLMs synthesize in-character dialogue only. All game state mutations (clues, room access, trust scores, endings) **must remain in deterministic Python code**.
4. **Preserve Immersion & General Audience Rating**: Mystery scenarios should be suspenseful, atmospheric, and emotionally engaging. Avoid gratuitous gore.

---

## 2. Good First Issues & Hacktoberfest Ideas

Looking for ways to contribute? Here are great starting points:
- **New Victorian Mystery Scenarios**: Create a new standalone scenario JSON in `backend/content/scenarios/` (e.g., *The Alchemist's Crypt*, *The Fog Over Blackfriars*).
- **Sound & Atmosphere Enhancements**: Add new Web Audio ambient effects (rain thuds, clock chimes, planchette scratches).
- **UI & Accessibility Improvements**: Add keyboard shortcuts, screen-reader labels, and high-contrast color modes.
- **New Clue Deduction Mechanics**: Add innovative evidence board connection types or forensic analysis tools.
- **Alternative Local Model Support**: Test and document prompts for other local models (e.g. `llama3.2`, `mistral`, `phi-4`).

---

## 3. Development Workflow

### 1. Fork & Branch
```bash
git checkout -b feature/your-feature-name
```

### 2. Set Up Local Environment
Follow the instructions in [docs/INSTALLATION.md](file:///c:/local_disc_D/Hackathan/week_4/docs/INSTALLATION.md) to set up your Python virtual environment and Node.js dependencies.

### 3. Verify Baseline Tests
Ensure all existing tests pass before making changes:
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\run-all.ps1
```

### 4. Implement Changes
- Write clean, documented code.
- Follow PEP 8 guidelines for Python code in `backend/`.
- Follow strict TypeScript guidelines with Tailwind CSS in `frontend/`.
- Add new tests in `backend/tests/` or `frontend/tests/` to cover new features.

### 5. Validate Before Submitting
Every pull request must satisfy:
1. Backend Pytest suite passes:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\scripts\test-backend.ps1
   ```
2. Frontend unit tests pass:
   ```powershell
   cd frontend; npm test; cd ..
   ```
3. Frontend TypeScript compiles with 0 errors:
   ```powershell
   cd frontend; npm run build; cd ..
   ```

---

## 4. How to Author a New Mystery Scenario

All mystery scenarios are data-driven JSON definitions stored in `backend/content/scenarios/`.

### Required Scenario JSON Structure
```json
{
  "schema_version": "1.0.0",
  "id": "case_your_mystery_id",
  "title": "Your Mystery Title",
  "subtitle": "A Victorian Occult Inquest",
  "era": "November 1922",
  "difficulty": "seasoned",
  "description": "Short synopsis of the murder and premise.",
  "opening_narration": "Atmospheric introductory prose presented to the player.",
  "max_turns": 30,
  "starting_location_id": "room_entryway",
  "characters": [ ... ],
  "clues": [ ... ],
  "locations": [ ... ],
  "permitted_connections": [ ... ],
  "choices": [ ... ],
  "endings": [ ... ]
}
```
Refer to [backend/content/scenarios/case_blackwood_thirteenth_chime.json](file:///c:/local_disc_D/Hackathan/week_4/backend/content/scenarios/case_blackwood_thirteenth_chime.json) as the canonical reference implementation.

---

## 5. Submitting Your Pull Request

1. Commit your changes with a clear, descriptive commit message:
   ```bash
   git commit -m "feat(scenario): add The Clockmaker's Curse mystery scenario"
   ```
2. Open a Pull Request on GitHub against the `main` branch.
3. Include:
   - Summary of changes.
   - Confirmation that all automated tests passed.
   - Any visual screenshots or gameplay logs.

Thank you for helping bring atmospheric ghost stories to the open-source community!

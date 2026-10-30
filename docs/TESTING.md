# Séance Studio — Testing & Quality Assurance Guide

This document describes the automated test architecture, coverage verification, and quality standards for **Séance Studio**.

---

## 1. Quick Test Execution

### Run Full-Stack Automated Verification (Backend + Frontend)
Execute the PowerShell verification script from the repository root:
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\run-all.ps1
```
This runs:
1. Backend pytest suite (82 tests across 12 modules).
2. Frontend unit and asset validation suite (15 tests).
3. Local Ollama reachability probe on `http://127.0.0.1:11434`.

---

## 2. Backend Automated Testing (Pytest)

The backend test suite is powered by **Pytest** with SQLite in-memory isolation, transaction rollbacks between tests, and dependency overrides for the AI provider.

### Run All Backend Tests
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\test-backend.ps1
```
Or directly via the Python virtual environment:
```powershell
cd backend
..\.venv\Scripts\pytest -v
cd ..
```

### Backend Test Modules

| Module | Description |
| :--- | :--- |
| `test_security_and_offline_audit.py` | Path traversal prevention, multi-session isolation, prompt injection neutralization, and inactive session guardrails. |
| `test_e2e_integration_flow.py` | Full 10-step player lifecycle test from new case through interrogation, clue discovery, evidence presentation, save/resume, and final accusation. |
| `test_ai_provider.py` | Ollama connection failure handling, timeout simulation, model output JSON parsing, clue ID redaction, input boundary validation, and real live inference smoke tests. |
| `test_game_state_service.py` | Authoritative room unlocks, trust clamping, clue prerequisites, and deterministic ending calculations. |
| `test_scenario_content.py` | Verifies integrity of the Blackwood Manor scenario JSON asset, location graph reachability, and complete solvability. |
| `test_investigations.py` | Session creation, detail querying, persistence across database restarts, and deletion. |
| `test_discoveries_and_evidence.py` | Clue discovery idempotency, locked-location rejections, permitted evidence linkages, and suspect evidence presentations. |
| `test_accuse_and_complete.py` | Evaluates all three case endings (`True Restitution`, `Tragic Coverup`, `Spectral Wrath`). |
| `test_choices_and_messages.py` | Player decision recording and dialogue turn advances. |
| `test_database_transactions.py` | Transaction rollback on failure and SQL injection resilience. |
| `test_journal.py` | Fact vs theory categorization and keyword search filters. |
| `test_health.py` | Root probes, health endpoints, AI diagnostic status, and vision payload analysis. |

---

## 3. Frontend Automated Testing (Node.js Test Runner)

The frontend test suite validates game invariants without requiring external browser drivers:
- Asset manifest integrity and physical existence on disk.
- Zero remote/external image URLs in bundle.
- Clue confidentiality protocol (ensuring locked clues are not leaked in DOM props).
- Evidence board permitted connection matrices.
- Accusation deduction matrix logic.
- Scripted fallback dialogue behavior.

### Run Frontend Tests
```powershell
cd frontend
npm test
cd ..
```

---

## 4. Frontend Type Checking & Production Build

Ensure zero TypeScript errors, lint errors, or Turbopack compilation issues:
```powershell
cd frontend
npm run build
cd ..
```
*Expected result:*
```text
✓ Compiled successfully
  Running TypeScript ...
✓ Generating static pages using 5 workers
```

---

## 5. Security & Boundary Regression Testing

To test prompt injection and path traversal resistance specifically:
```powershell
cd backend
..\.venv\Scripts\pytest tests/test_security_and_offline_audit.py -v
cd ..
```

To run tests with stdout capture disabled (inspecting live JSON logs):
```powershell
cd backend
..\.venv\Scripts\pytest tests/test_security_and_offline_audit.py -v -s
cd ..
```

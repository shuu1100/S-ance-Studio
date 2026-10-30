# Séance Studio — Hacktoberfest 60–90 Second Demo Script

This script provides a concise, high-impact demonstration of **Séance Studio: Interactive AI Ghost Stories** for video presentations, Hacktoberfest showcases, or portfolio recordings.

---

## Demo Overview
- **Duration:** ~75 seconds (1 minute 15 seconds)
- **Target Resolution:** 1920x1080 (1080p, 60fps)
- **Environment:** Local Windows Workstation with Ollama running `qwen3:4b`
- **Audio:** Browser audio enabled (procedural rain, clock chimes, ambient drone)

---

## Timeline & Step-by-Step Script

| Timestamp | Visual Action | Narrative / Voiceover Cue | On-Screen Highlights |
| :--- | :--- | :--- | :--- |
| **00:00 – 00:10** | **1-Click Launch & Title Screen**<br>Execute `.\start.bat`. Browser opens to `http://localhost:3000`. Show title screen with flickering candle and diagnostic badges. | *"Welcome to Séance Studio, a 100% offline, local-first supernatural detective game. Powered by a local Ollama runtime and a deterministic Python state machine, all dialogue happens privately on your own machine with zero cloud dependence."* | Green diagnostic badges: `Backend: Healthy`, `SQLite: WAL Mode`, `qwen3:4b: Ready`. |
| **00:10 – 00:20** | **Begin Inquest & Case Opening**<br>Click **"Begin Inquest"**. Select *Blackwood Manor: The Thirteenth Chime*. Grand Foyer scene renders with atmospheric ambient audio and mansion illustration. | *"We enter Blackwood Manor on October 14, 1922. Lady Eleanor lies dead in her locked study, and the grandfather clock has chimed an impossible thirteenth strike at midnight."* | Ward Candle at 100%, Sanity at 100%, Turn 1. |
| **00:20 – 00:32** | **AI Character Interview**<br>Click Arthur Briggs (The Caretaker). Type: *"Arthur, who altered the grandfather clock mechanism?"* Hit Send. Local model `qwen3:4b` synthesizes in-character response with emotional cue. | *"We interrogate the caretaker. Notice our query is processed locally in under a second by Qwen 3 (4B). Arthur remains in strict Victorian character, guarded, deflecting speculation according to his defined knowledge boundaries."* | Dialogue bubble: *"Arthur Briggs (Guarded): 'Aye, stranger... someone filed down the stop pin...'"* |
| **00:32 – 00:44** | **Discover & Present Clue**<br>Click Astronomical Clock POI -> Reveals `clue_thirteenth_chime`. Select **"Present Evidence"** -> Present clockwork to Arthur. | *"We examine the clock hotspot to authoritatively discover Exhibit C-1. When we present the filed escapement to Arthur, his trust metric surges from 40 to 55, unlocking new testimony and access to the locked Conservatory."* | Trust delta: `+15 Trust`. Notification: `New Topic Unlocked: The Potting Shed Theft`. |
| **00:44 – 00:55** | **Evidence Board Deductive Linkage**<br>Switch to the **Evidence Board**. Drag deductive string between `clue_silver_flask` and `clue_arsenic_vial`. Click **Connect**. | *"On our interactive evidence board, we connect the cordial flask to the arsenic vial. The authoritative Python engine validates the forensic match, rejecting any illogical connections."* | Red string connects clues: `Toxicity Match: Arsenic Trioxide`. |
| **00:55 – 01:05** | **Consequential Choice & Accusation**<br>Open Accusation Matrix. Select Lord Julian Blackwood as Culprit, Silver Flask as Weapon, Burned Will as Motive, with 3 supporting exhibits. Submit Indictment. | *"Armed with forensic proof, motive, and broken alibis, we deliver our formal accusation. The deterministic mystery engine evaluates our evidence against the ground truth."* | Ending Screen: **True Restitution (Rank S — Master Occult Detective)**. Epilogue scroll. |
| **01:05 – 01:15** | **Offline & Privacy Demonstration**<br>Show Windows Network settings disconnected (airplane mode). Highlight terminal showing zero external network calls. | *"The entire case was investigated, deduced, and solved without sending a single byte over the internet. No subscriptions, no cloud latency, complete privacy. Welcome to Séance Studio."* | Repository link: `github.com/<username>/seance-studio` • MIT License. |

---

## Screen Recording Checklist

1. [ ] Ollama is running with `qwen3:4b` pre-loaded (`ollama run qwen3:4b "Ready"` in background).
2. [ ] Database has been migrated (`alembic upgrade head`).
3. [ ] Browser is set to 100% zoom with dark mode enabled.
4. [ ] Windows notifications and background sounds are muted.
5. [ ] Microphone audio is leveled for clear, crisp narration.

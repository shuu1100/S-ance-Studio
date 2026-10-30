# Séance Studio — Gameplay & Investigation Guide

**Case Title:** *Blackwood Manor: The Thirteenth Chime*  
**Era:** October 14, 1922 • Barmouth Coast, Wales  
**Player Role:** Court-Appointed Occult Inquisitor  

---

## 1. Case Synopsis & Objective

At midnight during a violent coastal tempest, matriarch Lady Eleanor Blackwood was found dead inside her locked study, an empty silver flask fallen beside her hand. Moments later, the foyer's grandfather clock struck an impossible thirteenth chime and ceased ticking at exactly 12:13 AM.

As Madame Vane convenes a circle of ward candles in the Séance Parlor, you must interview the living, commune with the dead, gather forensic evidence, and name the culprit before the ward candle melts to ash.

---

## 2. Core Meters & Mechanics

- **Ward Candle (%):** Melts with every investigation action and interrogation turn (30 turns maximum). If the candle burns out, the spiritual circle breaks.
- **Player Sanity (0–100):** Depletes when witnessing horrific spectral manifestations or pursuing dangerous occult rituals. Dropping to 0 triggers madness and defeat.
- **Ectoplasmic Tension (0–100):** Escalates when confronting spirits or presenting accusatory evidence. High tension alters room ambiance and suspect reactions.

---

## 3. Characters & Suspects

| Character | Role & Persona | Location | Key Interaction |
| :--- | :--- | :--- | :--- |
| **Arthur Briggs** | Stoic, observant Manor Caretaker (35 yrs service). Suspicious of psychics. | Grand Foyer | Knows clock mechanics; noticed rat poison missing from his potting bench. |
| **Victoria Blackwood** | Intellectual, conflicted daughter. Deep grief and family loyalty. | Grand Foyer / Parlor | Recovered Eleanor's burned will from the fireplace; holds Father's crypt key. |
| **Madame Vane** | Renowned London spiritualist medium; maintains ward circle. | Séance Parlor | Facilitates spirit communion; senses paranormal fluctuations. |
| **Lady Eleanor's Apparition** | Restless spirit of the murdered matriarch. | Séance Parlor | Recalls the bitter almond taste in her cordial nightcap. |
| **Lord Julian Blackwood** | Extravagant nephew crushed by London gambling debts. | Corridor / Study | Prime suspect; fled the manor shortly after the thirteenth chime. |

---

## 4. Mansion Locations & Unlock Conditions

```
[The Iron Conservatory] (Locked)
       ^ (Requires Silver Flask + Caretaker Trust >= 50)
       |
[The Grand Foyer] <---------> [The Séance Parlor] (Spirit Table)
       |
       v (Requires Burned Will + Caretaker Trust >= 40)
[Library of Whispers] (Locked Crime Scene)
       |
       v (Requires Torn Velvet + Brass Crypt Key from Victoria)
[The Vaulted Crypt] (Locked Sub-level Cellar)
```

---

## 5. The Six Clues & Evidence Trail

1. **`clue_thirteenth_chime` (Astronomical Clock Mechanism):**
   - *Location:* The Grand Foyer (`hs_clock`)
   - *Description:* Brass escapement gear and count-wheel stop pin filed down with a jeweler's rasp to force an impossible 13th strike.
2. **`clue_burned_will` (Charred Testament Scrap):**
   - *Location:* The Grand Foyer Hearth (`hs_hearth`)
   - *Description:* Will fragment disinheriting Julian Blackwood due to Mayfair debts.
3. **`clue_silver_flask` (Lady Eleanor's Nightcap Flask):**
   - *Location:* Library of Whispers (`hs_armchair`)
   - *Description:* Empty flask smelling strongly of bitter valerian cordial and potassium cyanide.
4. **`clue_torn_velvet` (Crimson Velvet Fabric Shred):**
   - *Location:* Library Threshold Plate (`hs_threshold`)
   - *Description:* Fabric snagged on lock plate matching Lord Julian's crimson evening coat.
5. **`clue_arsenic_vial` (Amber Apothecary Bottle):**
   - *Location:* Iron Conservatory (`hs_botanicals`)
   - *Description:* 4-oz bottle of rat-eradicating arsenic taken from the potting bench.
6. **`clue_crypt_journal` (Poison Transaction Ledger):**
   - *Location:* Vaulted Crypt (`hs_barrel_rack`)
   - *Description:* Julian's private ledger detailing clandestine poison purchases from London apothecaries.

---

## 6. Evidence Board Deductions (String Connections)

On the interactive **Evidence Board**, link discovered clues to establish formal deductive correlations:

- **Weapon Correlation:** Link `clue_silver_flask` + `clue_arsenic_vial`  
  *Outcome: Matches the poison residue in Eleanor's nightcap to the potting shed poison.*
- **Financial Motive:** Link `clue_burned_will` + `clue_silver_flask`  
  *Outcome: Confirms Eleanor disinherited Julian hours before she was poisoned.*
- **Alibi Fabrication:** Link `clue_thirteenth_chime` + `clue_torn_velvet`  
  *Outcome: Proves the clock was rigged to create an alibi while Julian broke into the study.*
- **Physical Linkage:** Link `clue_torn_velvet` + `clue_crypt_journal`  
  *Outcome: Correlates Julian's presence at the crime scene with the secret cellar poison stash.*

---

## 7. The Three Possible Endings

At any time, enter the **Accusation Matrix** to deliver your formal deductive indictment:

### Ending 1: True Restitution (`END_TRUE_RESTITUTION`) — Rank S
- **Requirements:**
  - Suspect: **Lord Julian Blackwood**
  - Weapon: **Silver Cordial Flask** (or **Arsenic Vial**)
  - Motive: **Burned Will**
  - Supporting Clues: **Clockwork Chime**, **Arsenic Vial**, **Crypt Ledger**
- **Verdict:** Exemplary Victory. Julian is apprehended with undeniable forensic proof; Victoria inherits and preserves the estate; Eleanor's spirit departs in peace.

### Ending 2: Tragic Coverup (`END_TRAGIC_COVERUP`) — Rank B
- **Requirements:** Julian is correctly accused, but without securing the poison ledger or complete witness testimony.
- **Verdict:** Hollow Victory. Julian escapes through Mayfair connections; the Blackwood legacy is tarnished by lingering scandal.

### Ending 3: Spectral Wrath (`END_SPECTRAL_WRATH`) — Rank F
- **Triggered By:** Accusing an innocent party (Arthur or Victoria), OR allowing Player Sanity to drop to 0.
- **Verdict:** Catastrophic Failure. Supernatural fury consumes the manor; the investigator succumbs to the spectral storm.

# Blackwood Manor: The Thirteenth Chime
## Complete Playthrough & Investigation Walkthrough

This guide provides definitive, step-by-step investigation procedures for all three branching outcomes in *"Blackwood Manor: The Thirteenth Chime"*.

---

## Game Mechanics & Investigation Principles

1. **The Ward Candle**: You begin with 100% candle wax (approximately 30 turns before the protective circle collapses). Every inspection, dialogue exchange, or evidence presentation consumes wax. Manage your turns wisely.
2. **Player Sanity**: Starts at 100%. Communing with spirits or encountering distressing revelations inflicts subtle sanity decay. If sanity reaches 0, the investigator succumbs to madness.
3. **Character Trust**: Each character has a trust meter (0–100%). Unlocking key testimonies and cooperation requires building trust by presenting corroborating physical evidence or asking sensitive questions at the right moment.
4. **Deterministic Unlocks**: The mystery engine enforces strict prerequisites. Locations and clues cannot be accessed until their logical dependencies are satisfied.

---

## Playthrough 1: The Truth Revealed (Rank S — Exemplary Victory)

> **Ending**: `END_TRUE_RESTITUTION`
> **Rating**: Master Occult Detective (Rank S)
> **Goal**: Uncover the complete premeditated conspiracy, locate the hidden poison ledger in the crypt, secure the trust of Arthur and Victoria, lay Eleanor's spirit to rest, and convict Lord Julian.

### Step-by-Step Investigation Route:

#### Phase A: The Foyer & Crime Scene Access (Turns 1–4)
1. **Action: Inspect Grand Foyer Hearth**
   - *Target*: `hs_hearth` (Marble Fireplace)
   - *Result*: Discovers **Charred Will Fragment & Torn Letter** (`clue_burned_will`).
   - *Deductive Value*: Proves Lady Eleanor disinherited Julian on the morning of her death.
2. **Action: Inspect Astronomical Clock**
   - *Target*: `hs_clock` (Astronomical Clock)
   - *Result*: Discovers **Stopped Grandfather Clock & Tampered Escapement** (`clue_thirteenth_chime`).
   - *Deductive Value*: Reveals file marks on the escapement gear; the clock was deliberately altered to strike thirteen.
3. **Dialogue: Present Clockwork to Arthur Briggs**
   - *Character*: `char_caretaker` (Arthur Briggs)
   - *Presented Clue*: `clue_thirteenth_chime`
   - *Result*: Arthur's trust increases (+15 to 55%). Arthur admits Julian had a jeweler's file and asked about the chime mechanics.
4. **Action: Access Crime Scene (Library of Whispers)**
   - *Prerequisite*: Arthur's trust $\ge 40$ and `clue_burned_will` discovered.
   - *Result*: The heavy oak door to `room_library` is unlocked.

#### Phase B: The Crime Scene & The Missing Poison (Turns 5–9)
5. **Action: Inspect Eleanor's Armchair**
   - *Target*: `hs_armchair` (Library of Whispers)
   - *Result*: Discovers **Silver Cordial Flask & Phonograph Transcript** (`clue_silver_flask`).
   - *Deductive Value*: Murder weapon confirmed; residue tests positive for arsenic trioxide.
6. **Action: Inspect Door Threshold**
   - *Target*: `hs_threshold` (Library Lock Plate)
   - *Result*: Discovers **Torn Crimson Velvet Shred & Brass Crypt Key** (`clue_torn_velvet`).
   - *Deductive Value*: Snagged fabric thread matching Julian's evening smoking jacket.
7. **Dialogue: Present Burned Will to Victoria Blackwood**
   - *Character*: `char_daughter` (Victoria Blackwood)
   - *Presented Clue*: `clue_burned_will`
   - *Result*: Victoria's trust increases (+20 to 55%). Victoria confesses she pulled the burning will from the hearth after confronting Julian.
8. **Dialogue: Present Torn Velvet to Victoria**
   - *Character*: `char_daughter`
   - *Presented Clue*: `clue_torn_velvet`
   - *Result*: Victoria's trust reaches 70%. She gives you her father's heavy brass crypt key (`has_crypt_key = true`) and reveals Julian hid his private transactions behind barrel rack 12 in the crypt.
9. **Dialogue: Present Silver Flask to Arthur Briggs**
   - *Character*: `char_caretaker`
   - *Presented Clue*: `clue_silver_flask`
   - *Result*: Arthur's trust reaches 60%. Arthur admits he saw Julian carrying the cordial tray to Eleanor's study. The Iron Conservatory unlocks.

#### Phase C: The Poison Trail & The Crypt Vaults (Turns 10–14)
10. **Action: Search Iron Conservatory**
    - *Target*: `hs_botanicals` (Aconite Bed & Planters)
    - *Result*: Discovers **Amber Apothecary Vial & Marked Potting Plan** (`clue_arsenic_vial`).
    - *Deductive Value*: Source of the arsenic identified; matches Arthur's missing rat poison.
11. **Dialogue: Present Arsenic Vial to Arthur Briggs**
    - *Character*: `char_caretaker`
    - *Presented Clue*: `clue_arsenic_vial`
    - *Result*: Arthur's trust reaches 75%. Arthur breaks his silence, admitting Julian threatened him with eviction to conceal the shed break-in.
12. **Action: Unlock & Enter Vaulted Crypt Cellar**
    - *Location*: `room_cellar`
    - *Prerequisites*: `has_crypt_key = true`, Victoria trust $\ge 60$.
13. **Action: Search Barrel Rack 12**
    - *Target*: `hs_barrel_rack` (Vaulted Crypt Cellar)
    - *Result*: Discovers **Alchemist's Poison Ledger & Hidden Diary** (`clue_crypt_journal`).
    - *Deductive Value*: The smoking gun. Julian's handwriting logs his debts, forged codicil plans, and the deliberate timing of the thirteenth chime.
14. **Dialogue: Commune with Lady Eleanor's Apparition**
    - *Character*: `char_apparition` (Séance Parlor)
    - *Presented Clue*: `clue_crypt_journal`
    - *Result*: Apparition trust reaches 75%. Eleanor recognizes the handwriting; the spectral atmosphere calms, and her spirit prepares for peaceful ascension.

#### Phase D: The Final Accusation Matrix (Turn 15)
15. **Action: Deliver Inquest Verdict**
    - **Suspect**: `Lord Julian Blackwood` (`char_julian`)
    - **Weapon**: `Silver Cordial Flask` (`clue_silver_flask`)
    - **Motive**: `Charred Will Fragment` (`clue_burned_will`)
    - **Supporting Clues**:
      1. `Stopped Grandfather Clock` (`clue_thirteenth_chime`)
      2. `Amber Apothecary Vial` (`clue_arsenic_vial`)
      3. `Alchemist's Poison Ledger` (`clue_crypt_journal`)
    - **Outcome**: `END_TRUE_RESTITUTION` (Exemplary Victory — Rank S).
    - **Epilogue**: Julian is convicted at the Old Bailey; Victoria restores Blackwood Manor; Arthur is made estate bailiff with full pension; Eleanor's spirit departs in serene amber light.

---

## Playthrough 2: The Wrong Accusation / Inconclusive Inquest (Rank C — Hollow Victory)

> **Ending**: `END_TRAGIC_COVERUP`
> **Rating**: Inconclusive Inquest (Rank C)
> **Summary**: The player deduces that Julian is guilty, but delivers the accusation prematurely without obtaining the poison ledger from the crypt or securing Arthur's uncoerced testimony.

### Investigation Route:
1. **Inspect Grand Foyer**:
   - Inspect `hs_hearth` to discover `clue_burned_will`.
   - Inspect `hs_clock` to discover `clue_thirteenth_chime`.
2. **Confront Victoria**:
   - Present `clue_burned_will` to Victoria to establish Julian's financial ruin.
3. **Inspect Library**:
   - Gain entry to `room_library` and inspect `hs_armchair` to find `clue_silver_flask`.
4. **Premature Accusation**:
   - *Do not* enter the cellar or retrieve the poison ledger.
   - Deliver accusation naming **Lord Julian Blackwood**, with `clue_silver_flask` and `clue_burned_will`.
5. **Outcome**:
   - Crown magistrate rules the evidence merely circumstantial.
   - Julian flees abroad on the morning steamer with the family funds.
   - Arthur is dismissed in disgrace; Victoria retreats into London obscurity; Eleanor's spirit remains trapped in the cold curtains forever.

---

## Playthrough 3: The Silent House / Spectral Wrath (Rank F — Catastrophic Failure)

> **Ending**: `END_SPECTRAL_WRATH`
> **Rating**: Tragic Miscarriage of Inquest (Rank F)
> **Summary**: The player accuses an innocent person (Arthur Briggs or Victoria Blackwood) or allows the investigator's sanity to collapse to 0.

### Investigation Route A: Accusing Arthur Briggs
1. **Discover Clues**:
   - Find `clue_thirteenth_chime` (Arthur maintains the clock).
   - Find `clue_arsenic_vial` (rat poison came from Arthur's potting shed).
2. **Deliver False Verdict**:
   - Suspect: `Arthur Briggs` (`char_caretaker`)
   - Weapon: `clue_arsenic_vial`
   - Motive: `clue_burned_will`
3. **Outcome**:
   - Lady Eleanor's spirit violently rejects the false condemnation of her loyal caretaker.
   - The ward candle explodes in black flame, shattering every glass pane in the manor and burying the inhabitants in supernatural ruin.

### Investigation Route B: Sanity Collapse (Insanity Defeat)
1. **Repeatedly Provoke the Apparition**:
   - Interrogate `char_apparition` on unwhitelisted topics or repeatedly fail psychic resonance checks until player sanity drops to 0.
2. **Outcome**:
   - Immediate catastrophic trigger of `END_SPECTRAL_WRATH`.
   - The investigator's mind breaks as poltergeist storms consume Blackwood Manor.

---

## Strategy & Investigation Tips

- **Ward Candle Conservation**: Avoid wandering between unlocked rooms without inspecting hotspots. Each room transition and hotspot inspection costs 1 turn (approx. 3.3% wax).
- **Presentation Multipliers**: Presenting key physical evidence to the correct character yields high trust deltas (+15 to +20%), quickly unlocking sensitive topics without wasting turns on idle questions.
- **Evidence Board Connections**: Connect discovered clues on the evidence board early (`silver_flask` $\leftrightarrow$ `arsenic_vial`, `burned_will` $\leftrightarrow$ `silver_flask`) to formalize your deductive hypotheses.
- **Fair Play Guarantee**: The entire solution is self-contained. The killer's identity, access, and motives are fully documented across the six physical artifacts and three witness dialogues.

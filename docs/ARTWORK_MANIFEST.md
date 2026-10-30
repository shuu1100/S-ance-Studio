# Séance Studio — Local Haunted Artwork & Visual Storytelling Manifest

## Overview

The Séance Studio visual storytelling system provides atmospheric, high-fidelity gothic artwork for *Blackwood Manor: The Thirteenth Chime*. The system operates strictly offline, using local files within `frontend/public/assets/` and typed manifest bindings in `frontend/src/lib/assetManifest.ts`.

---

## 1. Directory Structure

All visual assets reside locally inside the Next.js static asset root:

```text
frontend/public/assets/
├── environments/          # Full-scene room and exterior backgrounds (16:9)
│   ├── manor_exterior.jpg # Manor exterior on misty seaside cliffs (841 KB)
│   ├── room_foyer.jpg     # Grand Victorian foyer with astronomical clock (883 KB)
│   ├── room_seance.jpg    # Séance parlor with round mahogany table (818 KB)
│   ├── room_library.jpg   # Two-story library with rolling ladder (802 KB)
│   ├── room_conservatory.jpg # Wrought-iron glasshouse with ferns (995 KB)
│   └── room_cellar.jpg    # Vaulted crypt cellar with wine arches (1,107 KB)
├── characters/            # Cameo portraits & relationship portraits (1:1)
│   ├── char_apparition.jpg# Lady Eleanor Blackwood (restless spirit) (940 KB)
│   ├── char_eleanor.jpg   # Cameo variant of Eleanor (940 KB)
│   ├── char_caretaker.jpg # Arthur Briggs (manor caretaker) (909 KB)
│   ├── char_daughter.jpg  # Victoria Blackwood (estranged daughter) (895 KB)
│   ├── char_julian.jpg    # Lord Julian Blackwood (disinherited nephew) (786 KB)
│   └── char_vane.jpg      # Madame Evangeline Vane (society medium) (919 KB)
├── clues/                 # Forensic evidence illustrations & plates (1:1 / 4:3)
│   ├── clue_silver_flask.jpg # Silver monogrammed cordial flask (805 KB)
│   ├── clue_burned_will.jpg  # [Intentional Fallback Plate: Wax seal & parchment]
│   ├── clue_spectral_whisper.jpg # [Intentional Fallback Plate: Spectral aura]
│   ├── clue_arsenic_vial.jpg # [Intentional Fallback Plate: Parchment forensic tag]
│   ├── clue_torn_velvet.jpg  # [Intentional Fallback Plate: Gothic specimen frame]
│   └── clue_crypt_journal.jpg# [Intentional Fallback Plate: Parchment ledger]
├── story-moments/         # Full-scene dramatic revelations (16:9 / 21:9)
│   ├── moment_thirteenth_chime.jpg # Astronomical clock striking thirteen
│   ├── moment_will_in_flames.jpg   # The burning will in the fireplace
│   └── moment_seance_communion.jpg # Spectral communion at the round table
├── endings/               # Final verdict scene illustrations (16:9 / 21:9)
│   ├── ending_true_restitution.jpg # Exemplary Justice • Dawn over Blackwood
│   ├── ending_tragic_coverup.jpg   # Partial Victory • Escaped in the Fog
│   └── ending_spectral_wrath.jpg   # Catastrophic Defeat • The Manor Cursed
└── ui/                    # Seals, parchment borders, and iconography
```

---

## 2. Asset Specifications & Recommendations

| Category | Recommended Dimensions | Aspect Ratio | Format | Framing & Focal Guide |
| :--- | :--- | :--- | :--- | :--- |
| **Environments** | 1920 × 1080 px | 16:9 | WebP / JPEG (Q85) | Wide horizontal framing; key focal objects centered at 50% X, 45–50% Y. |
| **Characters** | 1024 × 1024 px | 1:1 (Cameo) | WebP / JPEG (Q85) | Head and shoulders centered; eye line at 35% Y; oval vignette rim. |
| **Clues** | 1024 × 1024 px | 1:1 | WebP / JPEG (Q85) | Macro isolated relic upon dark velvet or parchment; focal point at 50% X, 50% Y. |
| **Story Moments**| 1920 × 1080 px | 16:9 or 21:9 | WebP / JPEG (Q85) | Cinematic wide-angle; dramatic light source from candles, moon, or fireplace. |
| **Endings** | 1920 × 1080 px | 16:9 | WebP / JPEG (Q85) | Tonal resolution: cool dawn (justice), misty grey (coverup), virulent purple (wrath). |

---

## 3. Visual Identity & Art Direction

The aesthetic adheres strictly to the Victorian Gothic identity established in the project:

- **Color Palette**:
  - Obsidian Black (`#0a0808` to `#16110e`)
  - Midnight Slate (`#121016`)
  - Deep Burgundy / Crimson (`#8a1f29`, `#450a0a`)
  - Antique Brass & Amber (`#c5a059`, `#dfc282`, `#e29d42`)
  - Aged Parchment (`#ece3cd`, `#d4c8af`)
  - Ectoplasmic Spirit Mist (`#38bdf8`, `#7dd3fc`)
- **Atmosphere**: Soft volumetric fog, flickering tallow candlelight, aged oil glaze, subtle grain, and restrained ornamental brass borders.
- **Strict Motion Constraints**: All components (`StoryMoment`, `EnvironmentScene`, `CharacterPortrait`) strictly respect `prefers-reduced-motion: reduce`.

---

## 4. Intentional Fallback Design System

Per the project specification:
> *"Do not create fake image files or use broken placeholder URLs. If artwork is missing, display an intentional fallback design."*

The visual engine provides four dedicated Victorian fallback styles implemented in pure CSS and SVG:

1. **`victorian_cameo`**: An ornamental brass cameo oval with character-specific silhouette profiles, spirit pulse glow, and heraldic emblems.
2. **`parchment_plate`**: Aged linen parchment with handwritten forensic exhibit headers, wax seal stamp, and verified case markers.
3. **`wax_seal`**: Crimson and brass lacquer seal with embossed Blackwood crest (§) and dark vignette border.
4. **`gothic_frame`**: Iron arch tracery with candlelight illumination and embossed brass labeling.
5. **`spectral_aura`**: Pulsing spirit board circle with planchette resonance and luminescent cyan runes.

---

## 5. Strict Clue Confidentiality Protocol

To prevent spoilers, `ClueArtwork` enforces **strict forensic confidentiality**:
- Undiscovered clues (`clue.status === "undiscovered"`) **never** render their image path, image element, or descriptive text.
- Instead, a sealed silhouette with a padlock icon and `[Concealed Forensic Exhibit]` label is rendered.
- Clue artwork is revealed only after the authoritative game engine updates `clue.status` to `revealed`, `hinted`, or `verified`.

---

## 6. Asset Generation Prompts

For future artwork additions, the following prompts guarantee visual consistency with the existing local assets:

### Environments
- **`manor_exterior`**:
  `Victorian gothic manor house perched precariously on sheer dark sea cliffs at twilight, heavy sea mist swirling around weathered granite gargoyles, tall arched windows dimly lit by yellow candlelight, dark crashing waves below, moody oil painting style, cinematic composition, photorealistic texture.`
- **`room_foyer`**:
  `Grand gothic manor entrance hall, soaring arched stone ceiling, monumental astronomical grandfather clock with brass zodiac dials, sweeping mahogany double staircase, dark checkered marble floor, tall mullioned windows with moonlight and rain streaks, atmospheric oil painting style.`
- **`room_seance`**:
  `Victorian occult parlor room at midnight, heavy plum velvet drapes, circular mahogany table with carved wooden planchette, silver candelabra with flickering tallow candles, antique spirit trumpet and tarot cards, eerie cold mist pooling on Persian rug, dark academic oil painting.`
- **`room_library`**:
  `Two-story Victorian gothic library, soaring dark walnut bookshelves packed with leather-bound occult tomes, brass rolling ladder, green banker's desk lamp, leather wingback armchair beside a carved stone fireplace with glowing embers, moody oil painting.`
- **`room_conservatory`**:
  `Overgrown Victorian wrought-iron conservatory at night, glass dome ceiling streaked with rain and moonlight, towering exotic ferns and weeping fig trees, stone fountain with cracked basin, rusty gardening shears on potting bench, atmospheric misty greenhouse.`
- **`room_cellar`**:
  `Gothic vaulted stone crypt cellar under Victorian manor, damp moss on stone arches, iron-banded wine barrels, heavy rusted iron gate leading into shadowy catacombs, flickering wall torch casting deep shadows, puddle on cobblestone floor, cinematic oil painting.`

### Characters (Cameo Portraits)
- **`char_apparition`**:
  `Victorian cameo oil portrait of Lady Eleanor Blackwood, ethereal ghost woman draped in sheer black lace mourning veil, translucent pale skin, sorrowful glowing blue eyes, faint silver aura, dark oval frame, classic oil portrait style.`
- **`char_caretaker`**:
  `Victorian oil portrait of Arthur Briggs, stern 60-year-old manor caretaker, weathered rugged face, thick mutton chops, holding an antique brass key ring, wearing a worn tweed waistcoat and heavy wool overcoat, dark atmospheric background, oval portrait framing.`
- **`char_daughter`**:
  `Victorian Edwardian oil portrait of Victoria Blackwood, 28-year-old estranged daughter, sharp intelligent gaze, dark hair in intricate braided bun, high-collar dark wool traveling coat with jet bead brooch, subtle defiant posture, oil painting, cameo style.`
- **`char_julian`**:
  `Victorian oil portrait of Lord Julian Blackwood, handsome 32-year-old aristocrat with anxious arrogant expression, slicked dark hair, wearing a rich crimson velvet smoking jacket and silk cravat, gold signet ring on finger, dark background, oil painting portrait.`
- **`char_vane`**:
  `Victorian oil portrait of Madame Evangeline Vane, mysterious 45-year-old spiritualist medium, dark penetrating eyes, wearing an ornate amethyst-colored velvet turban with peacock feather brooch and beaded shawls, holding a crystal pendulum, oil portrait style.`

### Clues
- **`clue_silver_flask`**:
  `Victorian engraved silver pocket flask lying on dark green velvet, ornate monogram "EB" engraved on the front, faint crystal residue of white powder around the screw top, macro photography, dramatic chiaroscuro candle lighting.`
- **`clue_burned_will`**:
  `Partially burned Victorian parchment document resting in marble fireplace ash, charred jagged edges, elegant black calligraphy showing "Last Will and Testament of Eleanor Blackwood... bequeath entire estate to Victoria...", dark moody lighting.`
- **`clue_spectral_whisper`**:
  `Victorian reel-to-reel early cylinder phonograph recorder on mahogany table, brass horn speaker, eerie faint ectoplasmic smoke wafting from the speaker horn, dark parlor background, dramatic lighting.`
- **`clue_arsenic_vial`**:
  `Small amber apothecary glass bottle with ribbed glass, weathered paper label reading "Arsenic Trioxide - Rat Eradicator", cork stopper tied with hemp string, resting on moist soil in conservatory terracotta pot.`
- **`clue_torn_velvet`**:
  `Macro photograph of a scrap of crimson silk velvet caught on an antique heavy brass skeleton key, resting on dusty stone cellar steps, dramatic side lighting.`
- **`clue_crypt_journal`**:
  `Antique small leather-bound diary with brass lock clasp, cracked spine, embossed with Blackwood family crest, yellowed parchment pages with Latin notes, lying on dusty stone altar.`

---

## 7. Licensing & Offline Verification Statement

1. **Strictly Local**: Zero external CDNs, cloud image endpoints, or dynamic fetch requests exist in the visual system.
2. **Original Artwork**: Assets were generated locally using project AI image tools and stored in `public/assets/`.
3. **Graceful Fallback**: Any missing image displays an intentional, styled Victorian SVG/CSS plate without console errors or broken link icons.
4. **Offline Resilience**: The entire visual experience is self-contained and functions seamlessly in airplane/offline mode.

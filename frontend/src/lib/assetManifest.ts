import { AssetManifestEntry, VisualVariant } from "../types/assets";

/**
 * Authoritative asset manifest for Séance Studio.
 * Maps stable scenario identifiers to local offline asset files.
 * Strictly adheres to offline-first principles (no remote URLs or cloud CDN dependencies).
 */
export const ASSET_MANIFEST: Record<string, AssetManifestEntry> = {
  // ==========================================
  // Environments / Rooms
  // ==========================================
  manor_exterior: {
    id: "manor_exterior",
    category: "environment",
    localPath: "/assets/environments/manor_exterior.jpg",
    altText: "Blackwood Manor perched on rugged Welsh coastal cliffs during a thunderstorm at midnight.",
    caption: "Blackwood Manor • October 1922",
    focalPoint: { x: 50, y: 40 },
    fallbackStyle: "atmospheric_room",
    themeColor: "#1c2438",
    isAvailableLocally: true,
  },
  room_foyer: {
    id: "room_foyer",
    category: "environment",
    localPath: "/assets/environments/room_foyer.jpg",
    altText: "The Grand Foyer of Blackwood Manor featuring a towering astronomical clock and sweeping mahogany staircase.",
    caption: "The Grand Foyer • Central Hall",
    focalPoint: { x: 50, y: 50 },
    fallbackStyle: "atmospheric_room",
    themeColor: "#3a2a1a",
    isAvailableLocally: true,
  },
  room_seance: {
    id: "room_seance",
    category: "environment",
    localPath: "/assets/environments/room_seance.jpg",
    altText: "The Séance Parlor draped in velvet with a spirit planchette table, ward candles, and occult circle.",
    caption: "The Séance Parlor • East Wing",
    focalPoint: { x: 50, y: 55 },
    fallbackStyle: "atmospheric_room",
    themeColor: "#2f1c3a",
    isAvailableLocally: true,
  },
  room_library: {
    id: "room_library",
    category: "environment",
    localPath: "/assets/environments/room_library.jpg",
    altText: "The Library of Whispers crime scene with towering oak bookshelves, wingback armchair, and dictation phonograph.",
    caption: "Library of Whispers • Crime Scene",
    focalPoint: { x: 45, y: 60 },
    fallbackStyle: "atmospheric_room",
    themeColor: "#241812",
    isAvailableLocally: true,
  },
  room_conservatory: {
    id: "room_conservatory",
    category: "environment",
    localPath: "/assets/environments/room_conservatory.jpg",
    altText: "The Iron Conservatory pavilion filled with aconite plants and rain-slicked curved glass panels.",
    caption: "The Iron Conservatory • South Pavilion",
    focalPoint: { x: 50, y: 50 },
    fallbackStyle: "atmospheric_room",
    themeColor: "#12261f",
    isAvailableLocally: true,
  },
  room_cellar: {
    id: "room_cellar",
    category: "environment",
    localPath: "/assets/environments/room_cellar.jpg",
    altText: "The Vaulted Crypt Cellar with stone arches, vintage port barrels, and padlocked iron catacomb gate.",
    caption: "The Vaulted Crypt Cellar • Sub-level Vaults",
    focalPoint: { x: 50, y: 45 },
    fallbackStyle: "atmospheric_room",
    themeColor: "#1e1e1e",
    isAvailableLocally: true,
  },

  // ==========================================
  // Characters
  // ==========================================
  char_apparition: {
    id: "char_apparition",
    category: "character",
    localPath: "/assets/characters/char_apparition.jpg",
    altText: "Victorian cameo oil portrait of Lady Eleanor Blackwood's spirit draped in lace mourning veil with silver aura.",
    caption: "Lady Eleanor Blackwood • Restless Spirit",
    focalPoint: { x: 50, y: 35 },
    variants: {
      spectral: "/assets/characters/char_apparition.jpg",
      restless: "/assets/characters/char_apparition.jpg",
    },
    fallbackStyle: "victorian_cameo",
    themeColor: "#38bdf8",
    isAvailableLocally: true,
  },
  char_eleanor: {
    id: "char_eleanor",
    category: "character",
    localPath: "/assets/characters/char_eleanor.jpg",
    altText: "Cameo portrait of Lady Eleanor Blackwood in lace mourning veil.",
    caption: "Lady Eleanor Blackwood • Matriarch",
    focalPoint: { x: 50, y: 35 },
    fallbackStyle: "victorian_cameo",
    themeColor: "#38bdf8",
    isAvailableLocally: true,
  },
  char_caretaker: {
    id: "char_caretaker",
    category: "character",
    localPath: "/assets/characters/char_caretaker.jpg",
    altText: "Stern Victorian oil portrait of Arthur Briggs, manor caretaker, holding a brass key and lantern.",
    caption: "Arthur Briggs • Manor Caretaker",
    focalPoint: { x: 50, y: 32 },
    fallbackStyle: "victorian_cameo",
    themeColor: "#c5a059",
    isAvailableLocally: true,
  },
  char_daughter: {
    id: "char_daughter",
    category: "character",
    localPath: "/assets/characters/char_daughter.jpg",
    altText: "Victorian Edwardian oil portrait of Victoria Blackwood with braided hair, high-collar black lace coat, and antique locket.",
    caption: "Victoria Blackwood • Estranged Daughter",
    focalPoint: { x: 50, y: 35 },
    fallbackStyle: "victorian_cameo",
    themeColor: "#8a1f29",
    isAvailableLocally: true,
  },
  char_julian: {
    id: "char_julian",
    category: "character",
    localPath: "/assets/characters/char_julian.jpg",
    altText: "Victorian oil portrait of Lord Julian Blackwood in a rich crimson velvet smoking jacket with gold onyx signet ring.",
    caption: "Lord Julian Blackwood • Disinherited Nephew",
    focalPoint: { x: 50, y: 32 },
    fallbackStyle: "victorian_cameo",
    themeColor: "#8a1f29",
    isAvailableLocally: true,
  },
  char_vane: {
    id: "char_vane",
    category: "character",
    localPath: "/assets/characters/char_vane.jpg",
    altText: "Oil portrait of Madame Vane, spiritualist medium, in embroidered dark violet headscarf holding a silver bell.",
    caption: "Madame Vane • Trance Medium",
    focalPoint: { x: 50, y: 35 },
    fallbackStyle: "victorian_cameo",
    themeColor: "#a855f7",
    isAvailableLocally: true,
  },
  char_finch: {
    id: "char_finch",
    category: "character",
    localPath: "/assets/characters/char_finch.jpg",
    altText: "Cameo portrait of Dr. Alistair Finch with round wire spectacles and scholarly doctor coat.",
    caption: "Dr. Alistair Finch • Family Physician",
    focalPoint: { x: 50, y: 35 },
    fallbackStyle: "victorian_cameo",
    themeColor: "#dfc282",
    isAvailableLocally: false, // Intentional fallback design
  },

  // ==========================================
  // Clues & Forensic Exhibits
  // ==========================================
  clue_silver_flask: {
    id: "clue_silver_flask",
    category: "clue",
    localPath: "/assets/clues/clue_silver_flask.jpg",
    altText: "Sterling silver pocket cordial flask with poison residue crystals beside an antique wax phonograph cylinder.",
    caption: "Exhibit A-1 • Silver Cordial Flask",
    focalPoint: { x: 50, y: 50 },
    fallbackStyle: "parchment_plate",
    themeColor: "#6da3a1",
    isAvailableLocally: true,
  },
  clue_burned_will: {
    id: "clue_burned_will",
    category: "clue",
    localPath: "/assets/clues/clue_burned_will.jpg",
    altText: "Charred fragment of legal will parchment with singed edges and solicitor red wax seal.",
    caption: "Exhibit B-3 • Charred Will Fragment",
    focalPoint: { x: 50, y: 50 },
    fallbackStyle: "wax_seal",
    themeColor: "#8a1f29",
    isAvailableLocally: false, // Intentional fallback design
  },
  clue_thirteenth_chime: {
    id: "clue_thirteenth_chime",
    category: "clue",
    localPath: "/assets/clues/clue_thirteenth_chime.jpg",
    altText: "Filed escapement gear from the stopped astronomical grandfather clock.",
    caption: "Exhibit C-1 • Tampered Clockwork Escapement",
    focalPoint: { x: 50, y: 50 },
    fallbackStyle: "gothic_frame",
    themeColor: "#c5a059",
    isAvailableLocally: false, // Intentional fallback design
  },
  clue_arsenic_vial: {
    id: "clue_arsenic_vial",
    category: "clue",
    localPath: "/assets/clues/clue_arsenic_vial.jpg",
    altText: "Ribbed amber apothecary bottle labeled Rat Eradicator Arsenic Trioxide with marked potting plan.",
    caption: "Exhibit D-2 • Amber Apothecary Vial",
    focalPoint: { x: 50, y: 50 },
    fallbackStyle: "parchment_plate",
    themeColor: "#e29d42",
    isAvailableLocally: false, // Intentional fallback design
  },
  clue_torn_velvet: {
    id: "clue_torn_velvet",
    category: "clue",
    localPath: "/assets/clues/clue_torn_velvet.jpg",
    altText: "Torn crimson velvet thread from Julian's smoking jacket paired with Father's brass crypt key.",
    caption: "Exhibit E-3 • Torn Velvet Shred & Crypt Key",
    focalPoint: { x: 50, y: 50 },
    fallbackStyle: "gothic_frame",
    themeColor: "#8a1f29",
    isAvailableLocally: false, // Intentional fallback design
  },
  clue_crypt_journal: {
    id: "clue_crypt_journal",
    category: "clue",
    localPath: "/assets/clues/clue_crypt_journal.jpg",
    altText: "Leather-bound alchemist poison transaction ledger and hidden diary found in the vaulted crypt.",
    caption: "Exhibit F-4 • Alchemist's Poison Ledger",
    focalPoint: { x: 50, y: 50 },
    fallbackStyle: "parchment_plate",
    themeColor: "#7d7265",
    isAvailableLocally: false, // Intentional fallback design
  },

  // ==========================================
  // Story Moments
  // ==========================================
  moment_thirteenth_chime: {
    id: "moment_thirteenth_chime",
    category: "story-moment",
    localPath: "/assets/story-moments/moment_thirteenth_chime.jpg",
    altText: "The astronomical grandfather clock striking the impossible thirteenth chime as frost covers the glass.",
    caption: "The Thirteenth Chime Strikes • 12:13 AM",
    focalPoint: { x: 50, y: 40 },
    fallbackStyle: "gothic_frame",
    themeColor: "#38bdf8",
    isAvailableLocally: false,
  },
  moment_will_in_flames: {
    id: "moment_will_in_flames",
    category: "story-moment",
    localPath: "/assets/story-moments/moment_will_in_flames.jpg",
    altText: "Lord Julian casting Lady Eleanor's revised will into the marble hearth while Victoria looks on.",
    caption: "Confrontation in the Foyer • The Burning Will",
    focalPoint: { x: 50, y: 50 },
    fallbackStyle: "wax_seal",
    themeColor: "#e29d42",
    isAvailableLocally: false,
  },
  moment_seance_communion: {
    id: "moment_seance_communion",
    category: "story-moment",
    localPath: "/assets/story-moments/moment_seance_communion.jpg",
    altText: "Lady Eleanor's spectral silhouette descending over the circular séance table in the dark parlor.",
    caption: "Communion with the Departed • The Séance",
    focalPoint: { x: 50, y: 50 },
    fallbackStyle: "spectral_aura",
    themeColor: "#7dd3fc",
    isAvailableLocally: true, // Uses seance parlor artwork as high-res scene
  },

  // ==========================================
  // Endings
  // ==========================================
  END_TRUE_RESTITUTION: {
    id: "END_TRUE_RESTITUTION",
    category: "ending",
    localPath: "/assets/environments/manor_exterior.jpg", // High-res manor at dawn
    altText: "Morning sun breaking over Blackwood Manor cliffs as Scotland Yard constables take Julian away and Eleanor's spirit ascends.",
    caption: "Exemplary Victory • The Spirit Laid to Rest",
    focalPoint: { x: 50, y: 50 },
    fallbackStyle: "gothic_frame",
    themeColor: "#dfc282",
    isAvailableLocally: true,
  },
  END_TRUE_JUSTICE: {
    id: "END_TRUE_JUSTICE",
    category: "ending",
    localPath: "/assets/environments/manor_exterior.jpg",
    altText: "Morning sun breaking over Blackwood Manor cliffs as Scotland Yard constables take Julian away and Eleanor's spirit ascends.",
    caption: "Exemplary Victory • The Spirit Laid to Rest",
    focalPoint: { x: 50, y: 50 },
    fallbackStyle: "gothic_frame",
    themeColor: "#dfc282",
    isAvailableLocally: true,
  },
  END_TRAGIC_COVERUP: {
    id: "END_TRAGIC_COVERUP",
    category: "ending",
    localPath: "/assets/endings/ending_tragic_coverup.jpg",
    altText: "Julian escaping into the dense morning sea fog on a horse carriage while Eleanor's spirit weeps in the curtains.",
    caption: "Partial Victory • Escaped in the Fog",
    focalPoint: { x: 50, y: 50 },
    fallbackStyle: "gothic_frame",
    themeColor: "#8a7f72",
    isAvailableLocally: false,
  },
  END_HOLLOW_ACCUSATION: {
    id: "END_HOLLOW_ACCUSATION",
    category: "ending",
    localPath: "/assets/endings/ending_tragic_coverup.jpg",
    altText: "Hollow accusation outcome scene with mist and shuttered manor windows.",
    caption: "Inconclusive Inquest",
    focalPoint: { x: 50, y: 50 },
    fallbackStyle: "gothic_frame",
    themeColor: "#8a7f72",
    isAvailableLocally: false,
  },
  END_SPECTRAL_WRATH: {
    id: "END_SPECTRAL_WRATH",
    category: "ending",
    localPath: "/assets/endings/ending_spectral_wrath.jpg",
    altText: "Supernatural poltergeist storm shattering the manor windows as the ward candle detonates in black flame.",
    caption: "Catastrophic Defeat • The Manor Cursed",
    focalPoint: { x: 50, y: 50 },
    fallbackStyle: "spectral_aura",
    themeColor: "#8a1f29",
    isAvailableLocally: false,
  },
  END_WRONGFUL_CONVICTION: {
    id: "END_WRONGFUL_CONVICTION",
    category: "ending",
    localPath: "/assets/endings/ending_spectral_wrath.jpg",
    altText: "Wrongful conviction outcome scene with poltergeist storm.",
    caption: "Catastrophic Error • Innocent Condemned",
    focalPoint: { x: 50, y: 50 },
    fallbackStyle: "spectral_aura",
    themeColor: "#8a1f29",
    isAvailableLocally: false,
  },
  END_VESSEL_OF_THE_DAMNED: {
    id: "END_VESSEL_OF_THE_DAMNED",
    category: "ending",
    localPath: "/assets/endings/ending_spectral_wrath.jpg",
    altText: "Psychic collapse as the protective salt circle shatters.",
    caption: "Sanity Broken • Vessel of the Damned",
    focalPoint: { x: 50, y: 50 },
    fallbackStyle: "spectral_aura",
    themeColor: "#8a1f29",
    isAvailableLocally: false,
  },
  END_THE_COLD_DARK: {
    id: "END_THE_COLD_DARK",
    category: "ending",
    localPath: "/assets/endings/ending_spectral_wrath.jpg",
    altText: "Ward candle extinguished in the pitch darkness of Blackwood Manor.",
    caption: "Time Expired • The Cold Dark",
    focalPoint: { x: 50, y: 50 },
    fallbackStyle: "spectral_aura",
    themeColor: "#8a1f29",
    isAvailableLocally: false,
  },
};

/**
 * Retrieve environment scene artwork entry by room identifier.
 */
export function getEnvironmentAsset(roomId: string): AssetManifestEntry {
  if (roomId in ASSET_MANIFEST) {
    return ASSET_MANIFEST[roomId];
  }
  // Default to manor exterior or foyer
  return {
    id: roomId,
    category: "environment",
    localPath: `/assets/environments/${roomId}.jpg`,
    altText: `Atmospheric chamber of ${roomId.replace("room_", "").replace("_", " ")}`,
    caption: "Blackwood Manor Chamber",
    focalPoint: { x: 50, y: 50 },
    fallbackStyle: "atmospheric_room",
    themeColor: "#17110e",
    isAvailableLocally: false,
  };
}

/**
 * Retrieve character portrait entry by character identifier.
 */
export function getCharacterAsset(
  characterId: string,
  variant?: VisualVariant
): AssetManifestEntry {
  // Normalize alias (char_eleanor -> char_apparition)
  const normalizedId =
    characterId === "char_eleanor" ? "char_apparition" : characterId;

  if (normalizedId in ASSET_MANIFEST) {
    const entry = ASSET_MANIFEST[normalizedId];
    if (variant && entry.variants && entry.variants[variant]) {
      return {
        ...entry,
        localPath: entry.variants[variant]!,
      };
    }
    return entry;
  }

  // Graceful fallback manifest entry
  return {
    id: characterId,
    category: "character",
    localPath: `/assets/characters/${characterId}.jpg`,
    altText: `Victorian portrait cameo of ${characterId.replace("char_", "")}`,
    caption: "Household Member",
    focalPoint: { x: 50, y: 35 },
    fallbackStyle: "victorian_cameo",
    themeColor: "#c5a059",
    isAvailableLocally: false,
  };
}

/**
 * Retrieve clue artwork entry by clue identifier.
 */
export function getClueAsset(
  clueId: string,
  _variant?: VisualVariant
): AssetManifestEntry {
  if (clueId in ASSET_MANIFEST) {
    return ASSET_MANIFEST[clueId];
  }
  return {
    id: clueId,
    category: "clue",
    localPath: `/assets/clues/${clueId}.jpg`,
    altText: `Forensic exhibit ${clueId.replace("clue_", "").replace("_", " ")}`,
    caption: "Evidence Exhibit",
    focalPoint: { x: 50, y: 50 },
    fallbackStyle: "parchment_plate",
    themeColor: "#dfc282",
    isAvailableLocally: false,
  };
}

/**
 * Retrieve ending scene artwork entry by ending identifier.
 */
export function getEndingAsset(endingId: string): AssetManifestEntry {
  if (endingId in ASSET_MANIFEST) {
    return ASSET_MANIFEST[endingId];
  }
  return {
    id: endingId,
    category: "ending",
    localPath: `/assets/endings/${endingId.toLowerCase()}.jpg`,
    altText: `Conclusive inquest verdict scene for ${endingId}`,
    caption: "Case Verdict",
    focalPoint: { x: 50, y: 50 },
    fallbackStyle: "gothic_frame",
    themeColor: "#8a1f29",
    isAvailableLocally: false,
  };
}

/**
 * Retrieve story moment scene artwork by moment identifier.
 */
export function getStoryMomentAsset(momentId: string): AssetManifestEntry {
  if (momentId in ASSET_MANIFEST) {
    return ASSET_MANIFEST[momentId];
  }
  return {
    id: momentId,
    category: "story-moment",
    localPath: `/assets/story-moments/${momentId}.jpg`,
    altText: `Dramatic story revelation moment ${momentId}`,
    caption: "Dramatic Inquest Moment",
    focalPoint: { x: 50, y: 50 },
    fallbackStyle: "gothic_frame",
    themeColor: "#38bdf8",
    isAvailableLocally: false,
  };
}

/**
 * Return all registered manifest entries for testing and auditing.
 */
export function getAllAssetEntries(): AssetManifestEntry[] {
  return Object.values(ASSET_MANIFEST);
}

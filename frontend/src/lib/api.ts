import {
  ApiResponse,
  DialogueMessage,
  Clue,
  Character,
  JournalEntry,
  InvestigationSession,
  EndingOutcome,
  PermittedConnectionRule,
  SuggestedQuestionsData,
  InvestigationTopic,
  Contradiction,
  ContradictionChallengeResult,
  InvestigationObjective,
  InvestigationTheory,
  TheoryEvaluationResult,
} from "../types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://127.0.0.1:8000/api/v1";

export interface ActionPayload {
  actionType: "TALK" | "INSPECT" | "RITUAL" | "ACCUSE";
  targetId: string;
  queryText?: string;
  presentedClueId?: string;
}

export interface ActionResponseData {
  turnNumber: number;
  dialogue?: DialogueMessage;
  unlockedClue?: Clue;
  candlePercentage: number;
  playerSanity: number;
  ectoplasmicTension: number;
  objectiveUpdate?: string;
  gameStatus: "active" | "completed" | "abandoned";
}

export interface AccusationPayload {
  suspectId: string;
  weaponId: string;
  motiveId: string;
  supportingClueIds: string[];
}

export interface BackendHealthResult {
  isOnline: boolean;
  ollamaOnline: boolean;
  textModelAvailable: boolean;
  visionModelAvailable: boolean;
  model: string;
  visionModel: string;
  endpoint: string;
  statusText: "ready" | "ollama_unavailable" | "model_unavailable" | "checking" | "offline";
  actionableMessage?: string;
  latencyMs?: number;
  error?: string;
}

export interface SendMessagePayload {
  characterId: string;
  content: string;
  presentedClueId?: string;
}

export interface InvestigationDetailData {
  session: InvestigationSession;
  characters: Character[];
  clues: Clue[];
  journal: JournalEntry[];
}

// ============================================================================
// Normalization Helpers (Backend Snake/Camel mapping)
// ============================================================================

export function normalizeCharacter(raw: any): Character {
  return {
    id: raw.id,
    name: raw.name,
    title: raw.title || "",
    era: raw.era || "1922",
    type: raw.type as any,
    status: raw.status as any,
    avatarSeed: raw.avatar_seed || raw.avatarSeed || "ghost",
    shortBio: raw.short_bio || raw.shortBio || "",
    secretGrievance: raw.secret_grievance || raw.secretGrievance || "",
    temperament: raw.personality || raw.temperament || "Mysterious",
    trustLevel: raw.trust_level ?? raw.trustLevel ?? 50,
    location: raw.location || "The Grand Foyer",
    isAvailable: raw.is_available ?? raw.isAvailable ?? true,
    knownFacts: raw.known_facts || raw.knownFacts || [],
  };
}

export function normalizeClue(raw: any): Clue {
  return {
    id: raw.id,
    title: raw.title,
    subtitle: raw.subtitle || "",
    category: raw.category,
    status: raw.status,
    description: raw.description,
    locationFound: raw.location_found || raw.locationFound || "Blackwood Manor",
    associatedSuspects: raw.associated_suspects || raw.associatedSuspects || [],
    evidenceMarker: raw.evidence_marker || raw.evidenceMarker,
    discoveredAtTurn: raw.discovered_at_turn ?? raw.discoveredAtTurn,
    isKeyEvidence: raw.is_key_evidence ?? raw.isKeyEvidence ?? false,
  };
}

export function normalizeJournalEntry(raw: any): JournalEntry {
  return {
    id: raw.id,
    title: raw.title,
    date: raw.date || "October 27, 1922",
    category: raw.category as any,
    entryType: (raw.entry_type || raw.entryType || "fact") as any,
    content: raw.content,
    flagged: raw.flagged ?? false,
    turnNumber: raw.turn_number ?? raw.turnNumber,
  };
}

export function normalizeSession(raw: any): InvestigationSession {
  return {
    id: raw.id,
    caseId: raw.case_id || raw.caseId || "case_blackwood_thirteenth_chime",
    caseTitle: raw.case_title || raw.caseTitle || "Blackwood Manor: The Thirteenth Chime",
    difficulty: raw.difficulty || "seasoned",
    currentAct: raw.current_act ?? raw.currentAct ?? 1,
    totalActs: raw.total_acts ?? raw.totalActs ?? 3,
    turnCounter: raw.turn_counter ?? raw.turnCounter ?? 1,
    maxTurns: raw.max_turns ?? raw.maxTurns ?? 30,
    candlePercentage: raw.candle_percentage ?? raw.candlePercentage ?? 100,
    playerSanity: raw.player_sanity ?? raw.playerSanity ?? 100,
    ectoplasmicTension: raw.ectoplasmic_tension ?? raw.ectoplasmicTension ?? 20,
    activeEntityId: raw.active_entity_id || raw.activeEntityId || "char_eleanor",
    currentLocation: raw.current_location || raw.currentLocation || "The Grand Foyer",
    objective: raw.objective || "Investigate the locked study.",
    lastSaved: raw.last_saved || raw.lastSaved || "Just now",
    status: raw.status || "active",
    endingAchieved: raw.ending_achieved || raw.endingAchieved,
    decisionsMade: raw.decisions_made || raw.decisionsMade || [],
  };
}

// ============================================================================
// Health & Diagnostics
// ============================================================================

/**
 * Health check probe to determine if local FastAPI backend & Ollama are responding.
 */
export async function checkBackendHealth(): Promise<BackendHealthResult> {
  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`${API_BASE}/health`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const latency = Date.now() - startTime;
    if (!res.ok) {
      return {
        isOnline: false,
        ollamaOnline: false,
        textModelAvailable: false,
        visionModelAvailable: false,
        model: "Unknown",
        visionModel: "Unknown",
        endpoint: API_BASE,
        statusText: "offline",
        latencyMs: latency,
        error: `Backend returned HTTP status ${res.status}: ${res.statusText}`,
      };
    }

    const json = (await res.json()) as any;
    const d = json.data || json;
    const isOllamaConnected = Boolean(d.ollama_connected);
    const isTextModelAvailable = Boolean(d.text_model_available);
    const isVisionModelAvailable = Boolean(d.vision_model_available);

    let statusText: "ready" | "ollama_unavailable" | "model_unavailable" | "offline" = "ready";
    if (!isOllamaConnected) {
      statusText = "ollama_unavailable";
    } else if (!isTextModelAvailable) {
      statusText = "model_unavailable";
    } else {
      statusText = "ready";
    }

    return {
      isOnline: true,
      ollamaOnline: isOllamaConnected,
      textModelAvailable: isTextModelAvailable,
      visionModelAvailable: isVisionModelAvailable,
      model: d.configured_text_model || d.active_model || "qwen3:4b",
      visionModel: d.vision_model || "qwen3-vl:8b",
      endpoint: API_BASE,
      statusText,
      actionableMessage: d.actionable_message || d.message,
      latencyMs: latency,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      isOnline: false,
      ollamaOnline: false,
      textModelAvailable: false,
      visionModelAvailable: false,
      model: "Offline",
      visionModel: "Offline",
      endpoint: API_BASE,
      statusText: "offline",
      error: `FastAPI service at ${API_BASE} unreachable (${message}). Local development fixtures active.`,
    };
  }
}

// ============================================================================
// Investigation Session Operations
// ============================================================================

/**
 * Retrieve list of all saved investigation sessions in SQLite.
 */
export async function fetchSavedInvestigationsApi(): Promise<{
  success: boolean;
  data?: InvestigationSession[];
  error?: string;
}> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${API_BASE}/investigations`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return { success: false, error: `HTTP ${res.status}: ${res.statusText}` };
    }

    const json = (await res.json()) as ApiResponse<any[]>;
    if (!json.success || !json.data) {
      return { success: false, error: json.error?.message || "Failed to fetch saved investigations." };
    }

    return { success: true, data: json.data.map(normalizeSession) };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

/**
 * Create a new investigation session with authoritative backend state.
 */
export async function createInvestigationApi(
  scenarioId: string = "case_blackwood_thirteenth_chime",
  difficulty: "novice" | "seasoned" | "skeptic" = "seasoned"
): Promise<{
  success: boolean;
  data?: InvestigationSession;
  error?: string;
}> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`${API_BASE}/investigations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenario_id: scenarioId, difficulty }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      return { success: false, error: errJson?.error?.message || `HTTP ${res.status}: ${res.statusText}` };
    }

    const json = (await res.json()) as ApiResponse<any>;
    if (!json.success || !json.data) {
      return { success: false, error: json.error?.message || "Failed to create investigation." };
    }

    return { success: true, data: normalizeSession(json.data) };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

/**
 * Fetch full authoritative detail of an investigation (session, characters, clues, journal).
 */
export async function fetchInvestigationDetailApi(sessionId: string): Promise<{
  success: boolean;
  data?: InvestigationDetailData;
  error?: string;
}> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`${API_BASE}/investigations/${sessionId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      const detail = errJson?.error?.message || errJson?.detail || `HTTP ${res.status}: ${res.statusText}`;
      return { success: false, error: detail };
    }

    const json = (await res.json()) as ApiResponse<any>;
    if (!json.success || !json.data) {
      return { success: false, error: json.error?.message || "Failed to load investigation details." };
    }

    const d = json.data;
    return {
      success: true,
      data: {
        session: normalizeSession(d.session),
        characters: (d.characters || []).map(normalizeCharacter),
        clues: (d.clues || []).map(normalizeClue),
        journal: (d.journal || []).map(normalizeJournalEntry),
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

/**
 * Delete / abandon an investigation session.
 */
export async function deleteInvestigationApi(sessionId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const res = await fetch(`${API_BASE}/investigations/${sessionId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });
    return { success: res.ok };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

/**
 * Safely recover a prematurely completed investigation back to active status.
 */
export async function recoverInvestigationApi(sessionId: string): Promise<{
  success: boolean;
  data?: {
    session: InvestigationSession;
    characters: Character[];
    clues: Clue[];
    journal: JournalEntry[];
  };
  error?: string;
}> {
  try {
    const res = await fetch(`${API_BASE}/investigations/${sessionId}/recover`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const json = (await res.json()) as ApiResponse<any>;

    if (!res.ok || !json.success || !json.data) {
      return { success: false, error: json.error?.message || "Failed to recover investigation." };
    }

    const d = json.data;
    return {
      success: true,
      data: {
        session: normalizeSession(d.session),
        characters: (d.characters || []).map(normalizeCharacter),
        clues: (d.clues || []).map(normalizeClue),
        journal: (d.journal || []).map(normalizeJournalEntry),
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

// ============================================================================
// Dialogue & Interrogation
// ============================================================================

/**
 * Send interrogation message to real local AI provider (qwen3:4b) via FastAPI backend.
 */
export async function sendDialogueMessageApi(
  sessionId: string,
  payload: SendMessagePayload
): Promise<{ success: boolean; data?: DialogueMessage; error?: string; code?: string; sessionStatus?: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 125000);

    const res = await fetch(`${API_BASE}/investigations/${sessionId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        character_id: payload.characterId,
        content: payload.content,
        presented_clue_id: payload.presentedClueId,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      const detail = errJson?.error?.message || errJson?.detail || `HTTP ${res.status}: ${res.statusText}`;
      const code = errJson?.error?.code || (res.status === 404 ? "SESSION_NOT_FOUND" : res.status === 503 ? "OLLAMA_UNAVAILABLE" : `HTTP_${res.status}`);
      const sessionStatus = errJson?.error?.details?.session_status;
      return { success: false, error: detail, code, sessionStatus };
    }

    const response = (await res.json()) as ApiResponse<{
      id: string;
      sender_id: string;
      sender_name: string;
      speaker_type: string;
      text: string;
      emotional_cue?: string;
      atmospheric_effect?: string;
      turn_number: number;
      timestamp: string;
      clue_presented_id?: string;
    }>;

    if (!response.success || !response.data) {
      return {
        success: false,
        error: response.error?.message || "Inference response rejected by game engine.",
        code: response.error?.code || "UNEXPECTED_ERROR",
      };
    }

    const d = response.data;
    const msg: DialogueMessage = {
      id: d.id,
      senderId: d.sender_id,
      senderName: d.sender_name,
      speakerType: d.speaker_type as any,
      text: d.text,
      emotionalCue: d.emotional_cue,
      atmosphericEffect: d.atmospheric_effect,
      turnNumber: d.turn_number,
      timestamp: d.timestamp,
      cluePresentedId: d.clue_presented_id,
    };

    return { success: true, data: msg };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, error: errorMsg };
  }
}

/**
 * Retrieve chronologically ordered dialogue history for an investigation session.
 */
export async function fetchDialogueHistoryApi(sessionId: string): Promise<{
  success: boolean;
  data?: DialogueMessage[];
  error?: string;
}> {
  try {
    const res = await fetch(`${API_BASE}/investigations/${sessionId}/messages`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) return { success: false, error: `HTTP ${res.status}` };
    const json = (await res.json()) as ApiResponse<any[]>;
    if (!json.success || !json.data) return { success: false, error: json.error?.message };

    const messages: DialogueMessage[] = json.data.map((d) => ({
      id: d.id,
      senderId: d.sender_id,
      senderName: d.sender_name,
      speakerType: d.speaker_type as any,
      text: d.text,
      emotionalCue: d.emotional_cue,
      atmosphericEffect: d.atmospheric_effect,
      turnNumber: d.turn_number,
      timestamp: d.timestamp,
      cluePresentedId: d.clue_presented_id,
    }));
    return { success: true, data: messages };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

// ============================================================================
// Actions, Clues & Evidence
// ============================================================================

/**
 * Submit player turn action (INSPECT, TALK, RITUAL, ACCUSE) to authoritative engine.
 */
export async function submitActionApi(
  sessionId: string,
  payload: ActionPayload
): Promise<{ success: boolean; data?: ActionResponseData; error?: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(`${API_BASE}/investigations/${sessionId}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      return { success: false, error: errJson?.error?.message || `HTTP ${res.status}: ${res.statusText}` };
    }

    const response = (await res.json()) as ApiResponse<any>;
    if (!response.success || !response.data) {
      return { success: false, error: response.error?.message || "Action rejected by game engine." };
    }

    const d = response.data;
    const actionData: ActionResponseData = {
      turnNumber: d.turnNumber,
      candlePercentage: d.candlePercentage,
      playerSanity: d.playerSanity,
      ectoplasmicTension: d.ectoplasmicTension,
      objectiveUpdate: d.objectiveUpdate,
      gameStatus: d.gameStatus,
      dialogue: d.dialogue
        ? {
            id: d.dialogue.id,
            senderId: d.dialogue.sender_id,
            senderName: d.dialogue.sender_name,
            speakerType: d.dialogue.speaker_type as any,
            text: d.dialogue.text,
            emotionalCue: d.dialogue.emotional_cue,
            atmosphericEffect: d.dialogue.atmospheric_effect,
            turnNumber: d.dialogue.turn_number,
            timestamp: d.dialogue.timestamp,
            cluePresentedId: d.dialogue.clue_presented_id,
          }
        : undefined,
      unlockedClue: d.unlockedClue ? normalizeClue(d.unlockedClue) : undefined,
    };

    return { success: true, data: actionData };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, error: errorMsg };
  }
}

/**
 * Discover a clue at a location or POI via authoritative backend rules.
 */
export async function discoverClueApi(
  sessionId: string,
  clueId: string,
  method: string = "INSPECTION"
): Promise<{ success: boolean; data?: Clue; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/investigations/${sessionId}/discoveries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clue_id: clueId, discovery_method: method }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      return { success: false, error: errJson?.error?.message || `HTTP ${res.status}: ${res.statusText}` };
    }

    const json = (await res.json()) as ApiResponse<any>;
    if (!json.success || !json.data) {
      return { success: false, error: json.error?.message || "Discovery rejected." };
    }

    return { success: true, data: normalizeClue(json.data) };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

/**
 * Present evidence to a character to elicit testimony.
 */
export async function presentEvidenceApi(
  sessionId: string,
  characterId: string,
  clueId: string
): Promise<{ success: boolean; data?: DialogueMessage; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/investigations/${sessionId}/present-evidence`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ character_id: characterId, clue_id: clueId }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      return { success: false, error: errJson?.error?.message || `HTTP ${res.status}` };
    }

    const json = (await res.json()) as ApiResponse<any>;
    if (!json.success || !json.data) return { success: false, error: json.error?.message };

    const d = json.data;
    const msg: DialogueMessage = {
      id: d.id,
      senderId: d.sender_id,
      senderName: d.sender_name,
      speakerType: d.speaker_type as any,
      text: d.text,
      emotionalCue: d.emotional_cue,
      atmosphericEffect: d.atmospheric_effect,
      turnNumber: d.turn_number,
      timestamp: d.timestamp,
      cluePresentedId: d.clue_presented_id,
    };
    return { success: true, data: msg };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

/**
 * Validate and establish a deductive string connection on the evidence board.
 */
export async function connectCluesApi(
  sessionId: string,
  fromClueId: string,
  toClueId: string
): Promise<{ success: boolean; data?: PermittedConnectionRule; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/investigations/${sessionId}/evidence/connect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from_clue_id: fromClueId, to_clue_id: toClueId }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      return {
        success: false,
        error: errJson?.error?.message || errJson?.detail || `Connection rejected by the mystery engine.`,
      };
    }

    const json = (await res.json()) as ApiResponse<any>;
    if (!json.success || !json.data) return { success: false, error: json.error?.message };

    const d = json.data;
    const rule: PermittedConnectionRule = {
      fromClueId: d.from_clue_id,
      toClueId: d.to_clue_id,
      relationship: d.relationship,
      label: d.label,
      reason: d.reason,
    };
    return { success: true, data: rule };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

/**
 * Retrieve evidence board state (discovered clues and permitted connections).
 */
export async function fetchEvidenceBoardApi(sessionId: string): Promise<{
  success: boolean;
  discoveredClues?: Clue[];
  permittedConnections?: PermittedConnectionRule[];
  error?: string;
}> {
  try {
    const res = await fetch(`${API_BASE}/investigations/${sessionId}/evidence`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) return { success: false, error: `HTTP ${res.status}` };
    const json = (await res.json()) as ApiResponse<any>;
    if (!json.success || !json.data) return { success: false, error: json.error?.message };

    const clues = (json.data.discovered_clues || []).map(normalizeClue);
    const conns: PermittedConnectionRule[] = (json.data.permitted_connections || []).map((c: any) => ({
      fromClueId: c.from_clue_id,
      toClueId: c.to_clue_id,
      relationship: c.relationship,
      label: c.label,
      reason: c.reason,
    }));
    return { success: true, discoveredClues: clues, permittedConnections: conns };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

// ============================================================================
// Journal Notes
// ============================================================================

/**
 * Add a new journal note to the persistent database.
 */
export async function addJournalEntryApi(
  sessionId: string,
  entry: {
    title: string;
    category?: string;
    entry_type: "fact" | "theory";
    content: string;
    flagged?: boolean;
  }
): Promise<{ success: boolean; data?: JournalEntry; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/investigations/${sessionId}/journal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: entry.title,
        category: entry.category || "lead",
        entry_type: entry.entry_type,
        content: entry.content,
        flagged: entry.flagged ?? false,
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      return { success: false, error: errJson?.error?.message || `HTTP ${res.status}` };
    }

    const json = (await res.json()) as ApiResponse<any>;
    if (!json.success || !json.data) return { success: false, error: json.error?.message };

    return { success: true, data: normalizeJournalEntry(json.data) };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

// ============================================================================
// Accusation & Ending Outcome
// ============================================================================

/**
 * Submit formal accusation deduction matrix to authoritative backend engine.
 */
export async function submitAccusationApi(
  sessionId: string,
  payload: AccusationPayload
): Promise<{ success: boolean; data?: EndingOutcome; error?: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(`${API_BASE}/investigations/${sessionId}/accuse`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        suspectId: payload.suspectId,
        weaponId: payload.weaponId,
        motiveId: payload.motiveId,
        supportingClueIds: payload.supportingClueIds,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      return { success: false, error: errJson?.error?.message || `HTTP ${res.status}: ${res.statusText}` };
    }

    const response = (await res.json()) as ApiResponse<any>;
    if (!response.success || !response.data) {
      return { success: false, error: response.error?.message || "Verdict evaluation failed." };
    }

    const d = response.data;
    const outcome: EndingOutcome = {
      id: d.id,
      title: d.title,
      subtitle: d.subtitle,
      verdictType: d.verdict_type || d.verdictType,
      narrative: d.narrative,
      culpritNamed: d.culprit_named || d.culpritNamed,
      evidenceSummary: (d.evidence_summary || d.evidenceSummary || []).map((e: any) => ({
        clueId: e.clue_id || e.clueId,
        title: e.title,
        significance: e.significance,
        verified: e.verified,
      })),
      influentialDecisions: d.influential_decisions || d.influentialDecisions || [],
      sanityScore: d.sanity_score ?? d.sanityScore ?? 80,
      turnsTaken: d.turns_taken ?? d.turnsTaken ?? 1,
      rating: d.rating || "Master Inquisitor",
    };

    return { success: true, data: outcome };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, error: errorMsg };
  }
}

export async function fetchSuggestedInquiriesApi(
  sessionId: string,
  characterId: string,
  topicId?: string
): Promise<{ success: boolean; data?: SuggestedQuestionsData; error?: string }> {
  try {
    const query = new URLSearchParams({ character_id: characterId });
    if (topicId) query.set("topic_id", topicId);

    const res = await fetch(`${API_BASE}/investigations/${sessionId}/suggestions?${query.toString()}`);
    if (!res.ok) {
      return { success: false, error: `HTTP ${res.status}: ${res.statusText}` };
    }
    const json = (await res.json()) as ApiResponse<any>;
    if (!json.success || !json.data) {
      return { success: false, error: json.error?.message || "Failed to fetch suggested inquiries" };
    }

    const d = json.data;
    const questions: SuggestedQuestionsData = {
      characterId: d.character_id,
      characterName: d.character_name,
      trustLevel: d.trust_level,
      activeTopic: d.active_topic,
      questions: (d.questions || []).map((q: any) => ({
        id: q.id,
        text: q.text,
        topicId: q.topic_id,
        topicLabel: q.topic_label,
        characterId: q.character_id,
        unlocked: q.unlocked,
        contextHint: q.context_hint,
      })),
    };
    return { success: true, data: questions };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function fetchInvestigationTopicsApi(
  sessionId: string,
  characterId?: string
): Promise<{ success: boolean; data?: InvestigationTopic[]; error?: string }> {
  try {
    const query = new URLSearchParams();
    if (characterId) query.set("character_id", characterId);

    const url = `${API_BASE}/investigations/${sessionId}/topics${query.toString() ? `?${query.toString()}` : ""}`;
    const res = await fetch(url);
    if (!res.ok) {
      return { success: false, error: `HTTP ${res.status}: ${res.statusText}` };
    }
    const json = (await res.json()) as ApiResponse<any[]>;
    if (!json.success || !json.data) {
      return { success: false, error: json.error?.message || "Failed to fetch topics" };
    }

    const topics: InvestigationTopic[] = json.data.map((t: any) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      category: t.category,
      isUnlocked: t.is_unlocked,
      relevantFacts: t.relevant_facts || [],
      discoveredClues: (t.discovered_clues || []).map((c: any) => ({
        id: c.id,
        title: c.title,
        category: c.category,
        evidenceMarker: c.evidence_marker,
      })),
      availableQuestions: t.available_questions || [],
      unresolvedLead: t.unresolved_lead,
    }));
    return { success: true, data: topics };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function fetchContradictionsApi(
  sessionId: string
): Promise<{ success: boolean; data?: Contradiction[]; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/investigations/${sessionId}/contradictions`);
    if (!res.ok) {
      return { success: false, error: `HTTP ${res.status}: ${res.statusText}` };
    }
    const json = (await res.json()) as ApiResponse<any[]>;
    if (!json.success || !json.data) {
      return { success: false, error: json.error?.message || "Failed to fetch contradictions" };
    }

    const items: Contradiction[] = json.data.map((c: any) => ({
      id: c.id,
      title: c.title,
      targetCharacterId: c.target_character_id,
      targetCharacterName: c.target_character_name,
      statementSummary: c.statement_summary,
      contradictingEvidenceId: c.contradicting_evidence_id,
      contradictingEvidenceTitle: c.contradicting_evidence_title,
      contradictionDetail: c.contradiction_detail,
      isReadyToChallenge: c.is_ready_to_challenge,
      isResolved: c.is_resolved,
      missingEvidence: c.missing_evidence || [],
    }));
    return { success: true, data: items };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function challengeContradictionApi(
  sessionId: string,
  contradictionId: string,
  presentedEvidenceId?: string
): Promise<{ success: boolean; data?: ContradictionChallengeResult; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/investigations/${sessionId}/contradictions/challenge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contradiction_id: contradictionId,
        presented_evidence_id: presentedEvidenceId,
      }),
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      return { success: false, error: errJson?.detail || `HTTP ${res.status}: ${res.statusText}` };
    }
    const json = (await res.json()) as ApiResponse<any>;
    if (!json.success || !json.data) {
      return { success: false, error: json.error?.message || "Contradiction challenge failed" };
    }

    const d = json.data;
    const result: ContradictionChallengeResult = {
      success: d.success,
      characterId: d.character_id,
      characterName: d.character_name,
      dialogue: d.dialogue,
      emotionalCue: d.emotional_cue,
      trustDelta: d.trust_delta,
      newTrust: d.new_trust,
      revealedFact: d.revealed_fact,
      unlockedClueId: d.unlocked_clue_id,
      journalEntryId: d.journal_entry_id,
    };
    return { success: true, data: result };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function fetchObjectivesApi(
  sessionId: string
): Promise<{ success: boolean; data?: InvestigationObjective[]; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/investigations/${sessionId}/objectives`);
    if (!res.ok) {
      return { success: false, error: `HTTP ${res.status}: ${res.statusText}` };
    }
    const json = (await res.json()) as ApiResponse<any[]>;
    if (!json.success || !json.data) {
      return { success: false, error: json.error?.message || "Failed to fetch objectives" };
    }

    const items: InvestigationObjective[] = json.data.map((o: any) => ({
      id: o.id,
      order: o.order,
      title: o.title,
      description: o.description,
      hint: o.hint,
      status: o.status,
      progressPercent: o.progress_percent,
    }));
    return { success: true, data: items };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function evaluateTheoryApi(
  sessionId: string,
  theory: InvestigationTheory
): Promise<{ success: boolean; data?: TheoryEvaluationResult; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/investigations/${sessionId}/theory/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        suspect_id: theory.suspectId,
        weapon_clue_id: theory.weaponClueId,
        motive_clue_id: theory.motiveClueId,
        supporting_clue_ids: theory.supportingClueIds,
        notes: theory.notes,
      }),
    });
    if (!res.ok) {
      return { success: false, error: `HTTP ${res.status}: ${res.statusText}` };
    }
    const json = (await res.json()) as ApiResponse<any>;
    if (!json.success || !json.data) {
      return { success: false, error: json.error?.message || "Failed to evaluate theory" };
    }

    const d = json.data;
    const result: TheoryEvaluationResult = {
      status: d.status,
      consistencyScore: d.consistency_score,
      strengths: d.strengths || [],
      vulnerabilities: d.vulnerabilities || [],
      contradictionsDetected: d.contradictions_detected || [],
      verdictReadiness: d.verdict_readiness,
    };
    return { success: true, data: result };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

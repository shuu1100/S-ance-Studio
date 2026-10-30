export type ScreenId =
  | "title"
  | "setup"
  | "investigations"
  | "mansion"
  | "interview"
  | "evidence"
  | "journal"
  | "settings"
  | "endings";

export type EntityType = "spirit" | "living" | "medium";

export type EntityStatus = "restless" | "evasive" | "calm" | "hostile" | "in_trance";

export interface Character {
  id: string;
  name: string;
  title: string;
  era: string;
  type: EntityType;
  status: EntityStatus;
  avatarSeed: string;
  shortBio: string;
  secretGrievance: string;
  temperament: string;
  trustLevel: number; // 0 to 100
  location: string;
  isAvailable: boolean;
  knownFacts: string[];
}

export type ClueCategory = "physical" | "testimony" | "document" | "paranormal";
export type ClueStatus = "undiscovered" | "hinted" | "revealed" | "contradicted" | "verified";

export interface Clue {
  id: string;
  title: string;
  subtitle: string;
  category: ClueCategory;
  status: ClueStatus;
  description: string;
  locationFound: string;
  associatedSuspects: string[];
  evidenceMarker?: string;
  discoveredAtTurn?: number;
  isKeyEvidence: boolean;
}

export interface DialogueMessage {
  id: string;
  senderId: string;
  senderName: string;
  speakerType: EntityType;
  text: string;
  emotionalCue?: string;
  atmosphericEffect?: string;
  turnNumber: number;
  timestamp: string;
  cluePresentedId?: string;
}

export interface MansionRoom {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  unlocked: boolean;
  presenceDetected: boolean;
  cluesCount: number;
  characterIdsPresent: string[];
  hotspots: {
    id: string;
    label: string;
    inspected: boolean;
    description: string;
    unlocksClueId?: string;
  }[];
}

export interface InvestigationSession {
  id: string;
  caseId: string;
  caseTitle: string;
  difficulty: "novice" | "seasoned" | "skeptic";
  currentAct: number;
  totalActs: number;
  turnCounter: number;
  maxTurns: number;
  candlePercentage: number;
  playerSanity: number;
  ectoplasmicTension: number;
  activeEntityId?: string;
  currentLocation?: string;
  objective: string;
  lastSaved: string;
  status: "active" | "completed" | "abandoned";
  endingAchieved?: string;
  decisionsMade: {
    turn: number;
    decision: string;
    impact: string;
  }[];
}

export interface JournalEntry {
  id: string;
  title: string;
  date: string;
  category: "lead" | "autopsy" | "testimony" | "occult" | "choice";
  entryType: "fact" | "theory";
  content: string;
  flagged: boolean;
  turnNumber?: number;
}

export interface EvidencePin {
  id: string;
  clueId: string;
  x: number; // percentage
  y: number; // percentage
  color: "crimson" | "amber" | "brass" | "cyan";
  pinnedNote?: string;
}

export interface EvidenceConnection {
  id: string;
  fromClueId: string;
  toClueId: string;
  relationship: "contradicts" | "implicates" | "alibi_for" | "weapon_match";
  label: string;
}

export interface PermittedConnectionRule {
  fromClueId: string;
  toClueId: string;
  relationship: "contradicts" | "implicates" | "alibi_for" | "weapon_match";
  label: string;
  reason: string;
}

export interface EndingOutcome {
  id: string;
  title: string;
  subtitle: string;
  verdictType: "exemplary_victory" | "hollow_victory" | "wrongful_conviction" | "insanity_defeat" | "candle_defeat";
  narrative: string;
  culpritNamed: string;
  evidenceSummary: {
    clueId: string;
    title: string;
    significance: string;
    verified: boolean;
  }[];
  influentialDecisions: string[];
  sanityScore: number;
  turnsTaken: number;
  rating: string;
}

export interface OllamaDiagnostic {
  connected: boolean;
  endpoint: string;
  activeModel: string;
  availableModels: string[];
  latencyMs?: number;
  lastChecked: string;
  gpuAcceleration: boolean;
  textModelAvailable?: boolean;
  visionModel?: string;
  visionModelAvailable?: boolean;
  statusText?: string;
  actionableMessage?: string;
  error?: string;
}

export interface NotificationToast {
  id: string;
  type: "clue" | "sanity" | "tension" | "info" | "warning" | "error";
  title: string;
  message: string;
  timestamp: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  } | null;
  timestamp: string;
}

export type InquiryMode =
  | "free_question"
  | "suggested_questions"
  | "investigate_topic"
  | "present_evidence"
  | "challenge_contradiction"
  | "conduct_seance";

export interface SuggestedQuestion {
  id: string;
  text: string;
  topicId: string;
  topicLabel: string;
  characterId: string;
  unlocked: boolean;
  contextHint?: string;
}

export interface SuggestedQuestionsData {
  characterId: string;
  characterName: string;
  trustLevel: number;
  activeTopic?: string;
  questions: SuggestedQuestion[];
}

export interface InvestigationTopic {
  id: string;
  title: string;
  description: string;
  category: string;
  isUnlocked: boolean;
  relevantFacts: string[];
  discoveredClues: {
    id: string;
    title: string;
    category: string;
    evidenceMarker?: string;
  }[];
  availableQuestions: string[];
  unresolvedLead: string;
}

export interface Contradiction {
  id: string;
  title: string;
  targetCharacterId: string;
  targetCharacterName: string;
  statementSummary: string;
  contradictingEvidenceId: string;
  contradictingEvidenceTitle: string;
  contradictionDetail: string;
  isReadyToChallenge: boolean;
  isResolved: boolean;
  missingEvidence: string[];
}

export interface ContradictionChallengeResult {
  success: boolean;
  characterId: string;
  characterName: string;
  dialogue: string;
  emotionalCue: string;
  trustDelta: number;
  newTrust: number;
  revealedFact?: string;
  unlockedClueId?: string;
  journalEntryId?: string;
}

export interface InvestigationObjective {
  id: string;
  order: number;
  title: string;
  description: string;
  hint: string;
  status: "completed" | "active" | "pending";
  progressPercent: number;
}

export interface InvestigationTheory {
  suspectId: string;
  weaponClueId: string;
  motiveClueId: string;
  supportingClueIds: string[];
  notes?: string;
}

export interface TheoryEvaluationResult {
  status: "supported" | "unsupported" | "contradicted";
  consistencyScore: number;
  strengths: string[];
  vulnerabilities: string[];
  contradictionsDetected: string[];
  verdictReadiness: string;
}

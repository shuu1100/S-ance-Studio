"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ScreenId,
  NotificationToast,
  InvestigationSession,
  Character,
  Clue,
  DialogueMessage,
  MansionRoom,
  JournalEntry,
  EvidenceConnection,
  EndingOutcome,
  OllamaDiagnostic,
} from "../types";
import {
  initialSession,
  sampleCharacters,
  sampleClues,
  sampleDialogues,
  sampleRooms,
  sampleJournalEntries,
  permittedConnectionRules,
  sampleEvidenceConnections,
  sampleEndingOutcomes,
  initialOllamaDiagnostic,
} from "../store/mockData";
import { AppShell } from "../components/game/AppShell";
import { TitleScreen } from "../components/screens/TitleScreen";
import { SetupScreen } from "../components/screens/SetupScreen";
import { InvestigationSelector } from "../components/screens/InvestigationSelector";
import { MansionDashboard } from "../components/screens/MansionDashboard";
import { InterviewPanel } from "../components/screens/InterviewPanel";
import { EvidenceBoard } from "../components/screens/EvidenceBoard";
import { JournalView } from "../components/screens/JournalView";
import { SettingsPanel } from "../components/screens/SettingsPanel";
import { EndingsScreen } from "../components/screens/EndingsScreen";
import { ToastContainer } from "../components/ui/Toast";
import { soundEngine } from "../lib/audio";
import {
  checkBackendHealth,
  sendDialogueMessageApi,
  createInvestigationApi,
  fetchInvestigationDetailApi,
  fetchSavedInvestigationsApi,
  fetchDialogueHistoryApi,
  discoverClueApi,
  submitActionApi,
  connectCluesApi,
  addJournalEntryApi,
  submitAccusationApi,
  fetchObjectivesApi,
} from "../lib/api";
import { InvestigationObjective } from "../types";
import { createId } from "../lib/id";

const STORAGE_KEY = "seance_studio_session_v1";
const ACTIVE_SESSION_ID_KEY = "seance_active_session_id";

export default function SeanceStudioPage() {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>("title");
  const [session, setSession] = useState<InvestigationSession>(initialSession);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [savedSessions, setSavedSessions] = useState<InvestigationSession[]>([]);
  const [hasSavedSession, setHasSavedSession] = useState(false);
  const [characters, setCharacters] = useState<Character[]>(sampleCharacters);
  const [clues, setClues] = useState<Clue[]>(sampleClues);
  const [dialogues, setDialogues] = useState<DialogueMessage[]>(sampleDialogues);
  const [rooms, setRooms] = useState<MansionRoom[]>(sampleRooms);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(sampleJournalEntries);
  const [connections, setConnections] = useState<EvidenceConnection[]>(sampleEvidenceConnections);
  const [objectives, setObjectives] = useState<InvestigationObjective[]>([]);
  const [activeEnding, setActiveEnding] = useState<EndingOutcome | null>(null);

  const [activeCharacterId, setActiveCharacterId] = useState("char_eleanor");
  const [isProcessingInquiry, setIsProcessingInquiry] = useState(false);
  const [inquiryError, setInquiryError] = useState<string | null>(null);
  const [lastAttemptedQuery, setLastAttemptedQuery] = useState<{
    query: string;
    targetId: string;
    itemFocusId?: string;
  } | null>(null);

  const [diagnostic, setDiagnostic] = useState<OllamaDiagnostic>(initialOllamaDiagnostic);
  const [toasts, setToasts] = useState<NotificationToast[]>([]);

  // Toast Helper
  const addToast = useCallback((
    type: NotificationToast["type"],
    title: string,
    message: string
  ) => {
    const newToast: NotificationToast = {
      id: createId("toast"),
      type,
      title,
      message,
      timestamp: "Just now",
    };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
    }, 5500);
  }, []);

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Synchronize room unlock states based on discovered clues
  const syncRoomUnlockStates = useCallback((currentClues: Clue[]) => {
    const revealedSet = new Set(
      currentClues.filter((c) => c.status !== "undiscovered").map((c) => c.id)
    );

    setRooms((prev) =>
      prev.map((room) => {
        let unlocked = room.unlocked;
        if (room.id === "room_foyer" || room.id === "room_parlor") {
          unlocked = true;
        } else if (room.id === "room_library") {
          unlocked = true;
        } else if (room.id === "room_conservatory") {
          unlocked =
            revealedSet.has("clue_silver_flask") ||
            revealedSet.has("clue_arsenic_vial") ||
            revealedSet.has("clue_burned_will");
        } else if (room.id === "room_crypt") {
          unlocked =
            revealedSet.has("clue_burned_will") ||
            revealedSet.has("clue_torn_diary") ||
            revealedSet.has("clue_clock_spring");
        }
        return { ...room, unlocked };
      })
    );
  }, []);

  // Check Backend Health & Fetch Saved Investigations on mount
  useEffect(() => {
    let isMounted = true;

    async function initializeSystem() {
      // 1. Probe backend & local Ollama daemon
      const health = await checkBackendHealth();
      if (!isMounted) return;

      setDiagnostic({
        connected: health.ollamaOnline,
        endpoint: health.endpoint,
        activeModel: health.model,
        visionModel: health.visionModel,
        textModelAvailable: health.textModelAvailable,
        visionModelAvailable: health.visionModelAvailable,
        statusText: health.statusText,
        availableModels: ["qwen3:4b", "qwen3-vl:8b"],
        latencyMs: health.latencyMs || 50,
        lastChecked: "Verified Just Now",
        gpuAcceleration: true,
        actionableMessage: health.actionableMessage,
        error: health.error,
      });

      // Clear any obsolete hardcoded session IDs from browser storage
      try {
        const stored = window.localStorage.getItem(ACTIVE_SESSION_ID_KEY);
        if (stored === "sess_blackwood_thirteenth_chime") {
          window.localStorage.removeItem(ACTIVE_SESSION_ID_KEY);
          window.localStorage.removeItem(STORAGE_KEY);
        }
      } catch {}

      // 2. Fetch saved investigations from authoritative backend database
      const savedRes = await fetchSavedInvestigationsApi();
      if (isMounted && savedRes.success && savedRes.data && savedRes.data.length > 0) {
        const validSessions = savedRes.data.filter(
          (s) => s.id && s.id !== "sess_blackwood_thirteenth_chime"
        );
        if (validSessions.length > 0) {
          setSavedSessions(validSessions);

          // Prefer active investigations over completed ones for automatic continuation
          const activeSessions = validSessions.filter((s) => s.status === "active");
          let chosen = activeSessions.length > 0 ? activeSessions[0] : validSessions[0];
          try {
            const storedId = window.localStorage.getItem(ACTIVE_SESSION_ID_KEY);
            const found = validSessions.find((s) => s.id === storedId);
            if (found) chosen = found;
          } catch {}

          // Load authoritative detail for this session
          const detailRes = await fetchInvestigationDetailApi(chosen.id);
          if (isMounted && detailRes.success && detailRes.data) {
            const d = detailRes.data;
            setSession(d.session);
            setActiveSessionId(d.session.id);
            setCharacters(d.characters);
            setClues(d.clues);
            setJournalEntries(d.journal);
            syncRoomUnlockStates(d.clues);

            if (d.session.status === "completed" && d.session.endingAchieved) {
              const outcome = sampleEndingOutcomes[d.session.endingAchieved];
              if (outcome) setActiveEnding(outcome);
            }

            const msgRes = await fetchDialogueHistoryApi(d.session.id);
            if (isMounted && msgRes.success && msgRes.data && msgRes.data.length > 0) {
              setDialogues(msgRes.data);
            }

            setHasSavedSession(true);
            try {
              window.localStorage.setItem(ACTIVE_SESSION_ID_KEY, d.session.id);
            } catch {}
            return;
          }
        }
      }

      // No valid saved session exists on backend
      if (isMounted) {
        setSavedSessions([]);
        setActiveSessionId(null);
        setHasSavedSession(false);
      }
    }

    initializeSystem();

    return () => {
      isMounted = false;
    };
  }, [syncRoomUnlockStates]);

  // Save state on notable mutations for offline continuity
  const persistCurrentState = (updatedSession: InvestigationSession) => {
    if (typeof window === "undefined") return;
    if (!updatedSession.id || updatedSession.id === "sess_blackwood_thirteenth_chime") return;
    try {
      window.localStorage.setItem(ACTIVE_SESSION_ID_KEY, updatedSession.id);
      const bundle = {
        session: updatedSession,
        characters,
        clues,
        dialogues,
        rooms,
        journalEntries,
        connections,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bundle));
      setHasSavedSession(true);
    } catch {}
  };

  // Load / Continue Saved Investigation
  const handleContinueInvestigation = async (targetSessionOrId?: InvestigationSession | string) => {
    soundEngine.playSfx("paper_rustle");

    let targetId: string | null = null;
    if (typeof targetSessionOrId === "string") {
      targetId = targetSessionOrId;
    } else if (targetSessionOrId && targetSessionOrId.id) {
      targetId = targetSessionOrId.id;
    } else if (activeSessionId) {
      targetId = activeSessionId;
    } else if (session.id && session.id !== "sess_blackwood_thirteenth_chime") {
      targetId = session.id;
    }

    if (!targetId || targetId === "sess_blackwood_thirteenth_chime") {
      addToast("warning", "No Active Investigation", "Please begin a new investigation to enter the manor.");
      setCurrentScreen("setup");
      return;
    }

    // Fetch authoritative investigation state from FastAPI backend
    addToast("info", "Resuming Inquest", `Loading authoritative case dossier for ${targetId}...`);
    const detailRes = await fetchInvestigationDetailApi(targetId);

    if (detailRes.success && detailRes.data) {
      const d = detailRes.data;
      setSession(d.session);
      setActiveSessionId(d.session.id);
      setCharacters(d.characters);
      setClues(d.clues);
      setJournalEntries(d.journal);
      syncRoomUnlockStates(d.clues);

      // Fetch persisted dialogue utterances
      const msgRes = await fetchDialogueHistoryApi(d.session.id);
      if (msgRes.success && msgRes.data && msgRes.data.length > 0) {
        setDialogues(msgRes.data);
      }

      fetchObjectivesApi(d.session.id).then((oRes) => {
        if (oRes.success && oRes.data) setObjectives(oRes.data);
      });

      if (d.session.status === "completed" && d.session.endingAchieved) {
        const outcome = sampleEndingOutcomes[d.session.endingAchieved];
        if (outcome) setActiveEnding(outcome);
      }

      persistCurrentState(d.session);
      if (d.session.status === "completed") {
        addToast(
          "info",
          "Archived Dossier Synchronized",
          `Loaded concluded investigation ${d.session.caseTitle} (${d.session.endingAchieved || "Verdict rendered"}).`
        );
      } else {
        addToast(
          "clue",
          "Authoritative Dossier Synchronized",
          `Resumed ${d.session.caseTitle} (Turn ${d.session.turnCounter}/${d.session.maxTurns}).`
        );
      }
      setInquiryError(null);
      setCurrentScreen("mansion");
      return;
    }

    // Session does not exist on backend
    const err = detailRes.error || `Investigation session '${targetId}' not found.`;
    addToast("warning", "Investigation Not Found", err);
    try {
      window.localStorage.removeItem(ACTIVE_SESSION_ID_KEY);
    } catch {}
    setActiveSessionId(null);
    setHasSavedSession(false);
  };

  // Probe Backend & Ollama Daemon Health
  const handleProbeOllama = async () => {
    soundEngine.playSfx("bell");
    addToast("info", "Probing Local AI Service", "Pinging loopback endpoints (127.0.0.1:8000 & 11434)...");
    setDiagnostic((prev) => ({ ...prev, statusText: "checking" }));

    const result = await checkBackendHealth();
    setDiagnostic({
      connected: result.ollamaOnline,
      endpoint: result.endpoint,
      activeModel: result.model,
      visionModel: result.visionModel,
      textModelAvailable: result.textModelAvailable,
      visionModelAvailable: result.visionModelAvailable,
      statusText: result.statusText,
      availableModels: ["qwen3:4b", "qwen3-vl:8b"],
      latencyMs: result.latencyMs || 50,
      lastChecked: "Verified Just Now",
      gpuAcceleration: true,
      actionableMessage: result.actionableMessage,
      error: result.error,
    });

    if (result.statusText === "ready") {
      addToast(
        "clue",
        "Local AI Ready",
        `Primary model ${result.model} active. Vision model ${result.visionModel} available.`
      );
    } else if (result.statusText === "ollama_unavailable") {
      addToast(
        "warning",
        "Ollama Unavailable",
        result.actionableMessage || "Ollama server is unreachable. Start the Ollama desktop app or run 'ollama serve'."
      );
    } else if (result.statusText === "model_unavailable") {
      addToast(
        "warning",
        "Model Unavailable",
        result.actionableMessage || `Configured model ${result.model} is not installed locally.`
      );
    } else {
      addToast(
        "info",
        "Air-Gapped Standalone Engine",
        "FastAPI service idle; utilizing client-side deterministic development engine."
      );
    }
  };

  // Submit Inquiry in Interview Panel
  const handleInquiry = async (
    query: string,
    targetId: string,
    itemFocusId?: string
  ) => {
    if (isProcessingInquiry) return;

    // Guard: Require authoritative active session
    const currentSessionId =
      activeSessionId ||
      (session.id && session.id !== "sess_blackwood_thirteenth_chime" ? session.id : null);

    if (!currentSessionId) {
      setInquiryError(
        "Investigation session 'sess_blackwood_thirteenth_chime' not found. Please begin a new investigation or select a valid session."
      );
      addToast(
        "warning",
        "Active Investigation Required",
        "Please begin a new investigation or open a dossier from the archives."
      );
      return;
    }

    if (session.status === "completed") {
      setInquiryError("Session is completed. No messages can be sent.");
      addToast(
        "info",
        "Investigation Concluded",
        "This psychic investigation has reached its final verdict. No further questions can be posed."
      );
      return;
    }

    setIsProcessingInquiry(true);
    setInquiryError(null);
    setLastAttemptedQuery({ query, targetId, itemFocusId });

    soundEngine.playSfx("planchette");

    // Send interrogation query to real local AI provider via FastAPI backend
    const apiRes = await sendDialogueMessageApi(currentSessionId, {
      characterId: targetId,
      content: query,
      presentedClueId: itemFocusId,
    });

    if (apiRes.success && apiRes.data) {
      const generatedMsg = apiRes.data;
      const newTurn = generatedMsg.turnNumber;

      // Optimistically record Player Utterance accompanied by Character Reply
      const userMsg: DialogueMessage = {
        id: createId("msg_user"),
        senderId: "investigator",
        senderName: "Investigator",
        speakerType: "living",
        text: query,
        turnNumber: newTurn,
        timestamp: generatedMsg.timestamp,
        cluePresentedId: itemFocusId,
      };

      setDialogues((prev) => [...prev, userMsg, generatedMsg]);
      soundEngine.playSfx("whisper_chime");

      const newCandle = Math.max(0, session.candlePercentage - 2.5);
      const newSanity = Math.max(0, session.playerSanity - (itemFocusId ? 3 : 1));
      const newTension = Math.min(100, session.ectoplasmicTension + 3);

      const updatedSession: InvestigationSession = {
        ...session,
        id: currentSessionId,
        turnCounter: newTurn,
        candlePercentage: newCandle,
        playerSanity: newSanity,
        ectoplasmicTension: newTension,
        lastSaved: "Just now",
      };
      setSession(updatedSession);
      persistCurrentState(updatedSession);
      setLastAttemptedQuery(null);

      // Check Fail Conditions
      if (newCandle <= 0) {
        triggerEnding("END_THE_COLD_DARK");
      } else if (newSanity <= 0) {
        triggerEnding("END_VESSEL_OF_THE_DAMNED");
      }

      setIsProcessingInquiry(false);
      return;
    }

    // Failure: Local Ollama API failed, timeout, or backend error
    setIsProcessingInquiry(false);
    const errorDetail = apiRes.error || "Communication failure with spirit.";
    const isCompletedError =
      apiRes.code === "SESSION_COMPLETED" ||
      errorDetail.toLowerCase().includes("completed") ||
      apiRes.sessionStatus === "completed";

    if (isCompletedError) {
      const updatedSession: InvestigationSession = {
        ...session,
        status: "completed",
      };
      setSession(updatedSession);
      persistCurrentState(updatedSession);
      setLastAttemptedQuery(null); // Clear retry state so it cannot blindly re-submit!
      setInquiryError(errorDetail);
      addToast(
        "info",
        "Investigation Concluded",
        "This investigation has concluded. You may view the case ending or review archives."
      );
      return;
    }

    setInquiryError(errorDetail);
    addToast("warning", "Channel Interruption", errorDetail);
  };

  // Retry Last Inquiry
  const handleRetryLastInquiry = () => {
    if (!lastAttemptedQuery || isProcessingInquiry) return;
    if (session.status === "completed") {
      addToast("info", "Inquest Concluded", "This investigation is completed and cannot accept further inquiries.");
      return;
    }
    const currentSessionId =
      activeSessionId ||
      (session.id && session.id !== "sess_blackwood_thirteenth_chime" ? session.id : null);
    if (!currentSessionId) {
      setInquiryError(
        "Investigation session not found. Please begin a new investigation."
      );
      return;
    }

    handleInquiry(
      lastAttemptedQuery.query,
      lastAttemptedQuery.targetId,
      lastAttemptedQuery.itemFocusId
    );
  };

  // Enter Room & Advance Investigation Location
  const handleEnterRoom = async (roomId: string) => {
    const currentSessionId =
      activeSessionId ||
      (session.id && session.id !== "sess_blackwood_thirteenth_chime" ? session.id : null);
    if (!currentSessionId) {
      addToast("warning", "No Active Investigation", "Please begin a new investigation.");
      return;
    }

    const r = rooms.find((x) => x.id === roomId);
    soundEngine.playSfx("paper_rustle");
    addToast("info", "Entering Estate Wing", `Initiated detailed forensic search in ${r?.name || roomId}.`);

    // Submit INSPECT action to authoritative backend
    const res = await submitActionApi(currentSessionId, {
      actionType: "INSPECT",
      targetId: roomId,
    });

    if (res.success && res.data) {
      const d = res.data;
      const updatedSession: InvestigationSession = {
        ...session,
        id: currentSessionId,
        currentLocation: r?.name || roomId,
        turnCounter: d.turnNumber,
        candlePercentage: d.candlePercentage,
        playerSanity: d.playerSanity,
        ectoplasmicTension: d.ectoplasmicTension,
        objective: d.objectiveUpdate || session.objective,
        status: d.gameStatus,
      };
      setSession(updatedSession);
      persistCurrentState(updatedSession);

      if (d.unlockedClue) {
        setClues((prev) => prev.map((c) => (c.id === d.unlockedClue!.id ? d.unlockedClue! : c)));
        syncRoomUnlockStates([...clues, d.unlockedClue]);
        addToast("clue", "Forensic Clue Discovered", `Cataloged: ${d.unlockedClue.title}`);
      }

      if (d.dialogue) {
        setDialogues((prev) => [...prev, d.dialogue!]);
      }
    }
  };

  // Inspect Room Hotspot & Authoritatively Reveal Clues
  const handleInspectHotspot = async (roomId: string, hotspotId: string) => {
    const currentSessionId =
      activeSessionId ||
      (session.id && session.id !== "sess_blackwood_thirteenth_chime" ? session.id : null);
    if (!currentSessionId) {
      addToast("warning", "No Active Investigation", "Please begin a new investigation.");
      return;
    }

    soundEngine.playSfx("paper_rustle");

    const targetRoom = rooms.find((r) => r.id === roomId);
    const targetHotspot = targetRoom?.hotspots.find((hs) => hs.id === hotspotId);

    if (targetHotspot?.unlocksClueId) {
      const clueId = targetHotspot.unlocksClueId;
      // Authoritatively discover the clue via backend
      const res = await discoverClueApi(currentSessionId, clueId, "INSPECTION");
      if (res.success && res.data) {
        const discoveredClue = res.data;
        const nextClues = clues.map((c) => (c.id === clueId ? discoveredClue : c));
        setClues(nextClues);
        syncRoomUnlockStates(nextClues);

        // Mark hotspot inspected
        setRooms((prev) =>
          prev.map((r) =>
            r.id === roomId
              ? {
                  ...r,
                  hotspots: r.hotspots.map((hs) =>
                    hs.id === hotspotId ? { ...hs, inspected: true } : hs
                  ),
                }
              : r
          )
        );

        setSession((prev) => ({
          ...prev,
          turnCounter: prev.turnCounter + 1,
          candlePercentage: Math.max(0, prev.candlePercentage - 2),
        }));

        addToast(
          "clue",
          "✦ Forensic Exhibit Cataloged ✦",
          `Uncovered: ${discoveredClue.title} in the examined location.`
        );
        return;
      } else if (res.error) {
        addToast("warning", "Investigation Notice", res.error);
        return;
      }
    }

    // Default inspection feedback
    setRooms((prev) =>
      prev.map((r) =>
        r.id === roomId
          ? {
              ...r,
              hotspots: r.hotspots.map((hs) =>
                hs.id === hotspotId ? { ...hs, inspected: true } : hs
              ),
            }
          : r
      )
    );
    addToast("info", "POI Re-examined", "Confirmed previous architectural and forensic observations.");
  };

  // Connect Two Clues via Yarn (Permitted by Authoritative Game Engine)
  const handleConnectClues = async (fromClueId: string, toClueId: string) => {
    soundEngine.playSfx("paper_rustle");

    const currentSessionId =
      activeSessionId ||
      (session.id && session.id !== "sess_blackwood_thirteenth_chime" ? session.id : null);
    if (!currentSessionId) {
      addToast("warning", "No Active Investigation", "Please begin a new investigation.");
      return;
    }

    // Check if already connected
    const exists = connections.some(
      (c) =>
        (c.fromClueId === fromClueId && c.toClueId === toClueId) ||
        (c.fromClueId === toClueId && c.toClueId === fromClueId)
    );
    if (exists) {
      addToast("info", "String Already Pinned", "These two exhibits are already linked on the board.");
      return;
    }

    // Call backend authoritative endpoint
    const res = await connectCluesApi(currentSessionId, fromClueId, toClueId);
    if (res.success && res.data) {
      const rule = res.data;
      const newConnection: EvidenceConnection = {
        id: createId("conn"),
        fromClueId: rule.fromClueId,
        toClueId: rule.toClueId,
        relationship: rule.relationship as EvidenceConnection["relationship"],
        label: rule.label,
      };

      setConnections((prev) => [...prev, newConnection]);
      addToast(
        "clue",
        "✦ Causal String Established ✦",
        `Valid deduction: "${rule.label}" pinned between exhibits.`
      );
      return;
    }

    // Local rule fallback if backend offline
    const rule = permittedConnectionRules.find(
      (r) =>
        (r.fromClueId === fromClueId && r.toClueId === toClueId) ||
        (r.fromClueId === toClueId && r.toClueId === fromClueId)
    );

    if (rule) {
      const newConnection: EvidenceConnection = {
        id: createId("conn"),
        fromClueId,
        toClueId,
        relationship: rule.relationship,
        label: rule.label,
      };
      setConnections((prev) => [...prev, newConnection]);
      addToast(
        "clue",
        "✦ Causal String Established ✦",
        `Valid deduction: "${rule.label}" pinned between exhibits.`
      );
    } else {
      addToast(
        "warning",
        "Deduction Refuted",
        res.error || "The mystery engine rejects this connection: no valid forensic correlation permitted."
      );
    }
  };

  const handleDisconnectClues = (connectionId: string) => {
    setConnections((prev) => prev.filter((c) => c.id !== connectionId));
    addToast("info", "Deduction String Severed", "Removed connection from the evidence board.");
  };

  // Commit Accusation & Resolve Authoritative Ending
  const handleCommitAccusation = async (deduction: {
    suspectId: string;
    weaponId: string;
    motiveId: string;
    supportingClueIds: string[];
  }) => {
    soundEngine.playSfx("bell");
    addToast("info", "Delivering Formal Accusation", "Submitting accusation matrix to authoritative mystery engine...");

    const currentSessionId =
      activeSessionId ||
      (session.id && session.id !== "sess_blackwood_thirteenth_chime" ? session.id : null);
    if (!currentSessionId) {
      addToast("warning", "No Active Investigation", "Please begin a new investigation.");
      return;
    }

    const res = await submitAccusationApi(currentSessionId, deduction);
    if (res.success && res.data) {
      const outcome = res.data;
      setActiveEnding(outcome);

      const updatedSession: InvestigationSession = {
        ...session,
        id: currentSessionId,
        status: "completed",
        endingAchieved: outcome.id,
      };
      setSession(updatedSession);
      persistCurrentState(updatedSession);

      addToast("clue", "Inquest Concluded", `Final verdict rendered: ${outcome.title}`);
      setCurrentScreen("endings");
      return;
    }

    // Fallback if backend offline
    const isJulian = deduction.suspectId === "char_julian";
    const isArsenic = deduction.weaponId === "method_arsenic_cordial";
    const isDebt = deduction.motiveId === "motive_disinheritance_debt";
    const hasSufficientClues = deduction.supportingClueIds.length >= 2;

    if (isJulian && isArsenic && isDebt && hasSufficientClues) {
      triggerEnding("END_TRUE_JUSTICE");
    } else if (isJulian && (!hasSufficientClues || !isArsenic)) {
      triggerEnding("END_HOLLOW_ACCUSATION");
    } else {
      triggerEnding("END_WRONGFUL_CONVICTION");
    }
  };

  // Trigger Ending & Jump to Endings Screen
  const triggerEnding = (endingId: string) => {
    const outcome = sampleEndingOutcomes[endingId] || sampleEndingOutcomes.END_TRUE_JUSTICE;
    setActiveEnding(outcome);

    const updatedSession: InvestigationSession = {
      ...session,
      status: "completed",
      endingAchieved: endingId,
    };
    setSession(updatedSession);
    persistCurrentState(updatedSession);

    setCurrentScreen("endings");
  };

  // Add New Journal Note
  const handleAddJournalNote = async (newEntry: {
    title: string;
    category: JournalEntry["category"];
    entryType: "fact" | "theory";
    content: string;
  }) => {
    soundEngine.playSfx("paper_rustle");

    const currentSessionId =
      activeSessionId ||
      (session.id && session.id !== "sess_blackwood_thirteenth_chime" ? session.id : null);
    if (!currentSessionId) {
      addToast("warning", "No Active Investigation", "Please begin a new investigation.");
      return;
    }

    const res = await addJournalEntryApi(currentSessionId, {
      title: newEntry.title,
      category: newEntry.category,
      entry_type: newEntry.entryType,
      content: newEntry.content,
      flagged: true,
    });

    if (res.success && res.data) {
      setJournalEntries((prev) => [res.data!, ...prev]);
      addToast("clue", "Dossier Ledger Inscribed", `"${res.data.title}" cataloged as ${res.data.entryType}.`);
      return;
    }

    // Local fallback if offline
    const created: JournalEntry = {
      id: createId("j"),
      title: newEntry.title,
      date: "October 27, 1922",
      category: newEntry.category,
      entryType: newEntry.entryType,
      content: newEntry.content,
      flagged: true,
      turnNumber: session.turnCounter,
    };
    setJournalEntries((prev) => [created, ...prev]);
    addToast("clue", "Dossier Ledger Inscribed", `"${newEntry.title}" recorded in field notebook.`);
  };

  // Initialize New Game from Setup
  const handleStartNewInvestigation = async (options: {
    difficulty: "novice" | "seasoned" | "skeptic";
    highContrast: boolean;
    reducedMotion: boolean;
    unmuteAudio: boolean;
    audioPreset: "cellar_drone" | "rain_storm" | "silent_crypt";
  }) => {
    soundEngine.playSfx("bell");
    addToast("info", "Consecrating Ward", "Initializing persistent investigation session on authoritative engine...");

    // Create session on backend
    const createRes = await createInvestigationApi("case_blackwood_thirteenth_chime", options.difficulty);
    if (createRes.success && createRes.data) {
      const createdSession = createRes.data;
      setActiveSessionId(createdSession.id);

      // Fetch initial entities
      const detailRes = await fetchInvestigationDetailApi(createdSession.id);
      if (detailRes.success && detailRes.data) {
        setSession(detailRes.data.session);
        setCharacters(detailRes.data.characters);
        setClues(detailRes.data.clues);
        setJournalEntries(detailRes.data.journal);
        syncRoomUnlockStates(detailRes.data.clues);
      } else {
        setSession(createdSession);
      }

      const msgRes = await fetchDialogueHistoryApi(createdSession.id);
      if (msgRes.success && msgRes.data && msgRes.data.length > 0) {
        setDialogues(msgRes.data);
      } else {
        setDialogues(sampleDialogues.slice(0, 2));
      }

      fetchObjectivesApi(createdSession.id).then((oRes) => {
        if (oRes.success && oRes.data) setObjectives(oRes.data);
      });

      setRooms(sampleRooms);
      setConnections([]);
      setActiveEnding(null);
      setHasSavedSession(true);
      setInquiryError(null);
      setLastAttemptedQuery(null);
      persistCurrentState(createdSession);

      addToast(
        "clue",
        "Inquest Commenced: Blackwood Manor",
        `Session [${createdSession.id}] registered. Turn ceiling set to ${createdSession.maxTurns} turns.`
      );
      setCurrentScreen("mansion");
      return;
    }

    // Backend creation failed: Do NOT navigate into the game with a fabricated fallback ID!
    const errMessage = createRes.error || "Failed to initialize investigation on backend.";
    addToast("warning", "Investigation Initialization Failed", errMessage);
  };

  return (
    <AppShell
      currentScreen={currentScreen}
      onNavigate={setCurrentScreen}
      session={session}
    >
      {/* 1. Title Screen */}
      {currentScreen === "title" && (
        <TitleScreen
          onNavigate={setCurrentScreen}
          onNewGame={() => setCurrentScreen("setup")}
          onContinue={() => handleContinueInvestigation()}
          hasSavedSession={hasSavedSession}
          savedSessionSummary={`${session.caseTitle} • Turn ${session.turnCounter}/${session.maxTurns}`}
          diagnostic={diagnostic}
          onProbeOllama={handleProbeOllama}
        />
      )}

      {/* 2. Investigation Setup Screen */}
      {currentScreen === "setup" && (
        <SetupScreen
          hasExistingSession={hasSavedSession && session.status === "active"}
          onConfirmStartNew={handleStartNewInvestigation}
          onCancel={() => setCurrentScreen("title")}
        />
      )}

      {/* Case Archives / Saved Sessions */}
      {currentScreen === "investigations" && (
        <InvestigationSelector
          currentSession={session}
          savedSessions={savedSessions}
          onSelectSession={(selected) => handleContinueInvestigation(selected)}
          onStartNewCase={() => setCurrentScreen("setup")}
        />
      )}

      {/* 3. Mansion Dashboard */}
      {currentScreen === "mansion" && (
        <MansionDashboard
          rooms={rooms}
          characters={characters}
          clues={clues}
          session={session}
          onEnterRoom={handleEnterRoom}
          onInspectHotspot={handleInspectHotspot}
          onNavigateToScreen={(target) => setCurrentScreen(target)}
        />
      )}

      {/* 4. Character Interview Panel */}
      {currentScreen === "interview" && (
        <InterviewPanel
          characters={characters}
          dialogues={dialogues}
          clues={clues}
          activeCharacterId={activeCharacterId}
          sessionId={activeSessionId || session.id}
          onReloadSession={() => {
            if (activeSessionId) handleContinueInvestigation(activeSessionId);
          }}
          onSelectCharacter={(id) => {
            setActiveCharacterId(id);
            soundEngine.playSfx("paper_rustle");
          }}
          onSubmitInquiry={handleInquiry}
          isProcessing={isProcessingInquiry}
          sessionStatus={session.status}
          onViewEnding={() => setCurrentScreen("endings")}
          lastError={inquiryError}
          onRetryLastInquiry={handleRetryLastInquiry}
          onStartNewCase={() => setCurrentScreen("setup")}
          onOpenArchives={() => setCurrentScreen("investigations")}
          isSessionReady={Boolean(activeSessionId && activeSessionId !== "sess_blackwood_thirteenth_chime")}
        />
      )}

      {/* 5. Deductive Evidence Board */}
      {currentScreen === "evidence" && (
        <EvidenceBoard
          clues={clues}
          characters={characters}
          connections={connections}
          permittedRules={permittedConnectionRules}
          sessionId={activeSessionId || session.id}
          onConnectClues={handleConnectClues}
          onDisconnectClues={handleDisconnectClues}
          onCommitAccusation={handleCommitAccusation}
        />
      )}

      {/* 6. Investigation Journal */}
      {currentScreen === "journal" && (
        <JournalView
          entries={journalEntries}
          session={session}
          clues={clues}
          characters={characters}
          dialogues={dialogues}
          onAddEntry={handleAddJournalNote}
        />
      )}

      {/* 7. Settings & Local AI Status */}
      {currentScreen === "settings" && (
        <SettingsPanel
          diagnostic={diagnostic}
          onRefreshDiagnostic={handleProbeOllama}
          onModelChange={(model) => {
            setDiagnostic((prev) => ({ ...prev, activeModel: model }));
            addToast("info", "Model Configured", `Active open-weight model switched to ${model}.`);
          }}
        />
      )}

      {/* 8. Endings Resolution Screen */}
      {currentScreen === "endings" && activeEnding && (
        <EndingsScreen
          outcome={activeEnding}
          onStartNewGame={() => setCurrentScreen("setup")}
          onReviewDossier={() => setCurrentScreen("evidence")}
        />
      )}

      {/* Atmospheric Toast Container */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
    </AppShell>
  );
}

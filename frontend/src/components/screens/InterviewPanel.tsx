"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Character,
  DialogueMessage,
  Clue,
  InquiryMode,
  SuggestedQuestion,
  InvestigationTopic,
  Contradiction,
} from "../../types";
import {
  fetchSuggestedInquiriesApi,
  fetchInvestigationTopicsApi,
  fetchContradictionsApi,
  challengeContradictionApi,
} from "../../lib/api";
import { CharacterPortrait } from "../game/CharacterPortrait";
import { DialogueBubble } from "../game/DialogueBubble";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import {
  MessageSquare,
  Sparkles,
  Send,
  ShieldAlert,
  Radio,
  RefreshCw,
  AlertTriangle,
  Heart,
  Compass,
  Scroll,
  Flame,
  HelpCircle,
  BookOpen,
  Scale,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  ChevronRight,
} from "lucide-react";

export interface InterviewPanelProps {
  characters: Character[];
  dialogues: DialogueMessage[];
  clues: Clue[];
  activeCharacterId: string;
  onSelectCharacter: (id: string) => void;
  onSubmitInquiry: (query: string, targetId: string, itemFocusId?: string) => void;
  sessionId?: string;
  onReloadSession?: () => void;
  isProcessing?: boolean;
  lastError?: string | null;
  onRetryLastInquiry?: () => void;
  onStartNewCase?: () => void;
  onOpenArchives?: () => void;
  onViewEnding?: () => void;
  isSessionReady?: boolean;
  sessionStatus?: string;
}

interface ClassifiedError {
  category: "session_missing" | "session_completed" | "ollama_unavailable" | "model_missing" | "timeout" | "unexpected";
  title: string;
  badge: string;
  description: string;
  actionableMessage: string;
  allowRetry: boolean;
  allowNewInvestigation: boolean;
  allowArchives: boolean;
  allowViewEnding?: boolean;
}

function classifyInquiryError(error: string | null): ClassifiedError | null {
  if (!error) return null;
  const lower = error.toLowerCase();

  if (
    lower.includes("completed") ||
    lower.includes("session is completed") ||
    lower.includes("concluded") ||
    lower.includes("session_completed")
  ) {
    return {
      category: "session_completed",
      title: "Psychic Inquest Concluded",
      badge: "Session Completed",
      description: "This investigation has already reached its final conclusion. The spiritual conduit is sealed and no further questions may be posed to the spirits.",
      actionableMessage: "View the official case ending verdict or begin a fresh investigation from the archives.",
      allowRetry: false,
      allowNewInvestigation: true,
      allowArchives: true,
      allowViewEnding: true,
    };
  }

  if (
    (lower.includes("not found") && (lower.includes("session") || lower.includes("investigation"))) ||
    lower.includes("no active") ||
    lower.includes("sess_blackwood_thirteenth_chime") ||
    lower.includes("session_not_found")
  ) {
    return {
      category: "session_missing",
      title: "Investigation Session Missing",
      badge: "HTTP 404 • Session Not Found",
      description: "The active investigation session could not be located in the manor archives.",
      actionableMessage: "Please begin a new investigation or select a saved case dossier from the archives.",
      allowRetry: false,
      allowNewInvestigation: true,
      allowArchives: true,
    };
  }

  if (
    lower.includes("unreachable") ||
    lower.includes("refused") ||
    lower.includes("cannot connect") ||
    (lower.includes("503") && lower.includes("ollama"))
  ) {
    return {
      category: "ollama_unavailable",
      title: "Local Ollama Server Unavailable",
      badge: "HTTP 503 • Service Offline",
      description: "The local Ollama service at http://127.0.0.1:11434 could not be reached.",
      actionableMessage: "Please verify the Ollama desktop app is running, or run 'ollama serve' in your terminal.",
      allowRetry: true,
      allowNewInvestigation: false,
      allowArchives: false,
    };
  }

  if (
    lower.includes("not installed") ||
    (lower.includes("model") && (lower.includes("not found") || lower.includes("missing")))
  ) {
    return {
      category: "model_missing",
      title: "Narrative Language Model Missing",
      badge: "HTTP 503 • Model Missing",
      description: "The configured open-weight model ('qwen3:4b') is not installed in local Ollama.",
      actionableMessage: "Check installed models with 'ollama list' and configure OLLAMA_MODEL in backend settings.",
      allowRetry: true,
      allowNewInvestigation: false,
      allowArchives: false,
    };
  }

  if (
    lower.includes("timeout") ||
    lower.includes("timed out") ||
    lower.includes("504")
  ) {
    return {
      category: "timeout",
      title: "Spectral Transmission Timeout",
      badge: "HTTP 504 • Gateway Timeout",
      description: "Local model inference exceeded the maximum permitted response duration.",
      actionableMessage: "The local system is under heavy computational load. You may safely retry the inquiry.",
      allowRetry: true,
      allowNewInvestigation: false,
      allowArchives: false,
    };
  }

  return {
    category: "unexpected",
    title: "Paranormal Channel Interruption",
    badge: "Engine Disturbance",
    description: "An unexpected communication fault prevented the spirit's voice from coalescing.",
    actionableMessage: "Please review your field notes or re-submit your inquiry to re-establish the psychic link.",
    allowRetry: true,
    allowNewInvestigation: false,
    allowArchives: false,
  };
}

export function InterviewPanel({
  characters,
  dialogues,
  clues,
  activeCharacterId,
  onSelectCharacter,
  onSubmitInquiry,
  sessionId,
  onReloadSession,
  isProcessing = false,
  lastError = null,
  onRetryLastInquiry,
  onStartNewCase,
  onOpenArchives,
  onViewEnding,
  isSessionReady = true,
  sessionStatus = "active",
}: InterviewPanelProps) {
  // Inquiry Mode Switcher
  const [inquiryMode, setInquiryMode] = useState<InquiryMode>("suggested_questions");
  const [customQuery, setCustomQuery] = useState("");
  const [selectedClueFocus, setSelectedClueFocus] = useState<string>("");
  const [inspectedClueId, setInspectedClueId] = useState<string | null>(null);

  // Dynamic server data
  const [suggestedQuestions, setSuggestedQuestions] = useState<SuggestedQuestion[]>([]);
  const [activeTopicFilter, setActiveTopicFilter] = useState<string | null>(null);
  const [topics, setTopics] = useState<InvestigationTopic[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [contradictions, setContradictions] = useState<Contradiction[]>([]);
  const [isChallenging, setIsChallenging] = useState(false);
  const [challengeFeedback, setChallengeFeedback] = useState<{
    success: boolean;
    title: string;
    message: string;
  } | null>(null);

  const isCompleted = sessionStatus === "completed";
  const isInputDisabled = isProcessing || !isSessionReady || isCompleted;

  const activeChar =
    characters.find((c) => c.id === activeCharacterId) || characters[0];

  const isSpiritOrMedium =
    activeChar.type === "spirit" ||
    activeChar.type === "medium" ||
    activeChar.id === "char_apparition" ||
    activeChar.id === "char_eleanor";

  // Fetch suggested questions whenever active character or topic filter changes
  const loadSuggestions = useCallback(async () => {
    if (!sessionId || !activeChar?.id) return;
    const res = await fetchSuggestedInquiriesApi(
      sessionId,
      activeChar.id,
      activeTopicFilter || undefined
    );
    if (res.success && res.data) {
      setSuggestedQuestions(res.data.questions);
    }
  }, [sessionId, activeChar?.id, activeTopicFilter]);

  // Fetch topics whenever session changes
  const loadTopics = useCallback(async () => {
    if (!sessionId) return;
    const res = await fetchInvestigationTopicsApi(sessionId, activeChar?.id);
    if (res.success && res.data) {
      setTopics(res.data);
      if (!selectedTopicId && res.data.length > 0) {
        setSelectedTopicId(res.data[0].id);
      }
    }
  }, [sessionId, activeChar?.id, selectedTopicId]);

  // Fetch contradictions whenever session changes
  const loadContradictions = useCallback(async () => {
    if (!sessionId) return;
    const res = await fetchContradictionsApi(sessionId);
    if (res.success && res.data) {
      setContradictions(res.data);
    }
  }, [sessionId]);

  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  useEffect(() => {
    loadTopics();
    loadContradictions();
  }, [loadTopics, loadContradictions]);

  const handleSendCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuery.trim() || isProcessing) return;
    onSubmitInquiry(customQuery.trim(), activeChar.id, selectedClueFocus || undefined);
    setCustomQuery("");
  };

  const handleSendQuestionText = (text: string, clueId?: string) => {
    if (isProcessing) return;
    onSubmitInquiry(text, activeChar.id, clueId || selectedClueFocus || undefined);
  };

  const handleChallenge = async (contradictionId: string) => {
    if (!sessionId || isProcessing || isChallenging) return;
    setIsChallenging(true);
    setChallengeFeedback(null);

    const res = await challengeContradictionApi(sessionId, contradictionId, selectedClueFocus || undefined);
    setIsChallenging(false);

    if (res.success && res.data) {
      setChallengeFeedback({
        success: res.data.success,
        title: res.data.success ? "Contradiction Shattered!" : "Challenge Dismissed",
        message: res.data.dialogue,
      });
      // Refresh session and contradictions
      loadContradictions();
      loadSuggestions();
      if (onReloadSession) {
        onReloadSession();
      }
    } else {
      setChallengeFeedback({
        success: false,
        title: "Challenge Failed",
        message: res.error || "Unable to challenge suspect at this time.",
      });
    }
  };

  const getTrustDescription = (trust: number) => {
    if (trust >= 75) return { label: "Receptive & Forthcoming", color: "text-[#86efac]" };
    if (trust >= 50) return { label: "Guarded but Attentive", color: "text-[#dfc282]" };
    if (trust >= 30) return { label: "Defensive & Evasive", color: "text-[#f5b041]" };
    return { label: "Hostile & Obstructive", color: "text-[#fca5a5]" };
  };

  const trustInfo = getTrustDescription(activeChar.trustLevel);
  const discoveredClues = clues.filter((c) => c.status !== "undiscovered");
  const inspectedClue = clues.find((c) => c.id === inspectedClueId);

  // Available topics for pills filter
  const topicFilterPills = [
    { id: "all", label: "All Topics" },
    { id: "death", label: "Death" },
    { id: "thirteenth_chime", label: "13th Chime" },
    { id: "clock", label: "Clockwork" },
    { id: "poison", label: "Poison" },
    { id: "will", label: "Will" },
    { id: "alibis", label: "Alibis" },
    { id: "relationships", label: "Feuds" },
    { id: "supernatural_events", label: "Occult" },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-[#c5a059]/30 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#dfc282]" />
            <h2 className="font-serif text-2xl text-[#dfc282] uppercase tracking-wide">
              Séance Chamber & Interrogation
            </h2>
          </div>
          <p className="text-xs text-[#b8a88a] font-mono mt-0.5">
            Interrogate living suspects or channel Lady Eleanor&apos;s unquiet spirit through the planchette.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={activeChar.type === "spirit" ? "spirit" : "brass"} size="md">
            Conduit: {activeChar.name}
          </Badge>
          <span className="text-[10px] font-mono text-[#b8a88a] bg-[#14100c] px-2 py-1 border border-[#c5a059]/30">
            Location: {activeChar.location}
          </span>
        </div>
      </div>

      {/* Suspect / Spirit Selector Carousel */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {characters.map((char) => (
          <CharacterPortrait
            key={char.id}
            character={char}
            selected={char.id === activeChar.id}
            onClick={() => !isProcessing && onSelectCharacter(char.id)}
          />
        ))}
      </div>

      {/* Mode Switcher Tabs */}
      <div className="bg-[#120f12] border border-[#c5a059]/30 p-1.5 rounded-[2px] flex items-center gap-1.5 overflow-x-auto">
        <button
          onClick={() => setInquiryMode("suggested_questions")}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-serif uppercase tracking-wider rounded-[1px] transition-colors whitespace-nowrap cursor-pointer ${
            inquiryMode === "suggested_questions"
              ? "bg-[#251d18] border border-[#c5a059] text-[#dfc282]"
              : "text-[#a39482] hover:text-[#dfc282] border border-transparent"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#c5a059]" />
          Suggested Inquiries
        </button>

        <button
          onClick={() => setInquiryMode("investigate_topic")}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-serif uppercase tracking-wider rounded-[1px] transition-colors whitespace-nowrap cursor-pointer ${
            inquiryMode === "investigate_topic"
              ? "bg-[#251d18] border border-[#c5a059] text-[#dfc282]"
              : "text-[#a39482] hover:text-[#dfc282] border border-transparent"
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-[#e29d42]" />
          Investigate Topic
        </button>

        <button
          onClick={() => setInquiryMode("present_evidence")}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-serif uppercase tracking-wider rounded-[1px] transition-colors whitespace-nowrap cursor-pointer ${
            inquiryMode === "present_evidence"
              ? "bg-[#251d18] border border-[#c5a059] text-[#dfc282]"
              : "text-[#a39482] hover:text-[#dfc282] border border-transparent"
          }`}
        >
          <Search className="w-3.5 h-3.5 text-[#86efac]" />
          Present Evidence
        </button>

        <button
          onClick={() => setInquiryMode("challenge_contradiction")}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-serif uppercase tracking-wider rounded-[1px] transition-colors whitespace-nowrap cursor-pointer ${
            inquiryMode === "challenge_contradiction"
              ? "bg-[#251d18] border border-[#c5a059] text-[#dfc282]"
              : "text-[#a39482] hover:text-[#dfc282] border border-transparent"
          }`}
        >
          <Scale className="w-3.5 h-3.5 text-[#fca5a5]" />
          Challenge Contradiction
        </button>

        {isSpiritOrMedium && (
          <button
            onClick={() => setInquiryMode("conduct_seance")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-serif uppercase tracking-wider rounded-[1px] transition-colors whitespace-nowrap cursor-pointer ${
              inquiryMode === "conduct_seance"
                ? "bg-[#1f1624] border border-[#a855f7] text-[#e9d5ff]"
                : "text-[#c084fc] hover:text-[#e9d5ff] border border-transparent"
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-[#c084fc]" />
            Conduct Séance
          </button>
        )}

        <button
          onClick={() => setInquiryMode("free_question")}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-serif uppercase tracking-wider rounded-[1px] transition-colors whitespace-nowrap cursor-pointer ${
            inquiryMode === "free_question"
              ? "bg-[#251d18] border border-[#c5a059] text-[#dfc282]"
              : "text-[#a39482] hover:text-[#dfc282] border border-transparent"
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5 text-[#dfc282]" />
          Free Inquest
        </button>
      </div>

      {/* Main Chamber Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Mode Workbench */}
        <div className="lg:col-span-5 space-y-4">
          {/* Active Profile Card with Trust Meter */}
          <div className="gothic-card p-4 border border-[#c5a059]/40 bg-[#161214] space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-[#c5a059]/20">
              <span className="font-serif text-xs font-semibold text-[#dfc282] uppercase tracking-wider">
                Dossier & Trust Assessment
              </span>
              <span className="text-[10px] font-mono text-[#b8a88a]">
                {activeChar.era}
              </span>
            </div>

            <p className="text-xs text-[#d4c8af] leading-relaxed">
              {activeChar.shortBio}
            </p>

            {/* Trust Meter */}
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-[#8a7f72] flex items-center gap-1">
                  <Heart className="w-3 h-3 text-[#c5a059]" /> Current Trust:
                </span>
                <span className={`font-semibold ${trustInfo.color}`}>
                  {activeChar.trustLevel}% ({trustInfo.label})
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#0a080a] border border-[#c5a059]/25 rounded-[1px] overflow-hidden">
                <div
                  style={{ width: `${activeChar.trustLevel}%` }}
                  className="h-full bg-gradient-to-r from-[#88652c] to-[#dfc282] transition-all duration-300"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-[#c5a059]/15 text-[11px] font-mono flex items-center justify-between">
              <span className="text-[#e29d42]">
                <span className="text-[#8a7f72]">Temperament:</span> {activeChar.temperament}
              </span>
              <span className="text-[10px] text-[#7d7265]">Cost: 1 Turn/Inquest</span>
            </div>
          </div>

          {/* MODE 1: SUGGESTED QUESTIONS */}
          {inquiryMode === "suggested_questions" && (
            <div className="gothic-card p-4 border border-[#c5a059]/30 bg-[#131012] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-serif text-xs font-semibold text-[#dfc282] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#c5a059]" />
                  Dynamic Suggested Inquiries ({suggestedQuestions.length})
                </span>
                <span className="text-[9px] font-mono text-[#7d7265]">Topic Filter</span>
              </div>

              {/* Compact Filter Pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1">
                {topicFilterPills.map((pill) => (
                  <button
                    key={pill.id}
                    onClick={() => setActiveTopicFilter(pill.id === "all" ? null : pill.id)}
                    className={`px-2 py-0.5 text-[10px] font-mono rounded-[1px] transition-colors cursor-pointer whitespace-nowrap ${
                      (pill.id === "all" && !activeTopicFilter) || activeTopicFilter === pill.id
                        ? "bg-[#c5a059] text-black font-semibold"
                        : "bg-[#1b1513] text-[#a39482] hover:text-[#dfc282] border border-[#3a3028]"
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>

              {/* Questions List */}
              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                {suggestedQuestions.map((q) => (
                  <button
                    key={q.id}
                    disabled={!q.unlocked || isInputDisabled}
                    onClick={() => handleSendQuestionText(q.text)}
                    className={`w-full text-left p-2.5 text-xs font-serif rounded-[1px] border transition-colors cursor-pointer group ${
                      q.unlocked
                        ? "border-[#3a3028] bg-[#1a1412] hover:border-[#c5a059]/70 hover:text-[#dfc282] text-[#d4c8af]"
                        : "border-[#221c1a] bg-[#100d0e] text-[#6b6055] cursor-not-allowed opacity-50"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[9px] font-mono mb-1">
                      <span className="text-[#c5a059] uppercase tracking-wider">{q.topicLabel}</span>
                      {!q.unlocked && <span className="text-[#ef4444]">Locked</span>}
                    </div>
                    <div className="leading-snug">&ldquo;{q.text}&rdquo;</div>
                    {q.contextHint && (
                      <div className="text-[9px] font-mono text-[#8a7f72] mt-1 italic">
                        {q.contextHint}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* MODE 2: INVESTIGATE TOPIC */}
          {inquiryMode === "investigate_topic" && (
            <div className="gothic-card p-4 border border-[#c5a059]/30 bg-[#131012] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-serif text-xs font-semibold text-[#dfc282] uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-[#e29d42]" />
                  Authoritative Inquest Topics (10)
                </span>
              </div>

              {/* Topics Grid */}
              <div className="grid grid-cols-2 gap-1.5 max-h-[140px] overflow-y-auto">
                {topics.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTopicId(t.id)}
                    className={`p-2 text-left text-[11px] font-serif rounded-[1px] border transition-colors cursor-pointer truncate ${
                      selectedTopicId === t.id
                        ? "border-[#c5a059] bg-[#221814] text-[#dfc282]"
                        : "border-[#3a3028] bg-[#181312] text-[#a39482] hover:border-[#c5a059]/40"
                    }`}
                  >
                    <div className="truncate font-semibold">{t.title}</div>
                    <div className="text-[9px] font-mono text-[#7d7265] uppercase">{t.category}</div>
                  </button>
                ))}
              </div>

              {/* Selected Topic Breakdown */}
              {(() => {
                const curTopic = topics.find((t) => t.id === selectedTopicId) || topics[0];
                if (!curTopic) return null;
                return (
                  <div className="p-3 bg-[#181316] border border-[#c5a059]/25 rounded-[1px] space-y-2 text-xs">
                    <div className="flex items-center justify-between border-b border-[#c5a059]/20 pb-1.5">
                      <span className="font-serif font-bold text-[#dfc282]">{curTopic.title}</span>
                      <Badge variant="brass" size="sm">{curTopic.category}</Badge>
                    </div>

                    <p className="text-[11px] text-[#d4c8af]">{curTopic.description}</p>

                    {/* Known facts */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-[#c5a059] uppercase block">Known Facts:</span>
                      {curTopic.relevantFacts.map((fact, idx) => (
                        <div key={idx} className="text-[10px] text-[#b8a88a] pl-2 border-l border-[#c5a059]/30">
                          {fact}
                        </div>
                      ))}
                    </div>

                    {/* Available Questions */}
                    <div className="pt-2 border-t border-[#c5a059]/15 space-y-1.5">
                      <span className="text-[10px] font-mono text-[#dfc282] uppercase block">Inquire About This:</span>
                      {curTopic.availableQuestions.map((qText, idx) => (
                        <button
                          key={idx}
                          disabled={isInputDisabled}
                          onClick={() => handleSendQuestionText(qText)}
                          className="w-full text-left p-1.5 text-[11px] font-serif bg-[#241a16] border border-[#3a3028] hover:border-[#c5a059] text-[#d4c8af] rounded-[1px] cursor-pointer flex items-center justify-between"
                        >
                          <span className="truncate">&ldquo;{qText}&rdquo;</span>
                          <ChevronRight className="w-3 h-3 text-[#c5a059] shrink-0" />
                        </button>
                      ))}
                    </div>

                    {/* Unresolved Lead */}
                    <div className="pt-1.5 text-[10px] font-mono text-[#e29d42]">
                      <span className="text-[#8a7f72]">Unresolved Lead:</span> {curTopic.unresolvedLead}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* MODE 3: PRESENT EVIDENCE */}
          {inquiryMode === "present_evidence" && (
            <div className="gothic-card p-4 border border-[#c5a059]/30 bg-[#131012] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-serif text-xs font-semibold text-[#dfc282] uppercase tracking-wider flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-[#86efac]" />
                  Present Evidence Relic ({discoveredClues.length})
                </span>
                <span className="text-[9px] font-mono text-[#7d7265]">Inspect & Confront</span>
              </div>

              {/* Clues Card Deck */}
              <div className="grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto">
                {discoveredClues.map((clue) => {
                  const isSelected = selectedClueFocus === clue.id;
                  return (
                    <div
                      key={clue.id}
                      onClick={() => {
                        setSelectedClueFocus(clue.id);
                        setInspectedClueId(clue.id);
                      }}
                      className={`p-2.5 rounded-[1px] border cursor-pointer transition-colors ${
                        isSelected
                          ? "border-[#86efac] bg-[#16241a] text-[#86efac]"
                          : "border-[#3a3028] bg-[#1a1412] text-[#d4c8af] hover:border-[#c5a059]/50"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[9px] font-mono text-[#c5a059] mb-1">
                        <span>{clue.evidenceMarker || "EXHIBIT"}</span>
                        <span className="uppercase">{clue.category}</span>
                      </div>
                      <div className="font-serif text-xs font-semibold truncate">{clue.title}</div>
                      <div className="text-[10px] font-mono text-[#7d7265] truncate">{clue.subtitle}</div>
                    </div>
                  );
                })}
              </div>

              {/* Inspected Clue Detail & Action */}
              {inspectedClue ? (
                <div className="p-3 bg-[#191518] border border-[#86efac]/40 rounded-[1px] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-xs font-bold text-[#86efac]">
                      {inspectedClue.title}
                    </span>
                    <Badge variant="brass" size="sm">{inspectedClue.category}</Badge>
                  </div>
                  <p className="text-[11px] text-[#d4c8af] leading-relaxed">
                    {inspectedClue.description}
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={isInputDisabled}
                    onClick={() => {
                      handleSendQuestionText(
                        `Confront ${activeChar.name.split(" ")[0]} with ${inspectedClue.title}`,
                        inspectedClue.id
                      );
                    }}
                    icon={<ShieldAlert className="w-3.5 h-3.5 text-[#dfc282]" />}
                    className="w-full text-xs py-1.5"
                  >
                    Present &ldquo;{inspectedClue.title}&rdquo; to {activeChar.name.split(" ")[0]}
                  </Button>
                </div>
              ) : (
                <div className="text-center p-3 text-[11px] font-mono text-[#7d7265] border border-dashed border-[#3a3028]">
                  Select an evidence relic above to inspect forensic details and confront {activeChar.name}.
                </div>
              )}
            </div>
          )}

          {/* MODE 4: CHALLENGE CONTRADICTION */}
          {inquiryMode === "challenge_contradiction" && (
            <div className="gothic-card p-4 border border-[#c5a059]/30 bg-[#131012] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-serif text-xs font-semibold text-[#dfc282] uppercase tracking-wider flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-[#fca5a5]" />
                  Witness Contradictions ({contradictions.length})
                </span>
                <span className="text-[9px] font-mono text-[#7d7265]">Forensic Inquest</span>
              </div>

              {/* Feedback Alert */}
              {challengeFeedback && (
                <div
                  className={`p-2.5 rounded-[1px] border text-xs ${
                    challengeFeedback.success
                      ? "bg-[#16241a] border-[#86efac]/50 text-[#86efac]"
                      : "bg-[#2d1115] border-[#ef4444]/50 text-[#fca5a5]"
                  }`}
                >
                  <div className="font-serif font-bold mb-1 flex items-center gap-1.5">
                    {challengeFeedback.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    {challengeFeedback.title}
                  </div>
                  <div className="text-[11px] leading-relaxed">{challengeFeedback.message}</div>
                </div>
              )}

              {/* Contradictions List */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {contradictions.map((contra) => {
                  return (
                    <div
                      key={contra.id}
                      className={`p-3 rounded-[1px] border space-y-2 ${
                        contra.isResolved
                          ? "border-[#86efac]/40 bg-[#131a14] opacity-75"
                          : contra.isReadyToChallenge
                          ? "border-[#f59e0b]/50 bg-[#1e1511]"
                          : "border-[#3a3028] bg-[#14100e]"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-[#dfc282] font-semibold">{contra.title}</span>
                        {contra.isResolved ? (
                          <span className="text-[#86efac] font-bold">Resolved</span>
                        ) : contra.isReadyToChallenge ? (
                          <span className="text-[#f59e0b] font-bold">Ready</span>
                        ) : (
                          <span className="text-[#ef4444]">Missing Clues</span>
                        )}
                      </div>

                      <p className="text-[11px] text-[#d4c8af]">
                        <span className="text-[#8a7f72] font-mono">Claim: </span>
                        {contra.statementSummary}
                      </p>

                      <div className="p-2 bg-[#0e0a0e] border border-[#3a3028] text-[10px] text-[#fca5a5] font-mono">
                        <span className="text-[#c5a059]">Conflict: </span>
                        {contra.contradictionDetail}
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] font-mono text-[#7d7265]">
                          Target: {contra.targetCharacterName}
                        </span>
                        <Button
                          variant={contra.isReadyToChallenge ? "primary" : "secondary"}
                          size="sm"
                          disabled={isInputDisabled || isChallenging || contra.isResolved}
                          onClick={() => handleChallenge(contra.id)}
                          className="text-[11px] py-1 px-2.5"
                        >
                          {contra.isResolved ? "Confronted" : "Challenge Statement"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* MODE 5: CONDUCT SEANCE */}
          {inquiryMode === "conduct_seance" && (
            <div className="gothic-card p-4 border border-[#a855f7]/40 bg-[#170e1e] space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#a855f7]/30">
                <span className="font-serif text-xs font-semibold text-[#e9d5ff] uppercase tracking-wider flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-[#c084fc]" />
                  Spiritualist Communion Trance
                </span>
                <span className="text-[10px] font-mono text-[#d8b4fe]">Ward Candle Flame Active</span>
              </div>

              <p className="text-xs text-[#d8b4fe] leading-relaxed">
                Direct psychic commune channels Lady Eleanor&apos;s astral memory at the moment of the thirteenth chime. Posing spectral inquiries pierces the veil between realms.
              </p>

              {/* Spectral Inquest Invocations */}
              <div className="space-y-1.5 pt-1">
                {[
                  "Lady Eleanor, tell me the exact sound that echoed through the study at 12:13 AM.",
                  "Spirit, who entered your locked library through the storm-swept terrace window?",
                  "Did the poisoned cordial taste of bitter almonds or sweet honey?",
                  "Channel the spectral vision: whose hands filed the brass teeth of the grandfather clock?",
                ].map((chant, idx) => (
                  <button
                    key={idx}
                    disabled={isInputDisabled}
                    onClick={() => handleSendQuestionText(chant)}
                    className="w-full text-left p-2.5 text-xs font-serif text-[#e9d5ff] border border-[#581c87] bg-[#2e1065]/40 hover:border-[#a855f7] hover:bg-[#3b0764]/60 transition-colors rounded-[1px] cursor-pointer"
                  >
                    <span className="text-[#c084fc] mr-1.5">🕯️</span>&ldquo;{chant}&rdquo;
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* MODE 6: FREE INQUEST */}
          {inquiryMode === "free_question" && (
            <div className="gothic-card p-4 border border-[#c5a059]/30 bg-[#131012] space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#c5a059]/20">
                <span className="font-serif text-xs font-semibold text-[#dfc282] uppercase tracking-wider flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-[#dfc282]" />
                  Unconstrained Inquest Directive
                </span>
              </div>
              <p className="text-xs text-[#d4c8af] leading-relaxed">
                Pose any custom question in natural prose. The local Ollama model will synthesize {activeChar.name}&apos;s spoken reply based strictly on their whitelisted knowledge boundaries.
              </p>

              {/* Quick Present Clue Dropdown */}
              <div className="pt-2 border-t border-[#c5a059]/20">
                <label className="text-[11px] font-serif uppercase tracking-wider text-[#dfc282] block mb-1.5 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-[#f5b041]" />
                  Optional Evidence Relic Presented
                </label>
                <select
                  value={selectedClueFocus}
                  disabled={isInputDisabled}
                  onChange={(e) => setSelectedClueFocus(e.target.value)}
                  className="w-full bg-[#0d0a0d] border border-[#c5a059]/30 text-xs font-mono text-[#dfc282] p-2 rounded-[1px] focus:outline-none focus:border-[#c5a059] disabled:opacity-50"
                >
                  <option value="">-- No Evidence Relic Presented --</option>
                  {discoveredClues.map((clue) => (
                    <option key={clue.id} value={clue.id}>
                      {clue.evidenceMarker ? `[${clue.evidenceMarker}] ` : ""}
                      {clue.title} ({clue.category})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Séance Transcript Feed */}
        <div className="lg:col-span-7 flex flex-col gothic-card border border-[#c5a059]/40 bg-[#120f12] h-[640px]">
          {/* Transcript Header */}
          <div className="p-3.5 border-b border-[#c5a059]/20 bg-[#161214] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-[#e29d42]" />
              <span className="font-serif text-xs font-semibold uppercase tracking-wider text-[#dfc282]">
                EVP Recording & Dialogue Feed
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#7d7265]">
              {dialogues.length} Inquests Transcribed
            </span>
          </div>

          {/* Transcript Scroll Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {/* Unconsecrated Session Banner if not ready */}
            {!isSessionReady && (
              <div className="p-4 bg-[#181216] border border-[#c5a059]/50 text-xs text-[#dfc282] rounded-[2px] space-y-2.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#c5a059]" />
                  <span className="font-serif font-bold uppercase tracking-wider text-[#dfc282]">
                    Chamber Inquest Awaiting Active Session
                  </span>
                </div>
                <p className="text-[11px] text-[#d4c8af] leading-relaxed">
                  No persistent investigation session is currently active. You must initialize an inquest or load an existing case dossier from the archives before communicating with the spirits.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  {onStartNewCase && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={onStartNewCase}
                      icon={<Compass className="w-3.5 h-3.5 text-[#dfc282]" />}
                      className="text-xs py-1 px-3"
                    >
                      Begin New Investigation
                    </Button>
                  )}
                  {onOpenArchives && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={onOpenArchives}
                      icon={<Scroll className="w-3.5 h-3.5 text-[#c5a059]" />}
                      className="text-xs py-1 px-3"
                    >
                      Case Archives
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Completed Inquest Banner */}
            {isCompleted && (
              <div className="p-4 bg-[#1e1511] border border-[#c5a059]/60 text-xs text-[#dfc282] rounded-[2px] shadow-lg space-y-2.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#dfc282]" />
                  <span className="font-serif font-bold uppercase tracking-wider text-[#dfc282]">
                    ✦ Psychic Inquest Concluded — Communion Sealed ✦
                  </span>
                </div>
                <p className="text-[11px] text-[#d4c8af] leading-relaxed">
                  This investigation session has reached its conclusion. Further psychic inquiries into the spirit realm are sealed. You may review the existing conversation transcript below, examine the case ending dossier, or begin a new case.
                </p>
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  {onViewEnding && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={onViewEnding}
                      icon={<Sparkles className="w-3.5 h-3.5 text-[#dfc282]" />}
                      className="text-xs py-1 px-3"
                    >
                      View Case Ending
                    </Button>
                  )}
                  {onOpenArchives && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={onOpenArchives}
                      icon={<Scroll className="w-3.5 h-3.5 text-[#c5a059]" />}
                      className="text-xs py-1 px-3"
                    >
                      Case Archives
                    </Button>
                  )}
                  {onStartNewCase && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={onStartNewCase}
                      icon={<Compass className="w-3.5 h-3.5 text-[#c5a059]" />}
                      className="text-xs py-1 px-3"
                    >
                      New Investigation
                    </Button>
                  )}
                </div>
              </div>
            )}

            {dialogues.map((msg) => (
              <DialogueBubble key={msg.id} message={msg} />
            ))}

            {/* In-Flight Loading State (Prevents duplicates) */}
            {isProcessing && (
              <div className="p-4 bg-[#1a1412] border border-[#c5a059]/50 text-center animate-pulse rounded-[1px]">
                <span className="text-xs font-serif text-[#dfc282] tracking-wider uppercase block">
                  ✦ The Planchette Slides Across the Spirit Board... ✦
                </span>
                <p className="text-[10px] font-mono text-[#b8a88a] mt-1">
                  Synthesizing ethereal transmission via local Ollama engine (127.0.0.1:11434)...
                </p>
              </div>
            )}

            {/* Actionable Error State */}
            {lastError && !isProcessing && (() => {
              const parsedError = classifyInquiryError(lastError);
              if (!parsedError) return null;
              return (
                <div className="p-4 bg-[#1c0f13] border border-[#a8323e]/60 text-xs text-[#fca5a5] rounded-[2px] shadow-lg space-y-3">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-[#ef4444] shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-serif font-bold uppercase tracking-wider text-[#dfc282]">
                          {parsedError.title}
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 bg-[#2d1115] border border-[#a8323e]/50 text-[#fca5a5]">
                          {parsedError.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#e2d5c0] leading-relaxed">
                        {parsedError.description}
                      </p>
                      <p className="text-[10px] font-mono text-[#fcd34d]">
                        ✦ Required Action: {parsedError.actionableMessage}
                      </p>
                    </div>
                  </div>

                  {/* Contextual Action Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#a8323e]/30 flex-wrap">
                    {parsedError.allowViewEnding && onViewEnding && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={onViewEnding}
                        icon={<Sparkles className="w-3.5 h-3.5 text-[#dfc282]" />}
                        className="text-xs py-1 px-3"
                      >
                        View Case Ending
                      </Button>
                    )}
                    {parsedError.allowNewInvestigation && onStartNewCase && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={onStartNewCase}
                        icon={<Compass className="w-3.5 h-3.5 text-[#dfc282]" />}
                        className="text-xs py-1 px-3"
                      >
                        New Investigation
                      </Button>
                    )}
                    {parsedError.allowArchives && onOpenArchives && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={onOpenArchives}
                        icon={<Scroll className="w-3.5 h-3.5 text-[#c5a059]" />}
                        className="text-xs py-1 px-3"
                      >
                        Case Archives
                      </Button>
                    )}
                    {parsedError.allowRetry && onRetryLastInquiry && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={onRetryLastInquiry}
                        icon={<RefreshCw className="w-3.5 h-3.5 text-[#dfc282]" />}
                        className="text-xs py-1 px-3"
                      >
                        Retry Inquest
                      </Button>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Bottom Continuous Custom Inquiry Input */}
          <form
            onSubmit={handleSendCustom}
            className="p-3 border-t border-[#c5a059]/25 bg-[#161214] flex items-center gap-2"
          >
            <input
              type="text"
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              placeholder={
                isCompleted
                  ? "This investigation has concluded. Further inquiries are sealed."
                  : !isSessionReady
                  ? "Please start or resume an investigation to begin inquiry..."
                  : isProcessing
                  ? "Transcribing response... please wait"
                  : `Inscribe question for ${activeChar.name}...`
              }
              disabled={isInputDisabled}
              className="flex-1 bg-[#0b080b] border border-[#c5a059]/30 text-xs text-[#ece3cd] placeholder-[#7d7265] px-3 py-2 font-serif focus:outline-none focus:border-[#c5a059] disabled:opacity-50"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!customQuery.trim() || isInputDisabled}
              icon={<Send className="w-3.5 h-3.5 text-[#dfc282]" />}
            >
              {isProcessing ? "Transcribing..." : "Inquire"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import {
  Clue,
  Character,
  EvidenceConnection,
  PermittedConnectionRule,
  TheoryEvaluationResult,
} from "../../types";
import { evaluateTheoryApi } from "../../lib/api";
import { ClueCard } from "../game/ClueCard";
import { ClueArtwork } from "../game/ClueArtwork";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Modal } from "../ui/Modal";
import { ConfirmationDialog } from "../ui/ConfirmationDialog";
import {
  Network,
  ShieldAlert,
  AlertTriangle,
  Link2,
  Unlink,
  Search,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Sparkles,
  Scale,
} from "lucide-react";

export interface EvidenceBoardProps {
  clues: Clue[];
  characters: Character[];
  connections: EvidenceConnection[];
  permittedRules: PermittedConnectionRule[];
  sessionId?: string;
  onConnectClues: (fromClueId: string, toClueId: string) => void;
  onDisconnectClues: (connectionId: string) => void;
  onCommitAccusation: (deduction: {
    suspectId: string;
    weaponId: string;
    motiveId: string;
    supportingClueIds: string[];
  }) => void;
}

export function EvidenceBoard({
  clues,
  characters,
  connections,
  permittedRules,
  sessionId,
  onConnectClues,
  onDisconnectClues,
  onCommitAccusation,
}: EvidenceBoardProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedClueA, setSelectedClueA] = useState<string>("");
  const [selectedClueB, setSelectedClueB] = useState<string>("");
  const [inspectClue, setInspectClue] = useState<Clue | null>(null);
  const [connectionMessage, setConnectionMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Accusation / Theory Matrix State
  const [accusedSuspect, setAccusedSuspect] = useState<string>("char_julian");
  const [selectedWeapon, setSelectedWeapon] = useState<string>("clue_silver_flask");
  const [selectedMotive, setSelectedMotive] = useState<string>("clue_burned_will");
  const [selectedAccusationClues, setSelectedAccusationClues] = useState<string[]>([
    "clue_silver_flask",
    "clue_burned_will",
  ]);

  // Theory Evaluation State
  const [isEvaluatingTheory, setIsEvaluatingTheory] = useState(false);
  const [theoryResult, setTheoryResult] = useState<TheoryEvaluationResult | null>(null);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Discovered clues
  const discoveredClues = clues.filter((c) => c.status !== "undiscovered");

  // Filtered by category
  const filteredClues = discoveredClues.filter((c) => {
    if (categoryFilter === "all") return true;
    return c.category === categoryFilter;
  });

  const handleAttemptConnection = () => {
    if (!selectedClueA || !selectedClueB) return;
    if (selectedClueA === selectedClueB) {
      setConnectionMessage({
        type: "error",
        text: "Cannot connect an exhibit to itself.",
      });
      return;
    }

    // Check against Authoritative Game Engine Permitted Rules
    const match = permittedRules.find(
      (rule) =>
        (rule.fromClueId === selectedClueA && rule.toClueId === selectedClueB) ||
        (rule.fromClueId === selectedClueB && rule.toClueId === selectedClueA)
    );

    if (match) {
      onConnectClues(selectedClueA, selectedClueB);
      setConnectionMessage({
        type: "success",
        text: `Valid Deduction Verified: ${match.label} (${match.reason})`,
      });
      setSelectedClueA("");
      setSelectedClueB("");
    } else {
      setConnectionMessage({
        type: "error",
        text: "Deduction Rejected by Engine: No causal, forensic, or temporal link connects these two exhibits.",
      });
    }
  };

  const toggleAccusationClue = (clueId: string) => {
    setSelectedAccusationClues((prev) =>
      prev.includes(clueId)
        ? prev.filter((id) => id !== clueId)
        : [...prev, clueId]
    );
  };

  const handleEvaluateTheory = async () => {
    if (!sessionId) return;
    setIsEvaluatingTheory(true);
    const res = await evaluateTheoryApi(sessionId, {
      suspectId: accusedSuspect,
      weaponClueId: selectedWeapon,
      motiveClueId: selectedMotive,
      supportingClueIds: selectedAccusationClues,
    });
    setIsEvaluatingTheory(false);
    if (res.success && res.data) {
      setTheoryResult(res.data);
    }
  };

  const handleExecuteAccusation = () => {
    setIsConfirmOpen(false);
    onCommitAccusation({
      suspectId: accusedSuspect,
      weaponId: selectedWeapon,
      motiveId: selectedMotive,
      supportingClueIds: selectedAccusationClues,
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-[#c5a059]/30 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Network className="w-5 h-5 text-[#dfc282]" />
            <h2 className="font-serif text-2xl text-[#dfc282] uppercase tracking-wide">
              Evidence Board & Theory Formulation
            </h2>
          </div>
          <p className="text-xs text-[#b8a88a] font-mono mt-0.5">
            Pin forensic exhibits, weave causal crimson strings, and validate hypotheses before court delivery.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="brass" size="md">
            {discoveredClues.length} Discovered Exhibits
          </Badge>
          <Badge variant="muted" size="md">
            {connections.length} Permitted Strings
          </Badge>
        </div>
      </div>

      {/* Top Deduction Connection Workbench */}
      <div className="gothic-card p-4 border border-[#c5a059]/30 bg-[#161214] space-y-3">
        <div className="flex items-center justify-between border-b border-[#c5a059]/20 pb-2">
          <span className="font-serif text-xs font-semibold text-[#dfc282] uppercase tracking-wider flex items-center gap-1.5">
            <Link2 className="w-3.5 h-3.5 text-[#c5a059]" />
            Connect Exhibits with Crimson Yarn
          </span>
          <span className="text-[10px] font-mono text-[#8a7f72]">
            Validated by Deterministic Mystery Engine
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-mono text-[#b8a88a] block mb-1">
              Exhibit A (Origin):
            </label>
            <select
              value={selectedClueA}
              onChange={(e) => setSelectedClueA(e.target.value)}
              className="w-full bg-[#0d0a0d] border border-[#c5a059]/30 text-xs font-mono text-[#dfc282] p-2 rounded-[1px] focus:outline-none focus:border-[#c5a059]"
            >
              <option value="">-- Choose First Exhibit --</option>
              {discoveredClues.map((c) => (
                <option key={c.id} value={c.id}>
                  [{c.evidenceMarker || "—"}] {c.title} ({c.category})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-mono text-[#b8a88a] block mb-1">
              Exhibit B (Target):
            </label>
            <select
              value={selectedClueB}
              onChange={(e) => setSelectedClueB(e.target.value)}
              className="w-full bg-[#0d0a0d] border border-[#c5a059]/30 text-xs font-mono text-[#dfc282] p-2 rounded-[1px] focus:outline-none focus:border-[#c5a059]"
            >
              <option value="">-- Choose Second Exhibit --</option>
              {discoveredClues.map((c) => (
                <option key={c.id} value={c.id}>
                  [{c.evidenceMarker || "—"}] {c.title} ({c.category})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          {connectionMessage ? (
            <div
              className={`text-xs font-mono flex items-center gap-1.5 ${
                connectionMessage.type === "success"
                  ? "text-[#86efac]"
                  : "text-[#fca5a5]"
              }`}
            >
              {connectionMessage.type === "success" ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <XCircle className="w-3.5 h-3.5" />
              )}
              <span>{connectionMessage.text}</span>
            </div>
          ) : (
            <span className="text-[10px] text-[#7d7265] font-mono">
              Select two exhibits to test a causal deduction link.
            </span>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={handleAttemptConnection}
            disabled={!selectedClueA || !selectedClueB}
          >
            Connect with Crimson Yarn
          </Button>
        </div>

        {/* Established Strings */}
        {connections.length > 0 && (
          <div className="pt-3 border-t border-[#c5a059]/20 space-y-1.5">
            <span className="text-[10px] font-mono uppercase text-[#8a7f72] tracking-wider block">
              Established Permitted Strings:
            </span>
            <div className="flex flex-wrap gap-2">
              {connections.map((conn) => {
                const clueA = clues.find((c) => c.id === conn.fromClueId);
                const clueB = clues.find((c) => c.id === conn.toClueId);
                return (
                  <div
                    key={conn.id}
                    className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#200c11] border border-[#8a1f29] text-xs font-mono text-[#fca5a5] rounded-[1px]"
                  >
                    <span className="text-[#dfc282] font-semibold">
                      {clueA?.evidenceMarker || "A"} ↔ {clueB?.evidenceMarker || "B"}:
                    </span>
                    <span>{conn.label}</span>
                    <button
                      onClick={() => onDisconnectClues(conn.id)}
                      className="text-[#7d7265] hover:text-[#ef4444] transition-colors ml-1"
                      title="Sever string connection"
                    >
                      <Unlink className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Main Board Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Discovered Clues Corkboard with Category Filters */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="font-serif text-xs font-semibold text-[#dfc282] uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-[#c5a059]" />
              Discovered Forensic Exhibits ({filteredClues.length})
            </span>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1">
              {[
                { id: "all", label: "All" },
                { id: "physical", label: "Physical" },
                { id: "document", label: "Document" },
                { id: "paranormal", label: "Paranormal" },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setCategoryFilter(pill.id)}
                  className={`px-2 py-0.5 text-[10px] font-mono rounded-[1px] transition-colors cursor-pointer ${
                    categoryFilter === pill.id
                      ? "bg-[#c5a059] text-black font-semibold"
                      : "bg-[#161214] border border-[#3a3028] text-[#8a7f72] hover:text-[#dfc282]"
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {filteredClues.map((clue) => {
              const isAttachedToAccusation = selectedAccusationClues.includes(clue.id);
              return (
                <div key={clue.id} className="relative space-y-1.5">
                  <ClueCard clue={clue} />

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setInspectClue(clue)}
                      icon={<Search className="w-3 h-3 text-[#dfc282]" />}
                      className="w-1/2 text-[10px] py-1"
                    >
                      Inspect Details
                    </Button>

                    <button
                      onClick={() => toggleAccusationClue(clue.id)}
                      className={`w-1/2 py-1 px-2 text-[10px] font-mono border rounded-[1px] flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        isAttachedToAccusation
                          ? "bg-[#2a0e13] border-[#8a1f29] text-[#fca5a5] font-semibold"
                          : "bg-[#14100c] border-[#3a3028] text-[#8a7f72] hover:border-[#c5a059]/40 hover:text-[#ece3cd]"
                      }`}
                    >
                      <Link2 className="w-3 h-3" />
                      {isAttachedToAccusation ? "Attached" : "Attach to Verdict"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Theory Formulation & Accusation Matrix */}
        <div className="lg:col-span-5 space-y-4">
          <div className="gothic-card p-5 border-2 border-[#8a1f29]/70 bg-[#160d10] space-y-4 shadow-[0_8px_30px_rgba(0,0,0,0.9)]">
            <div className="border-b border-[#8a1f29]/40 pb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#ef4444]" />
                <h3 className="font-serif text-base font-bold text-[#fca5a5] uppercase tracking-wide">
                  Accusation & Theory Matrix
                </h3>
              </div>
              <p className="text-[11px] text-[#b8a88a] font-mono mt-0.5">
                Construct and test your theory before delivering the authoritative verdict.
              </p>
            </div>

            {/* Suspect Selector */}
            <div className="space-y-1">
              <label className="text-xs font-serif uppercase tracking-wider text-[#dfc282] block">
                1. Accused Perpetrator
              </label>
              <select
                value={accusedSuspect}
                onChange={(e) => setAccusedSuspect(e.target.value)}
                className="w-full bg-[#0a0607] border border-[#8a1f29]/60 text-xs font-mono text-[#fca5a5] p-2 rounded-[1px] focus:outline-none focus:border-[#ef4444]"
              >
                <option value="char_julian">Lord Julian Blackwood (Nephew)</option>
                <option value="char_caretaker">Arthur Briggs (The Manor Caretaker)</option>
                <option value="char_daughter">Victoria Blackwood (Eleanor&apos;s Daughter)</option>
              </select>
            </div>

            {/* Weapon / Clue */}
            <div className="space-y-1">
              <label className="text-xs font-serif uppercase tracking-wider text-[#dfc282] block">
                2. Murder Instrument / Weapon
              </label>
              <select
                value={selectedWeapon}
                onChange={(e) => setSelectedWeapon(e.target.value)}
                className="w-full bg-[#0a0607] border border-[#8a1f29]/60 text-xs font-mono text-[#fca5a5] p-2 rounded-[1px] focus:outline-none focus:border-[#ef4444]"
              >
                <option value="clue_silver_flask">The Silver Monogrammed Flask (Arsenic Cordial)</option>
                <option value="clue_arsenic_vial">Amber Apothecary Vial of Arsenic Trioxide</option>
                <option value="clue_thirteenth_chime">Tampered Astronomical Clockwork</option>
              </select>
            </div>

            {/* Motive */}
            <div className="space-y-1">
              <label className="text-xs font-serif uppercase tracking-wider text-[#dfc282] block">
                3. Primary Motive Evidence
              </label>
              <select
                value={selectedMotive}
                onChange={(e) => setSelectedMotive(e.target.value)}
                className="w-full bg-[#0a0607] border border-[#8a1f29]/60 text-xs font-mono text-[#fca5a5] p-2 rounded-[1px] focus:outline-none focus:border-[#ef4444]"
              >
                <option value="clue_burned_will">Charred Codicil Fragment (Disinheritance & £8.5k Debts)</option>
                <option value="clue_crypt_journal">Julian&apos;s Secret Poison Ledger & Forged Codicil</option>
              </select>
            </div>

            {/* Test Theory Button */}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={isEvaluatingTheory}
              onClick={handleEvaluateTheory}
              icon={<Lightbulb className="w-3.5 h-3.5 text-[#dfc282]" />}
              className="w-full text-xs py-2"
            >
              {isEvaluatingTheory ? "Consulting Deductive Matrix..." : "Test Hypothesis Consistency"}
            </Button>

            {/* Theory Evaluation Output */}
            {theoryResult && (
              <div className="p-3 bg-[#11090c] border border-[#8a1f29]/60 rounded-[1px] space-y-2 text-xs">
                <div className="flex items-center justify-between font-mono">
                  <span className="text-[#dfc282] font-semibold">Evaluation Status:</span>
                  <Badge
                    variant={
                      theoryResult.status === "supported"
                        ? "brass"
                        : theoryResult.status === "contradicted"
                        ? "crimson"
                        : "muted"
                    }
                    size="sm"
                  >
                    {theoryResult.status.toUpperCase()} ({theoryResult.consistencyScore}%)
                  </Badge>
                </div>

                {/* Score bar */}
                <div className="w-full h-1.5 bg-[#0a0607] border border-[#8a1f29]/40 rounded-[1px] overflow-hidden">
                  <div
                    style={{ width: `${theoryResult.consistencyScore}%` }}
                    className={`h-full ${
                      theoryResult.status === "supported" ? "bg-[#86efac]" : "bg-[#ef4444]"
                    }`}
                  />
                </div>

                <div className="text-[11px] text-[#fca5a5] font-serif italic">
                  {theoryResult.verdictReadiness}
                </div>

                {/* Strengths */}
                {theoryResult.strengths.length > 0 && (
                  <div className="space-y-0.5 pt-1">
                    <span className="text-[10px] font-mono text-[#86efac] uppercase block">Corroborated:</span>
                    {theoryResult.strengths.map((s, idx) => (
                      <div key={idx} className="text-[10px] text-[#bbf7d0] pl-2 border-l border-[#86efac]/40">
                        {s}
                      </div>
                    ))}
                  </div>
                )}

                {/* Contradictions */}
                {theoryResult.contradictionsDetected.length > 0 && (
                  <div className="space-y-0.5 pt-1">
                    <span className="text-[10px] font-mono text-[#ef4444] uppercase block">Fatal Flaws:</span>
                    {theoryResult.contradictionsDetected.map((c, idx) => (
                      <div key={idx} className="text-[10px] text-[#fca5a5] pl-2 border-l border-[#ef4444]/40">
                        {c}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Deliver Verdict Button */}
            <div className="pt-2 border-t border-[#8a1f29]/30">
              <Button
                variant="destructive"
                size="md"
                onClick={() => setIsConfirmOpen(true)}
                disabled={selectedAccusationClues.length === 0}
                className="w-full py-3"
              >
                Deliver Verdict & Seal Judgment
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Clue Inspector Modal */}
      {inspectClue && (
        <Modal
          isOpen={Boolean(inspectClue)}
          onClose={() => setInspectClue(null)}
          title={`Forensic Dossier: ${inspectClue.title}`}
          subtitle={`Exhibit ${inspectClue.evidenceMarker || "—"} • ${inspectClue.category.toUpperCase()}`}
          maxWidth="lg"
          footer={
            <Button variant="primary" size="sm" onClick={() => setInspectClue(null)}>
              Close Exhibit Dossier
            </Button>
          }
        >
          <ClueArtwork clue={inspectClue} variant="detail" />
        </Modal>
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isConfirmOpen}
        onCancel={() => setIsConfirmOpen(false)}
        onConfirm={handleExecuteAccusation}
        title="Commit Formal Accusation"
        description="Are you prepared to speak the name of the murderer before the court and the spirit realm? An error in judgment will condemn an innocent soul and leave the true entity unrested."
        confirmLabel="Declare Guilty Party"
        variant="destructive"
      />
    </div>
  );
}

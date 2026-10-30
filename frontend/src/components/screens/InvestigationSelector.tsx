"use client";

import React, { useState } from "react";
import { InvestigationSession } from "../../types";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { CandleGauge } from "../ui/CandleGauge";
import { SanityMeter } from "../ui/SanityMeter";
import { Scroll, FolderOpen, Play, Lock, Clock } from "lucide-react";

export interface InvestigationSelectorProps {
  currentSession: InvestigationSession;
  savedSessions?: InvestigationSession[];
  onSelectSession: (session: InvestigationSession) => void;
  onStartNewCase: (caseId: string, difficulty: "novice" | "seasoned" | "skeptic") => void;
}

export function InvestigationSelector({
  currentSession,
  savedSessions = [],
  onSelectSession,
  onStartNewCase,
}: InvestigationSelectorProps) {
  const [selectedDifficulty, setSelectedDifficulty] = useState<"novice" | "seasoned" | "skeptic">(
    "seasoned"
  );
  const [activeTab, setActiveTab] = useState<"cases" | "saves">("cases");

  const displaySessions =
    savedSessions.length > 0
      ? savedSessions
      : currentSession && currentSession.id
      ? [currentSession]
      : [];

  const caseCatalog = [
    {
      id: "case_blackwood_manor",
      title: "The Haunting of Blackwood Manor",
      subtitle: "The Poisoned Insomnia Draught",
      era: "London • October 1922",
      difficulty: "Intermediate",
      status: "unlocked",
      summary:
        "Lady Eleanor Blackwood perished in the library shortly after midnight. Her nephew Julian inherited her shipping empire, but Eleanor's restless spirit claims the cordial tasted of bitter almonds and copper.",
      suspectsCount: 4,
      cluesCount: 10,
    },
    {
      id: "case_st_judes_asylum",
      title: "The Phantom of St. Jude's Ward",
      subtitle: "The Sealed Hydrotherapy Cell",
      era: "Devonshire • December 1919",
      difficulty: "Advanced",
      status: "locked",
      summary:
        "A patient vanished behind locked padded doors leaving only a cold draft and a waterlogged medical journal. The attending alienist swears the phantom walks through iron bars.",
      suspectsCount: 5,
      cluesCount: 14,
    },
    {
      id: "case_clockmakers_crypt",
      title: "The Automaton's Requiem",
      subtitle: "The Mechanical Clockwork Homicide",
      era: "Prague • May 1924",
      difficulty: "Expert",
      status: "locked",
      summary:
        "Master horologist Von Radek was crushed within his astronomical clock. The automaton continued ticking while his spirit manifested through the brass chime gears.",
      suspectsCount: 3,
      cluesCount: 12,
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-[#c5a059]/30 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Scroll className="w-5 h-5 text-[#dfc282]" />
            <h2 className="font-serif text-2xl text-[#dfc282] uppercase tracking-wide">
              The Occult Archives
            </h2>
          </div>
          <p className="text-xs text-[#b8a88a] font-mono mt-0.5">
            Select an archived paranormal homicide or resume an ongoing séance session.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 bg-[#14100c] border border-[#c5a059]/30 p-1">
          <button
            onClick={() => setActiveTab("cases")}
            className={`px-3 py-1.5 text-xs font-serif uppercase tracking-wider transition-all ${
              activeTab === "cases"
                ? "bg-[#271e16] text-[#dfc282] border border-[#c5a059]/60 font-semibold"
                : "text-[#8a7f72] hover:text-[#ece3cd]"
            }`}
          >
            Case Catalog
          </button>
          <button
            onClick={() => setActiveTab("saves")}
            className={`px-3 py-1.5 text-xs font-serif uppercase tracking-wider transition-all ${
              activeTab === "saves"
                ? "bg-[#271e16] text-[#dfc282] border border-[#c5a059]/60 font-semibold"
                : "text-[#8a7f72] hover:text-[#ece3cd]"
            }`}
          >
            Saved Sessions ({displaySessions.length})
          </button>
        </div>
      </div>

      {activeTab === "cases" ? (
        <div className="space-y-6">
          {/* Difficulty Tier Selector */}
          <div className="gothic-card p-4 border border-[#c5a059]/25 bg-[#120f12]">
            <span className="text-xs font-serif uppercase tracking-wider text-[#dfc282] block mb-2">
              Investigator Aptitude Tier
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: "novice",
                  title: "Novice Medium",
                  turns: "40 Turns",
                  desc: "Generous candle reserves, mild sanity drain.",
                },
                {
                  id: "seasoned",
                  title: "Seasoned Occultist",
                  turns: "30 Turns",
                  desc: "Authentic Victorian challenge. Standard sanity penalties.",
                },
                {
                  id: "skeptic",
                  title: "Hardened Skeptic",
                  turns: "20 Turns",
                  desc: "Ruthless candle burn, punishing paranormal tension.",
                },
              ].map((tier) => (
                <div
                  key={tier.id}
                  onClick={() => setSelectedDifficulty(tier.id as typeof selectedDifficulty)}
                  className={`p-3 border transition-all cursor-pointer select-none ${
                    selectedDifficulty === tier.id
                      ? "bg-[#281e15] border-[#c5a059] shadow-[0_0_12px_rgba(197,160,89,0.2)]"
                      : "bg-[#0d0a0d] border-[#332a22] hover:border-[#c5a059]/40 opacity-70 hover:opacity-100"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-serif text-xs font-semibold text-[#dfc282]">
                      {tier.title}
                    </span>
                    <span className="text-[10px] font-mono text-[#b8a88a]">
                      {tier.turns}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8a7f72] leading-snug">
                    {tier.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Cases Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {caseCatalog.map((c) => {
              const isLocked = c.status === "locked";
              return (
                <div
                  key={c.id}
                  className={`gothic-card p-5 border relative flex flex-col justify-between ${
                    isLocked
                      ? "border-[#332a22] bg-[#0c0a0c]/60 opacity-60"
                      : "border-[#c5a059]/40 bg-[#151113] hover:border-[#c5a059]"
                  }`}
                >
                  <div>
                    {/* Top Tag */}
                    <div className="flex items-center justify-between mb-3 text-[10px] font-mono">
                      <span className="text-[#c5a059]">{c.era}</span>
                      {isLocked ? (
                        <span className="flex items-center gap-1 text-[#8a7f72]">
                          <Lock className="w-3 h-3" /> SEALED
                        </span>
                      ) : (
                        <Badge variant="brass" size="sm">
                          {c.difficulty}
                        </Badge>
                      )}
                    </div>

                    <h3 className="font-serif text-base font-semibold text-[#dfc282] mb-1">
                      {c.title}
                    </h3>
                    <p className="text-xs font-mono text-[#b8a88a] italic mb-3">
                      &ldquo;{c.subtitle}&rdquo;
                    </p>
                    <p className="text-xs text-[#d4c8af] leading-relaxed mb-4">
                      {c.summary}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#c5a059]/15">
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#8a7f72] mb-3">
                      <span>{c.suspectsCount} Suspects</span>
                      <span>•</span>
                      <span>{c.cluesCount} Hidden Clues</span>
                    </div>

                    {isLocked ? (
                      <Button variant="secondary" size="sm" disabled className="w-full">
                        Requires Inquest Clearance
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => onStartNewCase(c.id, selectedDifficulty)}
                        icon={<Play className="w-3.5 h-3.5 text-[#dfc282]" />}
                        className="w-full"
                      >
                        Commence Séance Inquest
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Saved Sessions Tab */
        <div className="space-y-4">
          {displaySessions.length === 0 ? (
            <div className="border border-dashed border-[#3a3028] p-8 text-center text-xs font-mono text-[#7d7265] bg-[#0c0a0c]/40 space-y-3">
              <p>No saved investigations found in the occult archives.</p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setActiveTab("cases")}
                icon={<Play className="w-3.5 h-3.5 text-[#dfc282]" />}
              >
                Browse Case Catalog
              </Button>
            </div>
          ) : (
            displaySessions.map((s) => {
              const isCompleted = s.status === "completed";
              return (
                <div
                  key={s.id}
                  className={`gothic-card p-5 border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                    isCompleted
                      ? "border-[#c5a059]/20 bg-[#120f12] opacity-80 hover:opacity-100"
                      : "border-[#c5a059]/40 bg-[#161214] hover:border-[#c5a059]"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={isCompleted ? "brass" : "chapter"} size="sm">
                        {isCompleted
                          ? `CONCLUDED • ${s.endingAchieved || "VERDICT RENDERED"}`
                          : `ACT ${s.currentAct || 1} • TURN ${s.turnCounter}/${s.maxTurns}`}
                      </Badge>
                      <h3 className="font-serif text-base font-semibold text-[#dfc282]">
                        {s.caseTitle}
                      </h3>
                      <span className="text-[10px] font-mono text-[#7d7265]">
                        ({s.id})
                      </span>
                    </div>
                    <p className="text-xs text-[#b8a88a] font-mono flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-[#c5a059]" />
                      Last Recorded: {s.lastSaved}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <CandleGauge
                      percentage={s.candlePercentage}
                      turnCounter={s.turnCounter}
                      maxTurns={s.maxTurns}
                    />
                    <SanityMeter
                      sanity={s.playerSanity}
                      tension={s.ectoplasmicTension}
                    />
                    <Button
                      variant={isCompleted ? "secondary" : "primary"}
                      size="sm"
                      onClick={() => onSelectSession(s)}
                      icon={<FolderOpen className="w-4 h-4 text-[#dfc282]" />}
                    >
                      {isCompleted ? "Review Archive" : "Resume Séance"}
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

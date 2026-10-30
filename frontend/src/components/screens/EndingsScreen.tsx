"use client";

import React, { useState } from "react";
import Image from "next/image";
import { EndingOutcome } from "../../types";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { ConfirmationDialog } from "../ui/ConfirmationDialog";
import { getEndingAsset } from "../../lib/assetManifest";
import {
  Award,
  CheckCircle2,
  Compass,
  RotateCcw,
  Sparkles,
} from "lucide-react";

export interface EndingsScreenProps {
  outcome: EndingOutcome;
  onStartNewGame: () => void;
  onReviewDossier: () => void;
}

export function EndingsScreen({
  outcome,
  onStartNewGame,
  onReviewDossier,
}: EndingsScreenProps) {
  const [isConfirmRestartOpen, setIsConfirmRestartOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const endingAsset = getEndingAsset(outcome.id);

  const isVictory =
    outcome.verdictType === "exemplary_victory" ||
    outcome.verdictType === "hollow_victory";

  const badgeVariant =
    outcome.verdictType === "exemplary_victory"
      ? "chapter"
      : outcome.verdictType === "hollow_victory"
      ? "amber"
      : "crimson";

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4 animate-in fade-in duration-300">
      {/* Top Medallion */}
      <div className="text-center space-y-2">
        <Badge variant={badgeVariant} size="md">
          {outcome.subtitle}
        </Badge>
        <h1 className="font-serif text-3xl sm:text-4xl text-[#dfc282] uppercase tracking-wide">
          {outcome.title}
        </h1>
        <p className="text-xs font-mono text-[#b8a88a] uppercase tracking-widest">
          {outcome.rating} • Accused: {outcome.culpritNamed}
        </p>
      </div>

      {/* Atmospheric Ending Scene Artwork */}
      <div className="relative w-full aspect-video sm:aspect-[21/9] bg-[#0c090c] border-2 border-[#c5a059]/40 rounded-[2px] overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.8)]">
        {!imageError && endingAsset.isAvailableLocally ? (
          <Image
            src={endingAsset.localPath}
            alt={endingAsset.altText}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 900px"
            className="object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-[#1c0d16] via-[#100810] to-[#080508] flex flex-col items-center justify-center p-6 text-center">
            <div className="w-14 h-14 rounded-full border border-[#c5a059]/40 bg-[#23121d] flex items-center justify-center mb-2 shadow-[0_0_24px_rgba(197,160,89,0.25)]">
              <Sparkles className="w-7 h-7 text-[#dfc282]" />
            </div>
            <span className="font-serif text-sm uppercase tracking-widest text-[#dfc282]">
              {outcome.subtitle}
            </span>
            <p className="text-xs font-mono text-[#8a7f72] mt-1 max-w-sm">
              {endingAsset.caption || "Conclusive Inquest Chronicle"}
            </p>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#160c0f] via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Main Narrative Parchment */}
      <div
        className={`gothic-card p-6 sm:p-8 border-2 rounded-[2px] shadow-[0_8px_32px_rgba(0,0,0,0.9)] relative ${
          isVictory
            ? "border-[#c5a059]/60 bg-[#16120e]"
            : "border-[#8a1f29]/70 bg-[#170c0f]"
        }`}
      >
        <span className="absolute top-2 left-3 text-[10px] text-[#c5a059]/40">✦</span>
        <span className="absolute top-2 right-3 text-[10px] text-[#c5a059]/40">✦</span>
        <span className="absolute bottom-2 left-3 text-[10px] text-[#c5a059]/40">✦</span>
        <span className="absolute bottom-2 right-3 text-[10px] text-[#c5a059]/40">✦</span>

        <h3 className="font-serif text-xs uppercase tracking-widest text-[#dfc282] mb-3 pb-2 border-b border-[#c5a059]/20 flex items-center gap-2">
          <Award className="w-4 h-4 text-[#c5a059]" />
          Conclusive Inquest Chronicle
        </h3>

        <p className="font-serif text-sm sm:text-base text-[#ece3cd] leading-relaxed italic">
          &ldquo;{outcome.narrative}&rdquo;
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Evidence Verification Summary */}
        <div className="gothic-card p-5 border border-[#c5a059]/35 bg-[#141013] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#c5a059]/20">
            <span className="font-serif text-xs font-semibold text-[#dfc282] uppercase tracking-wider">
              Evidence Forensic Verification
            </span>
            <span className="text-[10px] font-mono text-[#8a7f72]">
              {outcome.evidenceSummary.length} Verified Relics
            </span>
          </div>

          <div className="space-y-2">
            {outcome.evidenceSummary.length === 0 ? (
              <p className="text-xs text-[#7d7265] font-mono p-3 bg-[#0a0709] border border-dashed border-[#3a3028]">
                No supporting forensic relics were formally verified prior to verdict delivery.
              </p>
            ) : (
              outcome.evidenceSummary.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-[#191310] border border-[#c5a059]/25 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-serif font-semibold text-[#dfc282]">
                      {item.title}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#86efac]">
                      <CheckCircle2 className="w-3 h-3" /> VERIFIED
                    </span>
                  </div>
                  <p className="text-[11px] text-[#b8a88a] font-mono">
                    {item.significance}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Decisions that Influenced the Ending */}
        <div className="gothic-card p-5 border border-[#c5a059]/35 bg-[#141013] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#c5a059]/20">
            <span className="font-serif text-xs font-semibold text-[#dfc282] uppercase tracking-wider">
              Crucial Inquest Decisions
            </span>
            <span className="text-[10px] font-mono text-[#8a7f72]">
              Causal Weight
            </span>
          </div>

          <div className="space-y-2">
            {outcome.influentialDecisions.map((decision, idx) => (
              <div
                key={idx}
                className="p-3 bg-[#1a120e] border border-[#c5a059]/25 text-xs text-[#d4c8af] font-serif leading-relaxed"
              >
                <span className="text-[#c5a059] mr-1.5 font-bold">◈</span>
                {decision}
              </div>
            ))}
          </div>

          {/* Inquest Performance Vitals */}
          <div className="pt-3 border-t border-[#c5a059]/20 grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-2.5 bg-[#0d090d] border border-[#332a22]">
              <span className="text-[10px] text-[#8a7f72] block">Sanity Retained</span>
              <span className="text-sm font-bold text-[#dfc282]">{outcome.sanityScore}%</span>
            </div>
            <div className="p-2.5 bg-[#0d090d] border border-[#332a22]">
              <span className="text-[10px] text-[#8a7f72] block">Turns Expended</span>
              <span className="text-sm font-bold text-[#ece3cd]">{outcome.turnsTaken} Turns</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="pt-4 border-t border-[#c5a059]/25 flex items-center justify-between gap-3 flex-wrap">
        <Button
          variant="secondary"
          size="md"
          onClick={onReviewDossier}
          icon={<Compass className="w-4 h-4 text-[#dfc282]" />}
        >
          Review Investigation Dossier
        </Button>

        <Button
          variant="primary"
          size="lg"
          onClick={() => setIsConfirmRestartOpen(true)}
          icon={<RotateCcw className="w-4 h-4 text-[#dfc282]" />}
        >
          Begin New Investigation
        </Button>
      </div>

      {/* Confirmation Dialog before starting new investigation */}
      <ConfirmationDialog
        isOpen={isConfirmRestartOpen}
        onCancel={() => setIsConfirmRestartOpen(false)}
        onConfirm={() => {
          setIsConfirmRestartOpen(false);
          onStartNewGame();
        }}
        title="Start New Investigation?"
        description="Are you prepared to close this case file and commence a fresh inquest at Blackwood Manor? Your current resolution is safely recorded."
        confirmLabel="Commence New Inquest"
        variant="primary"
      />
    </div>
  );
}

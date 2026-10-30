"use client";

import React, { useState } from "react";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { ConfirmationDialog } from "../ui/ConfirmationDialog";
import {
  Compass,
  Eye,
  Volume2,
  VolumeX,
  ShieldAlert,
  ArrowLeft,
  Play,
} from "lucide-react";
import { soundEngine } from "../../lib/audio";

export interface SetupScreenProps {
  hasExistingSession: boolean;
  onConfirmStartNew: (options: {
    difficulty: "novice" | "seasoned" | "skeptic";
    highContrast: boolean;
    reducedMotion: boolean;
    unmuteAudio: boolean;
    audioPreset: "cellar_drone" | "rain_storm" | "silent_crypt";
  }) => void;
  onCancel: () => void;
}

export function SetupScreen({
  hasExistingSession,
  onConfirmStartNew,
  onCancel,
}: SetupScreenProps) {
  const [difficulty, setDifficulty] = useState<"novice" | "seasoned" | "skeptic">("seasoned");
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [unmuteAudio, setUnmuteAudio] = useState(false);
  const [audioPreset, setAudioPreset] = useState<"cellar_drone" | "rain_storm" | "silent_crypt">(
    "cellar_drone"
  );

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const handleStartClicked = () => {
    if (hasExistingSession) {
      setIsConfirmModalOpen(true);
    } else {
      executeStart();
    }
  };

  const executeStart = () => {
    if (unmuteAudio) {
      if (soundEngine.getIsMuted()) {
        soundEngine.toggleMute();
      }
      soundEngine.startAmbience(audioPreset);
    }
    onConfirmStartNew({
      difficulty,
      highContrast,
      reducedMotion,
      unmuteAudio,
      audioPreset,
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#c5a059]/30">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            Back
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-[#dfc282]" />
              <h2 className="font-serif text-2xl text-[#dfc282] uppercase tracking-wide">
                Investigation Setup
              </h2>
            </div>
            <p className="text-xs text-[#b8a88a] font-mono mt-0.5">
              Blackwood Manor: The Thirteenth Chime • Chamber Inquest Calibration
            </p>
          </div>
        </div>

        <Badge variant="chapter" size="sm">
          Act I Preparation
        </Badge>
      </div>

      {/* Fictional Scenario Disclaimer Box */}
      <div className="gothic-card p-4 border border-[#c5a059]/40 bg-[#161011] flex items-start gap-3 rounded-[2px]">
        <ShieldAlert className="w-5 h-5 text-[#f5b041] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-serif text-xs font-semibold text-[#dfc282] uppercase tracking-wider">
            Historical Fiction Disclaimer
          </h4>
          <p className="text-xs text-[#d4c8af] leading-relaxed">
            The scenario <em>Blackwood Manor: The Thirteenth Chime</em> is a work of fiction set in London, October 1922. All characters, spectral mediums, criminal acts, and occult entities depicted are purely imaginary. No real historical figures or occult societies are referenced.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Difficulty Tier */}
        <div className="gothic-card p-5 border border-[#c5a059]/35 bg-[#141013] space-y-4">
          <div className="pb-2 border-b border-[#c5a059]/20">
            <h3 className="font-serif text-sm font-semibold text-[#dfc282] uppercase tracking-wider">
              1. Inquest Difficulty Tier
            </h3>
            <p className="text-[11px] text-[#8a7f72] font-mono">
              Controls candle duration and psychic tension penalties.
            </p>
          </div>

          <div className="space-y-2.5">
            {[
              {
                id: "novice",
                title: "Novice Medium",
                turns: "40 Turns",
                desc: "Generous candle reserves, forgiving sanity drain. Ideal for first-time deduction.",
              },
              {
                id: "seasoned",
                title: "Seasoned Occultist",
                turns: "30 Turns",
                desc: "Authentic Victorian challenge. Standard sanity penalties and subtle clue triggers.",
              },
              {
                id: "skeptic",
                title: "Hardened Skeptic",
                turns: "20 Turns",
                desc: "Rapid candle burn, severe psychic strain, and volatile spirit manifestations.",
              },
            ].map((tier) => (
              <div
                key={tier.id}
                onClick={() => setDifficulty(tier.id as typeof difficulty)}
                className={`p-3.5 border transition-all cursor-pointer rounded-[2px] select-none ${
                  difficulty === tier.id
                    ? "bg-[#251d16] border-[#c5a059] shadow-[0_0_12px_rgba(197,160,89,0.25)]"
                    : "bg-[#0d0a0d] border-[#332a22] hover:border-[#c5a059]/40 opacity-75 hover:opacity-100"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-serif text-xs font-semibold text-[#dfc282]">
                    {tier.title}
                  </span>
                  <Badge variant={difficulty === tier.id ? "amber" : "brass"} size="sm">
                    {tier.turns}
                  </Badge>
                </div>
                <p className="text-[11px] text-[#8a7f72] leading-relaxed">
                  {tier.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Accessibility & Optional Audio Settings */}
        <div className="space-y-4">
          {/* Visual Accessibility */}
          <div className="gothic-card p-5 border border-[#c5a059]/35 bg-[#141013] space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-[#c5a059]/20">
              <Eye className="w-4 h-4 text-[#dfc282]" />
              <h3 className="font-serif text-sm font-semibold text-[#dfc282] uppercase tracking-wider">
                2. Visual & Accessibility
              </h3>
            </div>

            <div className="space-y-2 text-xs">
              <label className="flex items-center justify-between p-2.5 bg-[#0d0a0d] border border-[#332a22] cursor-pointer">
                <div>
                  <span className="font-serif text-xs text-[#dfc282] block">
                    Restrain Motion & Candle Flicker
                  </span>
                  <span className="text-[10px] text-[#7d7265] font-mono">
                    Conforms strictly to prefers-reduced-motion
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={reducedMotion}
                  onChange={(e) => setReducedMotion(e.target.checked)}
                  className="accent-[#c5a059] w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 bg-[#0d0a0d] border border-[#332a22] cursor-pointer">
                <div>
                  <span className="font-serif text-xs text-[#dfc282] block">
                    High-Contrast Parchment Typography
                  </span>
                  <span className="text-[10px] text-[#7d7265] font-mono">
                    Increases contrast of dialogue transcript text
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={highContrast}
                  onChange={(e) => setHighContrast(e.target.checked)}
                  className="accent-[#c5a059] w-4 h-4 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Optional Audio Settings (Muted by default) */}
          <div className="gothic-card p-5 border border-[#c5a059]/35 bg-[#141013] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#c5a059]/20">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-[#dfc282]" />
                <h3 className="font-serif text-sm font-semibold text-[#dfc282] uppercase tracking-wider">
                  3. Atmospheric Audio (Optional)
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[#8a7f72]">
                Muted by Default
              </span>
            </div>

            <label className="flex items-center justify-between p-2.5 bg-[#0d0a0d] border border-[#332a22] cursor-pointer">
              <div className="flex items-center gap-2">
                {unmuteAudio ? (
                  <Volume2 className="w-4 h-4 text-[#e29d42]" />
                ) : (
                  <VolumeX className="w-4 h-4 text-[#7d7265]" />
                )}
                <div>
                  <span className="font-serif text-xs text-[#dfc282] block">
                    Enable Atmospheric Audio at Start
                  </span>
                  <span className="text-[10px] text-[#7d7265] font-mono">
                    {unmuteAudio ? "Audio will play on launch" : "Audio starts muted (recommended)"}
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={unmuteAudio}
                onChange={(e) => setUnmuteAudio(e.target.checked)}
                className="accent-[#c5a059] w-4 h-4 cursor-pointer"
              />
            </label>

            {unmuteAudio && (
              <div className="space-y-1.5 pt-2">
                <span className="text-[10px] font-mono uppercase text-[#7d7265]">
                  Ambience Preset
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: "cellar_drone", label: "Crypt Drone" },
                    { id: "rain_storm", label: "Mansion Rain" },
                    { id: "silent_crypt", label: "Silence" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setAudioPreset(p.id as typeof audioPreset)}
                      className={`text-[10px] p-1.5 font-mono border text-center transition-all ${
                        audioPreset === p.id
                          ? "border-[#c5a059] bg-[#2a221b] text-[#dfc282]"
                          : "border-[#302c28] bg-[#0c0a0c] text-[#8a7f72]"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Start Button Bar */}
      <div className="pt-4 border-t border-[#c5a059]/25 flex items-center justify-end gap-3">
        <Button variant="secondary" size="md" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="primary"
          size="lg"
          onClick={handleStartClicked}
          icon={<Play className="w-4 h-4 text-[#dfc282]" />}
        >
          Begin Inquest at Blackwood Manor
        </Button>
      </div>

      {/* Confirmation Dialog before abandoning existing session */}
      <ConfirmationDialog
        isOpen={isConfirmModalOpen}
        onCancel={() => setIsConfirmModalOpen(false)}
        onConfirm={() => {
          setIsConfirmModalOpen(false);
          executeStart();
        }}
        title="Supersede Ongoing Investigation?"
        description="An active investigation session already exists on this workstation. Commencing a new investigation will supersede your uncompleted session. Are you certain you wish to proceed?"
        confirmLabel="Supersede & Begin New Inquest"
        variant="destructive"
      />
    </div>
  );
}

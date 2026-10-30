"use client";

import React, { useState } from "react";
import { ScreenId, OllamaDiagnostic } from "../../types";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Modal } from "../ui/Modal";
import { EnvironmentScene } from "../game/EnvironmentScene";
import {
  Compass,
  Settings,
  HelpCircle,
  Play,
  Cpu,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export interface TitleScreenProps {
  onNavigate: (screen: ScreenId) => void;
  onNewGame: () => void;
  onContinue: () => void;
  hasSavedSession: boolean;
  savedSessionSummary?: string;
  diagnostic: OllamaDiagnostic;
  onProbeOllama: () => void;
}

export function TitleScreen({
  onNavigate,
  onNewGame,
  onContinue,
  hasSavedSession,
  savedSessionSummary,
  diagnostic,
  onProbeOllama,
}: TitleScreenProps) {
  const [isCreditsOpen, setIsCreditsOpen] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4 py-6 relative">
      {/* Victorian Ornamental Header Filigree */}
      <div className="w-full max-w-3xl flex items-center justify-center gap-3 text-[#c5a059]/40 mb-3 select-none">
        <span className="h-px bg-gradient-to-r from-transparent via-[#c5a059]/50 to-transparent flex-1" />
        <span className="text-xs tracking-widest text-[#dfc282]">✦ ❖ ✦</span>
        <span className="h-px bg-gradient-to-r from-transparent via-[#c5a059]/50 to-transparent flex-1" />
      </div>

      {/* Atmospheric Manor Exterior Artwork */}
      <div className="w-full max-w-xl mb-6">
        <EnvironmentScene
          roomId="manor_exterior"
          aspectRatio="banner"
          roomName="Blackwood Manor"
          subtitle="Coastal Headlands • October 1922"
          overlayOpacity={0.3}
          showCaption={true}
        />
      </div>

      {/* Case Subtitle & Badges */}
      <div className="flex items-center gap-2 mb-2">
        <Badge variant="chapter" size="md">
          Case 01
        </Badge>
        <Badge variant="brass" size="md">
          Victorian Supernatural Mystery
        </Badge>
      </div>

      <h1 className="font-serif text-3xl sm:text-5xl font-normal text-[#dfc282] tracking-wider uppercase mb-2 drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
        The Thirteenth Chime
      </h1>

      <p className="font-serif italic text-sm sm:text-base text-[#d4c8af] max-w-xl leading-relaxed mb-6">
        &ldquo;When the grandfather clock struck thirteen, Lady Eleanor breathed her last. Summon the dead, interrogate the living, and name the killer before the ward candle expires.&rdquo;
      </p>

      {/* Primary Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md mb-6">
        <Button
          variant="primary"
          size="lg"
          onClick={onNewGame}
          icon={<Compass className="w-5 h-5 text-[#dfc282]" />}
          className="w-full text-base py-3"
        >
          New Investigation
        </Button>

        <div className="w-full">
          <Button
            variant="secondary"
            size="lg"
            disabled={!hasSavedSession}
            onClick={onContinue}
            icon={<Play className="w-4 h-4 text-[#c5a059]" />}
            className="w-full text-sm py-3"
            title={
              hasSavedSession
                ? `Resume: ${savedSessionSummary || "Active Case"}`
                : "No saved investigation found on local device"
            }
          >
            Continue Inquest
          </Button>
          {!hasSavedSession && (
            <span className="text-[10px] text-[#7d7265] font-mono block mt-1">
              [No active saved session found]
            </span>
          )}
        </div>
      </div>

      {/* Secondary Fast Nav Links: Settings & Credits */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate("settings")}
          icon={<Settings className="w-3.5 h-3.5 text-[#c5a059]" />}
        >
          Chamber Settings & AI
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCreditsOpen(true)}
          icon={<HelpCircle className="w-3.5 h-3.5 text-[#b8a88a]" />}
        >
          Dossier Credits
        </Button>
      </div>

      {/* Local AI Readiness & Offline Status Banner */}
      <div className="gothic-card p-3.5 max-w-lg w-full border border-[#c5a059]/30 bg-[#120e11]/90 text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-start gap-2.5">
          {diagnostic.connected && diagnostic.textModelAvailable !== false ? (
            <CheckCircle2 className="w-4 h-4 text-[#38bdf8] shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-[#f5b041] shrink-0 mt-0.5" />
          )}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-serif font-semibold text-[#dfc282] uppercase tracking-wider">
                Local AI System
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 border rounded-[1px] bg-[#0e1d24] border-[#38bdf8]/40 text-[#7dd3fc]">
                {diagnostic.statusText === "ollama_unavailable"
                  ? "Ollama unavailable"
                  : diagnostic.statusText === "model_unavailable"
                  ? "Model unavailable"
                  : diagnostic.statusText === "checking"
                  ? "Checking local AI"
                  : "Local AI ready"}
              </span>
            </div>
            <p className="text-[11px] text-[#b8a88a] mt-0.5 leading-snug">
              Text: <code className="text-[#dfc282]">{diagnostic.activeModel}</code>
              {diagnostic.visionModel && (
                <> • Vision: <code className="text-[#c5a059]">{diagnostic.visionModel}</code></>
              )}
              {diagnostic.latencyMs ? ` • ${diagnostic.latencyMs}ms` : ""}
            </p>
            {diagnostic.actionableMessage && (
              <p className="text-[10px] font-mono text-[#fcd34d] mt-1">
                {diagnostic.actionableMessage}
              </p>
            )}
          </div>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={onProbeOllama}
          icon={<Cpu className="w-3 h-3 text-[#c5a059]" />}
          className="text-[10px] py-1 px-2 shrink-0 self-end sm:self-center"
        >
          Probe AI
        </Button>
      </div>

      {/* Credits / Historical Fiction Modal */}
      <Modal
        isOpen={isCreditsOpen}
        onClose={() => setIsCreditsOpen(false)}
        title="Séance Studio: Project Credits & Lore"
        subtitle="Victorian Spiritualism & Offline Interactive Fiction"
        maxWidth="md"
        footer={
          <Button variant="primary" size="sm" onClick={() => setIsCreditsOpen(false)}>
            Close Dossier
          </Button>
        }
      >
        <div className="space-y-4 text-xs text-[#d4c8af] leading-relaxed">
          <div className="p-3 bg-[#17110d] border border-[#c5a059]/30">
            <h4 className="font-serif font-bold text-[#dfc282] uppercase mb-1">
              Historical Fiction Disclaimer
            </h4>
            <p>
              <em>Blackwood Manor: The Thirteenth Chime</em> is a work of interactive supernatural detective fiction set in London, October 1922. All characters, spectral entities, toxicology reports, and estate deeds are entirely fictional creations.
            </p>
          </div>

          <div>
            <h4 className="font-serif font-bold text-[#dfc282] uppercase mb-1">
              Architectural & AI Principles
            </h4>
            <p>
              Séance Studio was engineered as an <strong>offline-first local application</strong>. Generative AI operations execute strictly via local Ollama open-weight language models on localhost. The game engine enforces deterministic clue discovery, sanity mechanics, and truth matrix verification.
            </p>
          </div>

          <div className="pt-2 border-t border-[#c5a059]/20 flex items-center justify-between text-[11px] font-mono text-[#8a7f72]">
            <span>Stack: Next.js 16 • Tailwind CSS • Web Audio API</span>
            <span>Version: 1.0.0 Phase 2</span>
          </div>
        </div>
      </Modal>
    </div>
  );
}

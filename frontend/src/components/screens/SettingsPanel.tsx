"use client";

import React, { useState } from "react";
import { OllamaDiagnostic } from "../../types";
import { Button } from "../ui/Button";
import { OfflineStateBadge } from "../ui/States";
import {
  Settings,
  Cpu,
  ShieldCheck,
  Eye,
  CheckCircle2,
  RefreshCw,
  Lock,
} from "lucide-react";

export interface SettingsPanelProps {
  diagnostic: OllamaDiagnostic;
  onRefreshDiagnostic: () => void;
  onModelChange: (model: string) => void;
}

export function SettingsPanel({
  diagnostic,
  onRefreshDiagnostic,
  onModelChange,
}: SettingsPanelProps) {
  const [selectedModel, setSelectedModel] = useState(diagnostic.activeModel);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(180);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);

  const handleApplyModel = () => {
    onModelChange(selectedModel);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-[#c5a059]/30 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#dfc282]" />
            <h2 className="font-serif text-2xl text-[#dfc282] uppercase tracking-wide">
              Chamber Configuration & AI Diagnostic
            </h2>
          </div>
          <p className="text-xs text-[#b8a88a] font-mono mt-0.5">
            Local Ollama daemon status, offline compliance, and accessibility parameters.
          </p>
        </div>

        <OfflineStateBadge endpoint={diagnostic.endpoint} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: Local Ollama & Language Model */}
        <div className="gothic-card p-5 border border-[#c5a059]/40 bg-[#141013] space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#c5a059]/20">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#dfc282]" />
              <h3 className="font-serif text-sm font-semibold text-[#dfc282] uppercase tracking-wider">
                Local AI Engine (Ollama)
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefreshDiagnostic}
              icon={<RefreshCw className="w-3 h-3 text-[#c5a059]" />}
              className="text-[10px] p-1 text-[#b8a88a]"
            >
              Probe Endpoint
            </Button>
          </div>

          {/* Connection Status Banner */}
          <div className="p-3 bg-[#0c1619] border border-[#38bdf8]/40 rounded-[1px] flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs font-mono text-[#7dd3fc]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#38bdf8]" />
                <span>DAEMON ACTIVE: {diagnostic.endpoint}</span>
              </div>
              <p className="text-[10px] font-mono text-[#8a7f72]">
                Hardware: NVIDIA GeForce RTX 4060 (GPU Accelerated)
              </p>
            </div>
            <span className="text-[10px] font-mono text-[#38bdf8] bg-[#09222b] px-2 py-0.5 border border-[#38bdf8]/40">
              {diagnostic.latencyMs || 120}ms Latency
            </span>
          </div>

          {/* Model Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-serif uppercase tracking-wider text-[#dfc282] block">
              Active Open-Weight Model
            </label>
            <div className="flex items-center gap-2">
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="flex-1 bg-[#0b080b] border border-[#c5a059]/30 text-xs font-mono text-[#dfc282] p-2 rounded-[1px] focus:outline-none focus:border-[#c5a059]"
              >
                {diagnostic.availableModels.map((m) => (
                  <option key={m} value={m}>
                    {m} (Installed Locally)
                  </option>
                ))}
              </select>
              <Button
                variant="primary"
                size="sm"
                onClick={handleApplyModel}
                disabled={selectedModel === diagnostic.activeModel}
              >
                Apply
              </Button>
            </div>
          </div>

          {/* Anti-Auto-Download Policy Notice */}
          <div className="p-3 bg-[#1a120e] border border-[#c5a059]/30 text-[11px] text-[#b8a88a] space-y-1">
            <div className="flex items-center gap-1.5 text-[#f5b041] font-semibold font-mono text-[10px] uppercase">
              <Lock className="w-3 h-3" /> Strict Local Air-Gap Policy
            </div>
            <p className="leading-relaxed">
              Séance Studio will <strong>never</strong> automatically download or silently switch models. All model weights must be retrieved manually via <code>ollama pull &lt;model&gt;</code> in your local terminal.
            </p>
          </div>

          {/* Inference Parameters */}
          <div className="space-y-3 pt-2 border-t border-[#c5a059]/20">
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono text-[#b8a88a]">
                <span>Temperature (Spirit Erraticism):</span>
                <span className="text-[#dfc282]">{temperature.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="1.0"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-[#c5a059] bg-[#090709] h-1.5 rounded cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono text-[#b8a88a]">
                <span>Response Token Ceiling:</span>
                <span className="text-[#dfc282]">{maxTokens} tokens</span>
              </div>
              <input
                type="range"
                min="60"
                max="300"
                step="10"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value, 10))}
                className="w-full accent-[#c5a059] bg-[#090709] h-1.5 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Privacy, Audio & Visual Accessibility */}
        <div className="space-y-6">
          {/* Privacy & Air-Gap Verification */}
          <div className="gothic-card p-5 border border-[#c5a059]/40 bg-[#141013] space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-[#c5a059]/20">
              <ShieldCheck className="w-4 h-4 text-[#38bdf8]" />
              <h3 className="font-serif text-sm font-semibold text-[#dfc282] uppercase tracking-wider">
                Privacy & Data Sovereignty
              </h3>
            </div>

            <div className="space-y-2 text-xs font-mono text-[#d4c8af]">
              <div className="flex items-center justify-between p-2 bg-[#0d0a0d] border border-[#332a22]">
                <span>External Telemetry & Analytics:</span>
                <span className="text-[#86efac] font-bold">DISABLED (0 BEACONS)</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-[#0d0a0d] border border-[#332a22]">
                <span>Local State Storage:</span>
                <span className="text-[#dfc282]">SQLite (seance_studio.db)</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-[#0d0a0d] border border-[#332a22]">
                <span>Cloud Inference Fallback:</span>
                <span className="text-[#86efac] font-bold">STRICTLY PROHIBITED</span>
              </div>
            </div>
          </div>

          {/* Visual & Motion Accessibility */}
          <div className="gothic-card p-5 border border-[#c5a059]/40 bg-[#141013] space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-[#c5a059]/20">
              <Eye className="w-4 h-4 text-[#dfc282]" />
              <h3 className="font-serif text-sm font-semibold text-[#dfc282] uppercase tracking-wider">
                Visual & Motion Accessibility
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <label className="flex items-center justify-between p-2 bg-[#0d0a0d] border border-[#332a22] cursor-pointer">
                <div>
                  <span className="font-serif text-xs text-[#dfc282] block">
                    Restrain Motion & Candle Flicker
                  </span>
                  <span className="text-[10px] text-[#7d7265] font-mono">
                    Conforms to prefers-reduced-motion
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={reducedMotion}
                  onChange={(e) => setReducedMotion(e.target.checked)}
                  className="accent-[#c5a059] w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2 bg-[#0d0a0d] border border-[#332a22] cursor-pointer">
                <div>
                  <span className="font-serif text-xs text-[#dfc282] block">
                    High-Contrast Parchment Typography
                  </span>
                  <span className="text-[10px] text-[#7d7265] font-mono">
                    Boosts text luminance against mahogany backgrounds
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
        </div>
      </div>
    </div>
  );
}

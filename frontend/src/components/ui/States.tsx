"use client";

import React from "react";
import { AlertOctagon, ShieldCheck, Compass, Lock, RefreshCw } from "lucide-react";
import { Button } from "./Button";

export function LoadingState({
  message = "Communing with the Ethereal Plane...",
  subtext = "The planchette hesitates upon the mahogany board...",
}: {
  message?: string;
  subtext?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {/* Occult Sigil Spinner */}
      <div className="relative w-16 h-16 mb-4 flex items-center justify-center">
        <div className="absolute inset-0 border border-[#c5a059]/30 rounded-full animate-spin [animation-duration:8s]" />
        <div className="absolute inset-2 border border-dashed border-[#dfc282]/50 rounded-full animate-spin [animation-duration:12s] [animation-direction:reverse]" />
        <span className="text-[#c5a059] text-xl animate-candle-flame">✦</span>
      </div>
      <h3 className="font-serif text-base text-[#dfc282] tracking-wider uppercase mb-1">
        {message}
      </h3>
      <p className="text-xs text-[#b8a88a] font-mono max-w-sm">
        {subtext}
      </p>
    </div>
  );
}

export function ErrorState({
  title = "Paranormal Transmission Severed",
  message = "An unseen interference has disrupted the spectral channel.",
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="gothic-card border border-[#8a1f29]/70 bg-[#1c0b0f]/80 p-6 text-center max-w-md mx-auto my-6">
      <div className="inline-flex p-3 bg-[#2b0c13] border border-[#8a1f29] text-[#fca5a5] mb-3">
        <AlertOctagon className="w-6 h-6" />
      </div>
      <h3 className="font-serif text-base text-[#fca5a5] tracking-wider uppercase mb-1">
        {title}
      </h3>
      <p className="text-xs text-[#d4c8af] leading-relaxed mb-4">
        {message}
      </p>
      {onRetry && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onRetry}
          icon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Re-establish Séance Channel
        </Button>
      )}
    </div>
  );
}

export function EmptyState({
  title = "The Archive Remains Silent",
  description = "No entries or relics have been cataloged in this section of the dossier.",
  actionLabel,
  onAction,
}: {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="border border-dashed border-[#c5a059]/25 p-8 text-center max-w-md mx-auto my-6 bg-[#0f0c0e]/60">
      <div className="inline-flex p-3 text-[#c5a059]/60 mb-3">
        <Compass className="w-8 h-8" />
      </div>
      <h3 className="font-serif text-sm text-[#dfc282] tracking-wider uppercase mb-1">
        {title}
      </h3>
      <p className="text-xs text-[#b8a88a] leading-relaxed mb-4">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export function OfflineStateBadge({
  endpoint = "127.0.0.1:11434",
}: {
  endpoint?: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#16120e] border border-[#c5a059]/40 text-[#dfc282] text-xs font-mono shadow-[0_2px_6px_rgba(0,0,0,0.5)]">
      <ShieldCheck className="w-3.5 h-3.5 text-[#38bdf8]" />
      <span className="text-[10px] uppercase tracking-wider text-[#b8a88a]">
        AIR-GAPPED LOCAL CHAMBER
      </span>
      <span className="text-[10px] text-[#7d7265] border-l border-[#c5a059]/30 pl-2">
        {endpoint}
      </span>
    </div>
  );
}

export function AIModelStatusBadge({
  status = "ready",
  model = "qwen3:4b",
  className = "",
}: {
  status?: "ready" | "ollama_unavailable" | "model_unavailable" | "checking" | "offline";
  model?: string;
  className?: string;
}) {
  switch (status) {
    case "ready":
      return (
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#091b22] border border-[#38bdf8]/50 text-[#7dd3fc] text-[10px] font-mono rounded-[1px] shadow-sm ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] animate-pulse" />
          <span className="font-semibold uppercase tracking-wider">Local AI ready</span>
          <span className="text-[#38bdf8]/70 border-l border-[#38bdf8]/30 pl-1.5">{model}</span>
        </div>
      );
    case "ollama_unavailable":
      return (
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#260f12] border border-[#ef4444]/50 text-[#fca5a5] text-[10px] font-mono rounded-[1px] ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]" />
          <span className="font-semibold uppercase tracking-wider">Ollama unavailable</span>
          <span className="text-[#fca5a5]/70 border-l border-[#ef4444]/30 pl-1.5">Run &apos;ollama serve&apos;</span>
        </div>
      );
    case "model_unavailable":
      return (
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#23170a] border border-[#f5b041]/50 text-[#fcd34d] text-[10px] font-mono rounded-[1px] ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#f5b041]" />
          <span className="font-semibold uppercase tracking-wider">Model unavailable</span>
          <span className="text-[#fcd34d]/70 border-l border-[#f5b041]/30 pl-1.5">{model}</span>
        </div>
      );
    case "checking":
      return (
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#16120e] border border-[#c5a059]/40 text-[#dfc282] text-[10px] font-mono rounded-[1px] animate-pulse ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#c5a059]" />
          <span className="font-semibold uppercase tracking-wider">Checking local AI...</span>
        </div>
      );
    default:
      return (
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#141215] border border-[#7d7265]/40 text-[#a89984] text-[10px] font-mono rounded-[1px] ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#7d7265]" />
          <span className="font-semibold uppercase tracking-wider">Air-Gapped Standalone</span>
        </div>
      );
  }
}

export function DisabledState({
  label = "Sealed by Order of the High Constable",
  reason = "Requires the Master Brass Key to unlock this threshold.",
}: {
  label?: string;
  reason?: string;
}) {
  return (
    <div className="opacity-50 border border-[#3a3028] bg-[#120f0d] p-4 flex items-center gap-3 select-none">
      <div className="p-2 border border-[#3a3028] bg-[#1c1713] text-[#7d7265]">
        <Lock className="w-4 h-4" />
      </div>
      <div>
        <div className="text-xs font-serif text-[#9b855b] uppercase tracking-wider">
          {label}
        </div>
        <div className="text-[11px] text-[#6d6356] font-mono">
          {reason}
        </div>
      </div>
    </div>
  );
}

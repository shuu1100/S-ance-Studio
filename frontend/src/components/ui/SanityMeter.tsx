"use client";

import React from "react";
import { Brain, Activity } from "lucide-react";

export interface SanityMeterProps {
  sanity: number; // 0 to 100
  tension: number; // 0 to 100
  className?: string;
}

export function SanityMeter({ sanity, tension, className = "" }: SanityMeterProps) {
  const clampedSanity = Math.max(0, Math.min(100, sanity));
  const isCritical = clampedSanity < 30;
  const isDisturbed = clampedSanity >= 30 && clampedSanity < 60;

  const barColor = isCritical
    ? "bg-gradient-to-r from-[#8a1f29] to-[#ef4444]"
    : isDisturbed
    ? "bg-gradient-to-r from-[#b38c47] to-[#e29d42]"
    : "bg-gradient-to-r from-[#88652c] to-[#dfc282]";

  return (
    <div
      className={`flex items-center gap-3 px-3 py-1.5 bg-[#14100c] border border-[#c5a059]/30 shadow-[0_2px_8px_rgba(0,0,0,0.6)] ${className}`}
      title={`Investigator Sanity: ${clampedSanity}% • Paranormal Tension: ${tension}%`}
    >
      <div className="shrink-0 p-1.5 bg-[#1f1812] border border-[#c5a059]/30 text-[#dfc282]">
        <Brain
          className={`w-4 h-4 ${isCritical ? "text-[#ef4444] animate-pulse" : "text-[#dfc282]"}`}
        />
      </div>

      <div className="flex flex-col min-w-[110px]">
        <div className="flex items-center justify-between text-[11px] font-serif uppercase tracking-wider text-[#dfc282]">
          <span>Sanity</span>
          <span
            className={`font-mono text-xs font-semibold ${
              isCritical ? "text-[#ef4444]" : "text-[#ece3cd]"
            }`}
          >
            {clampedSanity}%
          </span>
        </div>

        {/* Progress Track */}
        <div className="w-full h-1.5 bg-[#0a0807] border border-[#c5a059]/20 rounded-[1px] overflow-hidden mt-1">
          <div
            style={{ width: `${clampedSanity}%` }}
            className={`h-full transition-all duration-300 ${barColor}`}
          />
        </div>

        {/* Tension subtle indicator */}
        <div className="flex items-center gap-1 mt-0.5 text-[9px] text-[#7d7265] font-mono">
          <Activity className="w-2.5 h-2.5 text-[#e29d42]" />
          <span>Tension: {tension}%</span>
        </div>
      </div>
    </div>
  );
}

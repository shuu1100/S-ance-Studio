"use client";

import React from "react";
import { Flame } from "lucide-react";

export interface CandleGaugeProps {
  percentage: number; // 0 to 100
  turnCounter: number;
  maxTurns: number;
  className?: string;
}

export function CandleGauge({
  percentage,
  turnCounter,
  maxTurns,
  className = "",
}: CandleGaugeProps) {
  const clamped = Math.max(0, Math.min(100, percentage));
  // Height of wax stick: 10px to 48px based on percentage
  const waxHeight = Math.max(8, Math.round((clamped / 100) * 44));

  const isLow = clamped < 25;

  return (
    <div
      className={`flex items-center gap-3 px-3 py-1.5 bg-[#14100c] border border-[#c5a059]/30 shadow-[0_2px_8px_rgba(0,0,0,0.6)] ${className}`}
      title={`Ward Candle: ${clamped.toFixed(1)}% remaining (${turnCounter}/${maxTurns} turns)`}
    >
      {/* Candle Graphic */}
      <div className="relative w-7 h-16 flex flex-col items-center justify-end">
        {/* Animated Flame */}
        {clamped > 0 ? (
          <div className="relative -mb-1 animate-candle-flame">
            {/* Outer halo */}
            <div className="w-4 h-6 rounded-full bg-gradient-to-t from-[#f5b041] via-[#f39c12] to-transparent blur-[1px] opacity-90" />
            {/* Inner white-hot core */}
            <div className="absolute inset-x-1 bottom-0.5 h-3 rounded-full bg-gradient-to-t from-[#fffdf5] to-[#f5b041]" />
            {/* Wick */}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0.5 h-2 bg-[#2d1e12]" />
          </div>
        ) : (
          <div className="text-[10px] text-[#7d7265] font-mono mb-1">
            [SNUFFED]
          </div>
        )}

        {/* Wax Column */}
        <div
          style={{ height: `${waxHeight}px` }}
          className={`w-3.5 rounded-t-[1px] transition-all duration-500 relative border border-[#c5a059]/40 ${
            isLow
              ? "bg-gradient-to-b from-[#6b1e22] to-[#2b0c10]"
              : "bg-gradient-to-b from-[#dfc282] via-[#b8954e] to-[#7a5b28]"
          }`}
        >
          {/* Subtle wax drip */}
          <div className="absolute -left-0.5 top-1 w-1 h-2 bg-[#dfc282]/80 rounded-full" />
        </div>

        {/* Brass Candle Dish Base */}
        <div className="w-6 h-1.5 bg-gradient-to-r from-[#88652c] via-[#c5a059] to-[#88652c] rounded-sm border-t border-[#dfc282]/60 shadow-sm" />
      </div>

      {/* Numerical & Label Readout */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <Flame
            className={`w-3.5 h-3.5 ${
              isLow ? "text-[#ef4444] animate-pulse" : "text-[#f5b041]"
            }`}
          />
          <span className="text-[11px] font-serif uppercase tracking-wider text-[#dfc282]">
            Ward Candle
          </span>
        </div>
        <div className="flex items-baseline gap-1 mt-0.5">
          <span
            className={`font-mono text-sm font-semibold ${
              isLow ? "text-[#ef4444]" : "text-[#ece3cd]"
            }`}
          >
            {clamped.toFixed(0)}%
          </span>
          <span className="text-[10px] text-[#7d7265] font-mono">
            ({turnCounter}/{maxTurns} turns)
          </span>
        </div>
      </div>
    </div>
  );
}

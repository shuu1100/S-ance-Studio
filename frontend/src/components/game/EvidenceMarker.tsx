"use client";

import React from "react";

export interface EvidenceMarkerProps {
  label: string; // e.g. "A-1", "B", "1"
  variant?: "brass" | "crimson" | "amber";
  size?: "sm" | "md";
  className?: string;
}

export function EvidenceMarker({
  label,
  variant = "brass",
  size = "md",
  className = "",
}: EvidenceMarkerProps) {
  const sizeStyles = {
    sm: "w-6 h-6 text-[10px]",
    md: "w-8 h-8 text-xs",
  }[size];

  const variantStyles = {
    brass:
      "bg-gradient-to-b from-[#dfc282] via-[#b38c47] to-[#7a5b28] text-[#1c1510] border-[#f5d794]",
    crimson:
      "bg-gradient-to-b from-[#8a1f29] to-[#3a0d12] text-[#fca5a5] border-[#f87171]",
    amber:
      "bg-gradient-to-b from-[#f5b041] to-[#8c5717] text-[#1f1508] border-[#fed7aa]",
  }[variant];

  return (
    <div
      className={`inline-flex items-center justify-center font-mono font-bold rounded-full border shadow-[0_2px_6px_rgba(0,0,0,0.8)] select-none shrink-0 ${sizeStyles} ${variantStyles} ${className}`}
      title={`Forensic Evidence Tag #${label}`}
    >
      {label}
    </div>
  );
}

"use client";

import React from "react";

export interface BadgeProps {
  children: React.ReactNode;
  variant?:
    | "chapter"
    | "brass"
    | "amber"
    | "crimson"
    | "spirit"
    | "parchment"
    | "muted";
  size?: "sm" | "md";
  icon?: React.ReactNode;
  className?: string;
}

export function Badge({
  children,
  variant = "brass",
  size = "sm",
  icon,
  className = "",
}: BadgeProps) {
  const sizeStyles = {
    sm: "text-[10px] px-2 py-0.5 tracking-widest gap-1",
    md: "text-xs px-2.5 py-1 tracking-wider gap-1.5",
  }[size];

  const variantStyles = {
    chapter:
      "bg-gradient-to-r from-[#2a2018] via-[#1c1512] to-[#2a2018] text-[#dfc282] border border-[#c5a059]/70 font-serif uppercase shadow-[0_1px_4px_rgba(0,0,0,0.5)]",
    brass:
      "bg-[#1c1813] text-[#dfc282] border border-[#c5a059]/40 font-mono",
    amber:
      "bg-[#26170d] text-[#f5b041] border border-[#e29d42]/50",
    crimson:
      "bg-[#240b0f] text-[#fca5a5] border border-[#8a1f29]/60",
    spirit:
      "bg-[#0e1d21] text-[#7dd3fc] border border-[#38bdf8]/40",
    parchment:
      "bg-[#d8c8a8] text-[#1c1512] border border-[#a6926d] font-serif font-semibold",
    muted:
      "bg-[#141215] text-[#8a8070] border border-[#302c25]",
  }[variant];

  return (
    <span
      className={`inline-flex items-center justify-center font-medium uppercase select-none rounded-[1px] ${sizeStyles} ${variantStyles} ${className}`}
    >
      {variant === "chapter" && <span className="text-[#c5a059] text-[8px]">❖</span>}
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
      {variant === "chapter" && <span className="text-[#c5a059] text-[8px]">❖</span>}
    </span>
  );
}

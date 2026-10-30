"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Clue } from "../../types";
import { Badge } from "../ui/Badge";
import { EvidenceMarker } from "./EvidenceMarker";
import { getClueAsset } from "../../lib/assetManifest";
import { ShieldAlert, FileText, Sparkles, MapPin, CheckCircle2 } from "lucide-react";

export interface ClueCardProps {
  clue: Clue;
  selected?: boolean;
  onSelect?: () => void;
  className?: string;
}

export function ClueCard({
  clue,
  selected = false,
  onSelect,
  className = "",
}: ClueCardProps) {
  const categoryIcon = {
    physical: <ShieldAlert className="w-3 h-3 text-[#dfc282]" />,
    document: <FileText className="w-3 h-3 text-[#f5b041]" />,
    paranormal: <Sparkles className="w-3 h-3 text-[#7dd3fc]" />,
    testimony: <FileText className="w-3 h-3 text-[#dfc282]" />,
  }[clue.category];

  const categoryBadgeVariant = {
    physical: "brass" as const,
    document: "amber" as const,
    paranormal: "spirit" as const,
    testimony: "parchment" as const,
  }[clue.category];

  const statusBadge = {
    verified: (
      <span className="inline-flex items-center gap-1 text-[10px] text-[#86efac] font-mono">
        <CheckCircle2 className="w-3 h-3" /> VERIFIED
      </span>
    ),
    revealed: (
      <span className="text-[10px] text-[#dfc282] font-mono">
        ✦ REVEALED
      </span>
    ),
    hinted: (
      <span className="text-[10px] text-[#f5b041] font-mono">
        ◈ HINTED
      </span>
    ),
    contradicted: (
      <span className="text-[10px] text-[#fca5a5] font-mono">
        ✕ CONTRADICTION
      </span>
    ),
    undiscovered: (
      <span className="text-[10px] text-[#7d7265] font-mono">
        ? CONCEALED
      </span>
    ),
  }[clue.status];

  const [imageError, setImageError] = useState(false);
  const isDiscovered = clue.status !== "undiscovered";
  const asset = isDiscovered ? getClueAsset(clue.id) : null;

  return (
    <div
      onClick={onSelect}
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      className={`group relative p-4 transition-all duration-200 select-none rounded-[2px] ${
        onSelect ? "cursor-pointer" : ""
      } ${
        selected
          ? "bg-[#251d16] border-2 border-[#c5a059] shadow-[0_4px_20px_rgba(197,160,89,0.25)]"
          : "gothic-card border border-[#c5a059]/25 hover:border-[#c5a059]/55 hover:bg-[#181412]"
      } ${className}`}
    >
      {/* Wax seal watermark in corner */}
      <div className="absolute top-2 right-2 opacity-30 group-hover:opacity-60 transition-opacity">
        <div className="w-6 h-6 rounded-full bg-[#8a1f29] border border-[#fca5a5]/40 flex items-center justify-center text-[10px] font-serif font-bold text-[#fca5a5]">
          §
        </div>
      </div>

      {/* Top row: Evidence marker, Category, Status */}
      <div className="flex items-center gap-2 mb-2 pr-6">
        {clue.evidenceMarker && (
          <EvidenceMarker label={clue.evidenceMarker} size="sm" />
        )}
        <Badge variant={categoryBadgeVariant} size="sm" icon={categoryIcon}>
          {clue.category}
        </Badge>
        <div className="ml-auto">{statusBadge}</div>
      </div>

      {/* Thumbnail + Title & Description */}
      <div className="flex gap-3 mb-2">
        {isDiscovered && asset && asset.isAvailableLocally && !imageError && (
          <div className="relative w-14 h-14 shrink-0 rounded-[1px] overflow-hidden border border-[#c5a059]/40 bg-[#0c090a] shadow-inner">
            <Image
              src={asset.localPath}
              alt={asset.altText}
              fill
              sizes="56px"
              className="object-cover"
              onError={() => setImageError(true)}
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h4 className="font-serif text-sm font-semibold text-[#dfc282] group-hover:text-[#f8edd2] tracking-wide mb-1">
            {clue.title}
          </h4>
          <p className="text-xs text-[#d4c8af] leading-relaxed line-clamp-2">
            {clue.description}
          </p>
        </div>
      </div>

      {/* Location Found Footer */}
      <div className="pt-2 border-t border-[#c5a059]/15 flex items-center justify-between text-[10px] text-[#b8a88a] font-mono">
        <div className="flex items-center gap-1 truncate max-w-[220px]">
          <MapPin className="w-3 h-3 text-[#c5a059] shrink-0" />
          <span className="truncate">{clue.locationFound}</span>
        </div>
        {clue.discoveredAtTurn && (
          <span className="shrink-0 text-[#7d7265]">
            Turn {clue.discoveredAtTurn}
          </span>
        )}
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Clue } from "../../types";
import { getClueAsset } from "../../lib/assetManifest";
import { EvidenceMarker } from "./EvidenceMarker";
import { Badge } from "../ui/Badge";
import { Lock, EyeOff, ShieldAlert, FileText, Sparkles, CheckCircle2 } from "lucide-react";

export interface ClueArtworkProps {
  clue: Clue;
  variant?: "compact" | "card" | "detail";
  isNewlyDiscovered?: boolean;
  onClick?: () => void;
  className?: string;
}

export function ClueArtwork({
  clue,
  variant = "card",
  isNewlyDiscovered = false,
  onClick,
  className = "",
}: ClueArtworkProps) {
  const [imageError, setImageError] = useState(false);
  const asset = getClueAsset(clue.id);

  const isUndiscovered = clue.status === "undiscovered";

  const categoryBadgeVariant = {
    physical: "brass" as const,
    document: "amber" as const,
    paranormal: "spirit" as const,
    testimony: "parchment" as const,
  }[clue.category];

  // 1. STRICT CONFIDENTIALITY: Never reveal locked clue artwork
  if (isUndiscovered) {
    if (variant === "compact") {
      return (
        <div
          className={`relative p-2.5 bg-[#0a0709] border border-dashed border-[#4a3b32] rounded-[2px] flex items-center gap-2 select-none opacity-60 ${className}`}
        >
          <Lock className="w-3.5 h-3.5 text-[#7d7265] shrink-0" />
          <span className="text-[10px] font-mono text-[#7d7265] truncate">
            [Concealed Exhibit]
          </span>
        </div>
      );
    }

    return (
      <div
        className={`relative p-6 bg-[#0a0709] border-2 border-dashed border-[#3a2e26] rounded-[2px] flex flex-col items-center justify-center text-center select-none min-h-[180px] shadow-inner ${className}`}
      >
        <div className="w-12 h-12 rounded-full bg-[#181116] border border-[#554338] flex items-center justify-center mb-3 text-[#7d7265]">
          <Lock className="w-5 h-5 text-[#8a7f72]" />
        </div>
        <span className="text-[11px] font-mono uppercase tracking-widest text-[#8a7f72] mb-1">
          Forensic Exhibit Sealed
        </span>
        <p className="text-xs text-[#554a3e] max-w-xs font-serif italic">
          This piece of evidence remains concealed in the manor shadows until discovered through active investigation.
        </p>
      </div>
    );
  }

  // 2. Intentional Fallback Design for discovered clues when image file is missing
  const renderFallbackEvidencePlate = () => {
    return (
      <div className="relative w-full h-full min-h-[140px] bg-[#1a1410] border border-[#c5a059]/30 p-4 flex flex-col justify-between overflow-hidden">
        {/* Subtle watermark seal */}
        <div className="absolute -right-4 -bottom-4 w-28 h-28 rounded-full border-4 border-[#c5a059]/10 pointer-events-none" />

        <div className="flex items-start justify-between z-10">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#dfc282] px-1.5 py-0.5 bg-[#0a0708] border border-[#c5a059]/30">
            {clue.evidenceMarker || "Exhibit"}
          </span>
          <div className="w-6 h-6 rounded-full bg-[#8a1f29] border border-[#fca5a5]/40 flex items-center justify-center text-[10px] font-serif text-[#fca5a5] shadow-sm">
            §
          </div>
        </div>

        <div className="z-10 my-2">
          <h4 className="font-serif text-sm font-semibold text-[#dfc282] line-clamp-2">
            {clue.title}
          </h4>
          <p className="text-[10px] font-mono text-[#b8a88a] line-clamp-1 mt-0.5">
            {clue.subtitle}
          </p>
        </div>

        <div className="z-10 pt-2 border-t border-[#c5a059]/15 flex items-center justify-between text-[9px] font-mono text-[#7d7265]">
          <span className="uppercase">{clue.category}</span>
          <span className="text-[#86efac]">✦ VERIFIED</span>
        </div>
      </div>
    );
  };

  // 3. Compact Variant for Evidence Board Pins
  if (variant === "compact") {
    return (
      <div
        onClick={onClick}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        className={`group relative p-2.5 bg-[#17120e] border border-[#c5a059]/35 hover:border-[#c5a059] rounded-[2px] transition-all cursor-pointer select-none shadow-[0_2px_8px_rgba(0,0,0,0.6)] ${
          isNewlyDiscovered ? "animate-pulse" : ""
        } ${className}`}
      >
        <div className="flex items-center gap-2">
          {clue.evidenceMarker && (
            <EvidenceMarker label={clue.evidenceMarker} size="sm" />
          )}
          <span className="font-serif text-xs font-medium text-[#dfc282] truncate group-hover:text-[#f8edd2]">
            {clue.title}
          </span>
          <span className="ml-auto text-[9px] font-mono text-[#86efac]">
            ✦
          </span>
        </div>
      </div>
    );
  }

  // 4. Detail Variant for Inspection Lightbox / Modal
  if (variant === "detail") {
    return (
      <div
        className={`gothic-card p-6 border-2 border-[#c5a059]/60 bg-[#16110e] space-y-4 rounded-[2px] shadow-[0_8px_32px_rgba(0,0,0,0.9)] ${className}`}
      >
        {/* Large Illustration View */}
        <div className="relative w-full aspect-video sm:aspect-[16/10] bg-[#0c090a] border border-[#c5a059]/40 rounded-[2px] overflow-hidden shadow-inner">
          {!imageError && asset.isAvailableLocally ? (
            <Image
              src={asset.localPath}
              alt={asset.altText}
              fill
              sizes="(max-width: 768px) 100vw, 600px"
              className="object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            renderFallbackEvidencePlate()
          )}
        </div>

        {/* Forensic Metadata Header */}
        <div className="flex items-center justify-between gap-2 border-b border-[#c5a059]/20 pb-3">
          <div className="flex items-center gap-2">
            {clue.evidenceMarker && (
              <EvidenceMarker label={clue.evidenceMarker} size="md" />
            )}
            <div>
              <h3 className="font-serif text-lg font-bold text-[#dfc282]">
                {clue.title}
              </h3>
              <p className="text-xs font-mono text-[#b8a88a]">{clue.subtitle}</p>
            </div>
          </div>
          <Badge variant={categoryBadgeVariant} size="sm">
            {clue.category}
          </Badge>
        </div>

        {/* Detailed Forensic Description */}
        <p className="text-sm text-[#ece3cd] font-serif leading-relaxed italic bg-[#0c090c]/70 p-4 border border-[#c5a059]/20 rounded-[2px]">
          &ldquo;{clue.description}&rdquo;
        </p>

        {/* Source Location Footer */}
        <div className="flex items-center justify-between text-xs font-mono text-[#b8a88a] pt-2 border-t border-[#c5a059]/15">
          <span>Found at: {clue.locationFound}</span>
          {clue.discoveredAtTurn && <span>Discovered at Turn {clue.discoveredAtTurn}</span>}
        </div>
      </div>
    );
  }

  // 5. Default Card Variant (for lists and drawers)
  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`group relative gothic-card p-3.5 border border-[#c5a059]/30 hover:border-[#c5a059]/60 bg-[#16110e] rounded-[2px] transition-all cursor-pointer select-none space-y-3 ${
        isNewlyDiscovered ? "ring-2 ring-[#e29d42] animate-pulse" : ""
      } ${className}`}
    >
      {/* Thumbnail artwork */}
      <div className="relative w-full h-32 bg-[#090709] border border-[#c5a059]/25 rounded-[2px] overflow-hidden">
        {!imageError && asset.isAvailableLocally ? (
          <Image
            src={asset.localPath}
            alt={asset.altText}
            fill
            sizes="300px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImageError(true)}
          />
        ) : (
          renderFallbackEvidencePlate()
        )}
      </div>

      <div>
        <div className="flex items-center justify-between gap-1 mb-1">
          {clue.evidenceMarker && (
            <EvidenceMarker label={clue.evidenceMarker} size="sm" />
          )}
          <Badge variant={categoryBadgeVariant} size="sm">
            {clue.category}
          </Badge>
        </div>
        <h4 className="font-serif text-sm font-semibold text-[#dfc282] truncate group-hover:text-[#f8edd2]">
          {clue.title}
        </h4>
        <p className="text-xs text-[#d4c8af] line-clamp-2 mt-1">
          {clue.description}
        </p>
      </div>
    </div>
  );
}

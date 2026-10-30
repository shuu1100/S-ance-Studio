"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Character } from "../../types";
import { Badge } from "../ui/Badge";
import { getCharacterAsset } from "../../lib/assetManifest";
import { VisualVariant } from "../../types/assets";
import { Ghost, User, Sparkles, Heart } from "lucide-react";

export interface CharacterPortraitProps {
  character: Character;
  selected?: boolean;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
  variant?: VisualVariant;
  showTrustMeter?: boolean;
  className?: string;
}

export function CharacterPortrait({
  character,
  selected = false,
  onClick,
  size = "md",
  variant,
  showTrustMeter = true,
  className = "",
}: CharacterPortraitProps) {
  const [imageError, setImageError] = useState(false);
  const asset = getCharacterAsset(character.id, variant);

  // Fallback SVG Cameo silhouette based on avatarSeed / id
  const renderCameoGraphic = () => {
    switch (character.avatarSeed || character.id) {
      case "eleanor":
      case "char_eleanor":
      case "char_apparition":
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full text-[#6da3a1]">
            <circle cx="50" cy="50" r="46" fill="#0d1819" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 2" />
            <circle cx="50" cy="50" r="38" fill="url(#eleanor-glow)" opacity="0.4" />
            <defs>
              <radialGradient id="eleanor-glow">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>
            <path d="M50 24 C40 24 34 32 34 44 C34 54 40 60 50 60 C60 60 66 54 66 44 C66 32 60 24 50 24 Z" fill="#2d4244" />
            <ellipse cx="50" cy="23" rx="14" ry="7" fill="#1b2a2c" />
            <path d="M30 82 C30 68 40 62 50 62 C60 62 70 68 70 82 Z" fill="#1c2d30" />
            <path d="M44 62 L50 72 L56 62 Z" fill="#6da3a1" opacity="0.6" />
          </svg>
        );
      case "julian":
      case "char_julian":
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full text-[#dfc282]">
            <circle cx="50" cy="50" r="46" fill="#1c1410" stroke="#c5a059" strokeWidth="1" />
            <path d="M50 25 C42 25 36 32 36 44 C36 54 42 60 50 60 C58 60 64 54 64 44 C64 32 58 25 50 25 Z" fill="#3a2a1a" />
            <path d="M36 34 C38 24 52 22 62 26 C64 32 60 38 58 40 Z" fill="#23170c" />
            <path d="M26 84 C26 68 38 62 50 62 C62 62 74 68 74 84 Z" fill="#1f1510" />
            <polygon points="50,64 45,78 50,86 55,78" fill="#8a1f29" />
          </svg>
        );
      case "vane":
      case "char_vane":
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full text-[#e29d42]">
            <circle cx="50" cy="50" r="46" fill="#19101c" stroke="#a855f7" strokeWidth="1" strokeDasharray="4 2" />
            <path d="M32 46 C32 26 40 20 50 20 C60 20 68 26 68 46 C68 56 60 60 50 60 C40 60 32 56 32 46 Z" fill="#2f1c3a" />
            <ellipse cx="50" cy="44" rx="12" ry="14" fill="#462c54" />
            <circle cx="50" cy="27" r="3" fill="#dfc282" />
            <path d="M28 84 C28 66 38 62 50 62 C62 62 72 66 72 84 Z" fill="#1f1126" />
          </svg>
        );
      case "daughter":
      case "char_daughter":
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full text-[#c5a059]">
            <circle cx="50" cy="50" r="46" fill="#151214" stroke="#c5a059" strokeWidth="1" />
            <path d="M50 26 C42 26 36 34 36 45 C36 54 42 60 50 60 C58 60 64 54 64 45 C64 34 58 26 50 26 Z" fill="#2c2225" />
            <ellipse cx="50" cy="25" rx="12" ry="6" fill="#1a1518" />
            <path d="M30 84 C30 68 40 62 50 62 C60 62 70 68 70 84 Z" fill="#231b20" />
            <polygon points="50,65 47,74 50,78 53,74" fill="#8a1f29" />
          </svg>
        );
      default:
        // Caretaker / Finch
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full text-[#b8a88a]">
            <circle cx="50" cy="50" r="46" fill="#151515" stroke="#7d7265" strokeWidth="1" />
            <path d="M50 25 C42 25 36 33 36 45 C36 55 42 61 50 61 C58 61 64 55 64 45 C64 33 58 25 50 25 Z" fill="#2d2a26" />
            <circle cx="45" cy="42" r="5" fill="none" stroke="#dfc282" strokeWidth="1.5" />
            <circle cx="55" cy="42" r="5" fill="none" stroke="#dfc282" strokeWidth="1.5" />
            <line x1="50" y1="42" x2="50" y2="42" stroke="#dfc282" strokeWidth="1.5" />
            <path d="M28 84 C28 68 38 62 50 62 C62 62 72 68 72 84 Z" fill="#1b1a18" />
            <line x1="50" y1="62" x2="50" y2="84" stroke="#7d7265" strokeWidth="1" />
          </svg>
        );
    }
  };

  const typeIcon = {
    spirit: <Ghost className="w-3 h-3 text-[#7dd3fc]" />,
    living: <User className="w-3 h-3 text-[#dfc282]" />,
    medium: <Sparkles className="w-3 h-3 text-[#f5b041]" />,
  }[character.type] || <User className="w-3 h-3 text-[#dfc282]" />;

  const typeBadgeVariant = {
    spirit: "spirit" as const,
    living: "brass" as const,
    medium: "amber" as const,
  }[character.type] || "brass";

  const dimensionClass = {
    sm: "w-14 h-14",
    md: "w-24 h-24",
    lg: "w-32 h-32 sm:w-36 sm:h-36",
  }[size];

  const focalPointStyle: React.CSSProperties = {
    objectPosition: asset.focalPoint
      ? `${asset.focalPoint.x}% ${asset.focalPoint.y}%`
      : "50% 35%",
  };

  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`group relative flex flex-col items-center p-3.5 transition-all duration-200 select-none ${
        onClick ? "cursor-pointer" : ""
      } ${
        selected
          ? "bg-[#241c14] border-2 border-[#c5a059] shadow-[0_0_18px_rgba(197,160,89,0.35)]"
          : "gothic-card border border-[#c5a059]/25 hover:border-[#c5a059]/55 hover:bg-[#191412]"
      } ${className}`}
    >
      {/* Victorian Cameo Oval Frame */}
      <div
        className={`relative ${dimensionClass} rounded-full p-1 bg-[#0a0808] border-2 border-[#c5a059]/70 shadow-[inset_0_2px_8px_rgba(0,0,0,0.9)] overflow-hidden mb-2.5 transition-transform duration-300 group-hover:scale-105`}
      >
        {!imageError && asset.isAvailableLocally ? (
          <Image
            src={asset.localPath}
            alt={asset.altText}
            fill
            sizes="160px"
            style={focalPointStyle}
            className="object-cover rounded-full"
            onError={() => setImageError(true)}
          />
        ) : (
          renderCameoGraphic()
        )}

        {/* Eerie spirit pulse overlay if spirit */}
        {character.type === "spirit" && (
          <div className="absolute inset-0 bg-[#38bdf8]/15 rounded-full animate-seal-pulse pointer-events-none" />
        )}

        {/* Cameo Brass Rim Reflection */}
        <div className="absolute inset-0 rounded-full border border-[#f5d794]/25 pointer-events-none" />
      </div>

      {/* Name & Title */}
      <div className="text-center w-full">
        <h4 className="font-serif text-sm font-semibold text-[#dfc282] truncate group-hover:text-[#f8edd2]">
          {character.name}
        </h4>
        <p className="text-[11px] text-[#b8a88a] font-mono truncate mt-0.5">
          {character.title}
        </p>

        {/* Badges: Type & Status */}
        <div className="flex items-center justify-center gap-1.5 mt-2 flex-wrap">
          <Badge variant={typeBadgeVariant} size="sm" icon={typeIcon}>
            {character.type}
          </Badge>
          <span className="text-[9px] font-mono text-[#8a7f72] uppercase px-1.5 py-0.5 bg-[#0f0c0a] border border-[#c5a059]/15">
            {character.status}
          </span>
        </div>

        {/* Relationship Trust Meter */}
        {showTrustMeter && (
          <div className="mt-2.5 pt-2 border-t border-[#c5a059]/15 w-full">
            <div className="flex items-center justify-between text-[10px] font-mono text-[#b8a88a] mb-1">
              <span className="flex items-center gap-1">
                <Heart className="w-2.5 h-2.5 text-[#e29d42]" /> Trust
              </span>
              <span className="text-[#dfc282] font-semibold">{character.trustLevel}%</span>
            </div>
            <div className="w-full h-1 bg-[#151110] rounded-full overflow-hidden border border-[#c5a059]/25">
              <div
                className="h-full bg-gradient-to-r from-[#8a1f29] via-[#c5a059] to-[#dfc282] transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, character.trustLevel))}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

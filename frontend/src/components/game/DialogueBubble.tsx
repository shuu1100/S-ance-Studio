"use client";

import React, { useState } from "react";
import Image from "next/image";
import { DialogueMessage } from "../../types";
import { getCharacterAsset } from "../../lib/assetManifest";
import { Ghost, Sparkles, User, Radio } from "lucide-react";

export interface DialogueBubbleProps {
  message: DialogueMessage;
  className?: string;
}

export function DialogueBubble({ message, className = "" }: DialogueBubbleProps) {
  const [imageError, setImageError] = useState(false);
  const isSpirit = message.speakerType === "spirit";
  const isMedium = message.speakerType === "medium";
  const isPlayer = message.senderId === "player" || message.senderName.toLowerCase().includes("investigator");
  const charAsset = !isPlayer ? getCharacterAsset(message.senderId) : null;

  // Card styling
  const cardBorder = isSpirit
    ? "border-[#38bdf8]/40 bg-[#0e161a]/90 text-[#e0f2fe]"
    : isMedium
    ? "border-[#a855f7]/30 bg-[#160f1c]/90 text-[#f3e8ff]"
    : "border-[#c5a059]/30 bg-[#14100d]/90 text-[#ece3cd]";

  const speakerColor = isSpirit
    ? "text-[#7dd3fc]"
    : isMedium
    ? "text-[#d8b4fe]"
    : "text-[#dfc282]";

  const speakerIcon = isSpirit ? (
    <Ghost className="w-3.5 h-3.5 text-[#38bdf8]" />
  ) : isMedium ? (
    <Sparkles className="w-3.5 h-3.5 text-[#c084fc]" />
  ) : (
    <User className="w-3.5 h-3.5 text-[#c5a059]" />
  );

  return (
    <div
      className={`relative p-4 border rounded-[2px] shadow-[0_4px_16px_rgba(0,0,0,0.6)] ${cardBorder} ${className}`}
    >
      {/* Ornate corner points */}
      <span className="absolute top-1 left-1.5 text-[8px] text-[#c5a059]/40 select-none">✦</span>
      <span className="absolute bottom-1 right-1.5 text-[8px] text-[#c5a059]/40 select-none">✦</span>

      {/* Header bar: Speaker Cameo, Name & Metadata */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-xs">
        <div className="flex items-center gap-2">
          {charAsset && charAsset.isAvailableLocally && !imageError ? (
            <div className="relative w-6 h-6 rounded-full overflow-hidden border border-[#c5a059]/60 shrink-0 bg-[#0a0808]">
              <Image
                src={charAsset.localPath}
                alt={charAsset.altText}
                fill
                sizes="24px"
                className="object-cover"
                onError={() => setImageError(true)}
              />
            </div>
          ) : (
            speakerIcon
          )}
          <span className={`font-serif font-semibold tracking-wider uppercase ${speakerColor}`}>
            {message.senderName}
          </span>
          {message.emotionalCue && (
            <span className="text-[10px] text-[#b8a88a] font-mono italic ml-1">
              [{message.emotionalCue}]
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-[#7d7265] font-mono">
          <span>Turn {message.turnNumber}</span>
          <span>•</span>
          <span>{message.timestamp}</span>
        </div>
      </div>

      {/* Spoken Text */}
      <p
        className={`text-sm leading-relaxed ${
          isSpirit ? "font-serif italic tracking-wide" : "font-sans"
        }`}
      >
        &ldquo;{message.text}&rdquo;
      </p>

      {/* Atmospheric Phenomenon Tag */}
      {message.atmosphericEffect && (
        <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center gap-1.5 text-[11px] font-mono text-[#a89984]">
          <Radio className="w-3 h-3 text-[#e29d42]" />
          <span className="text-[#e29d42] font-semibold">Manifestation:</span>
          <span className="italic">{message.atmosphericEffect}</span>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { getStoryMomentAsset } from "../../lib/assetManifest";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { X, Sparkles, Compass } from "lucide-react";

export interface StoryMomentProps {
  momentId: string;
  title: string;
  subtitle?: string;
  narrative: string;
  isOpen: boolean;
  onDismiss: () => void;
  actionLabel?: string;
  imagePath?: string;
  altText?: string;
  className?: string;
}

export function StoryMoment({
  momentId,
  title,
  subtitle = "Dramatic Inquest Revelation",
  narrative,
  isOpen,
  onDismiss,
  actionLabel = "Proceed with Inquest",
  imagePath,
  altText,
  className = "",
}: StoryMomentProps) {
  const [imageError, setImageError] = useState(false);
  const asset = getStoryMomentAsset(momentId);

  const effectivePath = imagePath || asset.localPath;
  const effectiveAlt = altText || asset.altText;

  // Keyboard shortcut: Escape to dismiss
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onDismiss();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onDismiss]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="moment-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050306]/90 backdrop-blur-md select-none animate-in fade-in duration-300"
    >
      <div
        className={`relative w-full max-w-2xl gothic-card border-2 border-[#c5a059]/70 bg-[#120d12] rounded-[2px] overflow-hidden shadow-[0_12px_48px_rgba(0,0,0,0.95)] ${className}`}
      >
        {/* Dismiss / Skip Button */}
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 z-20 p-1.5 bg-[#090609]/80 border border-[#c5a059]/40 hover:border-[#c5a059] text-[#dfc282] rounded-[2px] transition-colors focus:outline-none focus:ring-1 focus:ring-[#c5a059]"
          title="Dismiss Scene (Esc)"
          aria-label="Dismiss story moment"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Scene Illustration Banner */}
        <div className="relative w-full aspect-video sm:aspect-[21/9] bg-[#080508] border-b border-[#c5a059]/30 overflow-hidden">
          {!imageError && asset.isAvailableLocally ? (
            <Image
              src={effectivePath}
              alt={effectiveAlt}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 800px"
              className="object-cover transition-transform duration-700 hover:scale-105 motion-reduce:transform-none"
              onError={() => setImageError(true)}
            />
          ) : (
            // Intentional Fallback Gothic Revelation Plate
            <div className="absolute inset-0 bg-gradient-to-b from-[#1b0d1e] via-[#120815] to-[#0a050b] flex flex-col items-center justify-center p-6 text-center">
              <div className="w-14 h-14 rounded-full border border-[#c5a059]/40 bg-[#251528] flex items-center justify-center mb-2 text-[#dfc282] shadow-[0_0_20px_rgba(197,160,89,0.3)]">
                <Sparkles className="w-7 h-7 text-[#e29d42]" />
              </div>
              <span className="font-serif text-sm uppercase tracking-widest text-[#dfc282]">
                {subtitle}
              </span>
            </div>
          )}

          {/* Dark Gradient Overlay for Readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#120d12] via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Narrative Content Body */}
        <div className="p-6 sm:p-8 space-y-4">
          <div className="space-y-1">
            <Badge variant="chapter" size="sm">
              {subtitle}
            </Badge>
            <h2
              id="moment-title"
              className="font-serif text-xl sm:text-2xl font-bold text-[#dfc282] tracking-wide"
            >
              {title}
            </h2>
          </div>

          {/* Atmospheric Narrative Prose */}
          <div className="p-4 bg-[#0a070a]/80 border border-[#c5a059]/25 rounded-[2px] shadow-inner">
            <p className="font-serif text-sm sm:text-base text-[#ece3cd] leading-relaxed italic">
              &ldquo;{narrative}&rdquo;
            </p>
          </div>

          {/* Footer Action */}
          <div className="flex items-center justify-end pt-2">
            <Button
              variant="primary"
              size="md"
              onClick={onDismiss}
              className="w-full sm:w-auto"
            >
              {actionLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

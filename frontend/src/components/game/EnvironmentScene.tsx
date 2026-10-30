"use client";

import React, { useState } from "react";
import Image from "next/image";
import { getEnvironmentAsset } from "../../lib/assetManifest";
import { Compass, Sparkles, MapPin } from "lucide-react";

export interface EnvironmentSceneProps {
  roomId: string;
  roomName?: string;
  subtitle?: string;
  aspectRatio?: "16:9" | "banner" | "card" | "full";
  overlayOpacity?: number; // 0.0 to 1.0
  showCaption?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function EnvironmentScene({
  roomId,
  roomName,
  subtitle,
  aspectRatio = "16:9",
  overlayOpacity = 0.45,
  showCaption = true,
  className = "",
  children,
}: EnvironmentSceneProps) {
  const [hasImageError, setHasImageError] = useState(false);
  const asset = getEnvironmentAsset(roomId);

  const aspectRatioClass = {
    "16:9": "aspect-video min-h-[220px]",
    banner: "h-48 sm:h-64 w-full",
    card: "h-36 sm:h-44 w-full",
    full: "w-full h-full min-h-[360px]",
  }[aspectRatio];

  const focalPointStyle: React.CSSProperties = {
    objectPosition: asset.focalPoint
      ? `${asset.focalPoint.x}% ${asset.focalPoint.y}%`
      : "50% 50%",
  };

  // Intentional Fallback Design when image is missing or fails to load
  const renderFallbackScene = () => {
    return (
      <div className="absolute inset-0 bg-[#0d090d] flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden">
        {/* Subtle Gothic Arch Background */}
        <svg
          viewBox="0 0 400 300"
          className="absolute inset-0 w-full h-full opacity-20 pointer-events-none"
          preserveAspectRatio="xMidYMid slice"
        >
          <path
            d="M 50,300 L 50,150 Q 50,40 200,20 Q 350,40 350,150 L 350,300 Z"
            fill="none"
            stroke="#c5a059"
            strokeWidth="1.5"
            strokeDasharray="4 2"
          />
          <path
            d="M 100,300 L 100,160 Q 100,70 200,50 Q 300,70 300,160 L 300,300 Z"
            fill="none"
            stroke="#dfc282"
            strokeWidth="1"
            opacity="0.6"
          />
        </svg>

        {/* Ambient Mist & Vignette */}
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#090609]/70 to-[#040204]" />

        {/* Icon & Chamber Designation */}
        <div className="relative z-10 flex flex-col items-center space-y-2">
          <div className="w-12 h-12 rounded-full border border-[#c5a059]/40 bg-[#191118]/80 flex items-center justify-center text-[#dfc282] shadow-[0_0_15px_rgba(197,160,89,0.2)]">
            <Compass className="w-6 h-6 text-[#c5a059]" />
          </div>
          <h3 className="font-serif text-lg font-semibold text-[#dfc282] tracking-wide">
            {roomName || asset.caption}
          </h3>
          <p className="text-xs font-mono text-[#b8a88a] max-w-sm">
            {subtitle || asset.altText}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`relative rounded-[2px] border border-[#c5a059]/35 overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.8)] ${aspectRatioClass} ${className}`}
    >
      {/* Actual Local Image */}
      {!hasImageError && asset.isAvailableLocally ? (
        <Image
          src={asset.localPath}
          alt={asset.altText}
          fill
          priority={roomId === "manor_exterior" || roomId === "room_foyer"}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 70vw, 900px"
          style={focalPointStyle}
          className="object-cover transition-transform duration-700 hover:scale-[1.02]"
          onError={() => setHasImageError(true)}
        />
      ) : (
        renderFallbackScene()
      )}

      {/* Configurable Atmospheric Dark Overlay for Foreground Readability */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          backgroundColor: `rgba(9, 6, 9, ${overlayOpacity})`,
          backgroundImage:
            "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(9,6,9,0.5) 60%, rgba(5,3,5,0.85) 100%)",
        }}
      />

      {/* Victorian Corner Filigree */}
      <span className="absolute top-2 left-2 text-[10px] text-[#c5a059]/50 select-none pointer-events-none">
        ✦
      </span>
      <span className="absolute top-2 right-2 text-[10px] text-[#c5a059]/50 select-none pointer-events-none">
        ✦
      </span>

      {/* Caption Bar */}
      {showCaption && (roomName || asset.caption) && (
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs z-10 pointer-events-none">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#0c090c]/85 border border-[#c5a059]/40 backdrop-blur-sm rounded-[2px]">
            <MapPin className="w-3.5 h-3.5 text-[#c5a059] shrink-0" />
            <span className="font-serif font-medium text-[#dfc282] truncate">
              {roomName || asset.caption}
            </span>
            {subtitle && (
              <span className="hidden sm:inline text-[10px] font-mono text-[#b8a88a]">
                • {subtitle}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Foreground Content / Controls Slot */}
      {children && <div className="relative z-10 h-full w-full">{children}</div>}
    </div>
  );
}

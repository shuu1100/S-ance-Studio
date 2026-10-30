"use client";

import React, { useState } from "react";
import { Volume2, VolumeX, Bell, Wind, Sliders, Music } from "lucide-react";
import { soundEngine } from "../../lib/audio";
import { Button } from "./Button";

export function AudioControls({ className = "" }: { className?: string }) {
  const [isMuted, setIsMuted] = useState(soundEngine.getIsMuted());
  const [volume, setVolume] = useState(0.4);
  const [isOpen, setIsOpen] = useState(false);
  const [activePreset, setActivePreset] = useState<"cellar_drone" | "rain_storm" | "silent_crypt">(
    "cellar_drone"
  );

  const handleToggleMute = () => {
    const nextMuted = soundEngine.toggleMute();
    setIsMuted(nextMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    soundEngine.setVolume(val);
  };

  const handleSelectPreset = (preset: "cellar_drone" | "rain_storm" | "silent_crypt") => {
    setActivePreset(preset);
    soundEngine.startAmbience(preset);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center gap-1.5 bg-[#14100c] border border-[#c5a059]/30 px-2.5 py-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
        <button
          onClick={handleToggleMute}
          className="text-[#dfc282] hover:text-[#fff] p-1 transition-colors flex items-center gap-1.5"
          aria-label={isMuted ? "Unmute atmospheric audio" : "Mute atmospheric audio"}
          title={isMuted ? "Audio Muted (Click to enable ambience)" : "Audio Active"}
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-[#8a7f72]" />
          ) : (
            <Volume2 className="w-4 h-4 text-[#e29d42]" />
          )}
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#b8a88a] hidden sm:inline">
            {isMuted ? "Muted" : "Ambience"}
          </span>
        </button>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`p-1 text-[#8a7f72] hover:text-[#dfc282] transition-colors border-l border-[#c5a059]/20 pl-2 ${
            isOpen ? "text-[#dfc282]" : ""
          }`}
          aria-label="Open audio mixing settings"
        >
          <Sliders className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Expanded Audio Tray */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 gothic-card bg-[#151114] border border-[#c5a059]/40 p-4 z-50 shadow-[0_8px_30px_rgba(0,0,0,0.9)] animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-[#c5a059]/20 mb-3">
            <span className="font-serif text-xs text-[#dfc282] uppercase tracking-wider flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5 text-[#c5a059]" />
              Acoustic Resonance
            </span>
            <span className="text-[9px] font-mono text-[#8a7f72]">
              Offline Web Audio
            </span>
          </div>

          {/* Master Volume */}
          <div className="space-y-1.5 mb-4">
            <div className="flex justify-between text-[11px] font-mono text-[#b8a88a]">
              <span>Volume</span>
              <span>{Math.round(volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              disabled={isMuted}
              onChange={handleVolumeChange}
              className="w-full accent-[#c5a059] bg-[#080708] h-1.5 rounded cursor-pointer disabled:opacity-40"
              aria-label="Audio Volume Slider"
            />
          </div>

          {/* Ambience Presets */}
          <div className="space-y-1.5 mb-4">
            <span className="text-[10px] uppercase font-mono text-[#7d7265] tracking-wider block">
              Atmospheric Preset
            </span>
            <div className="grid grid-cols-3 gap-1">
              {[
                { id: "cellar_drone", label: "Crypt Drone" },
                { id: "rain_storm", label: "Mansion Rain" },
                { id: "silent_crypt", label: "Absolute Silence" },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectPreset(p.id as typeof activePreset)}
                  className={`text-[10px] p-1.5 font-mono border transition-all text-center ${
                    activePreset === p.id
                      ? "border-[#c5a059] bg-[#2a221b] text-[#dfc282]"
                      : "border-[#302c28] bg-[#0c0a0c] text-[#8a7f72] hover:border-[#c5a059]/40 hover:text-[#b8a88a]"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Procedural Sound Effects Tester */}
          <div className="pt-2 border-t border-[#c5a059]/20">
            <span className="text-[10px] uppercase font-mono text-[#7d7265] tracking-wider block mb-1.5">
              Acoustic Cues (Test)
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => soundEngine.playSfx("bell")}
                icon={<Bell className="w-3 h-3 text-[#dfc282]" />}
                className="text-[10px] py-1 px-2"
              >
                Chime
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => soundEngine.playSfx("candle_snuff")}
                icon={<Wind className="w-3 h-3 text-[#fca5a5]" />}
                className="text-[10px] py-1 px-2"
              >
                Snuff
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => soundEngine.playSfx("planchette")}
                className="text-[10px] py-1 px-2"
              >
                Planchette
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

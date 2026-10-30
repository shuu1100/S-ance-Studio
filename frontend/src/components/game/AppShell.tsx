"use client";

import React from "react";
import { ScreenId, InvestigationSession } from "../../types";
import { CandleGauge } from "../ui/CandleGauge";
import { SanityMeter } from "../ui/SanityMeter";
import { AudioControls } from "../ui/AudioControls";
import { OfflineStateBadge } from "../ui/States";
import {
  Compass,
  Scroll,
  MessageSquare,
  Network,
  BookOpen,
  Settings,
  Sparkles,
} from "lucide-react";

export interface AppShellProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  session: InvestigationSession;
  children: React.ReactNode;
}

export function AppShell({
  currentScreen,
  onNavigate,
  session,
  children,
}: AppShellProps) {
  const navItems: { id: ScreenId; label: string; icon: React.ReactNode }[] = [
    { id: "title", label: "Title Portal", icon: <Sparkles className="w-4 h-4" /> },
    { id: "investigations", label: "Case Archives", icon: <Scroll className="w-4 h-4" /> },
    { id: "mansion", label: "Mansion Map", icon: <Compass className="w-4 h-4" /> },
    { id: "interview", label: "Séance Chamber", icon: <MessageSquare className="w-4 h-4" /> },
    { id: "evidence", label: "Evidence Board", icon: <Network className="w-4 h-4" /> },
    { id: "journal", label: "Case Dossier", icon: <BookOpen className="w-4 h-4" /> },
    { id: "settings", label: "Studio Settings & AI", icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#060507] text-[#ece3cd] selection:bg-[#c5a059]/30">
      {/* Top Atmospheric Header */}
      <header className="border-b border-[#c5a059]/25 bg-[#0e0c0e]/95 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-3">
          {/* Logo & Studio Crest */}
          <div
            onClick={() => onNavigate("title")}
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            <div className="w-8 h-8 rounded-full border border-[#c5a059] bg-[#1a1410] flex items-center justify-center text-[#dfc282] font-serif text-sm shadow-[0_0_10px_rgba(197,160,89,0.3)] group-hover:border-[#dfc282]">
              §
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-sm font-bold tracking-widest text-[#dfc282] uppercase">
                  Séance Studio
                </h1>
                <span className="text-[10px] text-[#7d7265] font-mono border-l border-[#c5a059]/30 pl-2">
                  EST. 1922
                </span>
              </div>
              <p className="text-[10px] text-[#b8a88a] font-mono tracking-wider truncate max-w-xs">
                {session.caseTitle} • Act {session.currentAct}
              </p>
            </div>
          </div>

          {/* Active Vitals: Candle, Sanity, Audio, Offline Badge */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <CandleGauge
              percentage={session.candlePercentage}
              turnCounter={session.turnCounter}
              maxTurns={session.maxTurns}
            />
            <SanityMeter
              sanity={session.playerSanity}
              tension={session.ectoplasmicTension}
            />
            <AudioControls />
            <div className="hidden lg:block">
              <OfflineStateBadge endpoint="127.0.0.1:11434" />
            </div>
          </div>
        </div>

        {/* Victorian Navigation Ribbon */}
        <nav
          aria-label="Séance Studio primary navigation"
          className="border-t border-[#c5a059]/15 bg-[#080709] px-4 overflow-x-auto"
        >
          <div className="max-w-7xl mx-auto flex items-center space-x-1 py-1">
            {navItems.map((item) => {
              const isActive = currentScreen === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs font-serif uppercase tracking-widest transition-all duration-150 border-b-2 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "text-[#dfc282] border-[#c5a059] bg-[#1a1410] font-semibold shadow-[inset_0_-4px_10px_rgba(197,160,89,0.15)]"
                      : "text-[#8a7f72] border-transparent hover:text-[#ece3cd] hover:border-[#c5a059]/40 hover:bg-[#120f12]"
                  }`}
                >
                  <span className={isActive ? "text-[#dfc282]" : "text-[#7d7265]"}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        {children}
      </main>

      {/* Atmospheric Footer */}
      <footer className="border-t border-[#c5a059]/20 bg-[#09080a] py-3 px-4 text-center text-xs text-[#7d7265] font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            ✦ SÉANCE STUDIO • AIR-GAPPED OCCULT INVESTIGATION ENGINE ✦
          </span>
          <span className="text-[11px] text-[#b8a88a]">
            Offline Protocol Active • No Cloud Inference • Local Ollama
          </span>
        </div>
      </footer>
    </div>
  );
}

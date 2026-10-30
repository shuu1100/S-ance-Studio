"use client";

import React, { useState } from "react";
import { MansionRoom, Character, Clue, InvestigationSession } from "../../types";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Modal } from "../ui/Modal";
import { EnvironmentScene } from "../game/EnvironmentScene";
import { ClueArtwork } from "../game/ClueArtwork";
import { StoryMoment } from "../game/StoryMoment";
import {
  Compass,
  Ghost,
  Search,
  MapPin,
  Radio,
  CheckCircle,
  ChevronRight,
  Lock,
  MessageSquare,
  Network,
  BookOpen,
  HelpCircle,
  EyeOff,
  User,
  Target,
} from "lucide-react";

export interface MansionDashboardProps {
  rooms: MansionRoom[];
  characters: Character[];
  clues: Clue[];
  session: InvestigationSession;
  onEnterRoom: (roomId: string) => void;
  onInspectHotspot: (roomId: string, hotspotId: string) => void;
  onNavigateToScreen: (screen: "interview" | "evidence" | "journal") => void;
}

export function MansionDashboard({
  rooms,
  characters,
  clues,
  session,
  onEnterRoom,
  onInspectHotspot,
  onNavigateToScreen,
}: MansionDashboardProps) {
  const [selectedRoomId, setSelectedRoomId] = useState<string>(rooms[0]?.id || "room_foyer");
  const [isStorySummaryOpen, setIsStorySummaryOpen] = useState(false);

  const activeRoom = rooms.find((r) => r.id === selectedRoomId) || rooms[0];

  const discoveredClues = clues.filter((c) => c.status !== "undiscovered");
  const undiscoveredClues = clues.filter((c) => c.status === "undiscovered");

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Investigation Objective Banner */}
      <div className="gothic-card p-4 border border-[#c5a059]/40 bg-[#17110e] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-[0_4px_16px_rgba(0,0,0,0.7)]">
        <div className="flex items-start gap-3">
          <div className="p-2 border border-[#c5a059]/40 bg-[#251b14] text-[#dfc282] shrink-0 mt-0.5">
            <Target className="w-4 h-4 text-[#e29d42]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#dfc282]">
                Active Inquest Objective • Act {session.currentAct}
              </span>
              <Badge variant="chapter" size="sm">
                Turn {session.turnCounter} of {session.maxTurns}
              </Badge>
            </div>
            <p className="font-serif text-sm text-[#ece3cd] mt-0.5 font-medium">
              {session.objective}
            </p>
          </div>
        </div>

        {/* Quick Nav Bar */}
        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onNavigateToScreen("interview")}
            icon={<MessageSquare className="w-3.5 h-3.5 text-[#dfc282]" />}
          >
            Interviews
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onNavigateToScreen("evidence")}
            icon={<Network className="w-3.5 h-3.5 text-[#dfc282]" />}
          >
            Evidence Board
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onNavigateToScreen("journal")}
            icon={<BookOpen className="w-3.5 h-3.5 text-[#dfc282]" />}
          >
            Journal
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsStorySummaryOpen(true)}
            icon={<HelpCircle className="w-3.5 h-3.5 text-[#b8a88a]" />}
            title="Read Story Background"
          >
            Story Summary
          </Button>
        </div>
      </div>

      {/* Main Floor Plan Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Room Map & Location Selector */}
        <div className="lg:col-span-5 space-y-2.5">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-serif uppercase tracking-wider text-[#dfc282] flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-[#c5a059]" />
              Manor Grounds Map
            </span>
            <span className="text-[10px] font-mono text-[#8a7f72]">
              {rooms.filter((r) => r.unlocked).length} of {rooms.length} Wings Unlocked
            </span>
          </div>

          {rooms.map((room) => {
            const isSelected = room.id === selectedRoomId;
            const occupants = characters.filter((c) =>
              room.characterIdsPresent?.includes(c.id)
            );

            return (
              <div
                key={room.id}
                onClick={() => setSelectedRoomId(room.id)}
                className={`p-3.5 border transition-all cursor-pointer rounded-[2px] select-none flex items-center justify-between ${
                  isSelected
                    ? "bg-[#251d16] border-[#c5a059] shadow-[0_0_12px_rgba(197,160,89,0.25)]"
                    : "gothic-card border-[#c5a059]/25 hover:border-[#c5a059]/50 hover:bg-[#151214]"
                } ${!room.unlocked ? "opacity-60 bg-[#0d090d]" : ""}`}
              >
                <div className="space-y-1 min-w-0 pr-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif text-sm font-semibold text-[#dfc282] truncate">
                      {room.name}
                    </h3>

                    {!room.unlocked ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-mono text-[#fca5a5] bg-[#200c0f] px-1.5 py-0.5 border border-[#8a1f29]/40">
                        <Lock className="w-2.5 h-2.5" /> SEALED
                      </span>
                    ) : room.presenceDetected ? (
                      <span
                        className="inline-flex items-center gap-1 text-[9px] font-mono text-[#7dd3fc] bg-[#0c1920] px-1.5 py-0.5 border border-[#38bdf8]/40"
                        title="Active spectral manifestation in this chamber"
                      >
                        <Ghost className="w-2.5 h-2.5" /> SPIRIT
                      </span>
                    ) : null}
                  </div>

                  <p className="text-[11px] text-[#b8a88a] font-mono truncate">
                    {room.subtitle}
                  </p>

                  {/* Character Presence Indicators */}
                  {occupants.length > 0 && (
                    <div className="flex items-center gap-1 pt-1 text-[10px] text-[#dfc282] font-mono">
                      <User className="w-3 h-3 text-[#c5a059]" />
                      <span>Present: {occupants.map((o) => o.name.split(" ")[1] || o.name).join(", ")}</span>
                    </div>
                  )}
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <span className="text-[10px] text-[#7d7265] font-mono">
                    {room.hotspots.length} POIs
                  </span>
                  <ChevronRight
                    className={`w-4 h-4 ${
                      isSelected ? "text-[#dfc282]" : "text-[#7d7265]"
                    }`}
                  />
                </div>
              </div>
            );
          })}

          {/* Clues Discovery Summary Accordion */}
          <div className="gothic-card p-4 border border-[#c5a059]/30 bg-[#120f12] space-y-3 mt-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#c5a059]/20">
              <span className="font-serif text-xs font-semibold text-[#dfc282] uppercase tracking-wider">
                Exhibits Discovered ({discoveredClues.length}/{clues.length})
              </span>
              <span className="text-[10px] font-mono text-[#8a7f72]">
                {undiscoveredClues.length} Concealed in Shadows
              </span>
            </div>

            {/* List of Discovered Clues */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {discoveredClues.map((c) => (
                <ClueArtwork key={c.id} clue={c} variant="compact" />
              ))}

              {/* Undiscovered Clues (Shown strictly without revealing sensitive descriptions or names) */}
              {undiscoveredClues.map((c, idx) => (
                <ClueArtwork key={c.id || idx} clue={c} variant="compact" />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Room Inspector & Hotspots */}
        <div className="lg:col-span-7">
          {activeRoom && (
            <div className="gothic-card p-6 border border-[#c5a059]/40 bg-[#141013] space-y-5">
              {/* Room Header */}
              <div className="flex items-start justify-between pb-3 border-b border-[#c5a059]/20">
                <div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#c5a059]" />
                    <h3 className="font-serif text-lg font-bold text-[#dfc282]">
                      {activeRoom.name}
                    </h3>
                  </div>
                  <p className="text-xs text-[#b8a88a] font-mono mt-0.5">
                    {activeRoom.subtitle}
                  </p>
                </div>

                <Badge
                  variant={!activeRoom.unlocked ? "crimson" : activeRoom.presenceDetected ? "spirit" : "brass"}
                  size="sm"
                >
                  {!activeRoom.unlocked ? "Sealed Vault" : activeRoom.presenceDetected ? "Active Spirit Echo" : "Secured Wing"}
                </Badge>
              </div>

              {/* Room Environment Scene Artwork */}
              <EnvironmentScene
                roomId={activeRoom.id}
                roomName={activeRoom.name}
                subtitle={activeRoom.subtitle}
                aspectRatio="16:9"
                overlayOpacity={0.25}
                showCaption={false}
              />

              {/* Room Narrative Description */}
              <p className="text-xs sm:text-sm text-[#d4c8af] leading-relaxed italic font-serif">
                &ldquo;{activeRoom.description}&rdquo;
              </p>

              {/* Room Occupants */}
              {activeRoom.characterIdsPresent?.length > 0 && (
                <div className="p-3 bg-[#191210] border border-[#c5a059]/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-[#dfc282]" />
                    <span className="text-xs font-serif text-[#dfc282]">
                      Occupants in Chamber:
                    </span>
                    <span className="text-xs font-mono text-[#b8a88a]">
                      {characters
                        .filter((c) => activeRoom.characterIdsPresent.includes(c.id))
                        .map((c) => `${c.name} (${c.title})`)
                        .join(", ")}
                    </span>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onNavigateToScreen("interview")}
                    className="text-xs py-1 px-2.5 shrink-0"
                  >
                    Question Occupants
                  </Button>
                </div>
              )}

              {/* Forensic Hotspots / Inspection Points */}
              <div className="space-y-3 pt-2">
                <span className="text-xs font-serif uppercase tracking-wider text-[#dfc282] flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-[#c5a059]" />
                  Forensic Points of Interest (POIs)
                </span>

                <div className="grid grid-cols-1 gap-2.5">
                  {activeRoom.hotspots.map((hs) => (
                    <div
                      key={hs.id}
                      className="p-3 bg-[#1c1613] border border-[#c5a059]/30 rounded-[1px] flex items-start justify-between gap-3 hover:border-[#c5a059]/60 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[#dfc282]">
                            {hs.label}
                          </span>
                          {hs.inspected ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-mono text-[#86efac]">
                              <CheckCircle className="w-2.5 h-2.5" /> Examined
                            </span>
                          ) : (
                            <span className="text-[9px] font-mono text-[#f5b041]">
                              Unexamined
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#b8a88a] leading-relaxed">
                          {hs.description}
                        </p>
                      </div>

                      <Button
                        variant={hs.inspected ? "secondary" : "primary"}
                        size="sm"
                        disabled={!activeRoom.unlocked}
                        onClick={() => onInspectHotspot(activeRoom.id, hs.id)}
                        className="shrink-0 text-xs py-1 px-3"
                      >
                        {hs.inspected ? "Re-examine" : "Examine POI"}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Quick Action */}
              <div className="pt-4 border-t border-[#c5a059]/20 flex items-center justify-between">
                <span className="text-[11px] font-mono text-[#8a7f72]">
                  {activeRoom.cluesCount} Associated Case Clues Tied to this Wing
                </span>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!activeRoom.unlocked}
                  onClick={() => onEnterRoom(activeRoom.id)}
                  icon={<Radio className="w-3.5 h-3.5 text-[#dfc282]" />}
                >
                  Conduct Detailed Sweep
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dramatic Revelation Story Moment Modal */}
      <StoryMoment
        momentId="moment_thirteenth_chime"
        title="Blackwood Manor: The Thirteenth Chime"
        subtitle="The Impossible Anomaly • 12:13 AM"
        narrative="At precisely midnight on October 14, 1922, the great astronomical clock in the central foyer chimed not twelve, but thirteen reverberating strokes. As the unnatural chime echoed through stone arches, frost crept across the windows and Lady Eleanor collapsed lifelessly in the library. Madame Vane swears the spirit realm broke open in that instant, leaving the murder unavenged."
        isOpen={isStorySummaryOpen}
        onDismiss={() => setIsStorySummaryOpen(false)}
        actionLabel="Return to Investigation"
      />
    </div>
  );
}

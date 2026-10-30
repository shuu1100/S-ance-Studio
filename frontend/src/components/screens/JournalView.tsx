"use client";

import React, { useState } from "react";
import { JournalEntry, InvestigationSession, Clue, Character, DialogueMessage } from "../../types";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import {
  BookOpen,
  Plus,
  Calendar,
  Search,
  Compass,
  Clock,
  User,
  ShieldAlert,
  Scale,
  HelpCircle,
  Lightbulb,
  History,
  CheckCircle2,
  Lock,
} from "lucide-react";

export type DossierSectionId =
  | "overview"
  | "timeline"
  | "witnesses"
  | "evidence"
  | "contradictions"
  | "unanswered"
  | "theories"
  | "history";

export interface JournalViewProps {
  entries: JournalEntry[];
  session: InvestigationSession;
  clues?: Clue[];
  characters?: Character[];
  dialogues?: DialogueMessage[];
  onAddEntry: (entry: {
    title: string;
    category: JournalEntry["category"];
    entryType: "fact" | "theory";
    content: string;
  }) => void;
}

export function JournalView({
  entries,
  session,
  clues = [],
  characters = [],
  dialogues = [],
  onAddEntry,
}: JournalViewProps) {
  const [activeSection, setActiveSection] = useState<DossierSectionId>("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newEntryType, setNewEntryType] = useState<"fact" | "theory">("theory");
  const [newContent, setNewContent] = useState("");

  const discoveredClues = clues.filter((c) => c.status !== "undiscovered");

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    onAddEntry({
      title: newTitle.trim(),
      category: "lead",
      entryType: newEntryType,
      content: newContent.trim(),
    });
    setNewTitle("");
    setNewContent("");
    setIsAddingNote(false);
  };

  const sectionsList: { id: DossierSectionId; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "1. Overview", icon: <Compass className="w-3.5 h-3.5" /> },
    { id: "timeline", label: "2. Timeline", icon: <Clock className="w-3.5 h-3.5" /> },
    { id: "witnesses", label: "3. Witness Statements", icon: <User className="w-3.5 h-3.5" /> },
    { id: "evidence", label: "4. Discovered Evidence", icon: <ShieldAlert className="w-3.5 h-3.5" /> },
    { id: "contradictions", label: "5. Contradictions", icon: <Scale className="w-3.5 h-3.5" /> },
    { id: "unanswered", label: "6. Unanswered Leads", icon: <HelpCircle className="w-3.5 h-3.5" /> },
    { id: "theories", label: "7. Current Theories", icon: <Lightbulb className="w-3.5 h-3.5" /> },
    { id: "history", label: "8. Inquest History", icon: <History className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-[#c5a059]/30 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#dfc282]" />
            <h2 className="font-serif text-2xl text-[#dfc282] uppercase tracking-wide">
              Official Case Dossier & Inquest Ledger
            </h2>
          </div>
          <p className="text-xs text-[#b8a88a] font-mono mt-0.5">
            Blackwood Manor: The Thirteenth Chime • Authoritative 8-Section Detective Record
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsAddingNote(!isAddingNote)}
          icon={<Plus className="w-4 h-4 text-[#dfc282]" />}
        >
          {isAddingNote ? "Close Composer" : "Inscribe Field Note"}
        </Button>
      </div>

      {/* 8-Section Navigation Tabs */}
      <div className="bg-[#120f12] border border-[#c5a059]/30 p-1.5 rounded-[2px] flex items-center gap-1.5 overflow-x-auto">
        {sectionsList.map((sec) => (
          <button
            key={sec.id}
            onClick={() => setActiveSection(sec.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-serif uppercase tracking-wider rounded-[1px] transition-colors whitespace-nowrap cursor-pointer ${
              activeSection === sec.id
                ? "bg-[#251d18] border border-[#c5a059] text-[#dfc282]"
                : "text-[#a39482] hover:text-[#dfc282] border border-transparent"
            }`}
          >
            {sec.icon}
            {sec.label}
          </button>
        ))}
      </div>

      {/* Composer Drawer */}
      {isAddingNote && (
        <form
          onSubmit={handleSaveNote}
          className="gothic-card p-5 border border-[#c5a059]/50 bg-[#161214] space-y-4 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between pb-2 border-b border-[#c5a059]/20">
            <span className="font-serif text-sm font-semibold text-[#dfc282] uppercase tracking-wide">
              Inscribe New Detective Observation
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setNewEntryType("fact")}
                className={`px-2.5 py-1 text-xs font-mono rounded-[1px] border cursor-pointer ${
                  newEntryType === "fact"
                    ? "bg-[#2d2218] border-[#c5a059] text-[#dfc282]"
                    : "border-[#3a3028] text-[#8a7f72]"
                }`}
              >
                Forensic Fact
              </button>
              <button
                type="button"
                onClick={() => setNewEntryType("theory")}
                className={`px-2.5 py-1 text-xs font-mono rounded-[1px] border cursor-pointer ${
                  newEntryType === "theory"
                    ? "bg-[#2d2218] border-[#c5a059] text-[#dfc282]"
                    : "border-[#3a3028] text-[#8a7f72]"
                }`}
              >
                Hypothesis
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Observation Title (e.g., Rasp marks on escapement wheel)"
              className="w-full bg-[#0d0a0d] border border-[#c5a059]/30 text-xs font-serif text-[#dfc282] p-2.5 rounded-[1px] focus:outline-none focus:border-[#c5a059]"
              required
            />
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={3}
              placeholder="Record forensic details, witness discrepancies, or deductive linkages..."
              className="w-full bg-[#0d0a0d] border border-[#c5a059]/30 text-xs font-serif text-[#d4c8af] p-2.5 rounded-[1px] focus:outline-none focus:border-[#c5a059]"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#c5a059]/20">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsAddingNote(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save to Dossier
            </Button>
          </div>
        </form>
      )}

      {/* SECTION CONTENT DISPLAY */}
      <div className="space-y-4">
        {/* SECTION 1: OVERVIEW */}
        {activeSection === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="gothic-card p-5 border border-[#c5a059]/40 bg-[#161214] space-y-3">
              <span className="font-serif text-sm font-bold text-[#dfc282] uppercase tracking-wider block border-b border-[#c5a059]/20 pb-2">
                Case Metadata & Crime Circumstances
              </span>
              <div className="space-y-2 text-xs font-mono">
                <div><span className="text-[#8a7f72]">Victim:</span> <span className="text-[#ece3cd] font-serif font-bold">Lady Eleanor Blackwood</span> (Age 64)</div>
                <div><span className="text-[#8a7f72]">Location of Death:</span> <span className="text-[#ece3cd]">The Locked Library, Blackwood Manor</span></div>
                <div><span className="text-[#8a7f72]">Time of Crime:</span> <span className="text-[#ece3cd]">October 14, 1922 • 12:00 AM – 12:13 AM</span></div>
                <div><span className="text-[#8a7f72]">Apparent Cause:</span> <span className="text-[#fca5a5]">Acute Arsenic Trioxide Intoxication</span></div>
                <div><span className="text-[#8a7f72]">Investigator:</span> <span className="text-[#dfc282]">Court-Appointed Occult Inquisitor</span></div>
                <div><span className="text-[#8a7f72]">Current Act:</span> <span className="text-[#c5a059]">Act {session.currentAct} of {session.totalActs}</span></div>
                <div><span className="text-[#8a7f72]">Inquest Turn:</span> <span className="text-[#dfc282]">{session.turnCounter} of {session.maxTurns}</span></div>
              </div>
            </div>

            <div className="gothic-card p-5 border border-[#c5a059]/40 bg-[#161214] space-y-3">
              <span className="font-serif text-sm font-bold text-[#dfc282] uppercase tracking-wider block border-b border-[#c5a059]/20 pb-2">
                Occult Equilibrium & Inquest Objective
              </span>
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-[#1e1511] border border-[#c5a059]/30 rounded-[1px]">
                  <span className="text-[10px] font-mono text-[#c5a059] uppercase block mb-1">Authoritative Objective:</span>
                  <p className="font-serif text-sm text-[#ece3cd]">{session.objective}</p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs">
                  <div className="p-2 bg-[#120f12] border border-[#c5a059]/20">
                    <span className="text-[10px] text-[#8a7f72] block">Sanity</span>
                    <span className="text-[#86efac] font-bold">{session.playerSanity}%</span>
                  </div>
                  <div className="p-2 bg-[#120f12] border border-[#c5a059]/20">
                    <span className="text-[10px] text-[#8a7f72] block">Ward Candle</span>
                    <span className="text-[#dfc282] font-bold">{session.candlePercentage.toFixed(1)}%</span>
                  </div>
                  <div className="p-2 bg-[#120f12] border border-[#c5a059]/20">
                    <span className="text-[10px] text-[#8a7f72] block">Tension</span>
                    <span className="text-[#fca5a5] font-bold">{session.ectoplasmicTension}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: TIMELINE */}
        {activeSection === "timeline" && (
          <div className="gothic-card p-5 border border-[#c5a059]/40 bg-[#161214] space-y-4">
            <span className="font-serif text-sm font-bold text-[#dfc282] uppercase tracking-wider block border-b border-[#c5a059]/20 pb-2">
              Chronological Reconstruction of the Fateful Night
            </span>
            <div className="relative border-l border-[#c5a059]/30 ml-4 space-y-6 py-2">
              {[
                {
                  time: "9:00 PM",
                  title: "Lord Julian Arrives at Blackwood Manor",
                  desc: "Julian arrives unexpectedly in driving rain, demanding funds to clear £8,500 gaming debts. Arthur notices a jeweler's rasp in Julian's pocket.",
                },
                {
                  time: "9:30 PM",
                  title: "Apothecary Vial Stolen from Potting Bench",
                  desc: "The conservatory lock is forced. Amber vial containing 99% pure arsenic trioxide rat poison disappears from Arthur's bench.",
                },
                {
                  time: "10:15 PM",
                  title: "Heated Confrontation in the Locked Library",
                  desc: "Eleanor refuses Julian's demands, stating she has revoked his inheritance. A draft will fragment is thrown into the study hearth.",
                },
                {
                  time: "11:30 PM",
                  title: "The Evening Valerian Cordial Administered",
                  desc: "Eleanor's silver monogrammed cordial flask is prepared and laced with arsenic trioxide, producing gradual respiratory distress.",
                },
                {
                  time: "12:00 AM",
                  title: "The Impossible Thirteenth Strike Tolls",
                  desc: "The astronomical clock strikes thirteen hollow bells, muffling Eleanor's dying cries. At 12:13 AM, the modified escapement jams.",
                },
                {
                  time: "12:15 AM",
                  title: "Intruder Flees Through Conservatory Window",
                  desc: "Shred of crimson velvet snags on the terrace catch as the perpetrator escapes to stash the poison ledger in the family vaults.",
                },
              ].map((item, idx) => (
                <div key={idx} className="relative pl-6">
                  <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#c5a059] border border-black" />
                  <span className="text-[10px] font-mono text-[#c5a059] font-bold uppercase">{item.time}</span>
                  <h4 className="font-serif text-xs font-semibold text-[#dfc282]">{item.title}</h4>
                  <p className="text-xs text-[#d4c8af] mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 3: WITNESS STATEMENTS */}
        {activeSection === "witnesses" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {characters.map((char) => (
              <div key={char.id} className="gothic-card p-4 border border-[#c5a059]/40 bg-[#161214] space-y-3">
                <div className="flex items-center justify-between border-b border-[#c5a059]/20 pb-2">
                  <h4 className="font-serif text-xs font-bold text-[#dfc282]">{char.name}</h4>
                  <Badge variant={char.type === "spirit" ? "spirit" : "brass"} size="sm">{char.type}</Badge>
                </div>
                <p className="text-xs text-[#d4c8af] leading-relaxed">{char.shortBio}</p>
                <div className="pt-2 border-t border-[#c5a059]/15 text-[11px] font-mono space-y-1">
                  <div><span className="text-[#8a7f72]">Trust:</span> <span className="text-[#86efac]">{char.trustLevel}%</span></div>
                  <div><span className="text-[#8a7f72]">Temperament:</span> <span className="text-[#e29d42]">{char.temperament}</span></div>
                  <div><span className="text-[#8a7f72]">Location:</span> <span className="text-[#b8a88a]">{char.location}</span></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SECTION 4: DISCOVERED EVIDENCE */}
        {activeSection === "evidence" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {clues.map((clue) => {
              const isDiscovered = clue.status !== "undiscovered";
              return (
                <div
                  key={clue.id}
                  className={`p-4 rounded-[1px] border space-y-2 ${
                    isDiscovered
                      ? "gothic-card border-[#c5a059]/40 bg-[#161214]"
                      : "border-[#251d18] bg-[#0c090c] opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-[#c5a059]">{clue.evidenceMarker || "EXHIBIT"}</span>
                    <Badge variant={isDiscovered ? "brass" : "muted"} size="sm">
                      {isDiscovered ? clue.status : "Locked"}
                    </Badge>
                  </div>
                  <h4 className="font-serif text-xs font-bold text-[#dfc282]">
                    {isDiscovered ? clue.title : "Undiscovered Exhibit"}
                  </h4>
                  <p className="text-xs text-[#d4c8af] leading-relaxed">
                    {isDiscovered ? clue.description : "This evidence relic has not yet been uncovered in the manor."}
                  </p>
                  {isDiscovered && (
                    <div className="pt-2 border-t border-[#c5a059]/15 text-[10px] font-mono text-[#8a7f72]">
                      Source: {clue.locationFound}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* SECTION 5: CONTRADICTIONS */}
        {activeSection === "contradictions" && (
          <div className="gothic-card p-5 border border-[#c5a059]/40 bg-[#161214] space-y-3">
            <span className="font-serif text-sm font-bold text-[#dfc282] uppercase tracking-wider block border-b border-[#c5a059]/20 pb-2">
              Witness Statements vs Physical Truth
            </span>
            <div className="space-y-3">
              {[
                {
                  title: "Clock Failure vs Rasp Marks",
                  claim: "Arthur stated the clock broke on its own during the heavy thunder.",
                  conflict: "Escapement wheel teeth were filed down with jeweler's rasp to jam at 12:13 AM.",
                  status: "Resolved",
                },
                {
                  title: "Peaceful Relations vs Charred Will",
                  claim: "Victoria insisted Eleanor had harmonious relations with the entire family.",
                  conflict: "Burned will fragment confirms Lord Julian was disinherited over £8,500 gaming debts.",
                  status: "Verified",
                },
                {
                  title: "Accidental Death vs Concentrated Arsenic",
                  claim: "Arthur suggested Eleanor accidentally swallowed cleaning solvent.",
                  conflict: "Apothecary vial stolen from potting bench contained pure concentrated arsenic trioxide.",
                  status: "Verified",
                },
              ].map((c, idx) => (
                <div key={idx} className="p-3 bg-[#110d10] border border-[#c5a059]/25 rounded-[1px] space-y-1.5 text-xs">
                  <div className="flex items-center justify-between font-mono text-[10px]">
                    <span className="font-serif font-bold text-[#dfc282] text-xs">{c.title}</span>
                    <span className="text-[#86efac] font-bold">{c.status}</span>
                  </div>
                  <div className="text-[#d4c8af]"><span className="text-[#8a7f72] font-mono">Claim:</span> {c.claim}</div>
                  <div className="text-[#fca5a5]"><span className="text-[#c5a059] font-mono">Physical Conflict:</span> {c.conflict}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 6: UNANSWERED QUESTIONS */}
        {activeSection === "unanswered" && (
          <div className="gothic-card p-5 border border-[#c5a059]/40 bg-[#161214] space-y-3">
            <span className="font-serif text-sm font-bold text-[#dfc282] uppercase tracking-wider block border-b border-[#c5a059]/20 pb-2">
              Unresolved Inquest Leads & Crucial Enigmas
            </span>
            <div className="space-y-2.5">
              {[
                {
                  lead: "Where is the definitive poison ledger recording the murder plot?",
                  hint: "Confront Victoria with the crimson velvet shred to obtain the brass crypt key and search the cellar vaults.",
                  status: discoveredClues.some((c) => c.id === "clue_crypt_journal") ? "Solved" : "Pending",
                },
                {
                  lead: "Who aided Julian in reaching the conservatory terrace?",
                  hint: "Inquire with Victoria regarding who unlocked the outer garden gate during the séance.",
                  status: "Under Investigation",
                },
                {
                  lead: "What did Eleanor's spirit utter regarding the face in the shadows?",
                  hint: "Channel Eleanor's apparition in the Séance Parlor to unlock the dying vision.",
                  status: "Active Lead",
                },
              ].map((lead, idx) => (
                <div key={idx} className="p-3 bg-[#181316] border border-[#c5a059]/25 rounded-[1px] space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-serif font-semibold text-[#dfc282]">{lead.lead}</span>
                    <Badge variant={lead.status === "Solved" ? "brass" : "muted"} size="sm">{lead.status}</Badge>
                  </div>
                  <p className="text-[11px] text-[#b8a88a] font-mono">{lead.hint}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 7: CURRENT THEORIES */}
        {activeSection === "theories" && (
          <div className="gothic-card p-5 border border-[#c5a059]/40 bg-[#161214] space-y-4">
            <span className="font-serif text-sm font-bold text-[#dfc282] uppercase tracking-wider block border-b border-[#c5a059]/20 pb-2">
              Deductive Working Hypotheses
            </span>
            <div className="p-4 bg-[#1f1612] border border-[#c5a059]/40 rounded-[1px] space-y-2 text-xs">
              <div className="flex items-center justify-between font-mono text-[10px]">
                <span className="font-serif font-bold text-[#dfc282] text-xs">Primary Hypothesis: Lord Julian Blackwood</span>
                <span className="text-[#86efac] font-bold">Supported (85%)</span>
              </div>
              <p className="text-[#d4c8af] leading-relaxed">
                Lord Julian entered Blackwood Manor at 9:00 PM, stole concentrated arsenic trioxide from Arthur&apos;s potting bench, filed the grandfather clock escapement to strike 13 times at midnight, poisoned Lady Eleanor&apos;s valerian cordial, burned the disinheriting codicil, and hid his ledger in the family crypt.
              </p>
            </div>

            {/* Custom inscribed theories */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-mono text-[#c5a059] uppercase block">Inscribed Field Notes:</span>
              {entries.filter((e) => e.entryType === "theory").map((entry) => (
                <div key={entry.id} className="p-3 bg-[#110e11] border border-[#3a3028] rounded-[1px] space-y-1 text-xs">
                  <div className="font-serif font-bold text-[#dfc282]">{entry.title}</div>
                  <p className="text-[#b8a88a]">{entry.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 8: INVESTIGATION HISTORY */}
        {activeSection === "history" && (
          <div className="gothic-card p-5 border border-[#c5a059]/40 bg-[#161214] space-y-4">
            <span className="font-serif text-sm font-bold text-[#dfc282] uppercase tracking-wider block border-b border-[#c5a059]/20 pb-2">
              Chronological Audit Log of Player Actions
            </span>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {session.decisionsMade.map((dec, idx) => (
                <div key={idx} className="p-3 bg-[#120f12] border border-[#c5a059]/25 rounded-[1px] text-xs flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono text-[#c5a059]">Turn {dec.turn}</span>
                    <h5 className="font-serif font-semibold text-[#dfc282]">{dec.decision}</h5>
                    <p className="text-[11px] text-[#b8a88a]">{dec.impact}</p>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-[#86efac] shrink-0 mt-1" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

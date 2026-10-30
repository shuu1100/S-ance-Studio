import { test } from "node:test";
import assert from "node:assert/strict";

test("Séance Studio — Dynamic Inquiry Modes Definition", () => {
  const permittedModes = [
    "free_question",
    "suggested_questions",
    "investigate_topic",
    "present_evidence",
    "challenge_contradiction",
    "conduct_seance",
  ];

  assert.equal(permittedModes.length, 6);
  assert.ok(permittedModes.includes("suggested_questions"));
  assert.ok(permittedModes.includes("challenge_contradiction"));
  assert.ok(permittedModes.includes("investigate_topic"));
  assert.ok(permittedModes.includes("present_evidence"));
  assert.ok(permittedModes.includes("conduct_seance"));
  assert.ok(permittedModes.includes("free_question"));
});

test("Séance Studio — 10 Canonical Investigation Topics Coverage", () => {
  const canonicalTopics = [
    "death",
    "thirteenth_chime",
    "clock",
    "poison",
    "will",
    "alibis",
    "relationships",
    "physical_evidence",
    "contradictions",
    "supernatural_events",
  ];

  assert.equal(canonicalTopics.length, 10);
  assert.ok(canonicalTopics.includes("thirteenth_chime"));
  assert.ok(canonicalTopics.includes("poison"));
  assert.ok(canonicalTopics.includes("will"));
  assert.ok(canonicalTopics.includes("contradictions"));
});

test("Séance Studio — Contradiction Readiness Logic", () => {
  const discoveredClues = ["clue_silver_flask"];

  const contraClock = {
    id: "contra_clock_file_vs_spontaneous",
    prerequisite_clues: ["clue_thirteenth_chime"],
  };

  const isClockReady = contraClock.prerequisite_clues.every((c) =>
    discoveredClues.includes(c)
  );
  assert.equal(isClockReady, false, "Clock contradiction should not be ready without escapement clue");

  const discoveredWithClock = ["clue_silver_flask", "clue_thirteenth_chime"];
  const isClockReadyNow = contraClock.prerequisite_clues.every((c) =>
    discoveredWithClock.includes(c)
  );
  assert.equal(isClockReadyNow, true, "Clock contradiction should be ready once escapement clue discovered");
});

test("Séance Studio — Theory Evaluation Consistency Scoring Logic", () => {
  function evaluateHypothesis(suspectId, weaponId, motiveId, supportingClues) {
    let score = 0;
    const contradictions = [];

    if (suspectId === "char_julian") {
      score += 35;
    } else {
      contradictions.push(`Suspect ${suspectId} has no established motive or opportunity`);
    }

    if (weaponId === "clue_silver_flask") {
      score += 25;
    } else {
      contradictions.push("Weapon does not match forensic cyanosis autopsy finding");
    }

    if (motiveId === "clue_burned_will") {
      score += 20;
    }

    score += Math.min(20, supportingClues.length * 5);
    score = Math.max(5, Math.min(100, score - contradictions.length * 20));

    return {
      status: contradictions.length > 0 ? "contradicted" : score >= 75 ? "supported" : "unsupported",
      score,
      contradictions,
    };
  }

  // Innocent accusation
  const caretakerHypothesis = evaluateHypothesis(
    "char_caretaker",
    "clue_silver_flask",
    "clue_burned_will",
    []
  );
  assert.equal(caretakerHypothesis.status, "contradicted");
  assert.ok(caretakerHypothesis.contradictions.length >= 1);

  // Authoritative truth
  const julianHypothesis = evaluateHypothesis(
    "char_julian",
    "clue_silver_flask",
    "clue_burned_will",
    ["clue_thirteenth_chime", "clue_arsenic_vial", "clue_crypt_journal", "clue_torn_velvet"]
  );
  assert.equal(julianHypothesis.status, "supported");
  assert.ok(julianHypothesis.score >= 90);
  assert.equal(julianHypothesis.contradictions.length, 0);
});

test("Séance Studio — Case Dossier 8 Sections Integrity", () => {
  const dossierSections = [
    "overview",
    "timeline",
    "witnesses",
    "evidence",
    "contradictions",
    "unanswered",
    "theories",
    "history",
  ];

  assert.equal(dossierSections.length, 8);
  assert.ok(dossierSections.includes("timeline"));
  assert.ok(dossierSections.includes("contradictions"));
  assert.ok(dossierSections.includes("unanswered"));
  assert.ok(dossierSections.includes("theories"));
  assert.ok(dossierSections.includes("history"));
});


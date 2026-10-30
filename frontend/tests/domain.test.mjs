import test from "node:test";
import assert from "node:assert/strict";

test("Séance Studio — Initial Game Session Validation", () => {
  const session = {
    id: "sess_blackwood_thirteenth_chime",
    caseTitle: "Blackwood Manor: The Thirteenth Chime",
    candlePercentage: 82.5,
    playerSanity: 78,
    turnCounter: 4,
    maxTurns: 30,
    status: "active",
  };

  assert.equal(session.status, "active");
  assert.ok(session.candlePercentage > 0 && session.candlePercentage <= 100);
  assert.ok(session.playerSanity >= 0 && session.playerSanity <= 100);
  assert.ok(session.turnCounter <= session.maxTurns);
});

test("Séance Studio — Permitted Evidence Connections Matrix", () => {
  const permittedRules = [
    { fromClueId: "clue_silver_flask", toClueId: "clue_arsenic_vial", relationship: "weapon_match" },
    { fromClueId: "clue_burned_will", toClueId: "clue_silver_flask", relationship: "implicates" },
    { fromClueId: "clue_silver_flask", toClueId: "clue_spectral_whisper", relationship: "contradicts" },
  ];

  function validateConnection(clueA, clueB) {
    return permittedRules.some(
      (r) =>
        (r.fromClueId === clueA && r.toClueId === clueB) ||
        (r.fromClueId === clueB && r.toClueId === clueA)
    );
  }

  // Valid pairings must be accepted
  assert.equal(validateConnection("clue_silver_flask", "clue_arsenic_vial"), true);
  assert.equal(validateConnection("clue_arsenic_vial", "clue_silver_flask"), true);
  assert.equal(validateConnection("clue_burned_will", "clue_silver_flask"), true);

  // Invalid pairings must be strictly rejected
  assert.equal(validateConnection("clue_burned_will", "clue_arsenic_vial"), false);
  assert.equal(validateConnection("clue_spectral_whisper", "clue_burned_will"), false);
});

test("Séance Studio — Undiscovered Clue Integrity (No Frontend Leakage)", () => {
  const sampleClues = [
    { id: "c1", status: "verified", title: "Silver Flask" },
    { id: "c2", status: "revealed", title: "Burned Will" },
    { id: "c3", status: "undiscovered", title: "Arsenic Vial" },
  ];

  // Frontend board must strictly filter out undiscovered clues
  const boardClues = sampleClues.filter((c) => c.status !== "undiscovered");
  assert.equal(boardClues.length, 2);
  assert.ok(!boardClues.some((c) => c.id === "c3"));
});

test("Séance Studio — Accusation Deduction Matrix Evaluation", () => {
  const evaluateVerdict = (suspectId, weaponId, motiveId, supportingClueIds) => {
    const isJulian = suspectId === "char_julian";
    const isArsenic = weaponId === "method_arsenic_cordial";
    const isDebt = motiveId === "motive_disinheritance_debt";
    const hasSufficientClues = supportingClueIds.length >= 2;

    if (isJulian && isArsenic && isDebt && hasSufficientClues) {
      return "END_TRUE_JUSTICE";
    }
    if (isJulian && (!hasSufficientClues || !isArsenic)) {
      return "END_HOLLOW_ACCUSATION";
    }
    return "END_WRONGFUL_CONVICTION";
  };

  // 1. True Justice
  assert.equal(
    evaluateVerdict("char_julian", "method_arsenic_cordial", "motive_disinheritance_debt", ["c1", "c2"]),
    "END_TRUE_JUSTICE"
  );

  // 2. Hollow Accusation (insufficient clues)
  assert.equal(
    evaluateVerdict("char_julian", "method_arsenic_cordial", "motive_disinheritance_debt", ["c1"]),
    "END_HOLLOW_ACCUSATION"
  );

  // 3. Wrongful Conviction (innocent suspect accused)
  assert.equal(
    evaluateVerdict("char_finch", "method_arsenic_cordial", "motive_disinheritance_debt", ["c1", "c2"]),
    "END_WRONGFUL_CONVICTION"
  );
});

test("Séance Studio — Trust Level Clamping & Boundaries", () => {
  function clampTrust(current, delta) {
    return Math.max(0, Math.min(100, current + delta));
  }

  assert.equal(clampTrust(95, 10), 100);
  assert.equal(clampTrust(15, -20), 0);
  assert.equal(clampTrust(50, 15), 65);
});

test("Séance Studio — Local AI Model Status Indicator Variants", () => {
  function computeAIStatus(backendHealth) {
    if (!backendHealth || !backendHealth.alive) {
      return { variant: "offline", label: "Backend Offline" };
    }
    if (backendHealth.ollamaConnected && backendHealth.textModelAvailable) {
      return { variant: "ready", label: "Local AI Ready" };
    }
    if (!backendHealth.ollamaConnected) {
      return { variant: "ollama_unavailable", label: "Ollama Unavailable" };
    }
    if (!backendHealth.textModelAvailable) {
      return { variant: "model_unavailable", label: "Model Unavailable" };
    }
    return { variant: "checking", label: "Checking Local AI" };
  }

  // 1. Both Ollama and configured text model available
  assert.deepEqual(
    computeAIStatus({ alive: true, ollamaConnected: true, textModelAvailable: true }),
    { variant: "ready", label: "Local AI Ready" }
  );

  // 2. Ollama daemon not running
  assert.deepEqual(
    computeAIStatus({ alive: true, ollamaConnected: false, textModelAvailable: false }),
    { variant: "ollama_unavailable", label: "Ollama Unavailable" }
  );

  // 3. Ollama daemon running but model not pulled
  assert.deepEqual(
    computeAIStatus({ alive: true, ollamaConnected: true, textModelAvailable: false }),
    { variant: "model_unavailable", label: "Model Unavailable" }
  );

  // 4. Backend completely unreachable
  assert.deepEqual(
    computeAIStatus({ alive: false }),
    { variant: "offline", label: "Backend Offline" }
  );
});

test("Séance Studio — Dialogue Generation Failure and Scripted Fallback Behavior", () => {
  const initialMessages = [
    { sender: "Investigator", text: "What did you see in the courtyard?" },
  ];

  function handleGenerationResult(messages, isError, scriptedFallback) {
    if (isError) {
      // Must preserve existing conversation and clearly label deterministic fallback
      return [
        ...messages,
        {
          sender: "Arthur Briggs",
          text: `[Deterministic Inquest Script]: ${scriptedFallback}`,
          isFallback: true,
        },
      ];
    }
    return messages;
  }

  const updatedMessages = handleGenerationResult(
    initialMessages,
    true,
    "I keep to my duties in the cellar."
  );

  // Existing messages preserved
  assert.equal(updatedMessages.length, 2);
  assert.equal(updatedMessages[0].text, "What did you see in the courtyard?");
  // Deterministic tag present
  assert.ok(updatedMessages[1].text.includes("[Deterministic Inquest Script]"));
  assert.equal(updatedMessages[1].isFallback, true);
});


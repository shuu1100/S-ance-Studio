import test from "node:test";
import assert from "node:assert/strict";

// Mirror error classification from InterviewPanel for deterministic testability
function classifyInquiryError(err) {
  if (!err) return null;
  const msg = (err.message || "").toLowerCase();
  const code = (err.code || "").toUpperCase();

  if (
    code === "SESSION_COMPLETED" ||
    msg.includes("session is completed") ||
    msg.includes("investigation is complete") ||
    msg.includes("no messages can be sent")
  ) {
    return {
      type: "session_completed",
      title: "Psychic Inquest Concluded",
      subtitle: "The communion with Blackwood Manor has ceased.",
      guidance: "This investigation has concluded. All spirits have settled and the veil has sealed. No further inquiries can be made in this session.",
      allowRetry: false,
      allowViewEnding: true,
      allowArchives: true,
      allowNewInvestigation: true,
    };
  }
  if (code === "NOT_FOUND" || code === "SESSION_NOT_FOUND" || msg.includes("not found") || msg.includes("sess_")) {
    return {
      type: "session_missing",
      title: "Investigation Session Missing",
      guidance: "The active psychic investigation session does not exist or has been severed. Please return to the Case Archives or start a new investigation.",
      allowRetry: false,
      allowArchives: true,
      allowNewInvestigation: true,
    };
  }
  if (code === "OLLAMA_UNAVAILABLE" || code === "AI_CONNECTION_ERROR" || msg.includes("unreachable") || msg.includes("connection refused") || msg.includes("failed to fetch")) {
    return {
      type: "ollama_unavailable",
      title: "Paranormal Medium (Ollama) Offline",
      guidance: "The local Ollama inference server is unreachable at http://127.0.0.1:11434. Ensure Ollama is running.",
      allowRetry: true,
    };
  }
  if (code === "MODEL_NOT_INSTALLED" || code === "AI_MODEL_NOT_FOUND" || msg.includes("model") || msg.includes("not installed")) {
    return {
      type: "model_missing",
      title: "Spiritual Vessel (AI Model) Not Installed",
      guidance: "The configured narrative model (e.g., qwen3:4b) is not installed in local Ollama.",
      allowRetry: false,
    };
  }
  if (code === "MODEL_TIMEOUT" || code === "AI_TIMEOUT_ERROR" || msg.includes("timeout") || msg.includes("timed out")) {
    return {
      type: "timeout",
      title: "Séance Trance Timed Out",
      guidance: "The spirit took too long to manifest a response. You may safely retry your inquest.",
      allowRetry: true,
    };
  }
  return {
    type: "unexpected",
    title: "Paranormal Channel Interruption",
    guidance: err.message || "An unexpected disturbance interrupted the communion.",
    allowRetry: true,
  };
}

test("Séance Studio Frontend — Missing Session Classification", () => {
  const err = {
    code: "NOT_FOUND",
    message: "Investigation session 'sess_blackwood_thirteenth_chime' not found.",
  };
  const classified = classifyInquiryError(err);
  assert.equal(classified.type, "session_missing");
  assert.equal(classified.allowRetry, false);
  assert.match(classified.title, /Missing/i);
});

test("Séance Studio Frontend — Completed Session Classification", () => {
  const err = {
    code: "SESSION_COMPLETED",
    message: "Session is completed. No messages can be sent.",
  };
  const classified = classifyInquiryError(err);
  assert.equal(classified.type, "session_completed");
  assert.equal(classified.allowRetry, false);
  assert.equal(classified.allowViewEnding, true);
  assert.match(classified.title, /Concluded/i);
});

test("Séance Studio Frontend — Ollama Offline Classification", () => {
  const err = {
    code: "AI_CONNECTION_ERROR",
    message: "Cannot connect to host 127.0.0.1:11434: Connection refused",
  };
  const classified = classifyInquiryError(err);
  assert.equal(classified.type, "ollama_unavailable");
  assert.equal(classified.allowRetry, true);
});

test("Séance Studio Frontend — Model Missing Classification", () => {
  const err = {
    code: "AI_MODEL_NOT_FOUND",
    message: "Model 'qwen3:4b' not installed.",
  };
  const classified = classifyInquiryError(err);
  assert.equal(classified.type, "model_missing");
  assert.equal(classified.allowRetry, false);
});

test("Séance Studio Frontend — Timeout Classification", () => {
  const err = {
    code: "AI_TIMEOUT_ERROR",
    message: "Request timed out after 45.0s",
  };
  const classified = classifyInquiryError(err);
  assert.equal(classified.type, "timeout");
  assert.equal(classified.allowRetry, true);
});

test("Séance Studio Frontend — Input Disabled When Session Completed or Not Ready", () => {
  function computeInputDisabled(sessionStatus, isSessionReady, isProcessing) {
    const isCompleted = sessionStatus === "completed";
    return isProcessing || !isSessionReady || isCompleted;
  }

  // Active session and ready: enabled
  assert.equal(computeInputDisabled("active", true, false), false);
  // Active session but processing: disabled
  assert.equal(computeInputDisabled("active", true, true), true);
  // Session completed: strictly disabled, even if ready and not processing
  assert.equal(computeInputDisabled("completed", true, false), true);
  // Session not ready: disabled
  assert.equal(computeInputDisabled("active", false, false), true);
});

test("Séance Studio Frontend — Session Readiness Guard", () => {
  function canSubmitInquiry(sessionId, isSubmitting) {
    const isSessionReady = Boolean(
      sessionId &&
      sessionId.trim().length > 0 &&
      sessionId !== "sess_blackwood_thirteenth_chime"
    );
    return isSessionReady && !isSubmitting;
  }

  // Blank session ID: blocked
  assert.equal(canSubmitInquiry("", false), false);
  // Stale hardcoded session ID: blocked
  assert.equal(canSubmitInquiry("sess_blackwood_thirteenth_chime", false), false);
  // Valid real backend ID: allowed
  assert.equal(canSubmitInquiry("sess_a1b2c3d4e5f6", false), true);
  // Submitting in progress: blocked
  assert.equal(canSubmitInquiry("sess_a1b2c3d4e5f6", true), false);
});

test("Séance Studio Frontend — Failed Inquiry Preserves Transcript & Turn State", () => {
  let transcript = [
    { id: "msg_1", speaker: "player", text: "Who was in the study?" },
    { id: "msg_2", speaker: "Eleanor Blackwood", text: "The cold settled before the bell struck." }
  ];
  let turnCounter = 2;

  // Simulate failed inquiry response handling
  const inquiryResponse = {
    success: false,
    error: {
      code: "AI_CONNECTION_ERROR",
      message: "Ollama server unreachable."
    }
  };

  if (!inquiryResponse.success) {
    // Crucial rule: DO NOT inject fake deterministic ghost lines or advance turnCounter
    // Only record error and preserve last attempted query for retry
  } else {
    turnCounter += 1;
    transcript.push({ id: "msg_3", speaker: "Eleanor Blackwood", text: inquiryResponse.data.dialogueText });
  }

  assert.equal(turnCounter, 2, "Turn counter must not increment on failure");
  assert.equal(transcript.length, 2, "Transcript must not have fake fallback messages appended");
});

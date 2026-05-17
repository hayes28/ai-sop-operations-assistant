/**
 * AI SOP & Operations Assistant
 * Generate calls POST /api/generate on the Express server (Gemini key stays in .env).
 * Load sample uses samples.js only — no API. Human review persists in localStorage.
 */

const TOOLS = [
  "draft-sop",
  "summarize-notes",
  "extract-actions",
  "business-rewrite",
];

const REVIEW_STORAGE_KEY = "ops-assistant-review-v1";
const ACCESS_CODE_STORAGE_KEY = "ops-assistant-access-code";
const MAX_INPUT_LENGTH = 6000;

function normalizeInput(text) {
  return text.replace(/\r\n/g, "\n").trim();
}

function getDemoOutput(toolId, input) {
  const sample = DEMO_SAMPLES[toolId];
  if (!sample) return null;
  if (normalizeInput(input) === normalizeInput(sample.input)) {
    return sample.output;
  }
  return null;
}

function getAccessCodeInput() {
  return document.getElementById("access-code");
}

function getAccessCode() {
  const input = getAccessCodeInput();
  return input?.value.trim() ?? "";
}

let accessCodeVerified = false;

function setAccessCodeStatus(message, state = "pending") {
  const el = document.getElementById("access-code-status");
  if (!el) return;
  el.textContent = message;
  el.classList.remove(
    "access-code-status--verified",
    "access-code-status--error",
    "access-code-status--pending"
  );
  el.classList.add(`access-code-status--${state}`);
}

function persistAccessCode() {
  const code = getAccessCode();
  if (code) {
    sessionStorage.setItem(ACCESS_CODE_STORAGE_KEY, code);
  } else {
    sessionStorage.removeItem(ACCESS_CODE_STORAGE_KEY);
  }
  accessCodeVerified = false;
  setAccessCodeStatus("Code changed — click Verify or press Enter.", "pending");
}

function restoreAccessCode() {
  const input = getAccessCodeInput();
  if (!input) return;
  const saved = sessionStorage.getItem(ACCESS_CODE_STORAGE_KEY);
  if (saved) input.value = saved;
}

async function verifyAccessCode() {
  const code = getAccessCode();
  const btn = document.getElementById("verify-access-btn");

  if (!code) {
    setAccessCodeStatus("Enter an access code first.", "error");
    return false;
  }

  persistAccessCode();
  btn.disabled = true;
  setAccessCodeStatus("Checking with server…", "pending");

  try {
    const response = await fetch("/api/verify-access", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Access-Code": code,
      },
      body: JSON.stringify({ accessCode: code }),
    });

    let data = {};
    try {
      data = await response.json();
    } catch {
      /* ignore */
    }

    if (!response.ok) {
      accessCodeVerified = false;
      setAccessCodeStatus(mapApiError(response, data), "error");
      return false;
    }

    accessCodeVerified = true;
    setAccessCodeStatus("Access code verified. You can use Generate with custom text.", "verified");
    return true;
  } catch {
    accessCodeVerified = false;
    setAccessCodeStatus(
      "Cannot reach server. Run npm start and open http://localhost:3000.",
      "error"
    );
    return false;
  } finally {
    btn.disabled = false;
  }
}

function initAccessCode() {
  restoreAccessCode();
  const input = getAccessCodeInput();
  const btn = document.getElementById("verify-access-btn");

  input?.addEventListener("input", persistAccessCode);

  input?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      verifyAccessCode();
    }
  });

  btn?.addEventListener("click", () => verifyAccessCode());

  if (getAccessCode()) {
    setAccessCodeStatus("Click Verify to confirm your access code with the server.", "pending");
  }
}

function getReviewerNameForRequest() {
  const input = document.getElementById("reviewer-name");
  const name = input?.value.trim() ?? "";
  return name || undefined;
}

/** Maps API error payloads to user-friendly messages. */
function mapApiError(response, data) {
  if (data?.error && typeof data.error === "string") {
    return data.error;
  }

  const byCode = {
    ACCESS_REQUIRED: "Access code is required. Enter it in the header before generating.",
    ACCESS_DENIED: "Invalid access code. It must match ACCESS_CODE in the server .env file.",
    ACCESS_NOT_CONFIGURED:
      "Server access code is not configured. Set ACCESS_CODE in .env and restart npm start.",
    API_KEY_MISSING:
      "AI is not configured. Add a real GEMINI_API_KEY to .env (from Google AI Studio) and restart npm start.",
    API_KEY_INVALID:
      "GEMINI_API_KEY was rejected by Google. Create a new key at aistudio.google.com/apikey, update .env, restart npm start.",
    GEMINI_QUOTA:
      "Google Gemini quota exceeded for this model. Wait and retry, switch GEMINI_MODEL in .env, or use Load sample.",
    RATE_LIMIT: "Too many requests. Wait a minute and try again, or use Load sample.",
    DAILY_LIMIT:
      "Daily generation limit reached. Try again tomorrow or use Load sample for offline demos.",
    VALIDATION_ERROR: "Request was invalid. Check your input length and try again.",
    GENERATION_FAILED: "Generation failed on the server. Try again in a moment.",
  };

  if (data?.code && byCode[data.code]) {
    return byCode[data.code];
  }

  switch (response.status) {
    case 400:
      return "Input validation failed. Shorten your text or check the tool selection.";
    case 401:
      return "Invalid or missing access code.";
    case 404:
      return "API not found. Use http://localhost:3000 (run npm start), then Ctrl+C and npm start again after code updates.";
    case 429:
      return "Rate or daily limit reached. Wait and retry, or use Load sample.";
    case 503:
      return "AI service unavailable. Check server .env (GEMINI_API_KEY, ACCESS_CODE) and restart.";
    case 500:
      return "Server error during generation. Check the terminal running npm start.";
    default:
      return `Request failed (HTTP ${response.status}).`;
  }
}

/**
 * Portfolio demos: exact sample input → bundled output (no API).
 * Other input → POST /api/generate with toolId, input, accessCode, reviewerName.
 */
async function runTool(toolId, input) {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Please enter some text before running this tool.");
  }

  if (trimmed.length > MAX_INPUT_LENGTH) {
    throw new Error(
      `Input is too long (${trimmed.length} characters). Maximum is ${MAX_INPUT_LENGTH}.`
    );
  }

  const demo = getDemoOutput(toolId, trimmed);
  if (demo) return demo;

  const accessCode = getAccessCode();
  if (!accessCode) {
    throw new Error("Enter the access code in the header, then click Verify.");
  }
  if (!accessCodeVerified) {
    const ok = await verifyAccessCode();
    if (!ok) {
      throw new Error("Access code not verified. Click Verify in the header and try again.");
    }
  }

  const payload = {
    toolId,
    input: trimmed,
    accessCode,
    reviewerName: getReviewerNameForRequest(),
  };

  let response;
  try {
    response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Access-Code": accessCode,
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error(
      "Cannot reach the server. Run npm start in the project folder and open http://localhost:3000 (not the HTML file directly)."
    );
  }

  let data = {};
  try {
    data = await response.json();
  } catch {
    /* non-JSON body */
  }

  if (!response.ok) {
    throw new Error(mapApiError(response, data));
  }

  if (!data.text || typeof data.text !== "string") {
    throw new Error("Server returned an invalid response. Check npm start logs.");
  }

  return data.text;
}

function getOutputEl(toolId) {
  return document.getElementById(`${toolId}-output`);
}

function getInputEl(toolId) {
  return document.getElementById(`${toolId}-input`);
}

function getOutputCard(toolId) {
  return document.querySelector(`.output-card[data-tool="${toolId}"]`);
}

function getDefaultPlaceholder(toolId) {
  const defaults = {
    "draft-sop": "1. Purpose\n2. Scope\n3. Responsibilities\n4. Procedure steps\n5. Exceptions & escalation",
    "summarize-notes":
      "• Key events: (pending generation)\n• Blockers: (pending generation)\n• Decisions: (pending generation)\n• Next shift handoff: (pending generation)",
    "extract-actions": "[ ] Task — Owner — Due\n[ ] Task — Owner — Due",
    "business-rewrite": "Executive summary and impact will appear here after generation.",
  };
  return defaults[toolId] ?? "";
}

/* —— Human review (localStorage) —— */

function loadReviewState() {
  try {
    const raw = localStorage.getItem(REVIEW_STORAGE_KEY);
    return raw ? JSON.parse(raw) : { reviewerName: "", reviews: {} };
  } catch {
    return { reviewerName: "", reviews: {} };
  }
}

function saveReviewState(state) {
  localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(state));
}

function getFingerprint(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return `fp_${hash.toString(36)}_${text.length}`;
}

function getStoredReview(toolId) {
  const state = loadReviewState();
  return state.reviews[toolId] ?? null;
}

function saveReview(toolId, outputText, reviewRecord) {
  const state = loadReviewState();
  state.reviews[toolId] = {
    fingerprint: getFingerprint(outputText),
    ...reviewRecord,
  };
  saveReviewState(state);
}

function clearStoredReview(toolId) {
  const state = loadReviewState();
  delete state.reviews[toolId];
  saveReviewState(state);
}

function formatReviewDate(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function getReviewerNameInput() {
  return document.getElementById("reviewer-name");
}

function getReviewerName() {
  const input = getReviewerNameInput();
  let name = input?.value.trim() ?? "";

  if (!name) {
    const entered = window.prompt(
      "Enter your name for the review record:",
      loadReviewState().reviewerName || "Demo reviewer"
    );
    if (entered?.trim()) {
      name = entered.trim();
      if (input) input.value = name;
      persistReviewerName(name);
    } else {
      name = "Demo reviewer";
      if (input && !input.value.trim()) input.value = name;
    }
  } else {
    persistReviewerName(name);
  }

  return name;
}

function persistReviewerName(name) {
  const state = loadReviewState();
  state.reviewerName = name;
  saveReviewState(state);
}

function restoreReviewerName() {
  const input = getReviewerNameInput();
  if (!input) return;
  const saved = loadReviewState().reviewerName;
  if (saved) input.value = saved;
}

function isOutputReviewable(outputEl) {
  if (!outputEl) return false;
  return (
    !outputEl.classList.contains("placeholder") &&
    !outputEl.classList.contains("loading") &&
    !outputEl.classList.contains("error") &&
    outputEl.textContent.trim().length > 0
  );
}

function getReviewControls(card) {
  return {
    approveBtn: card.querySelector('[data-action="approve"]'),
    rejectBtn: card.querySelector('[data-action="reject"]'),
    editBtn: card.querySelector('[data-action="edit-output"]'),
    saveEditBtn: card.querySelector('[data-action="save-edit"]'),
    cancelEditBtn: card.querySelector('[data-action="cancel-edit"]'),
    resetBtn: card.querySelector('[data-action="reset-review"]'),
  };
}

function isEditing(toolId) {
  return getOutputCard(toolId)?.dataset.editing === "true";
}

function getOutputEditor(card) {
  return card.querySelector("[data-output-editor]");
}

function enterEditMode(toolId) {
  const card = getOutputCard(toolId);
  const outputEl = getOutputEl(toolId);
  if (!card || !outputEl || !isOutputReviewable(outputEl)) return;

  const body = card.querySelector(".output-card__body");
  let editor = getOutputEditor(card);

  if (!editor) {
    editor = document.createElement("textarea");
    editor.className = "output-editor";
    editor.setAttribute("data-output-editor", "");
    editor.setAttribute("aria-label", "Edit generated output");
    body.appendChild(editor);
  }

  editor.value = outputEl.textContent;
  editor.dataset.original = outputEl.textContent;
  outputEl.hidden = true;
  card.dataset.editing = "true";
  card.classList.add("output-card--editing");

  const badge = card.querySelector(".output-card__status");
  const footer = card.querySelector("[data-review-footer]");
  badge.dataset.status = "pending";
  badge.textContent = "Editing";
  footer.textContent = "Revise the output below, then click Save edits to submit for review again.";

  applyEditModeButtons(toolId);
  editor.focus();
}

function exitEditMode(toolId, { save = false } = {}) {
  const card = getOutputCard(toolId);
  const outputEl = getOutputEl(toolId);
  if (!card || !outputEl) return;

  const editor = getOutputEditor(card);
  if (!editor) return;

  if (save) {
    const updated = editor.value.trim();
    if (!updated) {
      window.alert("Output cannot be empty. Add text or cancel editing.");
      return;
    }
    outputEl.textContent = updated;
    outputEl.classList.remove("placeholder", "loading", "error");
    clearStoredReview(toolId);
  }

  editor.remove();
  outputEl.hidden = false;
  delete card.dataset.editing;
  card.classList.remove("output-card--editing");
  syncReviewUI(toolId);
}

function applyEditModeButtons(toolId) {
  const card = getOutputCard(toolId);
  if (!card) return;

  const { approveBtn, rejectBtn, editBtn, saveEditBtn, cancelEditBtn, resetBtn } = getReviewControls(card);

  approveBtn.hidden = true;
  rejectBtn.hidden = true;
  editBtn.hidden = true;
  resetBtn.hidden = true;
  saveEditBtn.hidden = false;
  cancelEditBtn.hidden = false;
}

function setStandardReviewButtons(card, { showEdit = false, showReset = false } = {}) {
  const { approveBtn, rejectBtn, editBtn, saveEditBtn, cancelEditBtn, resetBtn } = getReviewControls(card);

  approveBtn.hidden = false;
  rejectBtn.hidden = false;
  editBtn.hidden = !showEdit;
  saveEditBtn.hidden = true;
  cancelEditBtn.hidden = true;
  resetBtn.hidden = !showReset;
}

function syncReviewUI(toolId) {
  const card = getOutputCard(toolId);
  const outputEl = getOutputEl(toolId);
  if (!card || !outputEl) return;

  if (isEditing(toolId)) {
    applyEditModeButtons(toolId);
    return;
  }

  const badge = card.querySelector(".output-card__status");
  const footer = card.querySelector("[data-review-footer]");
  const meta = card.querySelector("[data-review-meta]");
  const { approveBtn, rejectBtn, editBtn, resetBtn } = getReviewControls(card);

  setStandardReviewButtons(card);

  const text = outputEl.textContent;
  const fingerprint = getFingerprint(text);
  const reviewable = isOutputReviewable(outputEl);
  const stored = getStoredReview(toolId);
  const matches = stored?.fingerprint === fingerprint;

  card.classList.remove("output-card--approved", "output-card--rejected");

  if (outputEl.classList.contains("loading")) {
    badge.dataset.status = "pending";
    badge.textContent = "Generating…";
    footer.textContent = "Review controls unlock when generation completes.";
    approveBtn.disabled = true;
    rejectBtn.disabled = true;
    resetBtn.hidden = true;
    meta.hidden = true;
    return;
  }

  if (outputEl.classList.contains("error")) {
    badge.dataset.status = "error";
    badge.textContent = "Error";
    footer.textContent = "Fix the error and regenerate before submitting for review.";
    approveBtn.disabled = true;
    rejectBtn.disabled = true;
    resetBtn.hidden = true;
    meta.hidden = true;
    return;
  }

  if (matches && stored.status === "approved") {
    card.classList.add("output-card--approved");
    badge.dataset.status = "approved";
    badge.textContent = "Approved";
    footer.textContent = `Approved by ${stored.reviewer} on ${formatReviewDate(stored.at)}. OK for internal use per your team policy.`;
    meta.hidden = true;
    approveBtn.disabled = true;
    rejectBtn.disabled = true;
    resetBtn.hidden = false;
    return;
  }

  if (matches && stored.status === "rejected") {
    card.classList.add("output-card--rejected");
    badge.dataset.status = "rejected";
    badge.textContent = "Changes requested";
    footer.textContent = `Reviewed by ${stored.reviewer} on ${formatReviewDate(stored.at)}. Click Edit output to revise, then Save edits and Approve.`;
    if (stored.note) {
      meta.textContent = `Note: ${stored.note}`;
      meta.hidden = false;
    } else {
      meta.hidden = true;
    }
    approveBtn.disabled = true;
    rejectBtn.disabled = true;
    editBtn.hidden = false;
    resetBtn.hidden = false;
    return;
  }

  if (reviewable) {
    badge.dataset.status = "pending";
    badge.textContent = "Pending review";
    footer.textContent =
      "Read the output carefully. Click Approve if accurate, or Request changes if it needs edits.";
    approveBtn.disabled = false;
    rejectBtn.disabled = false;
    resetBtn.hidden = true;
    meta.hidden = true;
    return;
  }

  badge.dataset.status = "draft";
  badge.textContent = "Draft · Unreviewed";
  footer.textContent = "Not approved for distribution until human review is complete.";
  approveBtn.disabled = true;
  rejectBtn.disabled = true;
  resetBtn.hidden = true;
  meta.hidden = true;
}

function setOutput(el, text, { loading = false, error = false, toolId, isPlaceholder = false } = {}) {
  if (toolId && isEditing(toolId)) {
    exitEditMode(toolId, { save: false });
  }

  el.hidden = false;
  el.textContent = text;
  el.classList.toggle("placeholder", isPlaceholder || (!text && !loading));
  el.classList.toggle("loading", loading);
  el.classList.toggle("error", error);

  if (toolId) syncReviewUI(toolId);
}

function handleApprove(toolId) {
  const outputEl = getOutputEl(toolId);
  if (!isOutputReviewable(outputEl)) return;

  const reviewer = getReviewerName();
  saveReview(toolId, outputEl.textContent, {
    status: "approved",
    reviewer,
    at: new Date().toISOString(),
  });
  syncReviewUI(toolId);
}

function handleReject(toolId) {
  const outputEl = getOutputEl(toolId);
  if (!isOutputReviewable(outputEl)) return;

  const note = window.prompt(
    "Optional: describe what needs to change (shown in the review record):",
    ""
  );
  if (note === null) return;

  const reviewer = getReviewerName();
  saveReview(toolId, outputEl.textContent, {
    status: "rejected",
    reviewer,
    at: new Date().toISOString(),
    note: note.trim(),
  });
  syncReviewUI(toolId);
}

function handleResetReview(toolId) {
  clearStoredReview(toolId);
  syncReviewUI(toolId);
}

function initReview() {
  restoreReviewerName();

  getReviewerNameInput()?.addEventListener("change", (event) => {
    persistReviewerName(event.target.value.trim());
  });

  document.querySelectorAll(".output-card[data-tool]").forEach((card) => {
    const toolId = card.dataset.tool;

    card.querySelector('[data-action="approve"]')?.addEventListener("click", () => {
      handleApprove(toolId);
    });

    card.querySelector('[data-action="reject"]')?.addEventListener("click", () => {
      handleReject(toolId);
    });

    card.querySelector('[data-action="reset-review"]')?.addEventListener("click", () => {
      if (isEditing(toolId)) exitEditMode(toolId, { save: false });
      handleResetReview(toolId);
    });

    card.querySelector('[data-action="edit-output"]')?.addEventListener("click", () => {
      enterEditMode(toolId);
    });

    card.querySelector('[data-action="save-edit"]')?.addEventListener("click", () => {
      exitEditMode(toolId, { save: true });
    });

    card.querySelector('[data-action="cancel-edit"]')?.addEventListener("click", () => {
      exitEditMode(toolId, { save: false });
    });

    syncReviewUI(toolId);
  });
}

function loadSample(toolId, { animate = false } = {}) {
  const sample = DEMO_SAMPLES[toolId];
  if (!sample) return;

  const inputEl = getInputEl(toolId);
  const outputEl = getOutputEl(toolId);
  if (!inputEl || !outputEl) return;

  inputEl.value = sample.input;
  clearStoredReview(toolId);

  if (animate) {
    setOutput(outputEl, "Generating output…", { loading: true, toolId });
    setTimeout(() => {
      setOutput(outputEl, sample.output, { toolId });
    }, 350);
  } else {
    setOutput(outputEl, sample.output, { toolId });
  }
}

function initForms() {
  document.querySelectorAll(".tool-form").forEach((form) => {
    const toolId = form.dataset.tool;
    const outputEl = getOutputEl(toolId);
    const inputEl = getInputEl(toolId);
    const submitBtn = form.querySelector('button[type="submit"]');

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const input = inputEl.value;

      clearStoredReview(toolId);
      submitBtn.disabled = true;
      setOutput(outputEl, "Generating output…", { loading: true, toolId });

      try {
        const result = await runTool(toolId, input);
        setOutput(outputEl, result, { toolId });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Something went wrong.";
        setOutput(outputEl, message, { error: true, toolId });
      } finally {
        submitBtn.disabled = false;
      }
    });

    form.querySelector('[data-action="load-sample"]')?.addEventListener("click", () => {
      loadSample(toolId, { animate: true });
    });

    form.querySelector('[data-action="clear"]')?.addEventListener("click", () => {
      inputEl.value = "";
      inputEl.focus();
      clearStoredReview(toolId);
      setOutput(outputEl, getDefaultPlaceholder(toolId), { toolId, isPlaceholder: true });
    });
  });
}

function initTabs() {
  const tabs = Array.from(document.querySelectorAll(".tab"));
  const panels = Array.from(document.querySelectorAll(".tab-panel"));

  function activateTab(tab) {
    const toolId = tab.dataset.tab;
    const panelId = `panel-${toolId}`;

    tabs.forEach((t) => {
      const isActive = t === tab;
      t.classList.toggle("tab--active", isActive);
      t.setAttribute("aria-selected", String(isActive));
      t.tabIndex = isActive ? 0 : -1;
    });

    panels.forEach((panel) => {
      const isActive = panel.id === panelId;
      panel.classList.toggle("tab-panel--active", isActive);
      panel.hidden = !isActive;
    });

    tab.focus();
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => activateTab(tab));

    tab.addEventListener("keydown", (event) => {
      let nextIndex = null;

      if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
      else if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === "Home") nextIndex = 0;
      else if (event.key === "End") nextIndex = tabs.length - 1;

      if (nextIndex !== null) {
        event.preventDefault();
        activateTab(tabs[nextIndex]);
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initAccessCode();
  initTabs();
  initReview();
  initForms();
  loadSample("draft-sop");
});

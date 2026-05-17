/**
 * AI SOP & Operations Assistant
 * Enterprise tabbed UI — wire runTool() to your approved API endpoint.
 * Demo samples live in samples.js (no API required for portfolio demos).
 */

const TOOLS = [
  "draft-sop",
  "summarize-notes",
  "extract-actions",
  "business-rewrite",
];

function normalizeInput(text) {
  return text.replace(/\r\n/g, "\n").trim();
}

/** Returns demo output when input matches the bundled sample for that tool. */
function getDemoOutput(toolId, input) {
  const sample = DEMO_SAMPLES[toolId];
  if (!sample) return null;
  if (normalizeInput(input) === normalizeInput(sample.input)) {
    return sample.output;
  }
  return null;
}

/**
 * Replace with real API calls in production.
 * @param {string} toolId
 * @param {string} input
 * @returns {Promise<string>}
 */
async function runTool(toolId, input) {
  // TODO: fetch("/api/generate", { method: "POST", body: JSON.stringify({ toolId, input }) })
  await delay(400);

  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Please enter some text before running this tool.");
  }

  const demo = getDemoOutput(toolId, trimmed);
  if (demo) return demo;

  return buildGenericPlaceholder(toolId, trimmed);
}

/** Short fallback when input is not the bundled sample. */
function buildGenericPlaceholder(toolId, input) {
  const hint = "Load sample for a full demo, or connect your API in runTool().";
  switch (toolId) {
    case "draft-sop":
      return `SOP outline (generic)\n\n1. Purpose — based on ${input.length} characters of input\n2. Scope\n3. Responsibilities\n4. Procedure\n5. Exceptions\n\n${hint}`;
    case "summarize-notes":
      return `OPS SUMMARY (generic)\n\n• Input received (${input.length} chars)\n• Key events: [generate]\n• Blockers: [generate]\n• Handoff: [generate]\n\n${hint}`;
    case "extract-actions":
      return `ACTION ITEMS (generic)\n\n[ ] Review submitted text — Owner — Due\n\n${hint}`;
    case "business-rewrite":
      return `BUSINESS SUMMARY (generic)\n\nSituation: [generate from input]\nImpact: [generate]\nNext steps: [generate]\n\n${hint}`;
    default:
      throw new Error(`Unknown tool: ${toolId}`);
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getOutputEl(toolId) {
  return document.getElementById(`${toolId}-output`);
}

function getInputEl(toolId) {
  return document.getElementById(`${toolId}-input`);
}

function getOutputCard(toolId) {
  const outputEl = getOutputEl(toolId);
  return outputEl?.closest(".output-card") ?? null;
}

function setOutputStatus(toolId, status) {
  const card = getOutputCard(toolId);
  const badge = card?.querySelector(".output-card__status");
  if (!badge) return;

  const labels = {
    draft: "Draft · Unreviewed",
    generating: "Generating…",
    ready: "Generated · Review required",
    demo: "Demo sample · Review required",
    error: "Error",
  };

  badge.dataset.status = status === "demo" ? "ready" : status;
  badge.textContent = labels[status] ?? labels.draft;
}

function setOutput(el, text, { loading = false, error = false, toolId, isPlaceholder = false, isDemo = false } = {}) {
  el.textContent = text;
  el.classList.toggle("placeholder", isPlaceholder || (!text && !loading));
  el.classList.toggle("loading", loading);
  el.classList.toggle("error", error);

  if (toolId) {
    if (loading) setOutputStatus(toolId, "generating");
    else if (error) setOutputStatus(toolId, "error");
    else if (isDemo) setOutputStatus(toolId, "demo");
    else if (text && !isPlaceholder) setOutputStatus(toolId, "ready");
    else setOutputStatus(toolId, "draft");
  }
}

/** Fill textarea and output card with bundled demo content. */
function loadSample(toolId, { animate = false } = {}) {
  const sample = DEMO_SAMPLES[toolId];
  if (!sample) return;

  const inputEl = getInputEl(toolId);
  const outputEl = getOutputEl(toolId);
  if (!inputEl || !outputEl) return;

  inputEl.value = sample.input;

  if (animate) {
    setOutput(outputEl, "Generating output…", { loading: true, toolId });
    setTimeout(() => {
      setOutput(outputEl, sample.output, { toolId, isDemo: true });
    }, 350);
  } else {
    setOutput(outputEl, sample.output, { toolId, isDemo: true });
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

      submitBtn.disabled = true;
      setOutput(outputEl, "Generating output…", { loading: true, toolId });

      try {
        const result = await runTool(toolId, input);
        const isDemo = Boolean(getDemoOutput(toolId, input));
        setOutput(outputEl, result, { toolId, isDemo });
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
      setOutput(outputEl, getDefaultPlaceholder(toolId), { toolId, isPlaceholder: true });
    });
  });
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
  initTabs();
  initForms();
  // Pre-load first tab so the landing view is demo-ready
  loadSample("draft-sop");
});

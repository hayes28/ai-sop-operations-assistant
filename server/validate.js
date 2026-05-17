const { VALID_TOOLS } = require("./prompts");

function parsePositiveInt(value, fallback) {
  const n = Number.parseInt(String(value), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function validateGenerateRequest(body, env) {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Request body must be a JSON object." };
  }

  const { toolId, input } = body;

  if (typeof toolId !== "string" || !VALID_TOOLS.includes(toolId)) {
    return {
      ok: false,
      error: `Invalid toolId. Must be one of: ${VALID_TOOLS.join(", ")}.`,
    };
  }

  if (typeof input !== "string") {
    return { ok: false, error: "Input must be a text string." };
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return { ok: false, error: "Input cannot be empty." };
  }

  const maxLen = parsePositiveInt(env.MAX_INPUT_LENGTH, 8000);
  if (trimmed.length > maxLen) {
    return {
      ok: false,
      error: `Input is too long (${trimmed.length} characters). Maximum is ${maxLen}.`,
    };
  }

  return { ok: true, data: { toolId, input: trimmed } };
}

module.exports = { validateGenerateRequest, parsePositiveInt };

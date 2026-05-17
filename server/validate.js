const { VALID_TOOLS } = require("./prompts");

const ALLOWED_BODY_KEYS = new Set(["toolId", "input", "accessCode", "reviewerName"]);

function parsePositiveInt(value, fallback) {
  const n = Number.parseInt(String(value), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function validateGenerateRequest(body, env) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "Request body must be a JSON object." };
  }

  const extraKeys = Object.keys(body).filter((k) => !ALLOWED_BODY_KEYS.has(k));
  if (extraKeys.length > 0) {
    return {
      ok: false,
      error: `Unexpected fields: ${extraKeys.join(", ")}. Allowed: toolId, input, accessCode, reviewerName.`,
    };
  }

  const { toolId, input, reviewerName } = body;

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

  const maxLen = parsePositiveInt(env.MAX_INPUT_LENGTH, 6000);
  if (trimmed.length > maxLen) {
    return {
      ok: false,
      error: `Input is too long (${trimmed.length} characters). Maximum allowed is ${maxLen}. Shorten your text and try again.`,
    };
  }

  let reviewer = "";
  if (reviewerName !== undefined && reviewerName !== null && reviewerName !== "") {
    if (typeof reviewerName !== "string") {
      return { ok: false, error: "reviewerName must be a text string when provided." };
    }
    reviewer = reviewerName.trim().slice(0, 120);
  }

  return { ok: true, data: { toolId, input: trimmed, reviewerName: reviewer } };
}

function validateGenerateBody(req, res, next) {
  const validation = validateGenerateRequest(req.body, process.env);
  if (!validation.ok) {
    return res.status(400).json({ error: validation.error, code: "VALIDATION_ERROR" });
  }
  req.validated = validation.data;
  next();
}

module.exports = {
  validateGenerateRequest,
  validateGenerateBody,
  parsePositiveInt,
};

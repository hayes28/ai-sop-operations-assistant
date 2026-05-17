const rateLimit = require("express-rate-limit");
const { parsePositiveInt } = require("./validate");

/** Trim whitespace and optional surrounding quotes from .env or user input. */
function normalizeAccessCode(value) {
  if (value == null) return "";
  let code = String(value).trim();
  if (
    (code.startsWith('"') && code.endsWith('"')) ||
    (code.startsWith("'") && code.endsWith("'"))
  ) {
    code = code.slice(1, -1).trim();
  }
  return code;
}

function getExpectedAccessCode() {
  return normalizeAccessCode(process.env.ACCESS_CODE);
}

function getProvidedAccessCode(req) {
  const header = req.headers["x-access-code"];
  if (typeof header === "string" && header.trim()) {
    return normalizeAccessCode(header);
  }
  const bodyCode = req.body?.accessCode;
  if (typeof bodyCode === "string" && bodyCode.trim()) {
    return normalizeAccessCode(bodyCode);
  }
  return "";
}

function requireAccessCode(req, res, next) {
  const expected = getExpectedAccessCode();

  if (!expected) {
    return res.status(503).json({
      error:
        "Generation is unavailable: ACCESS_CODE is not set in the server .env file.",
      code: "ACCESS_NOT_CONFIGURED",
    });
  }

  const provided = getProvidedAccessCode(req);

  if (!provided) {
    return res.status(401).json({
      error: "Access code is required. Enter it in the header field before generating.",
      code: "ACCESS_REQUIRED",
    });
  }

  if (provided !== expected) {
    return res.status(401).json({
      error: "Access code is incorrect. It must match ACCESS_CODE in the server .env file.",
      code: "ACCESS_DENIED",
    });
  }

  next();
}

function requireGeminiApiKey(req, res, next) {
  const { isPlaceholderApiKey } = require("./env");
  const key = process.env.GEMINI_API_KEY?.trim();

  if (!key || isPlaceholderApiKey(key)) {
    return res.status(503).json({
      error:
        "AI is not configured: set a valid GEMINI_API_KEY in .env (from https://aistudio.google.com/apikey), then restart npm start.",
      code: "API_KEY_MISSING",
    });
  }
  next();
}

function createGenerateRateLimiter() {
  const windowMs = parsePositiveInt(process.env.RATE_LIMIT_WINDOW_MS, 60_000);
  const max = parsePositiveInt(process.env.RATE_LIMIT_MAX, 10);

  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    handler: (_req, res) => {
      const retryAfterSec = Math.ceil(windowMs / 1000);
      res.setHeader("Retry-After", String(retryAfterSec));
      res.status(429).json({
        error: `Too many requests. Wait about ${retryAfterSec} seconds, or use Load sample for an offline demo.`,
        code: "RATE_LIMIT",
      });
    },
  });
}

module.exports = {
  requireAccessCode,
  requireGeminiApiKey,
  createGenerateRateLimiter,
  getProvidedAccessCode,
  getExpectedAccessCode,
  normalizeAccessCode,
};

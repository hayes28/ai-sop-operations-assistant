const path = require("path");
const express = require("express");
const { loadEnv, assertServerConfig, getPublicConfig } = require("./server/env");
const { validateGenerateBody, parsePositiveInt } = require("./server/validate");
const { generateForTool } = require("./server/gemini");
const {
  requireAccessCode,
  requireGeminiApiKey,
  createGenerateRateLimiter,
  getExpectedAccessCode,
} = require("./server/security");
const { createDailyCapMiddleware } = require("./server/dailyCap");

loadEnv();

const app = express();
const PORT = parsePositiveInt(process.env.PORT, 3000);
const ROOT = __dirname;

const maxInputLength = parsePositiveInt(process.env.MAX_INPUT_LENGTH, 6000);
const jsonLimitKb = Math.min(128, Math.ceil((maxInputLength * 2) / 1024) + 4);

app.use(express.json({ limit: `${jsonLimitKb}kb` }));

const generateLimiter = createGenerateRateLimiter();
const dailyCap = createDailyCapMiddleware(
  parsePositiveInt(process.env.DAILY_REQUEST_CAP, 50)
);

// API routes must be registered before static files
app.get("/api/health", (_req, res) => {
  const config = getPublicConfig();
  res.json({
    ok: config.hasApiKey && config.hasAccessCode,
    ...config,
  });
});

app.post("/api/verify-access", requireAccessCode, (_req, res) => {
  res.json({ ok: true, message: "Access code accepted." });
});

app.post(
  "/api/generate",
  generateLimiter,
  validateGenerateBody,
  requireAccessCode,
  requireGeminiApiKey,
  dailyCap,
  async (req, res) => {
    try {
      const { toolId, input, reviewerName } = req.validated;
      const text = await generateForTool(toolId, input, process.env, { reviewerName });
      return res.json({ text });
    } catch (err) {
      const detail = err.message || "";
      console.error("[/api/generate]", detail);

      if (
        detail.includes("API_KEY_INVALID") ||
        detail.includes("API key not valid")
      ) {
        return res.status(503).json({
          error:
            "GEMINI_API_KEY is invalid. Create a new key at https://aistudio.google.com/apikey, update .env, and restart npm start.",
          code: "API_KEY_INVALID",
        });
      }

      if (
        detail.includes("429") ||
        detail.includes("Too Many Requests") ||
        detail.includes("quota") ||
        detail.includes("Quota exceeded")
      ) {
        const retryMatch = detail.match(/retry in (\d+)/i);
        const waitHint = retryMatch
          ? ` Try again in about ${retryMatch[1]} seconds.`
          : " Wait a minute and try again.";
        return res.status(429).json({
          error: `Gemini API quota limit reached for model ${process.env.GEMINI_MODEL || "gemini-2.0-flash"}.${waitHint} Use Load sample for offline demos, or change GEMINI_MODEL in .env (e.g. gemini-2.0-flash-lite) and restart. See https://ai.google.dev/gemini-api/docs/rate-limits`,
          code: "GEMINI_QUOTA",
        });
      }

      return res.status(500).json({
        error: "Generation failed. Please try again in a moment.",
        code: "GENERATION_FAILED",
      });
    }
  }
);

app.use("/api", (_req, res) => {
  res.status(404).json({ error: "API route not found.", code: "NOT_FOUND" });
});

// Frontend static assets (index.html, app.js, etc.)
app.use(express.static(ROOT));

app.listen(PORT, () => {
  assertServerConfig();
  const maxTok = parsePositiveInt(process.env.MAX_OUTPUT_TOKENS, 1024);
  const dailyCapLimit = parsePositiveInt(process.env.DAILY_REQUEST_CAP, 50);
  const rateMax = parsePositiveInt(process.env.RATE_LIMIT_MAX, 10);

  console.log(`AI SOP & Operations Assistant → http://localhost:${PORT}`);
  console.log(
    `Limits: input ${maxInputLength} chars · output ${maxTok} tokens · ${rateMax}/min/IP · ${dailyCapLimit}/day/IP`
  );
  console.log(`Health: http://localhost:${PORT}/api/health`);
  console.log(`Verify: POST http://localhost:${PORT}/api/verify-access`);

  const codeLen = process.env.ACCESS_CODE ? getExpectedAccessCode().length : 0;
  if (codeLen > 0) {
    console.log(`ACCESS_CODE loaded (${codeLen} characters). Restart server after .env changes.`);
  }
});

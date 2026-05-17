require("dotenv").config();

const path = require("path");
const express = require("express");
const rateLimit = require("express-rate-limit");
const { validateGenerateRequest, parsePositiveInt } = require("./server/validate");
const { generateForTool } = require("./server/gemini");

const app = express();
const PORT = parsePositiveInt(process.env.PORT, 3000);
const ROOT = __dirname;

app.use(express.json({ limit: "64kb" }));

// Static frontend (index.html, app.js, style.css, samples.js)
app.use(express.static(ROOT));

const generateLimiter = rateLimit({
  windowMs: parsePositiveInt(process.env.RATE_LIMIT_WINDOW_MS, 60_000),
  max: parsePositiveInt(process.env.RATE_LIMIT_MAX, 15),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      error: "Too many generation requests. Please wait a moment and try again.",
    });
  },
});

function checkAccessCode(req, res) {
  const expected = process.env.ACCESS_CODE;
  if (!expected) {
    res.status(503).json({
      error: "Server access code is not configured. Set ACCESS_CODE in .env.",
    });
    return false;
  }

  const provided = req.headers["x-access-code"];
  if (typeof provided !== "string" || provided !== expected) {
    res.status(401).json({ error: "Invalid or missing access code." });
    return false;
  }

  return true;
}

app.post("/api/generate", generateLimiter, async (req, res) => {
  if (!checkAccessCode(req, res)) return;

  const validation = validateGenerateRequest(req.body, process.env);
  if (!validation.ok) {
    return res.status(400).json({ error: validation.error });
  }

  try {
    const { toolId, input } = validation.data;
    const text = await generateForTool(toolId, input, process.env);
    return res.json({ text });
  } catch (err) {
    console.error("[/api/generate]", err.message);
    const message =
      err.message?.includes("API key") || err.message?.includes("GEMINI")
        ? "AI service is not configured correctly on the server."
        : "Generation failed. Please try again in a moment.";
    return res.status(500).json({ error: message });
  }
});

app.listen(PORT, () => {
  const maxIn = parsePositiveInt(process.env.MAX_INPUT_LENGTH, 8000);
  const maxTok = parsePositiveInt(process.env.MAX_OUTPUT_TOKENS, 2048);
  console.log(`AI SOP & Operations Assistant running at http://localhost:${PORT}`);
  console.log(`Max input: ${maxIn} chars · Max output tokens: ${maxTok}`);
  if (!process.env.GEMINI_API_KEY) {
    console.warn("Warning: GEMINI_API_KEY is missing — /api/generate will fail until .env is set.");
  }
});

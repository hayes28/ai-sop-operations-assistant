const path = require("path");
const { parsePositiveInt } = require("./validate");

function loadEnv() {
  const result = require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

  if (result.error) {
    console.warn(
      "No .env file loaded. Copy .env.example to .env in the project root and add your keys."
    );
  } else {
    console.log("Loaded environment from .env");
  }

  return result;
}

const PLACEHOLDER_API_KEY = "your_gemini_api_key_here";

function isPlaceholderApiKey(key) {
  if (!key) return true;
  const k = key.trim();
  return (
    k === PLACEHOLDER_API_KEY ||
    k.includes("your_gemini") ||
    k.includes("your_actual") ||
    k.length < 20
  );
}

function assertServerConfig() {
  const warnings = [];
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (isPlaceholderApiKey(apiKey)) {
    warnings.push(
      "GEMINI_API_KEY is missing or still the placeholder — get a key at https://aistudio.google.com/apikey and set it in .env"
    );
  }
  if (!process.env.ACCESS_CODE?.trim()) {
    warnings.push("ACCESS_CODE is missing — /api/generate will return 503.");
  }

  warnings.forEach((msg) => console.warn(`Warning: ${msg}`));
}

function getPublicConfig() {
  return {
    maxInputLength: parsePositiveInt(process.env.MAX_INPUT_LENGTH, 6000),
    hasApiKey: !isPlaceholderApiKey(process.env.GEMINI_API_KEY),
    hasAccessCode: Boolean(process.env.ACCESS_CODE?.trim()),
  };
}

module.exports = { loadEnv, assertServerConfig, getPublicConfig, isPlaceholderApiKey };

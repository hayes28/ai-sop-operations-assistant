const { GoogleGenerativeAI } = require("@google/generative-ai");
const { buildPrompt } = require("./prompts");
const { parsePositiveInt } = require("./validate");

let client = null;

function getModel(env) {
  if (!env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured on the server.");
  }
  if (!client) {
    client = new GoogleGenerativeAI(String(env.GEMINI_API_KEY).trim());
  }

  const maxOutputTokens = parsePositiveInt(env.MAX_OUTPUT_TOKENS, 1024);
  const modelName = env.GEMINI_MODEL || "gemini-2.0-flash";
  const temperature = Number(env.GEMINI_TEMPERATURE ?? 0.2);
  const topP = Number(env.GEMINI_TOP_P ?? 0.85);

  return client.getGenerativeModel({
    model: modelName,
    generationConfig: {
      maxOutputTokens,
      temperature: Number.isFinite(temperature) ? temperature : 0.2,
      topP: Number.isFinite(topP) ? topP : 0.85,
      topK: parsePositiveInt(env.GEMINI_TOP_K, 32),
      // Prefer shorter, focused responses for ops tooling
      candidateCount: 1,
    },
  });
}

async function generateForTool(toolId, input, env, options = {}) {
  const model = getModel(env);
  const prompt = buildPrompt(toolId, input, options);
  const result = await model.generateContent(prompt);
  const text = result?.response?.text();

  if (!text || !text.trim()) {
    throw new Error("Model returned an empty response.");
  }

  return text.trim();
}

module.exports = { generateForTool };

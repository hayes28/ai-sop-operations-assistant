const { GoogleGenerativeAI } = require("@google/generative-ai");
const { buildPrompt } = require("./prompts");
const { parsePositiveInt } = require("./validate");

let client = null;

function getModel(env) {
  if (!env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured on the server.");
  }
  if (!client) {
    client = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  }
  const maxOutputTokens = parsePositiveInt(env.MAX_OUTPUT_TOKENS, 2048);
  const modelName = env.GEMINI_MODEL || "gemini-2.0-flash";

  return client.getGenerativeModel({
    model: modelName,
    generationConfig: {
      maxOutputTokens,
      temperature: 0.4,
    },
  });
}

async function generateForTool(toolId, input, env) {
  const model = getModel(env);
  const prompt = buildPrompt(toolId, input);
  const result = await model.generateContent(prompt);
  const text = result?.response?.text();

  if (!text || !text.trim()) {
    throw new Error("Model returned an empty response.");
  }

  return text.trim();
}

module.exports = { generateForTool };

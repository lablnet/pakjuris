import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { logger } from "../utils/logger.js";

export function createChatModel() {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) throw new Error("Missing GOOGLE_API_KEY (or GOOGLE_GENAI_API_KEY)");

  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  console.log("model", model);
  const temperature = Number(process.env.GEMINI_TEMPERATURE ?? 0.1);
  const maxOutputTokens = Number(process.env.GEMINI_MAX_OUTPUT_TOKENS ?? 4096);
  const maxRetries = Number(process.env.GOOGLE_GENAI_MAX_RETRIES ?? 0); // avoid long hangs on 429

  logger.info({ model, temperature, maxOutputTokens, maxRetries }, "Init Gemini");

  return new ChatGoogleGenerativeAI({
    apiKey,
    model,
    temperature,
    maxOutputTokens,
    maxRetries,
  });
}
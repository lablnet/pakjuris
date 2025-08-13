import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { logger } from "../utils/logger.js";

export function createGeminiEmbeddings() {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY!;
  if (!apiKey) throw new Error("GOOGLE_GENAI_API_KEY missing");

  const model = process.env.GEMINI_EMBED_MODEL || "text-embedding-004";
  // text-embedding-004 returns 768-dim vectors
  const dimsEnv = process.env.EMBED_DIMENSIONS;
  const dimensions = dimsEnv ? Number(dimsEnv) : 768;

  logger.info({ model, dimensions }, "Initializing Gemini embeddings");
  return {
    embeddings: new GoogleGenerativeAIEmbeddings({
      apiKey,
      model,
    }),
    dimensions,
  };
}

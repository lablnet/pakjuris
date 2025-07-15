/**
 * OpenAI service for embeddings and other AI operations
 */
import OpenAI from 'openai';
import { ChatOpenAI } from '@langchain/openai';

const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY;
const AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME = process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME;
const AZURE_API_VERSION = process.env.AZURE_API_VERSION;

const azureClient = new OpenAI({
    apiKey: AZURE_OPENAI_API_KEY,
    baseURL: `${AZURE_OPENAI_ENDPOINT}openai/deployments/${AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME}`,
    defaultQuery: { "api-version": AZURE_API_VERSION },
    defaultHeaders: { "api-key": AZURE_OPENAI_API_KEY },
});

/**
 * Generates an embedding vector for a given text
 * @param text - The text to generate an embedding for
 * @returns The embedding vector
 */
export const getEmbedding = async (text: string): Promise<number[]> => {
  try {
    console.log(`Generating OpenAI embedding for text (length: ${text.length}) using model: ${AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME}`);
    
    // Ensure text is not empty
    if (!text || text.trim().length === 0) {
      throw new Error("Cannot generate embedding for empty text");
    }
    
    // Truncate if text is too long (OpenAI has token limits)
    const truncatedText = text.length > 8000 ? text.substring(0, 8000) : text;
    
    // @ts-ignore
    const embeddingResult = await azureClient.embeddings.create({
        input: truncatedText,
    });
    if (!embeddingResult || !embeddingResult.data || embeddingResult.data.length === 0 || !embeddingResult.data[0].embedding) {
        throw new Error('Invalid embedding response received from Azure OpenAI.');
    }

    return embeddingResult.data[0].embedding;
  } catch (error) {
    console.error("❌ Error generating OpenAI embedding:", error);
    throw error;
  }
};

export const llm = new ChatOpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  temperature: 0.7,
  streaming: true,
});
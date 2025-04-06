/**
 * OpenAI service for embeddings and other AI operations
 */
import OpenAI from 'openai';

// Initialize OpenAI client with API key from environment
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
});

// Default model for embeddings
const EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';

/**
 * Generates an embedding vector for a given text
 * @param text - The text to generate an embedding for
 * @returns The embedding vector
 */
export const getEmbedding = async (text: string): Promise<number[]> => {
  try {
    console.log(`Generating OpenAI embedding for text (length: ${text.length}) using model: ${EMBEDDING_MODEL}`);
    
    // Ensure text is not empty
    if (!text || text.trim().length === 0) {
      throw new Error("Cannot generate embedding for empty text");
    }
    
    // Truncate if text is too long (OpenAI has token limits)
    const truncatedText = text.length > 8000 ? text.substring(0, 8000) : text;
    
    // Generate embedding
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: truncatedText,
      encoding_format: 'float'
    });
    
    // Extract the embedding
    const embedding = response.data[0].embedding;
    
    if (!embedding || embedding.length === 0) {
      throw new Error("Failed to generate embedding: Empty response");
    }
    
    console.log(`Successfully generated embedding with dimension: ${embedding.length}`);
    return embedding;
  } catch (error) {
    console.error("❌ Error generating OpenAI embedding:", error);
    throw error;
  }
};

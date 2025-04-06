// services/pinecone.js
import { Pinecone } from '@pinecone-database/pinecone';
import * as prompts from '../utils/promptTemplates';

// Initialize Pinecone client
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY || '',
});

// Get the index from environment variables or use a default
const indexName = process.env.PINECONE_INDEX || 'pakistan-legal-docs';

// Define types for Pinecone responses
export interface PineconeMatch {
  id: string;
  score: number;
  metadata: {
    title?: string;
    year?: string;
    pageNumber?: string;
    text?: string;
    url?: string;
    [key: string]: any;
  };
}

/**
 * Queries the Pinecone vector database
 * @param queryVector - The embedding vector to search with
 * @param topK - Number of results to return
 * @returns Array of matching documents with their metadata
 */
export const queryPinecone = async (queryVector: number[], topK: number = 5): Promise<PineconeMatch[]> => {
  try {
    console.log(`Querying Pinecone index '${indexName}' for top ${topK} matches...`);
    
    // Get the index
    const index = pinecone.index(indexName);
    
    // Query the index
    const queryResponse = await index.query({
      vector: queryVector,
      topK,
      includeMetadata: true
    });
    
    // Map the response to our PineconeMatch interface
    const matches: PineconeMatch[] = queryResponse.matches?.map(match => ({
      id: match.id,
      score: match.score ?? 0, // Default to 0 if score is undefined
      metadata: match.metadata || {}
    })) || [];
    
    // Filter results below threshold
    const filteredMatches = matches.filter(match => 
      match.score >= (prompts.PINECONE_SCORE_THRESHOLD || 0.7)
    );
    
    if (filteredMatches.length === 0) {
      console.warn("⚠️ No matches found above the threshold score.");
    } else {
      console.log(`Found ${filteredMatches.length} relevant matches.`);
    }
    
    return filteredMatches;
  } catch (error) {
    console.error("❌ Error querying Pinecone:", error);
    throw error;
  }
};

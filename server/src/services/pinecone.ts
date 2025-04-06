// services/pinecone.js
import { Pinecone } from '@pinecone-database/pinecone';
import * as prompts from '../utils/promptTemplates';
require('dotenv').config();

// Initialize Pinecone client
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY || '',
});

// Get the index from environment variables or use a default
const indexName = process.env.PINECONE_INDEX_NAME || 'pakistan-legal-docs';

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
export const queryPinecone = async (queryVector: number[], topK: number = 5): Promise<any[]> => {
  try {
    console.log(`Querying Pinecone index '${indexName}' for top ${topK} matches...`);
    
    // Get the index
    const index = pinecone.index(indexName);
    
    // Query the index
    const results = await index.query({
      vector: queryVector,
      topK,
      includeMetadata: true
    });
    
    return results.matches || [];
  } catch (error) {
    console.error("❌ Error querying Pinecone:", error);
    throw error;
  }
};

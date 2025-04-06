/**
 * Gemini AI service for natural language processing
 */
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import * as prompts from '../utils/promptTemplates';
require('dotenv').config();

// Initialize Gemini API with key from environment
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Initialize embeddings for vector search
const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GEMINI_API_KEY,
  modelName: process.env.GEMINI_EMBEDDING_MODEL || 'embedding-001',
});

// Configure safety settings
const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

// Generation config
const generationConfig = {
  temperature: 0.7,
  topK: 1,
  topP: 1,
  maxOutputTokens: 512,
};

// Get the generative model
const model = genAI.getGenerativeModel({
  model: process.env.GEMINI_GENERATION_MODEL || 'gemini-1.5-pro',
  safetySettings,
  generationConfig
});

/**
 * Generates text using Gemini model
 * @param prompt - The prompt to generate text from
 * @returns The generated text
 */
async function generateText(prompt: string): Promise<string> {
  try {
    console.log(`Generating text with model ${process.env.GEMINI_GENERATION_MODEL || 'gemini-1.5-pro'}...`);
    
    const result = await model.generateContent(prompt);
    const response = result.response;

    // Check for blocked content
    if (!response || !response.text()) {
      const blockReason = response?.promptFeedback?.blockReason || 'Unknown';
      console.warn(`⚠️ Gemini generation blocked or empty. Reason: ${blockReason}`);
      
      if (blockReason === 'SAFETY') {
        throw new Error("Content generation blocked due to safety settings.");
      }
      throw new Error("Failed to generate text. Empty response from model.");
    }

    console.log("Text generation successful.");
    return response.text().trim();
  } catch (error) {
    console.error("❌ Error generating text with Gemini:", error);
    throw error;
  }
}

/**
 * Generate a response using a chat history
 * @param question - The current user question
 * @param history - The conversation history
 * @returns The generated response
 */
export const generateResponse = async (
  question: string, 
  history: Array<{role: string, content: string}>
): Promise<string> => {
  try {
    console.log(`Generating chat response with model ${process.env.GEMINI_GENERATION_MODEL || 'gemini-1.5-pro'}...`);
    
    const chat = model.startChat({
      history: history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      })),
      generationConfig: {
        ...generationConfig,
        maxOutputTokens: 800 // Increase token limit for discussion mode
      }
    });
    
    const result = await chat.sendMessage(question);
    const response = result.response;
    
    // Check for blocked content
    if (!response || !response.text()) {
      const blockReason = response?.promptFeedback?.blockReason || 'Unknown';
      console.warn(`⚠️ Gemini chat generation blocked or empty. Reason: ${blockReason}`);
      
      if (blockReason === 'SAFETY') {
        throw new Error("Content generation blocked due to safety settings.");
      }
      throw new Error("Failed to generate text. Empty response from model.");
    }
    
    console.log("Chat response generation successful.");
    return response.text().trim();
  } catch (error) {
    console.error("❌ Error generating chat response with Gemini:", error);
    throw error;
  }
};

/**
 * Classifies the intent of a user question
 * @param question - The user's question
 * @returns The classified intent
 */
export const classifyIntent = async (question: string): Promise<string> => {
  const prompt = prompts.INTENT_CLASSIFICATION_PROMPT(question);
  const classification = await generateText(prompt);
  
  // Validate classification
  const validIntents = ['GREETING', 'LEGAL_QUERY', 'CLARIFICATION_NEEDED', 'IRRELEVANT', 'DISCUSSION'];
  if (validIntents.includes(classification)) {
    return classification;
  } else {
    console.warn(`⚠️ Unexpected intent classification received: "${classification}". Defaulting to LEGAL_QUERY.`);
    return 'LEGAL_QUERY'; // Safer default
  }
};

/**
 * Generates search queries based on the original question
 * @param question - The original user question
 * @returns An array of search queries
 */
export const generateSearchQueries = async (question: string): Promise<string[]> => {
  const prompt = prompts.SEARCH_QUERY_GENERATION_PROMPT(question);
  const queryText = await generateText(prompt);
  
  // Split by newline and filter out empty lines
  const queries = queryText.split('\n')
    .map(q => q.trim())
    .filter(q => q.length > 0);
  
  if (queries.length === 0) {
    console.warn("⚠️ Failed to generate any search queries. Using original question.");
    return [question]; // Fallback to original question
  }
  
  console.log("Generated search queries:", queries);
  return queries;
};

/**
 * Generates a summary based on the question and retrieved context
 * @param question - The original question
 * @param contextChunks - The context data retrieved from the vector search
 * @returns A summary response
 */
export const generateSummary = async (
  question: string, 
  contextChunks: Array<{title?: string, year?: string, pageNumber?: string, text?: string}>
): Promise<string> => {
  if (!contextChunks || contextChunks.length === 0) {
    return prompts.NO_MATCH_RESPONSE;
  }
  
  const prompt = prompts.SUMMARY_GENERATION_PROMPT(question, contextChunks);
  return await generateText(prompt);
};

/**
 * Generates a name for a conversation based on the first message
 * @param message - The first message in the conversation
 * @returns A short, descriptive name for the conversation
 */
export const generateConversationName = async (message: string): Promise<string> => {
  const prompt = prompts.CONVERSATION_NAME_PROMPT(message);
  const name = await generateText(prompt);
  
  if (!name || name.length === 0) {
    console.warn("⚠️ Failed to generate conversation name. Using default.");
    return "New Conversation";
  }
  
  return name;
};

/**
 * Generates an embedding vector for a given text
 * @param text - The text to generate an embedding for
 * @returns The embedding vector
 */
export const getEmbedding = async (text: string): Promise<number[]> => {
  try {
    console.log(`Generating embedding for text (length: ${text.length})...`);
    const vector = await embeddings.embedQuery(text);
    console.log("Embedding generated successfully.");
    return vector;
  } catch (error) {
    console.error("❌ Error generating embedding:", error);
    throw error;
  }
};

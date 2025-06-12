/**
 * Gemini AI service for natural language processing
 */
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

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

export const llm = new ChatGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY, // set in your .env file
  model: process.env.GEMINI_GENERATION_MODEL || 'gemini-1.5-pro', // Use gemini-1.5-pro instead of gemini-2.0-flash
  temperature: 0.7,
  maxOutputTokens: 1024,
  streaming: true, // Disable streaming for now to avoid issues
});

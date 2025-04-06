// services/gemini.js
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
const { GoogleGenerativeAIEmbeddings } = require("@langchain/google-genai");
const config = require('../config/env');
const prompts = require('../utils/promptTemplates');

const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: config.GEMINI_API_KEY,
    modelName: config.GEMINI_EMBEDDING_MODEL,
});

// Configure safety settings for generation (adjust as needed)
const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

const generationConfig = {
    // temperature: 0.7, // Adjust creativity vs factualness
    // topK: 1,
    // topP: 1,
    // maxOutputTokens: 512, // Limit response length if needed
};

const model = genAI.getGenerativeModel({
    model: config.GEMINI_GENERATION_MODEL,
    safetySettings,
    generationConfig
});

async function generateText(prompt) {
    try {
        console.log(`   Generating text with model ${config.GEMINI_GENERATION_MODEL}...`);
        const result = await model.generateContent(prompt);
        const response = result.response;

        // Basic check for blocked content
        if (!response || !response.text) {
            const blockReason = response.promptFeedback.blockReason;
            console.warn(`   ⚠️ Gemini generation blocked or empty. Reason: ${blockReason || 'Unknown'}`);
            if (blockReason === 'SAFETY') {
                throw new Error("Content generation blocked due to safety settings.");
            }
            throw new Error("Failed to generate text. Empty response from model.");
        }

        console.log("   Text generation successful.");
        return response.text().trim();
    } catch (error) {
        console.error("   ❌ Error generating text with Gemini:", error);
        throw error; // Rethrow for handling in the route
    }
}

async function classifyIntent(question) {
    const prompt = prompts.INTENT_CLASSIFICATION_PROMPT(question);
    const classification = await generateText(prompt);
    // Basic validation - ensure it's one of the expected types
    const validIntents = ['GREETING', 'LEGAL_QUERY', 'CLARIFICATION_NEEDED', 'IRRELEVANT'];
    if (validIntents.includes(classification)) {
        return classification;
    } else {
        console.warn(`   ⚠️ Unexpected intent classification received: "${classification}". Defaulting to LEGAL_QUERY.`);
        // Fallback or re-try logic could be added here
        return 'LEGAL_QUERY'; // Safer default for now
    }
}

async function generateSearchQueries(question) {
    const prompt = prompts.SEARCH_QUERY_GENERATION_PROMPT(question);
    const queryText = await generateText(prompt);
    // Split by newline and filter out empty lines
    const queries = queryText.split('\n').map(q => q.trim()).filter(q => q.length > 0);
    if (queries.length === 0) {
        console.warn("   ⚠️ Failed to generate any search queries. Using original question.");
        return [question]; // Fallback to original question
    }
    console.log("   Generated search queries:", queries);
    return queries;
}

async function generateSummary(question, contextChunks) {
    if (!contextChunks || contextChunks.length === 0) {
        return prompts.NO_MATCH_RESPONSE;
    }
    const prompt = prompts.SUMMARY_GENERATION_PROMPT(question, contextChunks);
    return await generateText(prompt);
}

async function getEmbedding(text) {
    try {
        console.log(`   Generating embedding for text (length: ${text.length})...`);
        const vector = await embeddings.embedQuery(text);
        console.log("   Embedding generated successfully.");
        return vector;
    } catch (error) {
        console.error("   ❌ Error generating embedding:", error);
        throw error;
    }
}


module.exports = {
    classifyIntent,
    generateSearchQueries,
    generateSummary,
    getEmbedding,
};
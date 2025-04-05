// config/env.js
require('dotenv').config();
const functions = require('firebase-functions');

// Get config from Firebase Functions config or fall back to process.env
const getConfig = (key, defaultValue = null) => {
    try {
        // Check if we're in a Firebase Functions environment
        if (process.env.FUNCTION_TARGET) {
            // Parse the nested config keys (e.g., 'mongodb.uri')
            const parts = key.toLowerCase().split('_');

            if (parts.length === 1) {
                return functions.config()[key.toLowerCase()] || process.env[key] || defaultValue;
            }

            // Handle nested properties like MONGODB_URI as mongodb.uri in Firebase config
            const section = parts[0].toLowerCase();
            const prop = parts.slice(1).join('_').toLowerCase();

            // Try to get from firebase config
            const fbConfig = functions.config();
            return (fbConfig[section] && fbConfig[section][prop]) || process.env[key] || defaultValue;
        }
    } catch (error) {
        console.warn(`Unable to read Firebase config for ${key}, falling back to process.env`);
    }

    // Fallback to process.env
    return process.env[key] || defaultValue;
};

const config = {
    PORT: getConfig('PORT', 8000),
    MONGODB_URI: getConfig('MONGODB_URI'),
    MONGODB_COLLECTION: getConfig('MONGODB_COLLECTION'),
    MONGODB_DB: getConfig('MONGODB_DB'),
    GEMINI_API_KEY: getConfig('GEMINI_API_KEY'),
    PINECONE_API_KEY: getConfig('PINECONE_API_KEY'),
    PINECONE_INDEX_NAME: getConfig('PINECONE_INDEX_NAME'),
    GEMINI_GENERATION_MODEL: getConfig('GEMINI_GENERATION_MODEL', 'gemini-2.0-flash'),
    GEMINI_EMBEDDING_MODEL: getConfig('GEMINI_EMBEDDING_MODEL', 'text-embedding-004'),
    PINECONE_SCORE_THRESHOLD: getConfig('PINECONE_SCORE_THRESHOLD', 0.55),
};

// Basic validation
const requiredVars = [
    'MONGODB_URI',
    'MONGODB_COLLECTION',
    'MONGODB_DB',
    'GEMINI_API_KEY',
    'PINECONE_API_KEY',
    'PINECONE_INDEX_NAME',
];

const missingVars = requiredVars.filter(key => !config[key]);

if (missingVars.length > 0) {
    console.error("❌ FATAL ERROR: Missing required environment variables:", missingVars.join(', '));
    process.exit(1);
}

module.exports = config;
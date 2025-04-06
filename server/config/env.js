// config/env.js
require('dotenv').config();

// Get config from environment variables
const getConfig = (key, defaultValue = null) => {
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
    FIREBASE_PROJECT_ID: getConfig('FIREBASE_PROJECT_ID', 'pakjuris-fa475'),
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
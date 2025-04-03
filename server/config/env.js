// config/env.js
require('dotenv').config();

const config = {
    PORT: process.env.PORT || 8000,
    MONGODB_URI: process.env.MONGODB_URI,
    MONGODB_COLLECTION: process.env.MONGODB_COLLECTION,
    MONGODB_DB: process.env.MONGODB_DB,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    PINECONE_API_KEY: process.env.PINECONE_API_KEY,
    PINECONE_INDEX_NAME: process.env.PINECONE_INDEX_NAME,
    GEMINI_GENERATION_MODEL: process.env.GEMINI_GENERATION_MODEL || "gemini-1.5-flash-latest", // Use a fast model
    GEMINI_EMBEDDING_MODEL: process.env.GEMINI_EMBEDDING_MODEL || "text-embedding-004", // Or the specific model you use
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
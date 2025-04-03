// services/pinecone.js
const { Pinecone } = require('@pinecone-database/pinecone');
const config = require('../config/env');

let pineconeIndex = null;
let pinecone = null;

async function initPinecone() {
    try {
        pinecone = new Pinecone({ apiKey: config.PINECONE_API_KEY });

        const indexList = await pinecone.listIndexes();
        if (!indexList.indexes || !indexList.indexes.some(index => index.name === config.PINECONE_INDEX_NAME)) {
            throw new Error(`Pinecone index '${config.PINECONE_INDEX_NAME}' does not exist.`);
        }
        pineconeIndex = pinecone.index(config.PINECONE_INDEX_NAME);
        const stats = await pineconeIndex.describeIndexStats();
        console.log(`✅ Pinecone index '${config.PINECONE_INDEX_NAME}' initialized. Total vectors: ${stats.totalVectorCount}`);
    } catch (err) {
        console.error("❌ Pinecone initialization failed:", err);
        throw err;
    }
}

async function queryPinecone(vector, topK = 3) {
    if (!pineconeIndex) {
        throw new Error("Pinecone index is not initialized.");
    }
    try {
        console.log(`   Querying Pinecone index '${config.PINECONE_INDEX_NAME}' with topK=${topK}...`);
        const results = await pineconeIndex.query({
            vector: vector,
            topK: topK,
            includeMetadata: true,
        });
        console.log(`   Pinecone query successful. Found ${results.matches?.length || 0} matches.`);
        return results.matches || []; // Return array of matches
    } catch (err) {
        console.error("   ❌ Error querying Pinecone:", err);
        throw err; // Re-throw to be handled by the route
    }
}

module.exports = {
    initPinecone,
    queryPinecone,
};
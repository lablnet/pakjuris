// services/mongo.js
const { MongoClient } = require('mongodb');
const config = require('../config/env');

const mongoClient = new MongoClient(config.MONGODB_URI);
let dbCollection = null;

async function connectDB() {
    try {
        await mongoClient.connect();
        const db = mongoClient.db(config.MONGODB_DB);
        dbCollection = db.collection(config.MONGODB_COLLECTION);
        await db.command({ ping: 1 });
        console.log(`✅ MongoDB connected to database: ${config.MONGODB_DB}, collection: ${config.MONGODB_COLLECTION}`);
    } catch (err) {
        console.error("❌ MongoDB connection failed:", err);
        throw err; // Re-throw to be caught during initialization
    }
}

function getCollection() {
    if (!dbCollection) {
        throw new Error("MongoDB collection is not initialized. Ensure connectDB() was called successfully.");
    }
    return dbCollection;
}

async function closeDB() {
    try {
        await mongoClient.close();
        console.log('MongoDB connection closed.');
    } catch (err) {
        console.error('Error closing MongoDB connection:', err);
    }
}

// Function to get document details (like pdfUrl)
async function findDocumentDetails(title, year) {
    const collection = getCollection();
    try {
        const doc = await collection.findOne({ title, year });
        if (!doc) {
            console.warn(`   ⚠️ Warning: No matching document found in MongoDB for ${title} (${year}).`);
            return null;
        }
        console.log("   MongoDB document found.");
        return doc; // Contains pdfUrl etc.
    } catch (err) {
        console.error(`   ❌ Error fetching document details from MongoDB for ${title} (${year}):`, err);
        return null; // Don't crash the request, just return null
    }
}


module.exports = {
    connectDB,
    getCollection,
    closeDB,
    findDocumentDetails,
};
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const { GoogleGenerativeAIEmbeddings } = require("@langchain/google-genai");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { Pinecone } = require('@pinecone-database/pinecone');

// ENV
const PORT = process.env.PORT || 5000;
const COLLECTION_NAME = process.env.MONGODB_COLLECTION;
const DB_NAME = process.env.MONGODB_DB;

// INIT SERVICES
const app = express();
app.use(express.json());
app.use(cors());

const mongoClient = new MongoClient(process.env.MONGODB_URI);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const embeddings = new GoogleGenerativeAIEmbeddings({ apiKey: process.env.GEMINI_API_KEY });

const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY
});

const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME);

// MongoDB connect
async function initDB() {
    try {
        await mongoClient.connect();
        console.log("✅ MongoDB connected");
        return mongoClient.db(DB_NAME).collection(COLLECTION_NAME);
    } catch (err) {
        console.error("❌ MongoDB connection failed:", err);
        throw err;
    }
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal Server Error' });
});

// QUERY ROUTE
app.post('/query', async(req, res) => {
    try {
        const { question } = req.body;
        const collection = await initDB();

        const queryVector = await embeddings.embedQuery(question);

        const pineconeResult = await pineconeIndex.query({
            topK: 1,
            vector: queryVector,
            includeMetadata: true
        });

        if (!pineconeResult.matches || pineconeResult.matches.length === 0) {
            return res.status(404).json({ message: "No relevant match found." });
        }

        const bestMatch = pineconeResult.matches[0];
        const metadata = bestMatch.metadata;

        // Retrieve full document info from MongoDB
        const doc = await collection.findOne({
            title: metadata.title,
            year: metadata.year
        });

        if (!doc) {
            return res.status(404).json({ message: "Metadata found, but no document in MongoDB." });
        }

        const prompt = `
You are a helpful assistant specializing in Pakistani laws.
Summarize the following excerpt in simple, clear language without opinions or negative commentary.

User Question: "${question}"

Document: ${metadata.title} (${metadata.year})
Page Number: ${metadata.pageNumber}

Excerpt:
"${metadata.text}"

Return a brief and neutral summary that helps a layperson understand this content.
        `;

        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const response = await model.generateContent(prompt);
        const summary = response.response.text();

        return res.json({
            title: metadata.title,
            year: metadata.year,
            pageNumber: metadata.pageNumber,
            summary,
            originalText: metadata.text,
            pdfUrl: doc.pdfUrl || metadata.url || null
        });

    } catch (err) {
        console.error("❌ Error in /query:", err);
        res.status(500).json({ message: "Internal server error." });
    }
});

// START SERVER
const server = app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🔄 Gracefully shutting down');
    server.close(() => {
        mongoClient.close().then(() => {
            console.log('🛑 MongoDB disconnected');
            process.exit(0);
        });
    });
});
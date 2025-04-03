require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const { GoogleGenerativeAIEmbeddings } = require("@langchain/google-genai");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(express.json());
app.use(cors());

const client = new MongoClient(process.env.MONGODB_URI);
const COLLECTION_NAME = process.env.MONGODB_COLLECTION;
const DB_NAME = process.env.MONGODB_DB;

const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: process.env.GEMINI_API_KEY,
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function initDB() {
    await client.connect();
    return client.db(DB_NAME).collection(COLLECTION_NAME);
}

app.post('/query', async(req, res) => {
    const { question } = req.body;
    const collection = await initDB();

    const queryEmbedding = await embeddings.embedQuery(question);

    // Vector search query to MongoDB Atlas
    const results = await collection.aggregate([{
            $vectorSearch: {
                index: "vector_index",
                path: "pageEmbeddings.embedding",
                queryVector: queryEmbedding,
                numCandidates: 100,
                limit: 1
            }
        },
        {
            $project: {
                title: 1,
                year: 1,
                url: "$pdfUrl",
                pageEmbeddings: 1,
                pdfContent: 1
            }
        }
    ]).toArray();

    if (results.length === 0) {
        return res.status(404).json({ message: "No relevant results found." });
    }

    const bestDoc = results[0];
    const bestPage = bestDoc.pageEmbeddings[0]; // Best matching page

    const prompt = `
    You are a helpful assistant specialized in Pakistani law. 
    Answer the following question clearly, accurately, and neutrally based on the provided text.
    
    Question: "${question}"
    
    Document Title: "${bestDoc.title} (${bestDoc.year})"
    Page Number: ${bestPage.pageNumber}

    Excerpt from Document:
    "${bestPage.text}"

    Provide a brief, neutral summary without any negative commentary.
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const summary = result.response.text();

    res.json({
        title: bestDoc.title,
        year: bestDoc.year,
        pageNumber: bestPage.pageNumber,
        summary,
        originalText: bestPage.text,
        pdfUrl: bestDoc.url
    });
});

app.listen(5000, () => {
    console.log('Backend running on http://localhost:5000');
});
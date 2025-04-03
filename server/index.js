require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const pdfParse = require('pdf-parse');
const { GoogleGenerativeAIEmbeddings } = require("@langchain/google-genai");
const { MongoDBAtlasVectorSearch } = require("@langchain/mongodb");

const app = express();
app.use(express.json());
app.use(cors());

const upload = multer({ storage: multer.memoryStorage() });

const client = new MongoClient(process.env.MONGODB_ATLAS_URI);

async function initDB() {
    await client.connect();
    return client.db(process.env.MONGODB_DB).collection(process.env.MONGODB_COLLECTION);
}

// PDF Vectorization endpoint
app.post('/vectorize', upload.single('pdf'), async(req, res) => {
    const pdfBuffer = req.file.buffer;
    const pdfData = await pdfParse(pdfBuffer);

    const collection = await initDB();

    const embeddings = new GoogleGenerativeAIEmbeddings({
        apiKey: process.env.GEMINI_API_KEY,
    });

    const docs = [{
        content: pdfData.text,
        metadata: { filename: req.file.originalname }
    }];

    const vectorStore = new MongoDBAtlasVectorSearch(embeddings, {
        collection,
        indexName: "default",
        textKey: "content",
        embeddingKey: "embedding",
    });

    await vectorStore.addDocuments(docs);

    res.json({ message: 'PDF successfully vectorized.' });
});

// Question answering endpoint
app.post('/query', async(req, res) => {
    const { question } = req.body;

    const embeddings = new GoogleGenerativeAIEmbeddings({
        apiKey: process.env.GEMINI_API_KEY,
    });

    const collection = await initDB();

    const vectorStore = new MongoDBAtlasVectorSearch(embeddings, {
        collection,
        indexName: "default",
        textKey: "content",
        embeddingKey: "embedding",
    });

    const retriever = vectorStore.asRetriever();

    const relevantDocs = await retriever.getRelevantDocuments(question);

    // Simple summarization using Gemini API
    const { GoogleGenerativeAI } = require("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const prompt = `Summarize this document excerpt briefly in simple terms for the question: "${question}"\n\n${relevantDocs[0].pageContent}`;

    const result = await model.generateContent(prompt);
    const summary = result.response.text();

    res.json({
        filename: relevantDocs[0].metadata.filename,
        summary: summary,
        originalText: relevantDocs[0].pageContent
    });
});

app.listen(5000, () => {
    console.log('Backend running on http://localhost:5000');
});
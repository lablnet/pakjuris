require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const { MongoClient } = require('mongodb');
const { GoogleGenerativeAIEmbeddings } = require('@langchain/google-genai');
const { MongoDBAtlasVectorSearch } = require('@langchain/mongodb');
const { Document } = require('@langchain/core/documents');

// Connect to MongoDB Atlas
const client = new MongoClient(process.env.MONGODB_URI);

async function initDB() {
    await client.connect();
    return client.db(process.env.MONGODB_DB).collection(process.env.MONGODB_COLLECTION);
}

// Vectorize a single PDF
async function vectorizePDF(filePath, collection, embeddings) {
    try {
        const pdfBuffer = fs.readFileSync(filePath);
        console.log(`\nProcessing PDF: ${path.basename(filePath)}`);
        console.log(`File size: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);

        const pdfData = await pdfParse(pdfBuffer);
        console.log(`PDF Info:`, {
            numpages: pdfData.numpages,
            info: pdfData.info,
            version: pdfData.version,
            textLength: pdfData.text ? pdfData.text.length : 0
        });

        // Check if we got valid text content
        if (!pdfData.text || pdfData.text.trim().length === 0) {
            console.error(`❌ No text content found in PDF: ${path.basename(filePath)}`);
            console.log('PDF Data:', JSON.stringify(pdfData, null, 2));
            return;
        }

        const url = "https://d2n6e94p3v1d3j.cloudfront.net/" + path.basename(filePath);

        // Create a proper LangChain Document
        const doc = new Document({
            pageContent: pdfData.text.trim(),
            metadata: {
                source: url,
                filename: path.basename(filePath),
                pageCount: pdfData.numpages
            }
        });

        // Debug log
        console.log(`Text content length: ${pdfData.text.length} characters`);
        console.log(`First 100 characters: ${pdfData.text.substring(0, 100)}...`);

        const vectorStore = new MongoDBAtlasVectorSearch(embeddings, {
            collection,
            indexName: "vector_index",
            textKey: "content",
            embeddingKey: "embedding",
        });

        await vectorStore.addDocuments([doc]);
        console.log(`✅ Vectorized: ${path.basename(filePath)}`);
    } catch (error) {
        console.error(`❌ Error processing ${path.basename(filePath)}:`, error.message);
        if (error.stack) {
            console.error('Stack trace:', error.stack);
        }
    }
}

// Vectorize all PDFs in a directory
async function vectorizeFolder(folderPath) {
    const collection = await initDB();

    const embeddings = new GoogleGenerativeAIEmbeddings({
        apiKey: process.env.GEMINI_API_KEY,
    });

    const files = fs.readdirSync(folderPath).filter(file => file.endsWith('.pdf'));

    for (const file of files) {
        const filePath = path.join(folderPath, file);
        try {
            await vectorizePDF(filePath, collection, embeddings);
        } catch (error) {
            console.error(`❌ Error processing ${file}:`, error);
        }
    }

    await client.close();
    console.log('🎉 All PDFs have been processed!');
}

// Folder containing PDFs
const pdfFolderPath = path.join(__dirname, 'pdfs');
vectorizeFolder(pdfFolderPath);
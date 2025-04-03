require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const { MongoClient } = require('mongodb');
const { GoogleGenerativeAIEmbeddings } = require('@langchain/google-genai');

// MongoDB Connection
const client = new MongoClient(process.env.MONGODB_URI);
const COLLECTION_NAME = process.env.MONGODB_COLLECTION;
const DB_NAME = process.env.MONGODB_DB;

// Embedding Model
const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: process.env.GEMINI_API_KEY,
});

// Initialize DB
async function initDB() {
    await client.connect();
    return client.db(DB_NAME).collection(COLLECTION_NAME);
}

// Chunk text by pages
function chunkByPage(text) {
    return text.split(/Page\s\d+\sof\s\d+/).filter(page => page.trim().length > 0);
}

// Find existing doc by year and title
async function findExistingDoc(collection, year, title) {
    return collection.findOne({ year, title });
}

// Vectorize a single PDF and update existing document
async function vectorizePDF(filePath, collection) {
    try {
        const pdfBuffer = fs.readFileSync(filePath);
        const fileName = path.basename(filePath);
        console.log(`\nProcessing: ${fileName}`);

        const pdfData = await pdfParse(pdfBuffer);
        const chunks = chunkByPage(pdfData.text);

        console.log(`PDF has ${chunks.length} pages/chunks`);

        const url = "https://d2n6e94p3v1d3j.cloudfront.net/" + fileName;

        // Extract year and title from filename
        const baseName = fileName.replace('.pdf', '');
        const yearMatch = baseName.match(/^(\d{4})_/);
        const year = yearMatch ? yearMatch[1] : "Unknown";
        const title = baseName.replace(`${year}_`, '').replace(/_/g, ' ').trim();

        const existingDoc = await findExistingDoc(collection, year, title);

        if (!existingDoc) {
            console.error(`❌ No matching document found in DB for ${fileName}`);
            return;
        } else {
            console.log(`✅ Matching document found in DB for ${fileName} (${existingDoc._id})`);
        }

        // Generate embeddings per page
        const pageEmbeddings = [];
        for (let i = 0; i < chunks.length; i++) {
            const pageContent = chunks[i].trim();
            if (pageContent.length < 20) continue; // Skip empty/small pages

            const embeddingVector = await embeddings.embedQuery(pageContent);
            pageEmbeddings.push({
                pageNumber: i + 1,
                embedding: embeddingVector,
                text: pageContent,
            });

            console.log(`✔️ Page ${i + 1} vectorized`);
        }

        // Update existing document with embeddings
        await collection.updateOne({ _id: existingDoc._id }, {
            $set: {
                pdfContent: pdfData.text,
                pageEmbeddings: pageEmbeddings,
                pdfUrl: url,
                totalPages: chunks.length,
                lastVectorized: new Date(),
            }
        });

        console.log(`✅ Updated embeddings for ${fileName}`);
    } catch (error) {
        console.error(`❌ Error processing ${path.basename(filePath)}:`, error);
    }
}

// Vectorize all PDFs in folder
async function vectorizeFolder(folderPath) {
    const collection = await initDB();

    const files = fs.readdirSync(folderPath).filter(file => file.endsWith('.pdf'));

    for (const file of files) {
        await vectorizePDF(path.join(folderPath, file), collection);
    }

    await client.close();
    console.log('🎉 Done vectorizing PDFs!');
}

// Start vectorizing PDFs
const pdfFolderPath = path.join(__dirname, 'pdfs');
vectorizeFolder(pdfFolderPath);
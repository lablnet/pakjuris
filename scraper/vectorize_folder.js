require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const { MongoClient } = require('mongodb');
const { GoogleGenerativeAIEmbeddings } = require('@langchain/google-genai');
const { Pinecone } = require('@pinecone-database/pinecone');

// MongoDB
const client = new MongoClient(process.env.MONGODB_URI);
const COLLECTION_NAME = process.env.MONGODB_COLLECTION;
const DB_NAME = process.env.MONGODB_DB;

// Embeddings
const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: process.env.GEMINI_API_KEY,
});

// Pinecone
const pinecone = new Pinecone();
const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME);

// Helpers
function chunkByPage(text) {
    return text.split(/Page\s\d+\sof\s\d+/).filter(page => page.trim().length > 0);
}

async function initDB() {
    await client.connect();
    return client.db(DB_NAME).collection(COLLECTION_NAME);
}

async function findExistingDoc(collection, year, title) {
    return collection.findOne({ year, title });
}

async function vectorizePDF(filePath, collection) {
    try {
        const pdfBuffer = fs.readFileSync(filePath);
        const fileName = path.basename(filePath);
        console.log(`\n📄 Processing: ${fileName}`);

        const pdfData = await pdfParse(pdfBuffer);
        const chunks = chunkByPage(pdfData.text);
        const url = "https://d2n6e94p3v1d3j.cloudfront.net/" + fileName;

        const baseName = fileName.replace('.pdf', '');
        const yearMatch = baseName.match(/^(\d{4})_/);
        const year = yearMatch ? yearMatch[1] : "Unknown";
        const title = baseName.replace(`${year}_`, '').replace(/_/g, ' ').trim();

        const existingDoc = await findExistingDoc(collection, year, title);
        if (!existingDoc) {
            console.error(`❌ No matching document in MongoDB for ${fileName}`);
            return;
        }

        const pineconeVectors = [];

        for (let i = 0; i < chunks.length; i++) {
            const pageText = chunks[i].trim();
            if (pageText.length < 20) continue;

            const vector = await embeddings.embedQuery(pageText);

            pineconeVectors.push({
                id: `${existingDoc._id.toString()}_page_${i + 1}`,
                values: vector,
                metadata: {
                    pageNumber: i + 1,
                    text: pageText,
                    title,
                    year,
                    fileName,
                    url,
                }
            });

            console.log(`✔️ Page ${i + 1} embedded`);
        }

        if (pineconeVectors.length > 0) {
            await pineconeIndex.upsert(pineconeVectors);
            console.log(`✅ Uploaded ${pineconeVectors.length} vectors to Pinecone`);
        }
    } catch (err) {
        console.error(`❌ Failed on ${filePath}:`, err.message);
    }
}

async function vectorizeFolder(folderPath) {
    const collection = await initDB();
    const files = fs.readdirSync(folderPath).filter(file => file.endsWith('.pdf'));

    for (const file of files) {
        await vectorizePDF(path.join(folderPath, file), collection);
    }

    await client.close();
    console.log('🎉 All PDFs processed and uploaded to Pinecone');
}

const pdfFolderPath = path.join(__dirname, 'pdfs');
vectorizeFolder(pdfFolderPath);
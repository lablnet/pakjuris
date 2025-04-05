require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const { MongoClient } = require('mongodb');
const { Pinecone } = require('@pinecone-database/pinecone');
const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters"); // Using Langchain splitter as in your example

// --- Azure OpenAI Imports ---
const { OpenAI } = require("openai"); // --- End Azure OpenAI Imports ---

// --- Config ---
const MONGODB_URI = process.env.MONGODB_URI;
const COLLECTION_NAME = process.env.MONGODB_COLLECTION;
const DB_NAME = process.env.MONGODB_DB;
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME;

// --- Azure OpenAI Config ---
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY;
const AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME = process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME;
const AZURE_API_VERSION = process.env.AZURE_API_VERSION;
// --- End Azure OpenAI Config ---

// Basic validation for essential ENV variables
if (!MONGODB_URI || !COLLECTION_NAME || !DB_NAME || !PINECONE_API_KEY || !PINECONE_INDEX_NAME || !AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_API_KEY || !AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME) {
    console.error("❌ FATAL ERROR: Missing one or more required environment variables for MongoDB, Pinecone, or Azure OpenAI.");
    process.exit(1);
}

const mongoClient = new MongoClient(MONGODB_URI);
const pinecone = new Pinecone({ apiKey: PINECONE_API_KEY }); // Pass API key here
const pineconeIndex = pinecone.Index(PINECONE_INDEX_NAME);

// --- Initialize Azure OpenAI Client (Matching the Example Pattern) ---
// This tells the OpenAI library it's talking to Azure specifically
const azureClient = new OpenAI({
    apiKey: AZURE_OPENAI_API_KEY,
    baseURL: `${AZURE_OPENAI_ENDPOINT}openai/deployments/${AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME}`, // Construct specific base URL for the deployment
    defaultQuery: { "api-version": AZURE_API_VERSION },
    defaultHeaders: { "api-key": AZURE_OPENAI_API_KEY }, // Required for Azure API Key auth
});
// --- End Azure OpenAI Client Init ---

const CHUNK_SIZE = 800; // Target size in characters
const CHUNK_OVERLAP = 80; // Overlap between chunks

// Helpers
async function initDB() {
    await mongoClient.connect();
    console.log("MongoDB Connected for Vectorization");
    return mongoClient.db(DB_NAME).collection(COLLECTION_NAME);
}

// More robust lookup - consider normalizing titles if needed
async function findExistingDoc(collection, year, title) {
    const normalizedTitle = title.toLowerCase().replace(/,/g, '').trim();
    console.log(`   Looking up MongoDB doc with Year: ${year}, Normalized Title: '${normalizedTitle}'`);
    const doc = await collection.findOne({
        year: year,
        title: { $regex: new RegExp(`^${normalizedTitle.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') }
    });
    if (doc) {
        console.log(`   Found MongoDB doc ID: ${doc._id}`);
    } else {
        console.warn(`   ⚠️ No matching document found in MongoDB for Title: '${title}', Year: ${year}.`);
    }
    return doc;
}


async function vectorizePDF(filePath, collection) {
    const fileName = path.basename(filePath);
    console.log(`\n📄 Processing: ${fileName}`);
    try {
        const pdfBuffer = fs.readFileSync(filePath);
        const pdfData = await pdfParse(pdfBuffer);

        let cleanedText = pdfData.text.replace(/\s\s+/g, ' ').replace(/\n\n+/g, '\n');
        // Remove potential headers/footers (example - adjust regex)
        cleanedText = cleanedText.replace(/^Page \d+ of \d+\s*/gm, '');
        // Normalize whitespace
        cleanedText = cleanedText.replace(/\s\s+/g, ' ').replace(/\n\n+/g, '\n').trim();

        const baseName = fileName.replace('.pdf', '');
        const yearMatch = baseName.match(/^(\d{4})_/);
        const year = yearMatch ? yearMatch[1] : "Unknown";
        let title = baseName.replace(`${year}_`, '').replace(/_/g, ' ').trim();

        const existingDoc = await findExistingDoc(collection, year, title);
        if (!existingDoc) {
            console.error(`❌ Skipping - No matching document in MongoDB for ${fileName} (Year: ${year}, Title: ${title})`);
            return;
        }

        const url = existingDoc.url;
        console.log(`Using URL: ${url}`);

        const splitter = new RecursiveCharacterTextSplitter({ chunkSize: CHUNK_SIZE, chunkOverlap: CHUNK_OVERLAP });
        const docs = await splitter.createDocuments([cleanedText]);
        const chunks = docs.map(doc => doc.pageContent);
        console.log(`   Split into ${chunks.length} Langchain chunks`);

        const pineconeVectors = [];

        for (let i = 0; i < chunks.length; i++) {
            const chunkText = chunks[i];
            if (!chunkText || chunkText.length < 20) continue;

            try {
                console.log(`   Embedding chunk ${i + 1}/${chunks.length} using Azure OpenAI...`);

                // --- <<< CORRECT Call Azure OpenAI for Embedding using 'openai' library >>> ---
                const embeddingResult = await azureClient.embeddings.create({
                    // The 'model' parameter is actually IGNORED when baseURL points directly to a deployment.
                    // The deployment name is already part of the baseURL.
                    // model: AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME, // This is not strictly needed here but doesn't hurt
                    input: chunkText // Pass the single chunk string directly
                });
                // --- <<< End CORRECTED Azure OpenAI Call >>> ---


                if (!embeddingResult || !embeddingResult.data || embeddingResult.data.length === 0 || !embeddingResult.data[0].embedding) {
                    throw new Error('Invalid embedding response received from Azure OpenAI.');
                }

                const vector = embeddingResult.data[0].embedding;
                // --- <<< End Azure OpenAI Call >>> ---

                pineconeVectors.push({
                    id: `${existingDoc._id.toString()}_chunk_${i}`,
                    values: vector,
                    metadata: {
                        // Page number info might be less accurate with RecursiveCharacterTextSplitter
                        // pageNumber: pdfData.numpages ? i + 1 : i + 1, // Keep if useful, but less precise
                        chunkIndex: i,
                        text: chunkText,
                        title: existingDoc.title, // Use consistent title from DB
                        year: existingDoc.year, // Use consistent year from DB
                        fileName,
                        url: url, // Use the determined URL
                    }
                });

                // // Keep the delay, check Azure rate limits if you encounter issues
                // console.log(`   Waiting 10 seconds...`);
                // await new Promise(resolve => setTimeout(resolve, 10000));

            } catch (embedError) {
                console.error(`   ❌ Error embedding chunk ${i + 1}: ${embedError.message}`);
                // Consider adding logic to break or retry based on error type
            }
        }

        // --- Pinecone Upsert (remains the same logic) ---
        if (pineconeVectors.length > 0) {
            const BATCH_SIZE = 100; // Pinecone batch limit
            for (let i = 0; i < pineconeVectors.length; i += BATCH_SIZE) {
                const batch = pineconeVectors.slice(i, i + BATCH_SIZE);
                console.log(`   Uploading batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} vectors) to Pinecone...`);
                await pineconeIndex.upsert(batch);
            }
            console.log(`✅ Uploaded ${pineconeVectors.length} vectors to Pinecone for ${fileName}`);
        } else {
            console.log(`   ⚠️ No valid chunks generated or embedded for ${fileName}.`);
        }
    } catch (err) {
        console.error(`❌ Failed processing ${fileName}:`, err.message, err.stack);
    }
}

async function vectorizeFolder(folderPath, collection) { // Pass collection down
    const files = fs.readdirSync(folderPath).filter(file => file.endsWith('.pdf'));
    console.log(`Processing ${files.length} PDFs in ${folderPath}`);
    let i = 0;
    for (const file of files) {
        await vectorizePDF(path.join(folderPath, file), collection); // Pass collection
        i++;
        console.log(`Processed ${i} of ${files.length} PDFs`);
    }

    console.log('🎉 All PDFs processed.');
}

async function main() {
    try {
        const collection = await initDB();
        const pdfFolderPath = path.join(__dirname, 'pdfs'); // Ensure correct path
        await vectorizeFolder(pdfFolderPath, collection);
    } catch (error) {
        console.error("❌ An error occurred during the main process:", error);
    } finally {
        console.log("Vectorization process finished.");
    }
}

main();
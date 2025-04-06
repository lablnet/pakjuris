require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const { MongoClient } = require('mongodb');
const { Pinecone } = require('@pinecone-database/pinecone');
const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");
const { OpenAI } = require("openai");

// --- Config ---
const MONGODB_URI = process.env.MONGODB_URI;
const COLLECTION_NAME = process.env.MONGODB_COLLECTION;
const DB_NAME = process.env.MONGODB_DB;
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME;
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY;
const AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME = process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME;
const AZURE_API_VERSION = process.env.AZURE_API_VERSION;

// Basic validation for essential ENV variables
if (!MONGODB_URI || !COLLECTION_NAME || !DB_NAME || !PINECONE_API_KEY || !PINECONE_INDEX_NAME || !AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_API_KEY || !AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME) {
    console.error("❌ FATAL ERROR: Missing one or more required environment variables for MongoDB, Pinecone, or Azure OpenAI.");
    process.exit(1);
}

const mongoClient = new MongoClient(MONGODB_URI);
const pinecone = new Pinecone({ apiKey: PINECONE_API_KEY });
const pineconeIndex = pinecone.Index(PINECONE_INDEX_NAME);

const azureClient = new OpenAI({
    apiKey: AZURE_OPENAI_API_KEY,
    baseURL: `${AZURE_OPENAI_ENDPOINT}openai/deployments/${AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME}`,
    defaultQuery: { "api-version": AZURE_API_VERSION },
    defaultHeaders: { "api-key": AZURE_OPENAI_API_KEY },
});


const CHUNK_SIZE = 800; // Target size in characters
const CHUNK_OVERLAP = 80; // Overlap between chunks

// Helpers
async function initDB() {
    await mongoClient.connect();
    console.log("MongoDB Connected for Vectorization");
    return mongoClient.db(DB_NAME).collection(COLLECTION_NAME);
}

// Function to attempt splitting text into pages based on common patterns
function splitTextIntoPages(fullText, numPages) {
    // Strategy 1: Look for form feed character (\f) - often used by PDF libraries
    let pages = fullText.split('\f');
    console.log(`   Split attempt 1 (form feed): Found ${pages.length} potential pages.`);

    // Strategy 2: If form feed doesn't work well, try regex for "Page X of Y" (less reliable)
    if (pages.length <= 1 && numPages > 1) {
        console.log(`   Form feed split ineffective, trying regex split...`);
        // Regex to split by "Page <number> of <total>" potentially followed by whitespace
        // Making the " of <total>" part optional for robustness
        pages = fullText.split(/Page\s+\d+(\s+of\s+\d+)?\s*/i);
        console.log(`   Split attempt 2 (regex): Found ${pages.length} potential pages.`);
        // Regex split often leaves an empty first element if the pattern is at the start
        if (pages[0].trim() === '') {
            pages.shift();
        }
    }

    // Basic Filtering: Remove very short "pages" that might be artifacts
    const cleanedPages = pages.map(p => p.trim()).filter(p => p.length > 50); // Keep pages with some content
    console.log(`   Filtered down to ${cleanedPages.length} pages with significant content.`);

    // Warning if page count mismatch is large
    if (Math.abs(cleanedPages.length - numPages) > numPages * 0.1) { // Allow 10% difference
        console.warn(`   ⚠️ Potential page split mismatch: pdf-parse reported ${numPages} pages, but split resulted in ${cleanedPages.length} usable text pages.`);
    }

    return cleanedPages;
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
        const pdfData = await pdfParse(pdfBuffer, {
            pagerender: (pageData) => {
                // This callback can extract text per page, but it's complex to aggregate cleanly here.
                // We'll primarily rely on pdfData.numpages and split the full text.
                return ''; // Don't need the rendered text from here
            }
        });
        const totalPages = pdfData.numpages;
        console.log(`   PDF has ${totalPages} pages.`);

        // Basic text cleanup on the entire extracted text
        let fullCleanedText = pdfData.text.replace(/\s\s+/g, ' ').replace(/\n\n+/g, '\n').trim();

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

        const pageChunks = splitTextIntoPages(fullCleanedText, totalPages);
        console.log(`   Split into ${pageChunks.length} pages chunks`);

        const pineconeVectors = [];

        for (let i = 0; i < pageChunks.length; i++) {
            const pageText = pageChunks[i];
            const pageNumber = i + 1;
            if (!pageText || pageText.length < 50) { // Increase minimum length for pages
                console.log(`   Skipping embedding for page ${pageNumber} (too short).`);
                continue;
            }

            try {
                console.log(`   Embedding page ${pageNumber} using Azure OpenAI...`);

                // --- <<< CORRECT Call Azure OpenAI for Embedding using 'openai' library >>> ---
                const embeddingResult = await azureClient.embeddings.create({
                    // The 'model' parameter is actually IGNORED when baseURL points directly to a deployment.
                    // The deployment name is already part of the baseURL.
                    // model: AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME, // This is not strictly needed here but doesn't hurt
                    input: pageText // Pass the single chunk string directly
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
                        pageNumber: pageNumber,
                        chunkIndex: i,
                        text: pageText,
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
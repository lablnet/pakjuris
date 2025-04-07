require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
const { Pinecone } = require('@pinecone-database/pinecone');
const { OpenAI } = require("openai");
const pdf = require('pdf-parse');


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

const getSpecificPage = async(data, pageNum) => {
    try {
        // Get all text and split by page breaks
        const allText = data.text;

        // Find page markers in the text (page numbers are usually at the bottom)
        const pageRegex = /Page\s+(\d+)\s+of\s+\d+/g;
        let match;
        let pageLocations = [];

        // Find all page number locations in the text
        while ((match = pageRegex.exec(allText)) !== null) {
            pageLocations.push({
                pageNum: parseInt(match[1]),
                position: match.index,
                marker: match[0] // Store the actual marker text
            });
        }

        console.log(`Found ${pageNum} of ${pageLocations.length} page markers`);

        // Find the requested page
        const pageIndex = pageLocations.findIndex(p => p.pageNum === pageNum);

        if (pageIndex !== -1) {
            // Start from the actual page marker including the text "Page X of Y"
            const startPos = pageLocations[pageIndex].position;

            // End at the next page marker (or end of document)
            const endPos = pageIndex < pageLocations.length - 1 ?
                pageLocations[pageIndex + 1].position : allText.length;

            // Extract just this page's content
            let pageContent = allText.substring(startPos, endPos);
            // remove Page pageNum of pageNum
            pageContent = pageContent.replace(`Page ${pageNum} of ${pageNum}`, '');
            return pageContent;
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error parsing PDF:', error);
        return null;
    }
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

        // Using robust extraction
        const data = await pdf(pdfBuffer);
        const numPages = data.numpages;

        if (numPages === 0) {
            console.warn(`⚠️ No usable pages extracted from ${fileName}.`);
            return;
        }

        console.log(`Extracted ${numPages} usable pages from PDF.`);

        const baseName = fileName.replace('.pdf', '');
        const yearMatch = baseName.match(/^(\d{4})_/);
        const year = yearMatch ? yearMatch[1] : "Unknown";
        const title = baseName.replace(`${year}_`, '').replace(/_/g, ' ').trim();

        const existingDoc = await findExistingDoc(collection, year, title);
        if (!existingDoc) {
            console.error(`❌ Skipping - No matching document in MongoDB for ${fileName}`);
            return;
        }

        const url = existingDoc.url;
        const pineconeVectors = [];
        let i = 1;
        while (i <= numPages) {
            try {
                const pageContent = await getSpecificPage(data, i);
                if (!pageContent) {
                    console.error(`❌ No page content found for page ${i}`);
                    i++;
                    continue;
                }
                const embeddingResult = await azureClient.embeddings.create({
                    input: pageContent
                });
                if (!embeddingResult.data || !embeddingResult.data[0] || !embeddingResult.data[0].embedding) {
                    console.error(`❌ No embedding result for page ${i}`);
                    continue;
                }

                const vector = embeddingResult.data[0].embedding;

                pineconeVectors.push({
                    id: `${existingDoc._id.toString()}_page_${i}`,
                    values: vector,
                    metadata: {
                        pageNumber: i,
                        text: pageContent,
                        title: existingDoc.title,
                        year: existingDoc.year,
                        fileName,
                        url
                    }
                });

            } catch (embedError) {
                console.error(`❌ Error embedding page ${i}: ${embedError.message}`);
            }
            i++;
        }

        // Pinecone Upsert
        const BATCH_SIZE = 100;
        for (let i = 0; i < pineconeVectors.length; i += BATCH_SIZE) {
            const batch = pineconeVectors.slice(i, i + BATCH_SIZE);
            await pineconeIndex.upsert(batch);
            console.log(`Uploaded batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} vectors) to Pinecone.`);
        }

        console.log(`✅ Uploaded ${pineconeVectors.length} vectors to Pinecone for ${fileName}`);

    } catch (err) {
        console.error(`❌ Failed processing ${fileName}:`, err.message);
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
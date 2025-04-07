require('dotenv').config();
const { Pinecone } = require('@pinecone-database/pinecone');

// --- Azure OpenAI Imports ---
const { OpenAI } = require("openai"); // Using standard OpenAI library v4+
// --- End Azure OpenAI Imports ---

// --- Configuration ---
// Removed GEMINI_API_KEY

// --- Pinecone Config ---
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME;
const TOP_K_RESULTS = 5; // How many results to retrieve from Pinecone
// --- End Pinecone Config ---

// --- Azure OpenAI Config ---
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT; // e.g., https://your-resource-name.openai.azure.com/
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY;
const AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME = process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME; // Your DEPLOYMENT name
const AZURE_API_VERSION = "2024-02-01"; // Specify a supported API version
// --- End Azure OpenAI Config ---


// Basic validation
// Updated validation to check for Azure variables
if (!PINECONE_API_KEY || !PINECONE_INDEX_NAME || !AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_API_KEY || !AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME) {
    console.error("❌ FATAL ERROR: Missing one or more required environment variables for Pinecone or Azure OpenAI.");
    process.exit(1);
}

// --- Text to Test ---
// PASTE THE EXACT TEXT FROM YOUR PDF HERE
const textToTest = `prohibited company names`; // End of pasted text


// --- Initialize Services ---
// Removed Google Embeddings initialization

// Initialize Pinecone client
const pinecone = new Pinecone({
    apiKey: PINECONE_API_KEY,
});

// Initialize Azure OpenAI client (Matching the Example Pattern)
const azureClient = new OpenAI({
    apiKey: AZURE_OPENAI_API_KEY,
    baseURL: `${AZURE_OPENAI_ENDPOINT}openai/deployments/${AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME}`, // Construct specific base URL
    defaultQuery: { "api-version": AZURE_API_VERSION },
    defaultHeaders: { "api-key": AZURE_OPENAI_API_KEY },
});
// --- End Initializations ---


// --- Main Test Function ---
async function runTest() {
    console.log("🧪 Starting Azure OpenAI embedding test...");

    if (!textToTest || textToTest.trim().length < 10) {
        console.error("❌ Please paste a valid text snippet into the 'textToTest' variable.");
        return;
    }

    const textSnippet = textToTest.trim(); // Use trimmed text

    console.log("\n📜 Text Snippet to Test:");
    console.log("--------------------------------------------------");
    console.log(textSnippet);
    console.log("--------------------------------------------------");

    try {
        // 1. Initialize Pinecone Index
        console.log(`\n🌲 Connecting to Pinecone index '${PINECONE_INDEX_NAME}'...`);
        const pineconeIndex = pinecone.Index(PINECONE_INDEX_NAME);
        console.log("   Connected to Pinecone index.");

        // 2. Generate Embedding for the test text using Azure OpenAI
        console.log("\n✨ Generating embedding with Azure OpenAI...");

        // --- <<< Call Azure OpenAI for Embedding >>> ---
        const embeddingResult = await azureClient.embeddings.create({
            // model: AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME, // Model param ignored when baseURL points to deployment
            input: textSnippet // Pass the single string
        });
        // --- <<< End Azure OpenAI Call >>> ---

        if (!embeddingResult || !embeddingResult.data || embeddingResult.data.length === 0 || !embeddingResult.data[0].embedding) {
            throw new Error('Invalid embedding response received from Azure OpenAI.');
        }

        const queryVector = embeddingResult.data[0].embedding;
        console.log(`   Embedding generated (vector dimension: ${queryVector.length}).`);


        // 3. Query Pinecone
        console.log(`\n🔍 Querying Pinecone for top ${TOP_K_RESULTS} similar chunks...`);
        const queryResponse = await pineconeIndex.query({
            vector: queryVector,
            topK: TOP_K_RESULTS,
            includeMetadata: true,
        });
        console.log("   Pinecone query completed.");

        // 4. Display Results
        console.log(`\n📊 Results (Top ${TOP_K_RESULTS}):`);
        console.log("==================================================");

        if (!queryResponse || !queryResponse.matches || queryResponse.matches.length === 0) {
            console.log("   No matches found in Pinecone.");
        } else {
            queryResponse.matches.forEach((match, index) => {
                        const score = match.score * 100; // Convert to percentage
                        const metadata = match.metadata || {};
                        const textPreview = metadata.text ? metadata.text.replace(/\n/g, ' ') + '...' : '[No Text Metadata]';

                        console.log(`   Result ${index + 1}:`);
                        console.log(`     Score: ${score.toFixed(2)}%`);
                        console.log(`     ID: ${match.id}`);
                        console.log(`     Title: ${metadata.title || 'N/A'}`);
                        console.log(`     Year: ${metadata.year || 'N/A'}`);
                        console.log(`     Chunk/Page: ${metadata.chunkIndex !== undefined ? `Chunk ${metadata.chunkIndex}` : (metadata.pageNumber ? `Page ${metadata.pageNumber}` : 'N/A')}`);
                console.log(`     Text Preview: ${textPreview}`);
                console.log(`     --------------------`);
            });
        }
        console.log("==================================================");
        console.log("✅ Test finished.");

    } catch (error) {
        console.error("\n❌ An error occurred during the test:");
         // Log specific Azure errors if possible
         if (error?.status === 404) {
            console.error(`   Error: 404 Not Found. Check Azure Endpoint, Deployment Name ('${AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME}'), and API Version ('${AZURE_API_VERSION}').`);
         } else {
             console.error(error);
         }
    }
}

// --- Run the test ---
runTest();
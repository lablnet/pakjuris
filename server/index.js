require('dotenv').config(); // Load environment variables first
const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const { GoogleGenerativeAIEmbeddings } = require("@langchain/google-genai");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { Pinecone } = require('@pinecone-database/pinecone');

// --- Environment Variables ---
const PORT = process.env.PORT || 8000;
const MONGODB_URI = process.env.MONGODB_URI;
const COLLECTION_NAME = process.env.MONGODB_COLLECTION;
const DB_NAME = process.env.MONGODB_DB;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME;

// Basic validation for essential ENV variables
if (!MONGODB_URI || !COLLECTION_NAME || !DB_NAME || !GEMINI_API_KEY || !PINECONE_API_KEY || !PINECONE_INDEX_NAME) {
    console.error("❌ FATAL ERROR: Missing one or more required environment variables (.env file).");
    console.error("Required: MONGODB_URI, MONGODB_COLLECTION, MONGODB_DB, GEMINI_API_KEY, PINECONE_API_KEY, PINECONE_INDEX_NAME");
    process.exit(1); // Exit if essential config is missing
}

// --- Initialize Services ---
const app = express();
const mongoClient = new MongoClient(MONGODB_URI);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const embeddings = new GoogleGenerativeAIEmbeddings({ apiKey: GEMINI_API_KEY });
const pinecone = new Pinecone({ apiKey: PINECONE_API_KEY });

let dbCollection; // Will hold the MongoDB collection instance
let pineconeIndex; // Will hold the Pinecone index instance

// --- Middleware ---
app.use(express.json()); // Parse JSON bodies
app.use(cors()); // Enable Cross-Origin Resource Sharing

// Request logging middleware
app.use((req, res, next) => {
    console.log(`➡️ ${req.method} ${req.path}`);
    if (req.body && Object.keys(req.body).length > 0) {
        console.log('   Body:', JSON.stringify(req.body));
    }
    next();
});

// --- Service Initialization Function ---
async function initializeServices() {
    console.log("🔄 Initializing services...");
    try {
        // 1. Connect to MongoDB
        await mongoClient.connect();
        const db = mongoClient.db(DB_NAME);
        dbCollection = db.collection(COLLECTION_NAME);
        // Optional: Ping DB to confirm connection
        await db.command({ ping: 1 });
        console.log(`✅ MongoDB connected to database: ${DB_NAME}, collection: ${COLLECTION_NAME}`);

        // 2. Initialize Pinecone Index
        // Check if index exists before trying to use it (optional but good practice)
        const indexList = await pinecone.listIndexes();
        if (!indexList.indexes || !indexList.indexes.some(index => index.name === PINECONE_INDEX_NAME)) {
            throw new Error(`Pinecone index '${PINECONE_INDEX_NAME}' does not exist.`);
        }
        pineconeIndex = pinecone.index(PINECONE_INDEX_NAME);
        // Optional: Describe index stats to confirm connection
        const stats = await pineconeIndex.describeIndexStats();
        console.log(`✅ Pinecone index '${PINECONE_INDEX_NAME}' initialized. Total vectors: ${stats.totalVectorCount}`);

        console.log("👍 Services initialized successfully.");

    } catch (err) {
        console.error("❌ Service initialization failed:", err);
        await mongoClient.close(); // Attempt to close mongo connection if it opened
        process.exit(1); // Exit if critical services fail to initialize
    }
}

// --- Routes ---

// Health Check Route (Good Practice)
app.get('/', (req, res) => {
    res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});


// Query Route
app.post('/query', async(req, res, next) => { // Added next for error forwarding
    // Check if services are ready
    if (!dbCollection || !pineconeIndex) {
        console.warn("⚠️ Query received but services not yet initialized.");
        return res.status(503).json({ message: "Services not ready, please try again shortly." });
    }

    try {
        // 1. Validate Input
        if (!req.body || !req.body.question) {
            return res.status(400).json({ message: "Bad Request: 'question' field is required in the JSON body." });
        }
        const { question } = req.body;
        console.log("Processing question:", question);

        // 2. Generate Query Embedding
        console.log("   Generating embedding for the question...");
        let queryVector;
        try {
            queryVector = await embeddings.embedQuery(question);
            console.log("   Embedding generated successfully.");
        } catch (embeddingError) {
            console.error("   ❌ Error generating embedding:", embeddingError);
            // Rethrow or handle specifically (e.g., check for Gemini API errors)
            throw embeddingError; // Let the main catch handler deal with it for now
        }


        // 3. Query Pinecone
        console.log(`   Querying Pinecone index '${PINECONE_INDEX_NAME}'...`);
        let pineconeResult;
        try {
            pineconeResult = await pineconeIndex.query({
                topK: 1, // Get the single best match
                vector: queryVector,
                includeMetadata: true, // Crucial to get context
            });
            console.log(`   Pinecone query successful. Found ${pineconeResult.matches?.length || 0} matches.`);
        } catch (pineconeError) {
            console.error("   ❌ Error querying Pinecone:", pineconeError);
            throw pineconeError;
        }


        if (!pineconeResult.matches || pineconeResult.matches.length === 0) {
            console.log("   No relevant matches found in Pinecone.");
            return res.status(404).json({ message: "No relevant documents found matching your question." });
        }

        const bestMatch = pineconeResult.matches[0];
        const metadata = bestMatch.metadata; // Metadata from Pinecone (should contain title, year, page, text)
        const score = bestMatch.score; // Similarity score
        console.log(`   Best match (Score: ${score?.toFixed(4)}):`, metadata);

        if (!metadata || !metadata.title || !metadata.year || !metadata.pageNumber || !metadata.text) {
            console.error("   ❌ Error: Pinecone metadata is incomplete for the best match.", metadata);
            return res.status(500).json({ message: "Internal Error: Retrieved document metadata is incomplete." });
        }


        // 4. Retrieve Full Document Info from MongoDB (Optional but good for extra info like PDF URL)
        console.log(`   Retrieving additional info from MongoDB for: ${metadata.title} (${metadata.year})...`);
        const doc = await dbCollection.findOne({
            title: metadata.title,
            year: metadata.year,
            // You might need a more specific filter if title/year isn't unique
        });

        if (!doc) {
            // This might be okay if the PDF URL isn't strictly required, depends on your needs
            console.warn(`   ⚠️ Warning: Metadata found in Pinecone, but no matching document found in MongoDB for ${metadata.title} (${metadata.year}).`);
        } else {
            console.log("   MongoDB document found.");
        }


        // 5. Generate Summary with Gemini
        const prompt = `
You are an AI assistant specializing in summarizing Pakistani legal text for a layperson.
Analyze the user's question and the provided legal excerpt.
Provide a clear, simple, and neutral summary of the excerpt, directly addressing the user's query if possible.
Avoid legal jargon, opinions, or negative language. Focus on explaining the core meaning of the text.

User Question: "${question}"

Document Reference: ${metadata.title} (${metadata.year}), Page: ${metadata.pageNumber}

Legal Excerpt:
"${metadata.text}"

Summary:`; // Let the model complete the summary

        console.log("   Generating summary with Gemini...");
        let summary;
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro-exp-03-25" }); // Or specify the model you intend to use
            const generationResult = await model.generateContent(prompt);
            // It's good practice to check the finish reason if available
            if (generationResult.response.candidates[0].finishReason && generationResult.response.candidates[0].finishReason !== 'STOP') {
                console.warn(`   ⚠️ Gemini generation finished unexpectedly: ${generationResult.response.candidates[0].finishReason}`);
            }
            summary = generationResult.response.text();
            console.log("   Summary generated successfully.");
        } catch (geminiError) {
            console.error("   ❌ Error generating summary with Gemini:", geminiError);
            throw geminiError;
        }


        // 6. Send Response
        console.log("✅ Query processed successfully. Sending response.");
        return res.json({
            title: metadata.title,
            year: metadata.year,
            pageNumber: metadata.pageNumber,
            summary: summary.trim(), // Trim whitespace from summary
            originalText: metadata.text,
            pdfUrl: "https://d2n6e94p3v1d3j.cloudfront.net/bills/2017/2017_Companies_Act_2017.pdf" || null, // Use MongoDB doc URL if found, fallback to metadata URL, then null
            matchScore: score // Include the similarity score
        });

    } catch (err) {
        // Forward error to the global error handler
        next(err);
    }
});

// --- Global Error Handling Middleware ---
// MUST be defined LAST, after all other app.use() and routes
app.use((err, req, res, next) => {
    console.error("❌ An error occurred processing the request:", err); // Log the full error stack

    // Check for specific API error structures (example for Google AI, adjust if needed)
    if (err.response && err.response.data && err.response.data.error) {
        console.error("   API Error Details:", err.response.data.error);
        const apiError = err.response.data.error;
        return res.status(apiError.code || err.response.status || 500).json({
            message: `API Error: ${apiError.message || 'An error occurred calling an external service.'}`,
            status: apiError.status, // e.g., 'PERMISSION_DENIED'
        });
    }
    // Check for errors that might have a status property directly
    else if (err.status) {
        return res.status(err.status).json({ message: err.message || 'An error occurred.' });
    }
    // Check specifically for Pinecone errors if they have a unique structure (check SDK docs)
    else if (err.name === 'PineconeError') { // Example check, adjust based on actual error object
        return res.status(err.status || 500).json({ message: `Pinecone Error: ${err.message}` });
    }
    // Fallback for generic errors
    else {
        res.status(500).json({ message: "Internal Server Error. Please try again later." });
    }
});


// --- Start Server ---
// Initialize services first, then start listening
initializeServices().then(() => {
    const server = app.listen(PORT, () => {
        console.log(`🚀 Server running and listening at http://localhost:${PORT}`);
    });

    // --- Graceful Shutdown ---
    process.on('SIGTERM', () => {
        console.log('SIGTERM signal received: Closing HTTP server gracefully...');
        server.close(() => {
            console.log('HTTP server closed.');
            mongoClient.close().then(() => {
                console.log('MongoDB connection closed.');
                process.exit(0);
            }).catch(err => {
                console.error('Error closing MongoDB connection during shutdown:', err);
                process.exit(1);
            });
        });
    });

    process.on('SIGINT', () => {
        console.log('SIGINT signal received: Closing down...');
        // Trigger SIGTERM handler for cleanup
        process.emit('SIGTERM');
    });

}).catch(err => {
    // This catch is for errors during the initializeServices() call itself if not handled within
    console.error("❌ Server failed to start due to initialization error:", err);
    process.exit(1);
});
// index.js
const express = require('express');
const cors = require('cors');
const config = require('./config/env');
const mongoService = require('./services/mongo');
const pineconeService = require('./services/pinecone');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');
const queryRoutes = require('./routes/query'); // Import the router

const app = express();

// --- Core Middleware ---
// Use CORS before other middleware/routes if possible
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Parse JSON bodies
app.use(requestLogger); // Log requests

// --- Routes ---
app.get('/', (req, res) => { // Health check
    res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

// Mount the query routes
app.use('/query', queryRoutes);


// --- Global Error Handling ---
// This MUST be the last middleware added
app.use(errorHandler);

// --- Service Initialization and Server Start ---
async function startServer() {
    try {
        console.log("--- Initializing Services ---");
        await mongoService.connectDB();
        await pineconeService.initPinecone();
        console.log("-----------------------------");

        const server = app.listen(config.PORT, () => {
            console.log(`🚀 Server running and listening at http://localhost:${config.PORT}`);
        });

        // --- Graceful Shutdown ---
        const shutdown = async(signal) => {
            console.log(`\n${signal} signal received: Closing HTTP server gracefully...`);
            server.close(async() => {
                console.log('HTTP server closed.');
                await mongoService.closeDB();
                // Add any other cleanup here (e.g., Pinecone client if needed)
                process.exit(0);
            });
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT')); // Handle Ctrl+C

    } catch (error) {
        console.error("❌ Server failed to start due to initialization error:", error);
        // Attempt cleanup if DB connected partially
        await mongoService.closeDB().catch(err => console.error("Error closing DB during failed startup:", err));
        process.exit(1);
    }
}

startServer();
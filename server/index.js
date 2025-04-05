// index.js
const express = require('express');
const cors = require('cors');
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const config = require('./config/env');
const mongoService = require('./services/mongo');
const pineconeService = require('./services/pinecone');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');
const queryRoutes = require('./routes/query'); // Import the router
const { router: statusRoutes } = require('./routes/status'); // Import the SSE router

// Initialize Firebase Adymin SDK
admin.initializeApp();

// Create Express app
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

// Mount the status routes for SSE
app.use('/status', statusRoutes);

// --- Global Error Handling ---
// This MUST be the last middleware added
app.use(errorHandler);

// --- Service Initialization ---
const initializeServices = async() => {
    try {
        console.log("--- Initializing Services ---");
        await mongoService.connectDB();
        await pineconeService.initPinecone();
        console.log("-----------------------------");
        console.log("Services initialized successfully");
        return true;
    } catch (error) {
        console.error("❌ Services failed to initialize:", error);
        // Attempt cleanup if DB connected partially
        await mongoService.closeDB().catch(err => console.error("Error closing DB during failed initialization:", err));
        throw error; // Re-throw to ensure Firebase Functions knows initialization failed
    }
};

// --- Graceful Shutdown Handler ---
const handleShutdown = async() => {
    console.log('Shutting down services gracefully...');
    await mongoService.closeDB();
    // Add any other cleanup here (e.g., Pinecone client if needed)
    console.log('Services shutdown complete');
};

// Initialize services when the function is first deployed
let servicesInitialized = false;
const ensureServicesInitialized = async() => {
    if (!servicesInitialized) {
        await initializeServices();
        servicesInitialized = true;

        // Register cleanup handlers
        process.on('SIGTERM', handleShutdown);
        process.on('SIGINT', handleShutdown);
    }
};

// Create and export the function with increased memory and timeout
exports.api = functions.runWith({
    memory: '1GB', // Increase memory allocation to 1GB
    timeoutSeconds: 300, // 5 minute timeout
    minInstances: 0, // No minimum instances (scale to zero when not in use)
    maxInstances: 10 // Maximum of 10 instances for scaling
}).https.onRequest(async(req, res) => {
    try {
        // Initialize services on first request if not already initialized
        if (!servicesInitialized) {
            await ensureServicesInitialized().catch(err => {
                console.error("Failed to initialize services:", err);
                res.status(500).json({ error: "Service initialization failed" });
                return;
            });
        }

        // Pass the request to the Express app
        return app(req, res);
    } catch (error) {
        console.error("Error handling request:", error);
        res.status(500).json({ error: "Internal server error occurred" });
    }
});

// For local development using the Firebase emulator
if (process.env.NODE_ENV === 'development') {
    const PORT = config.PORT || 5001;
    app.listen(PORT, async() => {
        await ensureServicesInitialized().catch(err => {
            console.error("Failed to initialize services in dev mode:", err);
            process.exit(1);
        });
        console.log(`🚀 Development server running at http://localhost:${PORT}`);
    });
}
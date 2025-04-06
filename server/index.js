// index.js
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const config = require('./config/env');
const mongoService = require('./services/mongo');
const pineconeService = require('./services/pinecone');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');
const authMiddleware = require('./middleware/auth');
const queryRoutes = require('./routes/query'); // Import the router
const { router: statusRoutes } = require('./routes/status'); // Import the SSE router

// Initialize Firebase Admin SDK - still needed for authentication
admin.initializeApp();

// Create Express app
const app = express();

// --- Core Middleware ---
// Simple CORS config to avoid path-to-regexp issues
app.use(cors());

// Basic JSON parsing
app.use(express.json());

// Custom request logger
app.use(requestLogger);

// Authentication middleware
app.use(authMiddleware);

// --- Routes ---
// Health check endpoint
app.get('/', (req, res) => {
    res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

// Mount the query routes
app.use('/query', queryRoutes);

// Mount the status routes for SSE
app.use('/status', statusRoutes);

// --- Global Error Handling ---
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
        throw error;
    }
};

// --- Graceful Shutdown Handler ---
const handleShutdown = async() => {
    console.log('Shutting down services gracefully...');
    await mongoService.closeDB();
    // Add any other cleanup here (e.g., Pinecone client if needed)
    console.log('Services shutdown complete');
    process.exit(0);
};

// Server startup
const startServer = async() => {
    try {
        // Initialize services
        await initializeServices();

        // Register cleanup handlers
        process.on('SIGTERM', handleShutdown);
        process.on('SIGINT', handleShutdown);

        // Start server
        const PORT = process.env.PORT || config.PORT || 8080; // Default Cloud Run port is 8080
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
};

// Start the server
startServer();

module.exports = app; // Export for testing purposes
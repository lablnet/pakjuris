const express = require('express');
const router = express.Router();
const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Store active SSE connections
const clients = new Map();

// Function to send status update to a specific client
const sendStatusUpdate = (clientId, status) => {
    const client = clients.get(clientId);
    if (client) {
        try {
            client.write(`data: ${JSON.stringify(status)}\n\n`);
            // Flush data to ensure it's sent immediately 
            if (typeof client.flush === 'function') {
                client.flush();
            }
        } catch (error) {
            console.error(`Error sending SSE update to client ${clientId}:`, error);
            // Remove client if connection is broken
            clients.delete(clientId);
        }
    } else {
        console.log(`No client found with ID: ${clientId}`);
    }
};

// Extract and verify Firebase token
const verifyFirebaseToken = async(token) => {
    if (!token) return null;

    // If token starts with 'Bearer ', extract the actual token
    if (token.startsWith('Bearer ')) {
        token = token.substring(7);
    }

    try {
        // Verify the Firebase token
        const decodedToken = await admin.auth().verifyIdToken(token);
        return decodedToken;
    } catch (error) {
        console.error('Token verification error:', error);
        return null;
    }
};

// SSE endpoint to establish connection
router.get('/:clientId', async(req, res) => {
    try {
        // Safely extract client ID from params
        const clientId = req.params.clientId || '';
        if (!clientId) {
            return res.status(400).json({ error: 'Missing client ID' });
        }

        // Get token from query params if present and verify it
        const token = req.query.token || '';
        let user = null;

        if (token) {
            user = await verifyFirebaseToken(token);
            if (user) {
                console.log(`Client ${clientId} authenticated as ${user.email || user.uid}`);
            } else {
                console.log(`Client ${clientId} provided invalid token`);
                // Optional: you can return 401 here if you want to require auth
                // return res.status(401).json({ error: 'Authentication required' });
            }
        }

        // Set headers for SSE - use writeHead for atomic header setting
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*'
        });

        // Increase the timeout for Firebase Functions
        if (req.socket) {
            req.socket.setTimeout(2 * 60 * 1000); // 2 minutes timeout
        }

        // Send initial connection message
        res.write(`data: ${JSON.stringify({ type: 'connected', message: 'SSE connection established' })}\n\n`);

        // Force an immediate flush to make sure event is sent
        if (typeof res.flush === 'function') {
            res.flush();
        }

        // Store client connection
        clients.set(clientId, res);
        console.log(`SSE client connected: ${clientId}, Total clients: ${clients.size}`);

        // Handle client disconnect
        req.on('close', () => {
            clients.delete(clientId);
            console.log(`SSE client disconnected: ${clientId}, Remaining clients: ${clients.size}`);
        });

        // Keep connection alive with pings
        const pingInterval = setInterval(() => {
            try {
                if (clients.has(clientId)) {
                    res.write(`:ping\n\n`);
                    // Force flush after ping
                    if (typeof res.flush === 'function') {
                        res.flush();
                    }
                } else {
                    clearInterval(pingInterval);
                }
            } catch (error) {
                console.error(`Error sending ping to client ${clientId}:`, error);
                clients.delete(clientId);
                clearInterval(pingInterval);
            }
        }, 15000); // Reduced from 30 seconds to 15 seconds for more frequent pings
    } catch (error) {
        console.error('SSE connection error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Export both the router and the sendStatusUpdate function
module.exports = { router, sendStatusUpdate };
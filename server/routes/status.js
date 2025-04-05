const express = require('express');
const router = express.Router();
const functions = require('firebase-functions');

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
    }
};

// SSE endpoint to establish connection
router.get('/:clientId', (req, res) => {
    const clientId = req.params.clientId;

    // Set headers for SSE
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
    });

    // Increase the timeout for Firebase Functions
    // The default timeout is 60 seconds, but SSE connections might need to stay open longer
    if (req.socket) {
        req.socket.setTimeout(2 * 60 * 1000); // 2 minutes timeout
    }

    // Send initial connection message
    res.write(`data: ${JSON.stringify({ type: 'connected', message: 'SSE connection established' })}\n\n`);

    // Store client connection
    clients.set(clientId, res);
    console.log(`SSE client connected: ${clientId}, Total clients: ${clients.size}`);

    // Handle client disconnect
    req.on('close', () => {
        clients.delete(clientId);
        console.log(`SSE client disconnected: ${clientId}, Remaining clients: ${clients.size}`);
    });

    // Keep the connection alive by sending ping every 30 seconds
    // This helps with Firebase Functions timeout
    const pingInterval = setInterval(() => {
        try {
            if (clients.has(clientId)) {
                res.write(`:ping\n\n`);
            } else {
                clearInterval(pingInterval);
            }
        } catch (error) {
            console.error(`Error sending ping to client ${clientId}:`, error);
            clients.delete(clientId);
            clearInterval(pingInterval);
        }
    }, 30000);
});

// Export both the router and the sendStatusUpdate function
module.exports = { router, sendStatusUpdate };
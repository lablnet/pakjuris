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

// SSE endpoint to establish connection - use parameter matching to fix path-to-regexp issues
router.get('/:clientId', (req, res) => {
    // Extract client ID from params - ensure it's a valid format
    const clientId = req.params.clientId || '';

    // Get token from query params if present
    const token = req.query.token || '';

    // Basic log without token contents
    if (token) {
        console.log(`Client ${clientId} connecting with auth token`);
    }

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Send 200 status
    res.status(200);

    // Increase the timeout for Firebase Functions
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

    // Keep connection alive with pings
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
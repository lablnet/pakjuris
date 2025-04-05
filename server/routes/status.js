const express = require('express');
const router = express.Router();

// Store active SSE connections
const clients = new Map();

// Function to send status update to a specific client
const sendStatusUpdate = (clientId, status) => {
    const client = clients.get(clientId);
    if (client) {
        client.write(`data: ${JSON.stringify(status)}\n\n`);
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

    // Send initial connection message
    res.write(`data: ${JSON.stringify({ type: 'connected', message: 'SSE connection established' })}\n\n`);

    // Store client connection
    clients.set(clientId, res);

    // Handle client disconnect
    req.on('close', () => {
        clients.delete(clientId);
    });
});

// Export both the router and the sendStatusUpdate function
module.exports = { router, sendStatusUpdate };
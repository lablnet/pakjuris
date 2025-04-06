import { Request, Response, NextFunction } from 'express';

// Store active SSE connections
const clients = new Map<string, Response>();

/**
 * Send status update to a specific client
 * @param clientId - The ID of the client to send the update to
 * @param status - The status object to send
 */
export const sendStatusUpdate = (clientId: string, status: any): void => {
  const client = clients.get(clientId);
  if (client) {
    try {
      client.write(`data: ${JSON.stringify(status)}\n\n`);
      // Flush data to ensure it's sent immediately
      if (typeof (client as any).flush === 'function') {
        (client as any).flush();
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

/**
 * SSE endpoint to establish connection
 */
export const establishConnection = async(req: Request, res: Response): Promise<void> => {
    try {
        const user = req.user;
        // Safely extract client ID from params
        const clientId = req.params.clientId || '';
        if (!clientId) {
            res.status(400).json({ error: 'Missing client ID' });
            return;
        }

        // Set headers for SSE - use writeHead for atomic header setting
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
        console.log(`SSE client connected: ${clientId}, Total clients: ${clients.size}`);

        // Handle client disconnect
        req.on('close', () => {
            clients.delete(clientId);
            console.log(`SSE client disconnected: ${clientId}, Remaining clients: ${clients.size}`);
        });
    } catch (error) {
        console.error('SSE connection error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

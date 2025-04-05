// middleware/auth.js
const admin = require('firebase-admin');

/**
 * Authentication middleware that verifies Firebase ID tokens
 * Sets req.user if authentication is successful
 */
async function authMiddleware(req, res, next) {
    // Get the Authorization header
    const authHeader = req.headers.authorization;

    // Skip auth check if no token provided (we'll handle authorization in routes)
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('No auth token provided, continuing without authentication');
        return next();
    }

    // Extract the token
    const idToken = authHeader.split('Bearer ')[1];

    try {
        // Verify the token
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        req.user = decodedToken;
        console.log(`Authenticated user: ${decodedToken.email || decodedToken.uid}`);
        next();
    } catch (error) {
        console.error('Error verifying auth token:', error);
        // Don't return 401 immediately, let route handlers decide
        // whether authentication is required for specific routes
        req.user = null;
        next();
    }
}

module.exports = authMiddleware;
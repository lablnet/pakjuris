// middleware/auth.js
const admin = require('../$node_modules/.pnpm/firebase-admin@11.11.1/$node_modules/firebase-admin/lib/index.js');

/**
 * Authentication middleware that verifies Firebase ID tokens
 * Sets req.user if authentication is successful, otherwise req.user is null
 */
async function authMiddleware(req, res, next) {
    let token = null;

    // Check for token in Authorization header (preferred method)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
    }
    // Allow fallback to token in query parameter (for SSE or similar cases)
    else if (req.query && req.query.token && req.query.token.startsWith('Bearer ')) {
        token = req.query.token.substring(7);
    }

    if (!token) {
        // Continue without authentication
        req.user = null;
        return next();
    }

    try {
        // Verify the Firebase token
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;
        console.log(`Authenticated user: ${decodedToken.email || decodedToken.uid}`);
        next();
    } catch (error) {
        console.error('Error verifying auth token:', error);
        // Don't return 401, just set req.user to null and continue
        req.user = null;
        next();
    }
}

module.exports = authMiddleware;
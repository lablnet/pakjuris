// middleware/requestLogger.js
function requestLogger(req, res, next) {
    let path;
    try {
        // Only sanitize the path but don't modify it for routing
        path = req.originalUrl || req.url || req.path || '';
        const sanitizedPath = path.replace(/https?:\/\/[^\s]+/g, '[URL]');

        console.log(`${req.method} ${sanitizedPath} - ${new Date().toISOString()}`);
        if (req.body && Object.keys(req.body).length > 0) {
            // Avoid logging sensitive data in production if necessary
            console.log('   Body:', JSON.stringify(req.body));
        }
    } catch (error) {
        console.error('Error in request logger:', error);
        // Don't modify the request if there's an error
    }

    // Always call next() to continue the middleware chain
    next();
}

module.exports = requestLogger;
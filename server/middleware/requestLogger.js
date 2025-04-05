// middleware/requestLogger.js
function requestLogger(req, res, next) {
    // Sanitize URLs in path to avoid path-to-regexp errors during deployment
    const path = req.path.replace(/https?:\/\/[^\s]+/g, '[URL]');

    console.log(`${req.method} ${path} - ${new Date().toISOString()}`);
    if (req.body && Object.keys(req.body).length > 0) {
        // Avoid logging sensitive data in production if necessary
        console.log('   Body:', JSON.stringify(req.body));
    }
    next();
}

module.exports = requestLogger;
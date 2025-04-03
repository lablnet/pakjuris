// middleware/requestLogger.js
function requestLogger(req, res, next) {
    console.log(`➡️ ${new Date().toISOString()} ${req.method} ${req.path}`);
    if (req.body && Object.keys(req.body).length > 0) {
        // Avoid logging sensitive data in production if necessary
        console.log('   Body:', JSON.stringify(req.body));
    }
    next();
}

module.exports = requestLogger;
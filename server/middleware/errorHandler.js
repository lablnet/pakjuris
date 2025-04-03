// middleware/errorHandler.js

function errorHandler(err, req, res, next) {
    console.error("❌ An error occurred processing the request:", err.stack || err);

    let statusCode = 500;
    let message = "Internal Server Error. Please try again later.";
    let details = null;

    // Check for specific API error structures (adjust based on actual errors)
    if (err.response && err.response.data && err.response.data.error) {
        console.error("   API Error Details:", err.response.data.error);
        const apiError = err.response.data.error;
        statusCode = apiError.code || err.response.status || 500; // Prefer specific code if available
        message = `API Error: ${apiError.message || 'An error occurred calling an external service.'}`;
        details = { status: apiError.status }; // e.g., 'PERMISSION_DENIED'
    }
    // Check for Pinecone specific errors (adjust name/property if needed)
    else if (err.name === 'PineconeError' || err.constructor.name === 'PineconeError') {
        statusCode = err.status || 500;
        message = `Vector Database Error: ${err.message}`;
    }
    // Check for standard error properties
    else if (err.status) {
        statusCode = err.status;
        message = err.message || 'An error occurred.';
    } else if (err.statusCode) {
        statusCode = err.statusCode;
        message = err.message || 'An error occurred.';
    } else if (err.message.includes('safety settings')) {
        statusCode = 400; // Bad request (due to safety trigger)
        message = "Your request could not be processed due to safety filters.";
    }


    res.status(statusCode).json({
        message: message,
        ...(details && { details: details }) // Only include details if present
    });
}

module.exports = errorHandler;
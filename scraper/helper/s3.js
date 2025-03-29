const AWS = require('aws-sdk');
require('dotenv').config();

// Configure AWS SDK
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1'
});

const bucketName = process.env.AWS_BUCKET_NAME;

// Initialize S3 client
const s3 = new AWS.S3();

/**
 * Check if a file exists in S3 bucket
 * @param {string} bucketName - S3 bucket name
 * @param {string} key - S3 object key (file path)
 * @returns {Promise<boolean>} - Returns true if file exists, false otherwise
 */
async function fileExists(key) {
    try {
        await s3.headObject({
            Bucket: bucketName,
            Key: key
        }).promise();
        return true;
    } catch (error) {
        if (error.code === 'NotFound') {
            return false;
        }
        throw error;
    }
}

/**
 * Upload a file to S3 if it doesn't already exist
 * @param {string} bucketName - S3 bucket name
 * @param {string} key - S3 object key (file path)
 * @param {Buffer|Uint8Array|Blob|string|ReadableStream} fileContent - File content to upload
 * @param {string} contentType - Content type of the file (e.g., 'image/jpeg', 'application/pdf')
 * @param {Object} additionalParams - Additional parameters for S3 upload
 * @returns {Promise<Object>} - Upload result or null if file already exists
 */
async function uploadIfNotExists(key, fileContent, contentType = 'application/octet-stream', additionalParams = {}) {
    try {
        // Check if file already exists
        const exists = await fileExists(bucketName, key);

        if (exists) {
            console.log(`File ${key} already exists in bucket ${bucketName}`);
            return null;
        }

        // Upload file if it doesn't exist
        const params = {
            Bucket: bucketName,
            Key: key,
            Body: fileContent,
            ContentType: contentType,
            ...additionalParams
        };

        const result = await s3.upload(params).promise();
        console.log(`File ${key} uploaded successfully to ${bucketName}`);
        return result;
    } catch (error) {
        console.error('Error in uploadIfNotExists:', error);
        throw error;
    }
}

/**
 * Get a signed URL for an S3 object
 * @param {string} bucketName - S3 bucket name
 * @param {string} key - S3 object key (file path)
 * @param {number} expirySeconds - URL expiry time in seconds
 * @returns {Promise<string>} - Signed URL
 */
async function getSignedUrl(bucketName, key, expirySeconds = 3600) {
    try {
        const params = {
            Bucket: bucketName,
            Key: key,
            Expires: expirySeconds
        };

        return s3.getSignedUrlPromise('getObject', params);
    } catch (error) {
        console.error('Error generating signed URL:', error);
        throw error;
    }
}

module.exports = {
    fileExists,
    uploadIfNotExists,
    getSignedUrl,
    s3 // Export the S3 instance for direct access if needed
};
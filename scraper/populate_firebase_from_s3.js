require('dotenv').config();
const AWS = require('aws-sdk');
const admin = require('firebase-admin');
const path = require('path');
const { MongoClient } = require('mongodb');

// Initialize AWS S3
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});

const client = new MongoClient(process.env.MONGODB_URI);

// Function to extract useful information from filename
function extractInfo(filename) {
    const baseName = path.basename(filename, '.pdf');
    const matchYear = baseName.match(/^(\d{4})/);
    const year = matchYear ? matchYear[1] : 'Unknown';

    const title = baseName
        .replace(/^\d{4}_?/, '')
        .replace(/_/g, ' ')
        .trim();

    return { year, title };
}

// Function to list all files from S3 and populate Firebase
async function populateFirebaseFromS3() {
    try {
        await client.connect();
        const collection = client
            .db(process.env.MONGODB_DB)
            .collection(process.env.MONGODB_COLLECTION);

        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
        };

        const files = await s3.listObjectsV2(params).promise();

        const promises = files.Contents.filter(file => file.Key.endsWith('.pdf')).map(async file => {
            const { year, title } = extractInfo(file.Key);

            let url = "https://d2n6e94p3v1d3j.cloudfront.net/" + file.Key;
            const docData = {
                fileName: file.Key,
                title,
                year,
                url,
                country: "Pakistan",
                type: "bill",
                countryCode: "PK",
                createdBy: "lablnet",
                createdAt: new Date(),
            };

            await collection.updateOne({ fileName: file.Key }, { $set: docData }, { upsert: true });

            console.log(`✅ Saved: ${file.Key}`);
        });

        await Promise.all(promises);
        console.log('🎉 All documents have been saved to Firebase!');
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
    }
}

populateFirebaseFromS3();
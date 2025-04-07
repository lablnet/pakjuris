# PakJuris Scraper

This directory contains scrapers and data processing tools for the PakJuris legal information system.

## Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Copy `.env.example` to `.env` and configure the required environment variables:
   ```bash
   cp .env.example .env
   ```

3. Ensure the following environment variables are set:
   - **MongoDB Configuration:**
     - `MONGODB_URI` - MongoDB connection URI
     - `MONGODB_DB` - Database name
     - `MONGODB_COLLECTION` - Collection for storing document metadata

   - **AWS S3 Configuration:**
     - `AWS_ACCESS_KEY_ID` - S3 access key
     - `AWS_SECRET_ACCESS_KEY` - S3 secret key
     - `AWS_REGION` - AWS region (default: us-east-1)
     - `AWS_BUCKET_NAME` - S3 bucket name
     - `S3_ENDPOINT` - S3-compatible endpoint URL
     - `S3_BUCKET` - S3 bucket name (used for URL construction)

   - **Vectorization Configuration (for processing):**
     - `PINECONE_API_KEY` - Pinecone API key
     - `PINECONE_INDEX_NAME` - Pinecone index name
     - `AZURE_OPENAI_ENDPOINT` - Azure OpenAI endpoint
     - `AZURE_OPENAI_API_KEY` - Azure OpenAI API key
     - `AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME` - Azure embedding model name
     - `AZURE_API_VERSION` - Azure API version

## Bill Scraper

The bill scraper downloads legal bills from pakistancode.gov.pk and stores them in both S3 and MongoDB.

### Features

- **Resume capability**: The scraper tracks progress and can resume from where it left off
- **Deduplication**: Checks if bills already exist in MongoDB and S3 before downloading
- **Metadata storage**: Saves bill metadata to MongoDB for easier retrieval
- **Organized storage**: PDFs are stored in S3 with a structured hierarchy

### Running the Bill Scraper

```bash
# Using npm script
pnpm run scrape:bills

# Or directly
node scrapers/bills.js
```

### Process Flow

1. The scraper connects to MongoDB and retrieves the last saved state (year and bill index)
2. It navigates to the Pakistan Code website and extracts available years
3. For each year (starting from the resume point), it:
   - Extracts bill information (titles and URLs)
   - For each bill, it:
     - Checks if the bill already exists in MongoDB
     - Checks if the file already exists in S3
     - If not found, downloads the PDF and uploads to S3
     - Saves bill metadata to MongoDB
     - Updates the scraper state for resume capability

4. After processing, it closes connections and exits

## Document Vectorization

After bills are downloaded, they can be processed for semantic search:

```bash
# Using npm script
pnpm run vectorize

# Or directly
node vectorize_folder.js
```

This processes PDFs by:
1. Extracting text from the documents
2. Splitting text into manageable chunks
3. Creating vector embeddings using Azure OpenAI or OpenAI
4. Storing vectors in Pinecone for semantic search

## Troubleshooting

- **MongoDB Connection Issues**: Verify your MongoDB URI and credentials
- **S3 Upload Failures**: Check AWS credentials and bucket permissions
- **Website Structure Changes**: If the pakistancode.gov.pk website changes structure, the scraper selectors may need to be updated

# Firebase Functions API

This project has been migrated from a standalone Express server to Firebase Functions while maintaining the Express.js framework.

## Setup

1. Install dependencies:
```
npm install
```

2. Update Firebase project configuration:
   - Edit `.firebaserc` to set your Firebase project ID
   - Configure environment variables (see below)

3. Test locally:
```
npm run dev
```

## Environment Configuration

### Setting Environment Variables

Use this single command to set all your environment variables at once:

```bash
firebase functions:config:set mongodb.uri="your-mongodb-connection-string" \
mongodb.db="your-db-name" \
mongodb.collection="your-collection-name" \
gemini.api_key="your-gemini-api-key" \
pinecone.api_key="your-pinecone-api-key" \
pinecone.index_name="your-pinecone-index" \
pinecone.score_threshold="0.55"
```

### Viewing Current Configuration

To view all current environment variables:

```bash
firebase functions:config:get
```

### Using Environment Variables Locally

To use Firebase environment variables during local development, run:

```bash
firebase functions:config:get > .runtimeconfig.json
```

This will create a local file that the Firebase emulator will use.

## CORS Configuration

The API is configured to handle CORS requests. The current configuration allows requests from:
- http://localhost:3000
- http://localhost:5173
- http://127.0.0.1:5173
- Any origin (*) - for development purposes

If you need to allow additional origins, edit the `corsOptions` object in `index.js`:

```javascript
const corsOptions = {
    origin: ['http://localhost:3000', 'http://localhost:5173', 'your-new-origin.com'],
    // ...other options
};
```

For production, you should restrict the `origin` array to only the specific domains that need access to your API.

### Testing CORS with curl

You can test if CORS is working properly with curl:

```bash
# Test preflight OPTIONS request
curl -X OPTIONS -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v https://us-central1-your-project-id.cloudfunctions.net/api

# Test actual request
curl -X GET -H "Origin: http://localhost:3000" \
  -v https://us-central1-your-project-id.cloudfunctions.net/api
```

## Deployment

To deploy to Firebase:
```
npm run deploy
```

## Troubleshooting Deployment Issues

If you encounter errors during deployment, try these steps in order:

1. **Clean Install Dependencies**:
   ```bash
   rm -rf node_modules package-lock.json pnpm-lock.yaml
   npm install
   ```

2. **Check Firebase CLI Version**:
   ```bash
   firebase --version
   ```
   Make sure you're using a recent version (11.0.0+). If not, update:
   ```bash
   npm install -g firebase-tools
   ```

3. **Login to Firebase**:
   ```bash
   firebase logout
   firebase login
   ```

4. **Check Firebase Project**:
   ```bash
   firebase projects:list
   ```
   Verify your project ID matches the one in `.firebaserc`

5. **Deploy with Verbose Logging**:
   ```bash
   firebase deploy --only functions --debug
   ```

6. **Common Issues**:
   - **Memory Limits**: If your function exceeds memory limits, increase it in `index.js`:
     ```javascript
     exports.api = functions.runWith({memory: '1GB'}).https.onRequest(...)
     ```
   - **Timeout Issues**: For long-running functions, increase timeout:
     ```javascript
     exports.api = functions.runWith({timeoutSeconds: 540}).https.onRequest(...)
     ```
   - **Firebase Region**: If you need to deploy to a specific region:
     ```javascript
     exports.api = functions.region('us-central1').https.onRequest(...)
     ```

## Structure

- `index.js` - Main Firebase Functions entry point
- `routes/` - Express routes
- `services/` - Backend services
- `middleware/` - Express middleware
- `config/` - Configuration files
- `utils/` - Utility functions

## API Endpoints

The API is accessible at:
- Local: `http://localhost:5001/your-project-id/us-central1/api`
- Production: `https://us-central1-your-project-id.cloudfunctions.net/api`

### Available endpoints:

- `GET /` - Health check
- `POST /query` - Process a query through the RAG pipeline
- `GET /status/:clientId` - Server-Sent Events endpoint for status updates

## Notes

- The API is implemented using Express.js running within Firebase Functions
- Services are initialized on first request to the function
- SSE connections are maintained for real-time status updates with timeout handling
- Environment variables are read from Firebase Functions config with fallback to .env 
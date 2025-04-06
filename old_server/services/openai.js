const { OpenAI } = require("openai");

const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY;
const AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME = process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME;
const AZURE_API_VERSION = process.env.AZURE_API_VERSION;

const azureClient = new OpenAI({
    apiKey: AZURE_OPENAI_API_KEY,
    baseURL: `${AZURE_OPENAI_ENDPOINT}openai/deployments/${AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME}`,
    defaultQuery: { "api-version": AZURE_API_VERSION },
    defaultHeaders: { "api-key": AZURE_OPENAI_API_KEY },
});

const getEmbedding = async(text) => {
    const embeddingResult = await azureClient.embeddings.create({
        input: text,
    });
    if (!embeddingResult || !embeddingResult.data || embeddingResult.data.length === 0 || !embeddingResult.data[0].embedding) {
        throw new Error('Invalid embedding response received from Azure OpenAI.');
    }

    return embeddingResult.data[0].embedding;
};

module.exports = {
    getEmbedding,
};
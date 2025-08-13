import { Pinecone, ServerlessSpecCloudEnum } from "@pinecone-database/pinecone";
import { logger } from "./logger.js";

export function pineconeClient() {
    const apiKey = process.env.PINECONE_API_KEY!;
    if (!apiKey) throw new Error("PINECONE_API_KEY missing");
    return new Pinecone({ apiKey });
}

export async function ensurePineconeIndex(dimension: number) {
    const client = pineconeClient();
    const indexName = process.env.PINECONE_INDEX || "documents";
    const cloud = process.env.PINECONE_CLOUD || "aws";
    const region = process.env.PINECONE_REGION || "us-east-1";
    const metric = (process.env.PINECONE_METRIC as "cosine" | "dotproduct" | "euclidean") || "cosine";

    const existing = await client.listIndexes();
    const found = existing.indexes?.find((idx) => idx.name === indexName);

    if (found) {
        logger.info({ indexName }, "Using existing Pinecone index");
        return client.Index(indexName);
    }

    logger.info({ indexName, region, cloud, dimension, metric }, "Creating Pinecone index...");
    await client.createIndex({
        name: indexName,
        dimension,
        metric,
        spec: {
            serverless: { cloud: cloud as ServerlessSpecCloudEnum, region },
        },
    });

    // Pinecone needs a small wait after create
    let ready = false;
    for (let i = 0; i < 30; i++) {
        const idx = await client.describeIndex(indexName);
        if (idx.status?.ready) {
            ready = true;
            break;
        }
        await new Promise((r) => setTimeout(r, 2000));
    }
    if (!ready) logger.warn("Index not reported ready yet, continuing anyway…");
    return client.Index(indexName);
}

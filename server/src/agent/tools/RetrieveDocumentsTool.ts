import { z } from "zod";
import { BaseTool } from "./BaseTool.js";
import { createGeminiEmbeddings } from "../embeddings/geminiEmbeddings.js";
import { ensurePineconeIndex } from "../utils/pinecone.js";
import { PineconeStore } from "@langchain/pinecone";
import { logger } from "../utils/logger.js";
import type { RunnableConfig } from "@langchain/core/runnables";


const retrieveSchema = z.object({
    query: z.string().describe("Natural language search query"),
    k: z.number().int().min(1).max(20).default(5).describe("How many results to return"),
});

export class RetrieveDocumentsTool extends BaseTool<typeof retrieveSchema> {

    constructor(private namespace: string) { super(); }

    name = "retrieve_documents";
    description = "Retrieve relevant documents from the Pinecone vector database (RAG).";
    schema = retrieveSchema

    async run(args: z.infer<typeof this.schema>, config?: RunnableConfig): Promise<any> {
        logger.info(`🛠️ TOOL INVOKE retrieve_documents → query="${args.query}", k=${args.k}`);
        const { embeddings } = createGeminiEmbeddings();
        const dims = Number(process.env.EMBED_DIMENSIONS ?? 768);
        logger.info(`📐 Embedding dims: ${dims}`);
  
        const index = await ensurePineconeIndex(dims);
  
        const store = await PineconeStore.fromExistingIndex(embeddings, {
          pineconeIndex: index,
          namespace: this.namespace,
        });
  
        const docs = await store.similaritySearch(args.query, args.k);
  
        const results = docs.map((doc, i) => ({
          content: doc.pageContent,
          metadata: doc.metadata,
          rank: i + 1,
        }));
  
        logger.info(`🛠️ TOOL RESULT retrieve_documents → ${results.length} hits`);
        return { results };
      }
}

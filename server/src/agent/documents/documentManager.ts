import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { PineconeStore } from "@langchain/pinecone";
import { ensurePineconeIndex } from "../../utils/pinecone.js";
import { createGeminiEmbeddings } from "../embeddings/geminiEmbeddings.js";
import { getCollection } from "../../utils/mango.js";
import { logger } from "../utils/logger.js";
import type { Document } from "@langchain/core/documents";

type DocMeta = {
  document_name: string;
  chunk_index: number;
  total_chunks: number;
  character_count: number;
  source: string;
};

type DocMetaRecord = {
  document_name: string;
  total_chunks: number;
  last_updated: Date;
  hash?: string;
};

function simpleHash(s: string) {
  // quick, non-cryptographic hash just to detect exact duplicates
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return String(h);
}

export class DocumentManager {
  private splitter: RecursiveCharacterTextSplitter;

  constructor(
    private collectionName: string = "documents",
    private chunkSize = 1000,
    private chunkOverlap = 200
  ) {
    this.splitter = new RecursiveCharacterTextSplitter({
      chunkSize: this.chunkSize,
      chunkOverlap: this.chunkOverlap,
    });
  }

  async addOrUpdateDocument(text: string, documentName: string) {
    const { embeddings, dimensions } = createGeminiEmbeddings();
    const index = await ensurePineconeIndex(dimensions);
    const pineconeIndexName = process.env.PINECONE_INDEX || "documents";
    const docsMetaCol = await getCollection<DocMetaRecord>(
      process.env.MONGODB_COLLECTION_DOCS || "doc_metadata"
    );

    const chunks = await this.splitter.splitText(text);
    const hash = simpleHash(text);

    const existing = await docsMetaCol.findOne({ document_name: documentName });
    if (existing && existing.hash === hash) {
      return {
        action: "unchanged" as const,
        message: `Document '${documentName}' already exists with identical content`,
        document_id: existing.document_name,
      };
    }

    // If exists but different content, we “reindex”: simplest is to delete by filter metadata then re-add.
    // PineconeStore doesn’t natively delete-by-metadata, so we just add new vectors; optionally you can keep a custom id-prefix per doc and delete by ids you track in Mongo.
    const metadatas: DocMeta[] = [];
    const lcDocs: Document<DocMeta>[] = chunks.map((chunk: string, i: number) => {
      const md: DocMeta = {
        document_name: documentName,
        chunk_index: i,
        total_chunks: chunks.length,
        character_count: chunk.length,
        source: `api_document_${documentName}`,
      };
      metadatas.push(md);
      return {
        pageContent: chunk,
        metadata: md,
      };
    });

    // Upsert into Pinecone
    const store = await PineconeStore.fromDocuments(lcDocs, embeddings, {
      pineconeIndex: index,
      namespace: this.collectionName,
    });

    // Track metadata in Mongo
    await docsMetaCol.updateOne(
      { document_name: documentName },
      {
        $set: {
          document_name: documentName,
          total_chunks: chunks.length,
          last_updated: new Date(),
          hash,
        },
      },
      { upsert: true }
    );

    logger.info(
      { documentName, pineconeIndexName, chunks: chunks.length },
      "Document indexed into Pinecone"
    );

    return {
      action: existing ? ("updated" as const) : ("created" as const),
      message: `Document '${documentName}' ${existing ? "updated" : "created"} successfully`,
      document_id: documentName,
    };
  }
}

import type { BaseCheckpointSaver } from "@langchain/langgraph";
import { MongoCheckpointSaver } from 'langgraph-checkpoint-mongodb'
import { getMongoClient, closeMongo } from "../../utils/mongo";

let saver: BaseCheckpointSaver | null = null;

export async function getCheckpointer(): Promise<BaseCheckpointSaver> {
  if (saver) return saver;
  const dbName = process.env.MONGODB_DB!;
  const client = await getMongoClient();
  saver = new MongoCheckpointSaver(client, dbName);
  return saver;
}

export async function closeCheckpointer() {
  try {
    await closeMongo();
  } finally {
    saver = null;
  }
}

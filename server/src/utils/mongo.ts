import { MongoClient, Db, Collection } from "mongodb";
import { logger } from "../agent/utils/logger.js";

let client: MongoClient | null = null;
let db: Db | null = null;

export async function getMongoClient(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI!;
  if (!uri) throw new Error("MongoDB URI missing");
  client = new MongoClient(uri);
  await client.connect();
  return client;
}

export async function connectMongo(): Promise<Db> {
  if (db) return db;

  const dbName = process.env.MONGODB_DB!;
  const client = await getMongoClient();
  db = client.db(dbName);
  logger.info({ dbName }, "Connected to MongoDB");
  return db;
}

export async function getCollection<T = any>(name: string): Promise<Collection<T & Document>> {
  const database = await connectMongo();
  return database.collection<T & Document>(name);
}

export async function closeMongo() {
  if (client) {
    await client.close();
    client = null;
    db = null;
    logger.info("MongoDB connection closed");
  }
}

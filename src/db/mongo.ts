import { MongoClient, Collection } from "mongodb";
import dotenv from "dotenv";
import { webcrypto } from "node:crypto";
import { EmailRecord } from "../types.js";

dotenv.config();

// The mongodb driver's SCRAM-SHA-256 auth path calls the global Web Crypto
// API (crypto.getRandomValues). Under some ts-node/ESM loader setups that
// global isn't reliably present, causing "crypto is not defined" mid-auth.
// Polyfill it defensively before any connection is made.
if (typeof (globalThis as { crypto?: unknown }).crypto === "undefined") {
  (globalThis as { crypto?: typeof webcrypto }).crypto = webcrypto;
}

let client: MongoClient | undefined;
let collection: Collection<EmailRecord> | undefined;

async function getCollection(): Promise<Collection<EmailRecord>> {
  if (collection) return collection;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI must be set in .env file");
  }

  console.log('🍃 Connecting to MongoDB...');
  client = new MongoClient(uri);
  await client.connect();

  const dbName = process.env.MONGODB_DB || "auto_mail";
  const collectionName = process.env.MONGODB_COLLECTION || "sent_emails";
  collection = client.db(dbName).collection<EmailRecord>(collectionName);
  await collection.createIndex({ postLink: 1 });
  console.log(`✅ MongoDB connected → db "${dbName}", collection "${collectionName}"`);

  return collection;
}

// A post is considered already handled if we already sent an email for it
export async function alreadySentForPost(postLink: string): Promise<boolean> {
  const coll = await getCollection();
  const existing = await coll.findOne({ postLink, status: "sent" });
  if (existing) {
    console.log(`🗄️  Found existing "sent" record for ${postLink} → skipping`);
  }
  return existing !== null;
}

export async function saveEmailRecord(
  record: Omit<EmailRecord, "createdAt">,
): Promise<void> {
  const coll = await getCollection();
  await coll.insertOne({ ...record, createdAt: new Date() });
  const statusEmoji = record.status === 'sent' ? '✅' : record.status === 'failed' ? '❌' : '⏭️';
  console.log(`💾 Saved record to MongoDB: ${statusEmoji} ${record.status} → ${record.to} (${record.postLink})`);
}

export async function closeMongo(): Promise<void> {
  if (client) {
    await client.close();
    client = undefined;
    collection = undefined;
    console.log('🔌 MongoDB connection closed.');
  }
}

import { MongoClient } from "mongodb";
import { env } from "../config/env.js";

let client: MongoClient | null = null;

export const getMongoClient = (): MongoClient => {
  if (!client) {
    if (!env.MONGODB_URI) throw new Error("MONGODB_URI is not set");
    client = new MongoClient(env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 30000,
      tls: true,
    });
  }
  return client;
};

export const closeMongoClient = async (): Promise<void> => {
  if (client) {
    await client.close();
    client = null;
  }
};

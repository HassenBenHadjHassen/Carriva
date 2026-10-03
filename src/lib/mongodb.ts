import { MongoClient } from 'mongodb';

if (!process.env.DATABASE_URL && process.env.NODE_ENV !== 'test') {
  console.warn('Missing environment variable: "DATABASE_URL"');
}

const uri = process.env.DATABASE_URL || "mongodb://localhost:27017/test";
const options = {};

let client: MongoClient;
let db: import('mongodb').Db;

if (process.env.NODE_ENV === 'development') {
  const globalWithMongo = global as typeof globalThis & {
    _mongoClient?: MongoClient;
  };

  if (!globalWithMongo._mongoClient) {
    globalWithMongo._mongoClient = new MongoClient(uri, options);
  }
  client = globalWithMongo._mongoClient;
} else {
  client = new MongoClient(uri, options);
}

db = client.db();

export default db;

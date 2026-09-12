/**
 * db.js - Database connection module.
 * Prefers MongoDB if MONGO_URI is set, otherwise starts MongoMemoryServer for zero-config execution.
 */
const mongoose = require('mongoose');

let mongoServer;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return;

  if (process.env.MONGO_URI && process.env.MONGO_URI.trim()) {
    try {
      console.log('[DB] Connecting to MongoDB via MONGO_URI...');
      await mongoose.connect(process.env.MONGO_URI);
      console.log('[DB] Connected to MongoDB');
      return;
    } catch (err) {
      console.warn('[DB] Failed to connect to MONGO_URI, falling back to MongoMemoryServer:', err.message);
    }
  }

  console.log('[DB] Starting MongoMemoryServer (In-Memory Database)...');
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    console.log('[DB] Connected to MongoMemoryServer (In-Memory)');
  } catch (memErr) {
    console.warn('[DB] MongoMemoryServer start error, retrying:', memErr.message);
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoServer = await MongoMemoryServer.create({ instance: { dbName: 'deepresearch' } });
      await mongoose.connect(mongoServer.getUri());
      console.log('[DB] Connected to MongoMemoryServer (Retry Success)');
    } catch (e2) {
      console.warn('[DB] Trying local MongoDB fallback:', e2.message);
      try {
        await mongoose.connect('mongodb://127.0.0.1:27017/deepresearch', {
          serverSelectionTimeoutMS: 3000
        });
        console.log('[DB] Connected to local MongoDB');
      } catch (e3) {
        console.error('[DB] All MongoDB connection attempts failed:', e3.message);
      }
    }
  }
};

module.exports = connectDB;


const mongoose = require('mongoose');
const dns = require('dns');

try {
  if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
  }
} catch (_) {}

let isConnected = false;
let mongoMemoryServer = null;

const connectDB = async () => {
  let connStr = process.env.MONGODB_URI || process.env.MONGO_URI;

  // 1. If explicit Cloud MongoDB URI (e.g. MongoDB Atlas) is provided in .env
  if (connStr && !connStr.includes('127.0.0.1') && !connStr.includes('localhost')) {
    try {
      console.log('[MongoDB] Connecting to Cloud Database (MongoDB Atlas)...');
      const conn = await mongoose.connect(connStr, { serverSelectionTimeoutMS: 5000 });
      isConnected = true;
      console.log(`[MongoDB] Connected to Cloud Database: ${conn.connection.host}`);
      return conn;
    } catch (err) {
      console.warn(`[MongoDB Warning] Could not connect to Cloud URI (${err.message}). Trying local fallback...`);
    }
  }

  // 2. Try connecting to Local MongoDB instance on port 27017
  try {
    const localUri = 'mongodb://127.0.0.1:27017/restaurant-voice-agent';
    const conn = await mongoose.connect(localUri, { serverSelectionTimeoutMS: 2000 });
    isConnected = true;
    console.log(`[MongoDB] Connected to Local Database: ${conn.connection.host}`);
    return conn;
  } catch (localErr) {
    console.log('[MongoDB] Local MongoDB service not active. Starting Embedded In-Memory MongoDB Engine...');
  }

  // 3. Embedded In-Memory MongoDB Server (Zero-setup real MongoDB database engine)
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongoMemoryServer = await MongoMemoryServer.create();
    const memoryUri = mongoMemoryServer.getUri();
    const conn = await mongoose.connect(memoryUri);
    isConnected = true;
    console.log(`[MongoDB] Real Embedded MongoDB Database Engine Active at: ${memoryUri}`);
    return conn;
  } catch (memErr) {
    console.warn(`[MongoDB Warning] Could not spin up MongoMemoryServer (${memErr.message}). Fallback to memory objects.`);
    isConnected = false;
  }
};

const getIsConnected = () => isConnected;

module.exports = { connectDB, getIsConnected };

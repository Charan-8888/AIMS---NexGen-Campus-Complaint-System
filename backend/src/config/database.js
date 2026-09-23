const mongoose = require('mongoose');
const logger = require('../utils/logger');
const env = require('./environment');

const MONGO_OPTIONS = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    logger.info('[DB] Already connected to MongoDB');
    return;
  }

  try {
    const conn = await mongoose.connect(env.MONGODB_URI, MONGO_OPTIONS);
    isConnected = true;

    logger.info(`[DB] MongoDB connected: ${conn.connection.host}`);
    logger.info(`[DB] Database: ${conn.connection.name}`);

    mongoose.connection.on('disconnected', () => {
      logger.warn('[DB] MongoDB disconnected. Attempting reconnect...');
      isConnected = false;
    });

    mongoose.connection.on('error', (err) => {
      logger.error(`[DB] MongoDB error: ${err.message}`);
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('[DB] MongoDB reconnected');
      isConnected = true;
    });
  } catch (error) {
    logger.error(`[DB] MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  logger.info('[DB] MongoDB disconnected gracefully');
};

module.exports = { connectDB, disconnectDB };

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const requiredVars = [
  'MONGODB_URI',
  'JWT_SECRET',
];

const missingVars = requiredVars.filter((v) => !process.env[v]);

if (missingVars.length > 0) {
  console.error(`[ENV] Missing required environment variables: ${missingVars.join(', ')}`);
  console.error('[ENV] Please copy .env.example to .env and fill in values.');
  process.exit(1);
}

module.exports = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',

  MONGODB_URI: process.env.MONGODB_URI,

  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',

  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,

  GROQ_API_KEY: process.env.GROQ_API_KEY,
  AI_PROVIDER: process.env.AI_PROVIDER || 'groq',
  AI_MODEL: process.env.AI_MODEL || 'llama3-8b-8192',

  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',

  SLA_HOURS: {
    LOW: parseInt(process.env.SLA_LOW_HOURS || '48', 10),
    MEDIUM: parseInt(process.env.SLA_MEDIUM_HOURS || '24', 10),
    HIGH: parseInt(process.env.SLA_HIGH_HOURS || '8', 10),
    CRITICAL: parseInt(process.env.SLA_CRITICAL_HOURS || '2', 10),
  },

  MAX_FILE_SIZE_MB: parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10),
};

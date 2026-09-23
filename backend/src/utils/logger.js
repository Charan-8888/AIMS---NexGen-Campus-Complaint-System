const winston = require('winston');
const path = require('path');
const env = require('../config/environment');

const { combine, timestamp, colorize, printf, json, errors } = winston.format;

// Custom console format for development
const devFormat = printf(({ level, message, timestamp: ts, stack }) => {
  return `${ts} [${level}]: ${stack || message}`;
});

const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  defaultMeta: { service: 'aims-campus-backend' },

  transports: [
    // Console — always on
    new winston.transports.Console({
      format: combine(
        colorize({ all: true }),
        timestamp({ format: 'HH:mm:ss' }),
        errors({ stack: true }),
        devFormat
      ),
    }),

    // File — error log
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
      format: combine(timestamp(), errors({ stack: true }), json()),
    }),

    // File — combined log
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/combined.log'),
      format: combine(timestamp(), json()),
    }),
  ],
});

// Stream for morgan HTTP logger
logger.stream = {
  write: (message) => logger.http(message.trim()),
};

module.exports = logger;

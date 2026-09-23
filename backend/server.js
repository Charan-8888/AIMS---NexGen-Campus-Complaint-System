const http = require('http');
const app = require('./app');
const { connectDB } = require('./src/config/database');
const env = require('./src/config/environment');
const logger = require('./src/utils/logger');

const PORT = env.PORT;

const startServer = async () => {
  try {
    // Connect to MongoDB first
    await connectDB();

    const server = http.createServer(app);

    server.listen(PORT, () => {
      logger.info(`\n`);
      logger.info(`  ╔══════════════════════════════════════════╗`);
      logger.info(`  ║       AIMS-Campus API Server             ║`);
      logger.info(`  ║   NexGen University — Smart Campus       ║`);
      logger.info(`  ╠══════════════════════════════════════════╣`);
      logger.info(`  ║  Status  : ✅ Running                    ║`);
      logger.info(`  ║  Port    : ${PORT}                          ║`);
      logger.info(`  ║  Env     : ${env.NODE_ENV.padEnd(12)} ║`);
      logger.info(`  ║  Health  : http://localhost:${PORT}/health  ║`);
      logger.info(`  ╚══════════════════════════════════════════╝\n`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      logger.info(`\n[Server] ${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        const { disconnectDB } = require('./src/config/database');
        await disconnectDB();
        logger.info('[Server] Server and database connection closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('[Server] Unhandled Promise Rejection:', { reason, promise });
    });

    process.on('uncaughtException', (err) => {
      logger.error('[Server] Uncaught Exception:', err);
      process.exit(1);
    });

    return server;
  } catch (error) {
    logger.error('[Server] Failed to start:', error);
    process.exit(1);
  }
};

startServer();

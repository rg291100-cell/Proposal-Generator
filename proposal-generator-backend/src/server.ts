import app from './app';
import { env } from './config/env';
import logger from './utils/logger';
import prisma from './config/db';

const startServer = async () => {
    try {
        // Database connection test via Prisma
        await prisma.$connect();
        logger.info('Connected to PostgreSQL successfully.');

        // Start Express server
        const server = app.listen(env.port, () => {
            logger.info(`Server is running on http://localhost:${env.port}`);
            logger.info(`Environment: ${env.nodeEnv}`);
        });

        // Graceful shutdown handling
        const shutdown = async () => {
            logger.info('Shutting down server...');
            server.close();
            await prisma.$disconnect();
            logger.info('Database disconnected.');
            process.exit(0);
        };

        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);

    } catch (error) {
        logger.error('Failed to start the server:', error);
        process.exit(1);
    }
};

startServer();

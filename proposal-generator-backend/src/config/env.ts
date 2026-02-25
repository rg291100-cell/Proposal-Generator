import dotenv from 'dotenv';

// Load .env for local development. On Vercel, env vars are injected by the platform.
dotenv.config();

export const env = {
    port: parseInt(process.env.PORT || '5000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    databaseUrl: process.env.DATABASE_URL || '',
};

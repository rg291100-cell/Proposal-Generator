import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Prisma v7 requires the database adapter to be passed explicitly.
// DATABASE_URL is injected by Vercel in prod, or loaded from .env locally.
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
    console.error('WARNING: DATABASE_URL is not set. Database calls will fail.');
}

const pool = new Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export default prisma;

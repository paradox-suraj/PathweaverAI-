// Cache buster for Turbopack: 5
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma';

const connectionString = `${process.env.DATABASE_URL}`.replace('sslmode=require', 'sslmode=verify-full');

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

// Force a reload by wiping the global cache if the schema changed
if (globalForPrisma.prisma && !('codeResource' in globalForPrisma.prisma)) {
  console.log("Wiping cached Prisma client to load new schema...");
  globalForPrisma.prisma = undefined;
}

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

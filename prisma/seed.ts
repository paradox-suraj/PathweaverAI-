/**
 * Seed script for development environments only.
 * Creates test data to facilitate local development.
 * 
 * WARNING: Do NOT run this in production.
 */
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding development database...');

  // Verify connection
  const userCount = await prisma.user.count();
  console.log(`Current user count: ${userCount}`);

  // No demo data is inserted — users are created via OAuth sign-in.
  // This seed script exists as a placeholder for future development fixtures.

  console.log('✅ Seed complete.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

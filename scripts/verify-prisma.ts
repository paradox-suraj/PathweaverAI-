import { prisma } from '../src/lib/prisma';

async function verify() {
  try {
    const count = await prisma.user.count();
    console.log('✅ Connected');
    console.log('User count:', count);
  } catch (error) {
    console.error('Failed to connect:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verify();

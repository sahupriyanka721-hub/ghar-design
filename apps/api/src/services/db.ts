import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

let prismaInstance: PrismaClient | null = null;
let isConnected = false;

export function getPrisma(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
  }
  return prismaInstance;
}

export async function testDbConnection(): Promise<boolean> {
  try {
    const prisma = getPrisma();
    await prisma.$queryRaw`SELECT 1`;
    isConnected = true;
    logger.info('✅ Successfully connected to PostgreSQL database via Prisma');
    return true;
  } catch (err: any) {
    isConnected = false;
    logger.warn('⚠️ PostgreSQL database not reachable yet. Using fallback mock store for seamless local demo.');
    return false;
  }
}

export const isDbConnected = () => isConnected;

/**
 * Executes a live Prisma database action when PostgreSQL is connected.
 * Seamlessly falls back to in-memory store if DB is offline.
 */
export async function executeDb<T>(
  dbAction: (prisma: PrismaClient) => Promise<T>,
  fallbackAction: () => T | Promise<T>
): Promise<T> {
  if (isConnected) {
    try {
      const prisma = getPrisma();
      return await dbAction(prisma);
    } catch (err: any) {
      logger.warn(`Database query failed, falling back: ${err.message || err}`);
      return await fallbackAction();
    }
  }
  return await fallbackAction();
}

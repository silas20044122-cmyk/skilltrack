import { Prisma, PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

const RETRYABLE_CODES = new Set([
  'P1000',
  'P1001',
  'P1002',
  'P1008',
  'P1010',
  'P1011',
  'P1017',
  'P2024',
]);

function isRetryableConnectionError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return RETRYABLE_CODES.has(error.code);
  }
  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    return /can't reach database server|connection|ECONNREFUSED|ECONNRESET|ETIMEDOUT|timed out/i.test(
      error.message,
    );
  }
  return false;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function createPrismaClient() {
  const base = new PrismaClient({
    log:
      process.env.NODE_ENV === 'test'
        ? []
        : process.env.NODE_ENV === 'development'
          ? ['warn']
          : ['error'],
  });

  const maxAttempts = 4;

  return base.$extends({
    name: 'connection-retry',
    query: {
      async $allOperations({ query, args }) {
        let lastError: unknown;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          try {
            return await query(args);
          } catch (error) {
            lastError = error;
            if (attempt === maxAttempts || !isRetryableConnectionError(error)) {
              throw error;
            }
            await sleep(150 * attempt);
          }
        }
        throw lastError;
      },
    },
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

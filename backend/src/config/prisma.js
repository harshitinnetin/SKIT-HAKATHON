import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

/**
 * Concurrency semaphore — limits simultaneous Prisma queries to `max`.
 *
 * Why this fixes P2024 / PrismaClientInitializationError:
 *   connection_limit = 5  →  semaphore max = 4
 *   At most 4 queries run in parallel, always leaving ≥1 free pool slot.
 *   No matter how many concurrent HTTP requests arrive, the pool is never
 *   over-subscribed and pgBouncer never has to refuse a connection.
 */
class Semaphore {
  constructor(max) {
    this._max     = max;
    this._current = 0;
    this._queue   = [];
  }

  acquire() {
    if (this._current < this._max) {
      this._current++;
      return Promise.resolve();
    }
    // Queue the caller — it will be resumed by the next release()
    return new Promise(resolve => this._queue.push(resolve));
  }

  release() {
    if (this._queue.length > 0) {
      // Hand the slot directly to the next waiter (count stays the same)
      const next = this._queue.shift();
      next();
    } else {
      this._current--;
    }
  }
}

// Pool has 5 slots; we use at most 4 so auth/admin always has a free slot.
const dbSemaphore = new Semaphore(4);

/**
 * Determines whether a Prisma error is a transient pool issue worth retrying.
 * Catches both PrismaClientKnownRequestError (P2024) and
 * PrismaClientInitializationError (errorCode: undefined) that share the same
 * "Timed out fetching a new connection" message.
 */
const isPoolError = (err) =>
  err?.code === 'P2024' ||
  err?.message?.includes('connection pool') ||
  err?.message?.includes('Timed out fetching');

const createClient = () => {
  const base = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: { db: { url: process.env.DATABASE_URL } },
  });

  return base.$extends({
    query: {
      $allModels: {
        async $allOperations({ operation, model, args, query }) {
          const MAX_RETRIES = 3; // 3 total attempts, 2 retries

          for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            // ① Wait for a free semaphore slot (never exceeds 4 concurrent)
            await dbSemaphore.acquire();
            try {
              // ② Execute the query — pool will always have a free slot
              return await query(args);
            } catch (err) {
              if (isPoolError(err) && attempt < MAX_RETRIES) {
                // ③ Transient pool error → back-off and retry
                const delay = 300 * attempt; // 300ms, 600ms
                console.warn(
                  `[Prisma] Pool error on ${model}.${operation} — retry ${attempt}/${MAX_RETRIES - 1} in ${delay}ms`
                );
                await new Promise(r => setTimeout(r, delay));
                // (finally runs here, releasing the slot before the next attempt)
              } else {
                // Non-retryable or exhausted retries — propagate
                throw err;
              }
            } finally {
              // ④ Always release the semaphore slot (even on retry)
              dbSemaphore.release();
            }
          }
        },
      },
    },
  });
};

const prisma = globalForPrisma.prisma ?? createClient();
globalForPrisma.prisma = prisma;

process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;

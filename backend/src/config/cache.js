/**
 * Lightweight in-memory TTL cache — zero external dependencies.
 * Used as an in-process API Gateway cache layer.
 *
 * Features:
 *  - Per-key TTL
 *  - LRU-style max-size eviction
 *  - Pending request deduplication (request coalescing)
 */
export class TtlCache {
  constructor({ maxSize = 500, defaultTtlMs = 60_000 } = {}) {
    this._store = new Map();        // key → { value, expiresAt }
    this._pending = new Map();      // key → Promise (request coalescing)
    this._maxSize = maxSize;
    this._defaultTtlMs = defaultTtlMs;
  }

  get(key) {
    const entry = this._store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this._store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key, value, ttlMs = this._defaultTtlMs) {
    // Evict oldest entry if at capacity
    if (this._store.size >= this._maxSize && !this._store.has(key)) {
      const oldest = this._store.keys().next().value;
      this._store.delete(oldest);
    }
    this._store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  delete(key) {
    this._store.delete(key);
  }

  clear() {
    this._store.clear();
  }

  /**
   * Get-or-fetch with request coalescing.
   * If multiple callers ask for the same key simultaneously while it's being
   * fetched, they all wait on the same Promise instead of firing N DB queries.
   *
   * @param {string} key
   * @param {() => Promise<any>} fetchFn
   * @param {number} [ttlMs]
   */
  async getOrFetch(key, fetchFn, ttlMs = this._defaultTtlMs) {
    const cached = this.get(key);
    if (cached !== undefined) return cached;

    // If another request is already fetching this key, piggyback on it
    if (this._pending.has(key)) {
      return this._pending.get(key);
    }

    const promise = fetchFn()
      .then(value => {
        this.set(key, value, ttlMs);
        this._pending.delete(key);
        return value;
      })
      .catch(err => {
        this._pending.delete(key);
        throw err;
      });

    this._pending.set(key, promise);
    return promise;
  }
}

// ─── Shared cache instances ─────────────────────────────────────────────────

/** Profile cache: userId → profile object. TTL 5 min. */
export const profileCache = new TtlCache({ maxSize: 1000, defaultTtlMs: 5 * 60_000 });

/** Analytics cache: userId → analytics payload. TTL 2 min. */
export const analyticsCache = new TtlCache({ maxSize: 200, defaultTtlMs: 2 * 60_000 });

/** Chat list cache: userId → chats array. TTL 30 sec. */
export const chatListCache = new TtlCache({ maxSize: 500, defaultTtlMs: 30_000 });

/** Document list cache: userId → document list. TTL 30 sec. */
export const documentListCache = new TtlCache({ maxSize: 500, defaultTtlMs: 30_000 });

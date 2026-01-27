import { storage } from "./storage";
import crypto from "node:crypto";
import { getRedis, REDIS_ENABLED } from "./redis-client";
import { 
  LeaderboardMode, 
  LeaderboardTimeframe, 
  LeaderboardSnapshot,
  getLeaderboardConfig 
} from "../shared/leaderboard-types";

export type LeaderboardType = "global" | "code" | "stress" | "dictation" | "rating" | "book";
export type TimeFrame = "all" | "daily" | "weekly" | "monthly";

// Redis key patterns for distributed cache
const REDIS_CACHE_KEYS = {
  topN: (mode: string, timeframe: string, language: string) => 
    `leaderboard:top100:${mode}:${timeframe}:${language}`,
  snapshot: (mode: string, timeframe: string, language: string) =>
    `leaderboard:snapshot:${mode}:${timeframe}:${language}`,
};

// TTL for Redis cache in seconds
const REDIS_CACHE_TTL = {
  topN: 60, // 1 minute
  snapshot: 60, // 1 minute
};

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  lastAccessed: number;
  hits: number;
  etag: string;
}

interface LeaderboardEntry {
  userId: string;
  username: string;
  wpm: number;
  accuracy: number;
  avatarColor: string | null;
  rank: number;
  isVerified?: boolean;
  verifiedAt?: Date;
}

interface PaginatedResponse<T> {
  entries: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
    nextCursor?: string;
    prevCursor?: string;
  };
  metadata: {
    cacheHit: boolean;
    timeframe: TimeFrame;
    lastUpdated: number;
    etag?: string;
  };
}

// Cache TTLs - configurable via environment variables for real-time experience
// Default values are much shorter for near real-time updates
const CACHE_TTL_MS = {
  global: parseInt(process.env.LEADERBOARD_CACHE_TTL_GLOBAL_MS || '10000', 10), // 10 seconds
  code: parseInt(process.env.LEADERBOARD_CACHE_TTL_CODE_MS || '10000', 10),
  stress: parseInt(process.env.LEADERBOARD_CACHE_TTL_STRESS_MS || '10000', 10),
  dictation: parseInt(process.env.LEADERBOARD_CACHE_TTL_DICTATION_MS || '10000', 10),
  rating: parseInt(process.env.LEADERBOARD_CACHE_TTL_RATING_MS || '30000', 10), // 30 seconds for ELO
  book: parseInt(process.env.LEADERBOARD_CACHE_TTL_BOOK_MS || '10000', 10),
  aroundMe: parseInt(process.env.LEADERBOARD_CACHE_TTL_AROUND_ME_MS || '5000', 10), // 5 seconds for user-specific
  timeBased: parseInt(process.env.LEADERBOARD_CACHE_TTL_TIME_BASED_MS || '10000', 10),
};

const MAX_CACHE_SIZE = parseInt(process.env.LEADERBOARD_MAX_CACHE_SIZE || '100', 10);
const MAX_MEMORY_MB = parseInt(process.env.LEADERBOARD_MAX_MEMORY_MB || '50', 10);

function generateEtag(data: any): string {
  const hash = crypto.createHash('md5');
  hash.update(JSON.stringify(data));
  return `"${hash.digest('hex').substring(0, 16)}"`;
}

function estimateMemorySize(obj: any): number {
  const str = JSON.stringify(obj);
  return Buffer.byteLength(str, 'utf8');
}

class LeaderboardCache {
  private cache = new Map<string, CacheEntry<any>>();
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    memoryUsedBytes: 0,
  };

  private getCacheKey(
    type: LeaderboardType,
    options: {
      timeframe?: TimeFrame;
      difficulty?: string;
      language?: string;
      tier?: string;
      topic?: string;
      limit?: number;
      offset?: number;
      userId?: string;
    }
  ): string {
    const parts: string[] = [type];
    if (options.timeframe) parts.push(`tf:${options.timeframe}`);
    if (options.difficulty) parts.push(`diff:${options.difficulty}`);
    if (options.language) parts.push(`lang:${options.language}`);
    if (options.tier) parts.push(`tier:${options.tier}`);
    if (options.topic) parts.push(`topic:${options.topic}`);
    if (options.limit) parts.push(`lim:${options.limit}`);
    if (options.offset) parts.push(`off:${options.offset}`);
    if (options.userId) parts.push(`uid:${options.userId}`);
    return parts.join(":");
  }

  private getTTL(type: LeaderboardType): number {
    return CACHE_TTL_MS[type] || 30000;
  }

  private isExpired(entry: CacheEntry<any>, ttl: number): boolean {
    return Date.now() - entry.timestamp > ttl;
  }

  private evictLRU(): void {
    if (this.cache.size < MAX_CACHE_SIZE) return;

    let lruKey: string | null = null;
    let lruTime = Infinity;

    const entries = Array.from(this.cache.entries());
    for (const [key, entry] of entries) {
      if (entry.lastAccessed < lruTime) {
        lruTime = entry.lastAccessed;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
      this.stats.evictions++;
    }
  }

  get<T>(key: string, ttl: number): { data: T; etag: string } | null {
    const entry = this.cache.get(key);
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (this.isExpired(entry, ttl)) {
      this.stats.memoryUsedBytes -= estimateMemorySize(entry.data);
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    entry.lastAccessed = Date.now();
    entry.hits++;
    this.stats.hits++;
    return { data: entry.data as T, etag: entry.etag };
  }

  getEtag(key: string, ttl: number): string | null {
    const entry = this.cache.get(key);
    if (!entry || this.isExpired(entry, ttl)) {
      return null;
    }
    return entry.etag;
  }

  set<T>(key: string, data: T): string {
    this.evictLRU();
    const now = Date.now();
    const etag = generateEtag(data);
    const memSize = estimateMemorySize(data);
    
    const existingEntry = this.cache.get(key);
    if (existingEntry) {
      this.stats.memoryUsedBytes -= estimateMemorySize(existingEntry.data);
    }
    
    this.cache.set(key, {
      data,
      timestamp: now,
      lastAccessed: now,
      hits: 0,
      etag,
    });
    
    this.stats.memoryUsedBytes += memSize;
    this.evictIfMemoryExceeded();
    return etag;
  }

  private evictIfMemoryExceeded(): void {
    const maxBytes = MAX_MEMORY_MB * 1024 * 1024;
    while (this.stats.memoryUsedBytes > maxBytes && this.cache.size > 0) {
      let lruKey: string | null = null;
      let lruTime = Infinity;

      for (const [key, entry] of Array.from(this.cache.entries())) {
        if (entry.lastAccessed < lruTime) {
          lruTime = entry.lastAccessed;
          lruKey = key;
        }
      }

      if (lruKey) {
        const entry = this.cache.get(lruKey);
        if (entry) {
          this.stats.memoryUsedBytes -= estimateMemorySize(entry.data);
        }
        this.cache.delete(lruKey);
        this.stats.evictions++;
      } else {
        break;
      }
    }
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    const keys = Array.from(this.cache.keys());
    for (const key of keys) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Invalidate Redis cache for a specific leaderboard
   */
  async invalidateRedis(mode: string, timeframe: string, language: string): Promise<void> {
    if (!REDIS_ENABLED) return;

    const redis = getRedis();
    const keys = [
      REDIS_CACHE_KEYS.topN(mode, timeframe, language),
      REDIS_CACHE_KEYS.snapshot(mode, timeframe, language),
    ];

    try {
      await redis.del(...keys);
    } catch (error) {
      console.error('[LeaderboardCache] Redis invalidation failed:', error);
    }
  }

  /**
   * Get Top-N entries from Redis cache
   * Falls back to database if not cached
   */
  async getRedisTopN(
    mode: LeaderboardMode,
    timeframe: LeaderboardTimeframe,
    language: string,
    limit: number = 100
  ): Promise<LeaderboardSnapshot | null> {
    if (!REDIS_ENABLED) return null;

    const redis = getRedis();
    const key = REDIS_CACHE_KEYS.topN(mode, timeframe, language);

    try {
      const cached = await redis.get(key);
      if (cached) {
        const data = JSON.parse(cached) as LeaderboardSnapshot;
        return {
          ...data,
          entries: data.entries.slice(0, limit),
        };
      }
    } catch (error) {
      console.error('[LeaderboardCache] Redis get failed:', error);
    }

    return null;
  }

  /**
   * Set Top-N entries in Redis cache
   */
  async setRedisTopN(
    mode: LeaderboardMode,
    timeframe: LeaderboardTimeframe,
    language: string,
    entries: LeaderboardEntry[],
    total: number
  ): Promise<void> {
    if (!REDIS_ENABLED) return;

    const redis = getRedis();
    const key = REDIS_CACHE_KEYS.topN(mode, timeframe, language);
    const config = getLeaderboardConfig();

    try {
      const snapshot: LeaderboardSnapshot = {
        version: Date.now(),
        mode,
        timeframe,
        language,
        entries: entries.slice(0, config.topNSize),
        total,
        generatedAt: Date.now(),
        expiresAt: Date.now() + REDIS_CACHE_TTL.topN * 1000,
      };

      await redis.setex(key, REDIS_CACHE_TTL.topN, JSON.stringify(snapshot));
    } catch (error) {
      console.error('[LeaderboardCache] Redis set failed:', error);
    }
  }

  /**
   * Get leaderboard snapshot from Redis (for CDN/anonymous traffic)
   */
  async getRedisSnapshot(
    mode: LeaderboardMode,
    timeframe: LeaderboardTimeframe,
    language: string
  ): Promise<LeaderboardSnapshot | null> {
    if (!REDIS_ENABLED) return null;

    const redis = getRedis();
    const key = REDIS_CACHE_KEYS.snapshot(mode, timeframe, language);

    try {
      const cached = await redis.get(key);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.error('[LeaderboardCache] Redis snapshot get failed:', error);
    }

    return null;
  }

  /**
   * Set leaderboard snapshot in Redis
   */
  async setRedisSnapshot(snapshot: LeaderboardSnapshot): Promise<void> {
    if (!REDIS_ENABLED) return;

    const redis = getRedis();
    const key = REDIS_CACHE_KEYS.snapshot(snapshot.mode, snapshot.timeframe, snapshot.language);

    try {
      await redis.setex(key, REDIS_CACHE_TTL.snapshot, JSON.stringify(snapshot));
    } catch (error) {
      console.error('[LeaderboardCache] Redis snapshot set failed:', error);
    }
  }

  /**
   * Get cache stats including Redis stats
   */
  async getRedisStats(): Promise<{
    localStats: { hits: number; misses: number; evictions: number; memoryUsedBytes: number; hitRate: number; size: number };
    redisEnabled: boolean;
    redisKeyCount?: number;
  }> {
    const localStats = this.getStats();
    
    if (!REDIS_ENABLED) {
      return { localStats, redisEnabled: false };
    }

    try {
      const redis = getRedis();
      const keys = await this.scanKeys(redis, 'leaderboard:*');
      return {
        localStats,
        redisEnabled: true,
        redisKeyCount: keys.length,
      };
    } catch {
      return { localStats, redisEnabled: true };
    }
  }

  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0
      ? this.stats.hits / (this.stats.hits + this.stats.misses)
      : 0;
    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 100) / 100,
      size: this.cache.size,
    };
  }

  private async scanKeys(redis: ReturnType<typeof getRedis>, pattern: string): Promise<string[]> {
    const keys: string[] = [];
    let cursor = '0';
    do {
      const [nextCursor, batch] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', '200');
      cursor = nextCursor;
      if (batch.length > 0) {
        keys.push(...batch);
      }
    } while (cursor !== '0');
    return keys;
  }

  /**
   * Generic leaderboard fetcher - reduces code duplication across all leaderboard types
   * Uses tiered caching: Redis (distributed) -> In-memory (local) -> Database
   * 
   * @param type - The type of leaderboard (global, code, stress, etc.)
   * @param options - Pagination and filter options
   * @param fetchFns - Functions to fetch entries and total count
   */
  private async getLeaderboardGeneric<T>(
    type: LeaderboardType,
    options: {
      timeframe?: TimeFrame;
      limit: number;
      offset: number;
      language?: string;
      cacheKeyOptions: Record<string, any>;
    },
    fetchFns: {
      getEntries: () => Promise<T[]>;
      getTotal: () => Promise<number>;
    }
  ): Promise<PaginatedResponse<T>> {
    const { timeframe = "all", limit, offset, language, cacheKeyOptions } = options;
    const languageKey = language || "all";
    const cacheKey = this.getCacheKey(type, cacheKeyOptions);
    const ttl = this.getTTL(type);
    let redisSnapshot: LeaderboardSnapshot | null = null;
    
    // 1. Check local in-memory cache first (fastest)
    const cached = this.get<PaginatedResponse<T>>(cacheKey, ttl);
    if (cached) {
      return { ...cached.data, metadata: { ...cached.data.metadata, cacheHit: true, etag: cached.etag } };
    }

    // 2. For top entries (offset 0), try Redis distributed cache
    if (offset === 0 && REDIS_ENABLED) {
      try {
        redisSnapshot = await this.getRedisTopN(type as LeaderboardMode, timeframe as LeaderboardTimeframe, languageKey, limit);
        if (redisSnapshot && redisSnapshot.entries.length > 0) {
          const total = Math.max(redisSnapshot.total, redisSnapshot.entries.length);
          const response: PaginatedResponse<T> = {
            entries: redisSnapshot.entries.slice(0, limit) as T[],
            pagination: {
              total,
              limit,
              offset,
              hasMore: limit < total,
              nextCursor: limit < total ? this.encodeCursor(limit) : undefined,
            },
            metadata: {
              cacheHit: true,
              timeframe,
              lastUpdated: Date.now(),
            },
          };
          // Populate local cache from Redis
          const etag = this.set(cacheKey, response);
          return { ...response, metadata: { ...response.metadata, etag } };
        }
      } catch (error) {
        console.error('[LeaderboardCache] Redis cache miss or error:', error);
        // Fall through to database
      }
    }

    // 3. Fetch from database
    let entries: T[];
    let total: number;
    try {
      [entries, total] = await Promise.all([
        fetchFns.getEntries(),
        fetchFns.getTotal(),
      ]);
    } catch (error) {
      if (redisSnapshot) {
        const totalFromSnapshot = Math.max(redisSnapshot.total, redisSnapshot.entries.length);
        const response: PaginatedResponse<T> = {
          entries: redisSnapshot.entries.slice(0, limit) as T[],
          pagination: {
            total: totalFromSnapshot,
            limit,
            offset,
            hasMore: limit < totalFromSnapshot,
            nextCursor: limit < totalFromSnapshot ? this.encodeCursor(limit) : undefined,
          },
          metadata: {
            cacheHit: true,
            timeframe,
            lastUpdated: Date.now(),
          },
        };
        const etag = this.set(cacheKey, response);
        return { ...response, metadata: { ...response.metadata, etag } };
      }
      throw error;
    }

    const response: PaginatedResponse<T> = {
      entries,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + entries.length < total,
        nextCursor: offset + limit < total ? this.encodeCursor(offset + limit) : undefined,
        prevCursor: offset > 0 ? this.encodeCursor(Math.max(0, offset - limit)) : undefined,
      },
      metadata: {
        cacheHit: false,
        timeframe,
        lastUpdated: Date.now(),
      },
    };

    // Set local cache
    const etag = this.set(cacheKey, response);

    // Populate Redis cache for top entries
    if (offset === 0 && REDIS_ENABLED) {
      try {
        await this.setRedisTopN(
          type as LeaderboardMode,
          timeframe as LeaderboardTimeframe,
          languageKey,
          entries as LeaderboardEntry[],
          total
        );
      } catch (error) {
        console.error('[LeaderboardCache] Failed to set Redis cache:', error);
      }
    }

    return { ...response, metadata: { ...response.metadata, etag } };
  }

  async getGlobalLeaderboard(options: {
    timeframe?: TimeFrame;
    limit?: number;
    offset?: number;
    language?: string;
  }): Promise<PaginatedResponse<any>> {
    const { timeframe = "all", limit = 20, offset = 0, language = "en" } = options;
    
    return this.getLeaderboardGeneric("global", {
      timeframe,
      limit,
      offset,
      language,
      cacheKeyOptions: { timeframe, limit, offset, language },
    }, {
      getEntries: () => storage.getLeaderboardPaginated(limit, offset, timeframe, language),
      getTotal: () => storage.getLeaderboardCount(timeframe, language),
    });
  }

  async getStressLeaderboard(options: {
    difficulty?: string;
    timeframe?: TimeFrame;
    limit?: number;
    offset?: number;
  }): Promise<PaginatedResponse<any>> {
    const { difficulty, timeframe = "all", limit = 50, offset = 0 } = options;
    
    return this.getLeaderboardGeneric("stress", {
      timeframe,
      limit,
      offset,
      cacheKeyOptions: { difficulty, timeframe, limit, offset },
    }, {
      getEntries: () => storage.getStressTestLeaderboardPaginated(difficulty, timeframe, limit, offset),
      getTotal: () => storage.getStressTestLeaderboardCount(difficulty, timeframe),
    });
  }

  async getCodeLeaderboard(options: {
    language?: string;
    timeframe?: TimeFrame;
    limit?: number;
    offset?: number;
  }): Promise<PaginatedResponse<any>> {
    const { language, timeframe = "all", limit = 20, offset = 0 } = options;
    
    return this.getLeaderboardGeneric("code", {
      timeframe,
      limit,
      offset,
      cacheKeyOptions: { language, timeframe, limit, offset },
    }, {
      getEntries: () => storage.getCodeLeaderboardPaginated(language, timeframe, limit, offset),
      getTotal: () => storage.getCodeLeaderboardCount(language, timeframe),
    });
  }

  async getRatingLeaderboard(options: {
    tier?: string;
    limit?: number;
    offset?: number;
  }): Promise<PaginatedResponse<any>> {
    const { tier, limit = 50, offset = 0 } = options;
    
    return this.getLeaderboardGeneric("rating", {
      timeframe: "all",
      limit,
      offset,
      cacheKeyOptions: { tier, limit, offset },
    }, {
      getEntries: () => storage.getRatingLeaderboardPaginated(tier, limit, offset),
      getTotal: () => storage.getRatingLeaderboardCount(tier),
    });
  }

  async getDictationLeaderboard(options: {
    timeframe?: TimeFrame;
    limit?: number;
    offset?: number;
  }): Promise<PaginatedResponse<any>> {
    const { timeframe = "all", limit = 20, offset = 0 } = options;
    
    return this.getLeaderboardGeneric("dictation", {
      timeframe,
      limit,
      offset,
      cacheKeyOptions: { timeframe, limit, offset },
    }, {
      getEntries: () => storage.getDictationLeaderboardPaginated(timeframe, limit, offset),
      getTotal: () => storage.getDictationLeaderboardCount(timeframe),
    });
  }

  async getBookLeaderboard(options: {
    topic?: string;
    limit?: number;
    offset?: number;
  }): Promise<PaginatedResponse<any>> {
    const { topic, limit = 20, offset = 0 } = options;
    
    return this.getLeaderboardGeneric("book", {
      timeframe: "all",
      limit,
      offset,
      cacheKeyOptions: { topic, limit, offset },
    }, {
      getEntries: () => storage.getBookLeaderboardPaginated(topic, limit, offset),
      getTotal: () => storage.getBookLeaderboardCount(topic),
    });
  }

  async getAroundMe(
    type: LeaderboardType,
    userId: string,
    options: {
      difficulty?: string;
      language?: string;
      tier?: string;
      topic?: string;
      range?: number;
      timeframe?: TimeFrame;
    } = {}
  ): Promise<{ userRank: number; entries: any[]; cacheHit: boolean }> {
    const { range = 5, timeframe } = options;
    const cacheKey = this.getCacheKey(type, { ...options, userId, timeframe });
    
    const cached = this.get<{ userRank: number; entries: any[] }>(cacheKey, CACHE_TTL_MS.aroundMe);
    if (cached) {
      return { ...cached.data, cacheHit: true };
    }

    let result: { userRank: number; entries: any[] };

    switch (type) {
      case "global":
        result = await storage.getLeaderboardAroundUser(userId, range, timeframe, options.language || "en");
        break;
      case "stress":
        result = await storage.getStressLeaderboardAroundUser(userId, options.difficulty, timeframe, range);
        break;
      case "code":
        result = await storage.getCodeLeaderboardAroundUser(userId, options.language, timeframe, range);
        break;
      case "rating":
        result = await storage.getRatingLeaderboardAroundUser(userId, options.tier, range);
        break;
      case "dictation":
        result = await storage.getDictationLeaderboardAroundUser(userId, timeframe, range);
        break;
      case "book":
        result = await storage.getBookLeaderboardAroundUser(userId, options.topic, range);
        break;
      default:
        result = { userRank: -1, entries: [] };
    }

    this.set(cacheKey, result);
    return { ...result, cacheHit: false };
  }

  private encodeCursor(offset: number): string {
    return Buffer.from(`offset:${offset}`).toString("base64");
  }

  decodeCursor(cursor: string): number {
    try {
      const decoded = Buffer.from(cursor, "base64").toString("utf-8");
      const match = decoded.match(/^offset:(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    } catch {
      return 0;
    }
  }
}

export const leaderboardCache = new LeaderboardCache();

/**
 * Get date range for a given timeframe with UTC normalization
 * Production-ready with proper edge case handling
 */
export function getTimeframeDateRange(timeframe: TimeFrame): { start: Date; end: Date } {
  // Use UTC to ensure consistent behavior across timezones
  const now = new Date();
  const end = new Date(now);
  let start: Date;

  // Validate timeframe input
  const validTimeframes: TimeFrame[] = ["all", "daily", "weekly", "monthly"];
  const safeTimeframe = validTimeframes.includes(timeframe) ? timeframe : "all";

  switch (safeTimeframe) {
    case "daily":
      // Start of today in UTC
      start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
      break;
    case "weekly":
      // Start of current week (Sunday) in UTC
      const dayOfWeek = now.getUTCDay();
      start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - dayOfWeek, 0, 0, 0, 0));
      break;
    case "monthly":
      // Start of current month in UTC
      start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
      break;
    case "all":
    default:
      // Unix epoch for all-time
      start = new Date(0);
      break;
  }

  // Ensure start is never after end (edge case protection)
  if (start.getTime() > end.getTime()) {
    console.warn(`[TimeframeDateRange] Start date after end date, resetting to epoch`);
    start = new Date(0);
  }

  return { start, end };
}

/**
 * Validate timeframe parameter
 * Returns a safe default if invalid
 */
export function validateTimeframe(timeframe: string | undefined): TimeFrame {
  const validTimeframes: TimeFrame[] = ["all", "daily", "weekly", "monthly"];
  if (!timeframe || !validTimeframes.includes(timeframe as TimeFrame)) {
    return "all";
  }
  return timeframe as TimeFrame;
}

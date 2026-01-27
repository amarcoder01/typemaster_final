/**
 * Personalized Rank Window Cache
 * 
 * Pre-computes and caches user's rank ± N entries for fast "around me" queries.
 * Reduces database load for personalized leaderboard views.
 * 
 * Key features:
 * - Redis-backed for distributed access
 * - Short TTL for freshness
 * - Computed on score submission
 * - Fallback to database on cache miss
 */

import { getRedis, REDIS_ENABLED } from './redis-client';
import { storage } from './storage';
import { 
  AroundMeCache, 
  LeaderboardMode, 
  LeaderboardTimeframe,
  LeaderboardEntry,
  getLeaderboardConfig 
} from '../shared/leaderboard-types';

// Redis key pattern for around-me cache
const AROUND_ME_KEY = (
  userId: string, 
  mode: LeaderboardMode, 
  timeframe: LeaderboardTimeframe, 
  language: string
) => `leaderboard:around:${userId}:${mode}:${timeframe}:${language}`;

// TTL in seconds
const AROUND_ME_TTL = 60; // 1 minute

// Configuration
const config = getLeaderboardConfig();

// Stats tracking
const stats = {
  hits: 0,
  misses: 0,
  updates: 0,
  errors: 0,
};

/**
 * Get around-me cache for a user
 */
export async function getAroundMeCache(
  userId: string,
  mode: LeaderboardMode = 'global',
  timeframe: LeaderboardTimeframe = 'all',
  language: string = 'en',
  range: number = config.aroundMeRange
): Promise<AroundMeCache | null> {
  if (!REDIS_ENABLED) {
    return fetchFromDatabase(userId, mode, timeframe, language, range);
  }

  const redis = getRedis();
  const key = AROUND_ME_KEY(userId, mode, timeframe, language);

  try {
    const cached = await redis.get(key);
    if (cached) {
      stats.hits++;
      const data = JSON.parse(cached) as AroundMeCache;
      
      // Check if still valid
      if (data.expiresAt > Date.now()) {
        return data;
      }
    }
    
    stats.misses++;
  } catch (error) {
    stats.errors++;
    console.error('[AroundMeCache] Redis get failed:', error);
  }

  // Fetch from database and cache
  return fetchAndCache(userId, mode, timeframe, language, range);
}

/**
 * Update around-me cache for a user (called after score submission)
 */
export async function updateAroundMeCache(
  userId: string,
  mode: LeaderboardMode = 'global',
  timeframe: LeaderboardTimeframe = 'all',
  language: string = 'en',
  range: number = config.aroundMeRange
): Promise<AroundMeCache | null> {
  return fetchAndCache(userId, mode, timeframe, language, range);
}

/**
 * Invalidate around-me cache for a user
 */
export async function invalidateAroundMeCache(
  userId: string,
  mode: LeaderboardMode = 'global',
  timeframe?: LeaderboardTimeframe,
  language?: string
): Promise<void> {
  if (!REDIS_ENABLED) return;

  const redis = getRedis();

  try {
    if (timeframe && language) {
      // Specific cache invalidation
      await redis.del(AROUND_ME_KEY(userId, mode, timeframe, language));
    } else {
      // Pattern-based invalidation for all timeframes/languages
      const pattern = `leaderboard:around:${userId}:${mode}:*`;
      const keys = await scanKeys(redis, pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    }
  } catch (error) {
    console.error('[AroundMeCache] Invalidation failed:', error);
  }
}

/**
 * Batch update around-me caches for multiple users
 */
export async function batchUpdateAroundMeCache(
  userIds: string[],
  mode: LeaderboardMode = 'global',
  timeframe: LeaderboardTimeframe = 'all',
  language: string = 'en'
): Promise<void> {
  // Process in parallel but with concurrency limit
  const concurrency = 10;
  const chunks: string[][] = [];
  
  for (let i = 0; i < userIds.length; i += concurrency) {
    chunks.push(userIds.slice(i, i + concurrency));
  }

  for (const chunk of chunks) {
    await Promise.all(
      chunk.map(userId => updateAroundMeCache(userId, mode, timeframe, language))
    );
  }
}

/**
 * Get around-me stats
 */
export function getAroundMeStats(): {
  hits: number;
  misses: number;
  updates: number;
  errors: number;
  hitRate: number;
} {
  const total = stats.hits + stats.misses;
  return {
    ...stats,
    hitRate: total > 0 ? Math.round((stats.hits / total) * 100) / 100 : 0,
  };
}

/**
 * Reset stats
 */
export function resetAroundMeStats(): void {
  stats.hits = 0;
  stats.misses = 0;
  stats.updates = 0;
  stats.errors = 0;
}

// --- Private helpers ---

async function fetchFromDatabase(
  userId: string,
  mode: LeaderboardMode,
  timeframe: LeaderboardTimeframe,
  language: string,
  range: number
): Promise<AroundMeCache | null> {
  try {
    let result: { userRank: number; entries: any[] } | null = null;
    switch (mode) {
      case 'global':
        result = await storage.getLeaderboardAroundUser(userId, range, timeframe, language);
        break;
      case 'code':
        result = await storage.getCodeLeaderboardAroundUser(userId, language, timeframe, range);
        break;
      case 'stress':
        result = await storage.getStressLeaderboardAroundUser(userId, undefined, timeframe, range);
        break;
      case 'dictation':
        result = await storage.getDictationLeaderboardAroundUser(userId, timeframe, range);
        break;
      case 'rating':
        result = await storage.getRatingLeaderboardAroundUser(userId, undefined, range);
        break;
      case 'book':
        result = await storage.getBookLeaderboardAroundUser(userId, undefined, range);
        break;
      default:
        return null;
    }
    
    if (result.userRank <= 0) {
      return null;
    }

    const now = Date.now();
    return {
      userId,
      userRank: result.userRank,
      entries: result.entries.map((e: any) => ({
        userId: e.userId,
        username: e.username,
        wpm: typeof e.wpm === "number" ? e.wpm : 0,
        accuracy: typeof e.accuracy === "number" ? e.accuracy : 0,
        rank: typeof e.rank === "number" ? e.rank : 0,
        avatarColor: e.avatarColor ?? null,
        isVerified: e.isVerified ?? false,
      })),
      mode,
      timeframe,
      language,
      cachedAt: now,
      expiresAt: now + AROUND_ME_TTL * 1000,
    };
  } catch (error) {
    console.error('[AroundMeCache] Database fetch failed:', error);
    return null;
  }
}

async function scanKeys(redis: ReturnType<typeof getRedis>, pattern: string): Promise<string[]> {
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

async function fetchAndCache(
  userId: string,
  mode: LeaderboardMode,
  timeframe: LeaderboardTimeframe,
  language: string,
  range: number
): Promise<AroundMeCache | null> {
  const data = await fetchFromDatabase(userId, mode, timeframe, language, range);
  
  if (!data) {
    return null;
  }

  if (!REDIS_ENABLED) {
    return data;
  }

  const redis = getRedis();
  const key = AROUND_ME_KEY(userId, mode, timeframe, language);

  try {
    await redis.setex(key, AROUND_ME_TTL, JSON.stringify(data));
    stats.updates++;
  } catch (error) {
    stats.errors++;
    console.error('[AroundMeCache] Redis set failed:', error);
  }

  return data;
}

/**
 * Pre-warm around-me cache for active users
 * Called periodically or after leaderboard updates
 */
export async function prewarmAroundMeCache(
  userIds: string[],
  mode: LeaderboardMode = 'global',
  language: string = 'en'
): Promise<{ warmed: number; failed: number }> {
  let warmed = 0;
  let failed = 0;

  // Only warm 'all' timeframe for now
  const timeframe: LeaderboardTimeframe = 'all';

  for (const userId of userIds) {
    try {
      const result = await updateAroundMeCache(userId, mode, timeframe, language);
      if (result) {
        warmed++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }

  return { warmed, failed };
}

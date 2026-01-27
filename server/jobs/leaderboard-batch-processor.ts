/**
 * Leaderboard Batch Processor
 * 
 * Consumes batched score events and:
 * 1. Deduplicates user entries (keep best score)
 * 2. Aggregates rank changes
 * 3. Triggers targeted view refresh
 * 4. Publishes snapshot diffs to Redis Pub/Sub
 * 
 * This decouples score submission from leaderboard updates,
 * enabling horizontal scaling and reducing database load.
 */

import { 
  LeaderboardBatch, 
  LeaderboardDelta, 
  RankChange,
  LeaderboardTimeframe,
  LeaderboardMode,
  LeaderboardEntry,
  getLeaderboardConfig 
} from '../../shared/leaderboard-types';
import { onBatchReady, initializeEventStream, getStreamStats } from '../leaderboard-event-stream';
import { triggerImmediateRefresh, triggerTargetedRefresh } from './schedule-leaderboard-refresh';
import { redisPub, REDIS_ENABLED, getRedis } from '../redis-client';
import { storage } from '../storage';
import { leaderboardCache } from '../leaderboard-cache';

// Configuration
const config = getLeaderboardConfig();

// Metrics tracking
interface ProcessorMetrics {
  batchesProcessed: number;
  eventsProcessed: number;
  deltasPublished: number;
  refreshesTriggered: number;
  errors: number;
  lastBatchTime: number;
  averageBatchSize: number;
  averageProcessingTimeMs: number;
}

const metrics: ProcessorMetrics = {
  batchesProcessed: 0,
  eventsProcessed: 0,
  deltasPublished: 0,
  refreshesTriggered: 0,
  errors: 0,
  lastBatchTime: 0,
  averageBatchSize: 0,
  averageProcessingTimeMs: 0,
};

// Version counter for delta updates
let deltaVersion = Date.now();
const MAX_DELTA_VERSION = Number.MAX_SAFE_INTEGER - 1000;
const BATCH_RETRY_MAX = parseInt(process.env.LEADERBOARD_BATCH_RETRY_MAX || '3', 10);
const BATCH_RETRY_BASE_MS = parseInt(process.env.LEADERBOARD_BATCH_RETRY_BASE_MS || '500', 10);
const BATCH_RETRY_MAX_MS = parseInt(process.env.LEADERBOARD_BATCH_RETRY_MAX_MS || '5000', 10);

// Cache of previous top-N for delta calculation
const previousTopN: Map<string, LeaderboardEntry[]> = new Map();

/**
 * Process a batch of score events
 */
async function processBatch(batch: LeaderboardBatch): Promise<void> {
  const startTime = Date.now();
  
  console.log(`[BatchProcessor] Processing batch ${batch.batchId} with ${batch.events.length} events`);
  
  try {
    // 1. Group events by language and mode for targeted processing
    const eventsByKey = groupEventsByKey(batch.events);
    
    // 2. Invalidate relevant caches
    await invalidateCaches(batch);
    
    // 3. Trigger targeted view refresh based on affected data
    await triggerRefreshes(batch);
    
    // 4. Calculate and publish deltas for each affected key
    for (const [key, events] of eventsByKey) {
      await publishDelta(key, events, batch.batchId);
    }
    
    // 5. Update around-me caches for affected users
    await updateAroundMeCaches(batch.events);
    
    // Update metrics
    metrics.batchesProcessed++;
    metrics.eventsProcessed += batch.events.length;
    metrics.lastBatchTime = Date.now();
    
    const processingTime = Date.now() - startTime;
    metrics.averageProcessingTimeMs = 
      (metrics.averageProcessingTimeMs * (metrics.batchesProcessed - 1) + processingTime) / 
      metrics.batchesProcessed;
    metrics.averageBatchSize = 
      (metrics.averageBatchSize * (metrics.batchesProcessed - 1) + batch.events.length) / 
      metrics.batchesProcessed;
    
    console.log(`[BatchProcessor] Batch ${batch.batchId} processed in ${processingTime}ms`);
    
  } catch (error) {
    metrics.errors++;
    console.error(`[BatchProcessor] Error processing batch ${batch.batchId}:`, error);
    throw error;
  }
}

async function processBatchWithRetry(batch: LeaderboardBatch): Promise<void> {
  let attempt = 0;
  let delayMs = BATCH_RETRY_BASE_MS;
  while (attempt <= BATCH_RETRY_MAX) {
    try {
      await processBatch(batch);
      return;
    } catch (error) {
      attempt++;
      if (attempt > BATCH_RETRY_MAX) {
        throw error;
      }
      const jitter = Math.floor(Math.random() * 200);
      await new Promise(resolve => setTimeout(resolve, Math.min(delayMs + jitter, BATCH_RETRY_MAX_MS)));
      delayMs = Math.min(delayMs * 2, BATCH_RETRY_MAX_MS);
    }
  }
}

/**
 * Group events by language:mode key for targeted processing
 */
function groupEventsByKey(events: LeaderboardBatch['events']): Map<string, LeaderboardBatch['events']> {
  const grouped = new Map<string, LeaderboardBatch['events']>();
  
  for (const event of events) {
    const key = `${event.language}:${event.leaderboardMode || 'global'}`;
    
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(event);
  }
  
  return grouped;
}

/**
 * Invalidate relevant caches for affected data
 */
async function invalidateCaches(batch: LeaderboardBatch): Promise<void> {
  // Invalidate in-memory cache
  for (const language of batch.affectedLanguages) {
    leaderboardCache.invalidate(`global:${language}`);
    leaderboardCache.invalidate(`aroundMe:global:${language}`);
  }
  
  // Invalidate Redis cache if enabled
  if (REDIS_ENABLED) {
    const redis = getRedis();
    const pipeline = redis.pipeline();
    
    for (const language of batch.affectedLanguages) {
      for (const timeframe of batch.affectedTimeframes) {
        pipeline.del(`leaderboard:top100:global:${timeframe}:${language}`);
      }
    }
    
    await pipeline.exec();
  }
}

/**
 * Trigger targeted materialized view refreshes
 */
async function triggerRefreshes(batch: LeaderboardBatch): Promise<void> {
  // Prioritize daily view since it changes most frequently
  const timeframePriority: LeaderboardTimeframe[] = ['daily', 'weekly', 'monthly', 'all'];
  
  for (const timeframe of timeframePriority) {
    if (batch.affectedTimeframes.includes(timeframe)) {
      try {
        await triggerTargetedRefresh(timeframe);
        metrics.refreshesTriggered++;
      } catch (error) {
        console.error(`[BatchProcessor] Failed to refresh ${timeframe}:`, error);
      }
    }
  }
}

/**
 * Calculate and publish delta updates for a specific key
 */
async function publishDelta(
  key: string, 
  events: LeaderboardBatch['events'],
  batchId: string
): Promise<void> {
  const [language, modeStr] = key.split(':');
  const mode = (modeStr || 'global') as LeaderboardMode;
  
  // Get current top-N from cache or database
  const currentTopN = await getTopN(mode, 'all', language, config.topNSize);
  
  // Get previous top-N for comparison
  const previousKey = `${mode}:all:${language}`;
  const previous = previousTopN.get(previousKey) || [];
  
  // Calculate changes
  const changes = calculateChanges(previous, currentTopN, events);
  
  // Update previous cache
  previousTopN.set(previousKey, currentTopN);
  
  // Publish delta for each timeframe
  for (const timeframe of ['all', 'daily', 'weekly', 'monthly'] as LeaderboardTimeframe[]) {
    const delta: LeaderboardDelta = {
      version: nextDeltaVersion(),
      mode,
      timeframe,
      language,
      changes,
      removed: findRemoved(previous, currentTopN),
      topN: config.topNSize,
      timestamp: Date.now(),
      batchId,
    };
    
    // Publish via Redis Pub/Sub if enabled
    if (REDIS_ENABLED) {
      const channel = `leaderboard:updates:${mode}:${timeframe}:${language}`;
      await redisPub.publish(channel, JSON.stringify(delta));
      metrics.deltasPublished++;
    }
  }
}

/**
 * Get top-N entries for a specific leaderboard
 */
async function getTopN(
  mode: LeaderboardMode,
  timeframe: LeaderboardTimeframe,
  language: string,
  limit: number
): Promise<LeaderboardEntry[]> {
  try {
    // Try to get from cache first
    const cacheResult = await leaderboardCache.getGlobalLeaderboard({
      timeframe,
      language,
      limit,
      offset: 0,
    });
    
    return cacheResult.entries;
  } catch (error) {
    console.error('[BatchProcessor] Error getting top-N:', error);
    return [];
  }
}

/**
 * Calculate rank changes between previous and current top-N
 */
function calculateChanges(
  previous: LeaderboardEntry[],
  current: LeaderboardEntry[],
  events: LeaderboardBatch['events']
): RankChange[] {
  const changes: RankChange[] = [];
  const previousRanks = new Map(previous.map(e => [e.userId, e.rank]));
  const eventUserIds = new Set(events.map(e => e.userId));
  
  for (const entry of current) {
    const oldRank = previousRanks.get(entry.userId) ?? null;
    const isNewEntry = eventUserIds.has(entry.userId) && oldRank === null;
    const hasImproved = oldRank !== null && entry.rank < oldRank;
    const hasDropped = oldRank !== null && entry.rank > oldRank;
    
    // Only include entries that changed or are from this batch
    if (isNewEntry || hasImproved || hasDropped || eventUserIds.has(entry.userId)) {
      changes.push({
        userId: entry.userId,
        username: entry.username,
        oldRank,
        newRank: entry.rank,
        wpm: entry.wpm,
        accuracy: entry.accuracy,
        avatarColor: entry.avatarColor,
        isVerified: entry.isVerified,
        changeType: isNewEntry ? 'new' : hasImproved ? 'improved' : hasDropped ? 'dropped' : 'unchanged',
      });
    }
  }
  
  return changes;
}

/**
 * Find users that were removed from top-N
 */
function findRemoved(previous: LeaderboardEntry[], current: LeaderboardEntry[]): string[] {
  const currentIds = new Set(current.map(e => e.userId));
  return previous.filter(e => !currentIds.has(e.userId)).map(e => e.userId);
}

/**
 * Update around-me caches for affected users
 */
async function updateAroundMeCaches(events: LeaderboardBatch['events']): Promise<void> {
  if (!REDIS_ENABLED) return;
  
  const redis = getRedis();
  const pipeline = redis.pipeline();
  
  for (const event of events) {
    try {
      // Get user's new rank and surrounding entries
      const aroundMe = await storage.getLeaderboardAroundUser(
        event.userId,
        config.aroundMeRange,
        'all',
        event.language
      );
      
      if (aroundMe.userRank > 0) {
        const cacheKey = `leaderboard:around:${event.userId}:global:all:${event.language}`;
        pipeline.setex(
          cacheKey,
          60, // 60 second TTL
          JSON.stringify({
            userId: event.userId,
            userRank: aroundMe.userRank,
            entries: aroundMe.entries,
            mode: 'global',
            timeframe: 'all',
            language: event.language,
            cachedAt: Date.now(),
            expiresAt: Date.now() + 60000,
          })
        );
      }
    } catch (error) {
      console.error(`[BatchProcessor] Failed to update around-me for ${event.userId}:`, error);
    }
  }
  
  await pipeline.exec();
}

/**
 * Initialize the batch processor
 */
export async function initializeBatchProcessor(): Promise<void> {
  console.log('[BatchProcessor] Initializing...');
  
  // Initialize event stream
  await initializeEventStream();
  
  // Register batch handler
  onBatchReady(processBatchWithRetry);
  
  console.log('[BatchProcessor] Ready to process batches');
}

function nextDeltaVersion(): number {
  if (deltaVersion >= MAX_DELTA_VERSION) {
    deltaVersion = Date.now();
    return deltaVersion;
  }
  deltaVersion += 1;
  return deltaVersion;
}

/**
 * Get processor metrics
 */
export function getBatchProcessorMetrics(): ProcessorMetrics & { streamStats?: any } {
  return { ...metrics };
}

/**
 * Get detailed processor stats including stream stats
 */
export async function getDetailedProcessorStats(): Promise<ProcessorMetrics & { streamStats: any }> {
  const streamStats = await getStreamStats();
  return {
    ...metrics,
    streamStats,
  };
}

/**
 * Shutdown the batch processor
 */
export async function shutdownBatchProcessor(): Promise<void> {
  console.log('[BatchProcessor] Shutting down...');
  // Event stream shutdown is handled separately
}

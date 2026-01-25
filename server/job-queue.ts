import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import { getRedis, REDIS_ENABLED, REDIS_CLUSTER_ENABLED, SERVER_ID } from './redis-client';
import { storage } from './storage';
import { eloRatingService } from './elo-rating-service';
import { metrics } from './metrics-exporter';
import { leaderboardCache } from './leaderboard-cache';

/**
 * Job Queue Service using BullMQ
 * 
 * Provides distributed job processing for heavy/async operations:
 * - Race completion (results processing, leaderboard updates)
 * - ELO rating calculations
 * - Achievement processing
 * - Analytics aggregation
 */

// Queue names
const QUEUE_NAMES = {
  RACE_COMPLETION: 'race-completion',
  LEADERBOARD_UPDATE: 'leaderboard-update',
  ACHIEVEMENT_CHECK: 'achievement-check',
  ANALYTICS: 'analytics',
} as const;

// Job types
export interface RaceCompletionJob {
  raceId: number;
  results: Array<{
    participantId: number;
    userId?: number;
    wpm: number;
    accuracy: number;
    position: number;
    finishedAt: Date;
  }>;
  raceMode: string;
  startedAt: Date;
  finishedAt: Date;
}

export interface LeaderboardUpdateJob {
  type: 'race' | 'stress' | 'code' | 'dictation';
  userId?: number;
  wpm: number;
  accuracy: number;
  timestamp: Date;
}

export interface AchievementCheckJob {
  userId: number;
  eventType: 'race_completed' | 'test_completed' | 'level_up';
  data: Record<string, any>;
}

// Connection options for BullMQ
const getConnectionOptions = () => {
  if (!REDIS_ENABLED) {
    return null;
  }
  
  // BullMQ requires ioredis connection options
  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: null, // Required for BullMQ
  };
};

// Create queues (only if Redis is enabled)
let raceCompletionQueue: Queue<RaceCompletionJob> | null = null;
let leaderboardUpdateQueue: Queue<LeaderboardUpdateJob> | null = null;
let achievementCheckQueue: Queue<AchievementCheckJob> | null = null;

// Workers
let raceCompletionWorker: Worker<RaceCompletionJob> | null = null;
let leaderboardUpdateWorker: Worker<LeaderboardUpdateJob> | null = null;
let achievementCheckWorker: Worker<AchievementCheckJob> | null = null;

/**
 * Initialize job queues
 */
export async function initializeJobQueues(): Promise<boolean> {
  const connection = getConnectionOptions();
  
  if (!connection) {
    console.log('[JobQueue] Redis disabled, job queues not initialized');
    return false;
  }
  
  try {
    // Create queues
    raceCompletionQueue = new Queue<RaceCompletionJob>(QUEUE_NAMES.RACE_COMPLETION, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: {
          count: 1000, // Keep last 1000 completed jobs
          age: 3600, // Remove jobs older than 1 hour
        },
        removeOnFail: {
          count: 5000, // Keep last 5000 failed jobs for debugging
        },
      },
    });
    
    leaderboardUpdateQueue = new Queue<LeaderboardUpdateJob>(QUEUE_NAMES.LEADERBOARD_UPDATE, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 500,
        },
        removeOnComplete: {
          count: 1000,
        },
      },
    });
    
    achievementCheckQueue = new Queue<AchievementCheckJob>(QUEUE_NAMES.ACHIEVEMENT_CHECK, {
      connection,
      defaultJobOptions: {
        attempts: 2,
        backoff: {
          type: 'fixed',
          delay: 2000,
        },
        removeOnComplete: {
          count: 500,
        },
      },
    });
    
    // Create workers
    raceCompletionWorker = new Worker<RaceCompletionJob>(
      QUEUE_NAMES.RACE_COMPLETION,
      async (job: Job<RaceCompletionJob>) => {
        await processRaceCompletion(job);
      },
      {
        connection,
        concurrency: 10,
        limiter: {
          max: 100,
          duration: 1000, // Max 100 jobs per second
        },
      }
    );
    
    leaderboardUpdateWorker = new Worker<LeaderboardUpdateJob>(
      QUEUE_NAMES.LEADERBOARD_UPDATE,
      async (job: Job<LeaderboardUpdateJob>) => {
        await processLeaderboardUpdate(job);
      },
      {
        connection,
        concurrency: 20,
      }
    );
    
    achievementCheckWorker = new Worker<AchievementCheckJob>(
      QUEUE_NAMES.ACHIEVEMENT_CHECK,
      async (job: Job<AchievementCheckJob>) => {
        await processAchievementCheck(job);
      },
      {
        connection,
        concurrency: 5,
      }
    );
    
    // Set up event handlers
    setupWorkerEvents(raceCompletionWorker, QUEUE_NAMES.RACE_COMPLETION);
    setupWorkerEvents(leaderboardUpdateWorker, QUEUE_NAMES.LEADERBOARD_UPDATE);
    setupWorkerEvents(achievementCheckWorker, QUEUE_NAMES.ACHIEVEMENT_CHECK);
    
    console.log(`[JobQueue] Initialized on server ${SERVER_ID}`);
    return true;
  } catch (error) {
    console.error('[JobQueue] Initialization failed:', error);
    return false;
  }
}

/**
 * Set up worker event handlers
 */
function setupWorkerEvents(worker: Worker<any>, queueName: string): void {
  worker.on('completed', (job) => {
    metrics.operationDuration.observe(
      { operation: `job_${queueName}`, status: 'success' },
      (Date.now() - job.timestamp) / 1000
    );
  });
  
  worker.on('failed', (job, err) => {
    console.error(`[JobQueue:${queueName}] Job ${job?.id} failed:`, err.message);
    metrics.operationDuration.observe(
      { operation: `job_${queueName}`, status: 'error' },
      job ? (Date.now() - job.timestamp) / 1000 : 0
    );
  });
  
  worker.on('error', (err) => {
    console.error(`[JobQueue:${queueName}] Worker error:`, err.message);
  });
}

/**
 * Process race completion job
 */
async function processRaceCompletion(job: Job<RaceCompletionJob>): Promise<void> {
  const { raceId, results, raceMode, startedAt, finishedAt } = job.data;
  
  console.log(`[JobQueue] Processing race ${raceId} completion with ${results.length} results`);
  
  try {
    // Update race status
    await storage.updateRaceStatus(raceId, 'finished', new Date(startedAt), new Date(finishedAt));
    
    // Update participant results
    for (const result of results) {
      await storage.updateParticipantProgress(
        result.participantId,
        100, // Full progress
        result.wpm,
        result.accuracy,
        0
      );
    }
    
    // Calculate ELO ratings for ranked races
    if (raceMode === 'ranked') {
      const userResults = results.filter(r => r.userId);
      if (userResults.length >= 2) {
        await eloRatingService.processRaceResults(
          raceId,
          userResults.map(r => ({
            participantId: r.participantId,
            userId: r.userId?.toString() || null,
            position: r.position,
            wpm: r.wpm,
            accuracy: r.accuracy,
            isBot: false, // Job queue only processes human results
          }))
        );
      }
    }
    
    // Record metrics
    const duration = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
    metrics.raceDuration.observe({ mode: raceMode }, duration / 1000);
    metrics.raceParticipants.observe(results.length);
    metrics.racesCompleted.inc({ mode: raceMode });
    
    console.log(`[JobQueue] Race ${raceId} completion processed successfully`);
  } catch (error) {
    console.error(`[JobQueue] Error processing race ${raceId}:`, error);
    throw error; // Let BullMQ handle retry
  }
}

/**
 * Process leaderboard update job
 */
async function processLeaderboardUpdate(job: Job<LeaderboardUpdateJob>): Promise<void> {
  const { type, userId, wpm, accuracy } = job.data;
  
  console.log(`[JobQueue] Processing leaderboard update: ${type}, WPM: ${wpm}`);
  
  try {
    leaderboardCache.invalidate(type);
    console.log(`[JobQueue] Leaderboard cache invalidated for ${type}`);
  } catch (error) {
    console.error('[JobQueue] Leaderboard update error:', error);
    throw error;
  }
}

/**
 * Process achievement check job
 */
async function processAchievementCheck(job: Job<AchievementCheckJob>): Promise<void> {
  const { userId, eventType, data } = job.data;
  
  console.log(`[JobQueue] Processing achievement check for user ${userId}: ${eventType}`);
  
  try {
    // Achievement checking logic would go here
    // This is a placeholder for the actual achievement service integration
    console.log(`[JobQueue] Achievement check completed for user ${userId}`);
  } catch (error) {
    console.error('[JobQueue] Achievement check error:', error);
    throw error;
  }
}

// ==================== Public API ====================

/**
 * Queue a race completion for async processing
 */
export async function queueRaceCompletion(data: RaceCompletionJob): Promise<string | null> {
  if (!raceCompletionQueue) {
    // Process synchronously if queues not available
    console.log('[JobQueue] Queue not available, processing synchronously');
    return null;
  }
  
  const job = await raceCompletionQueue.add('complete', data, {
    jobId: `race-${data.raceId}-${Date.now()}`,
  });
  
  return job.id || null;
}

/**
 * Queue a leaderboard update
 */
export async function queueLeaderboardUpdate(data: LeaderboardUpdateJob): Promise<string | null> {
  if (!leaderboardUpdateQueue) {
    return null;
  }
  
  const job = await leaderboardUpdateQueue.add('update', data);
  return job.id || null;
}

/**
 * Queue an achievement check
 */
export async function queueAchievementCheck(data: AchievementCheckJob): Promise<string | null> {
  if (!achievementCheckQueue) {
    return null;
  }
  
  const job = await achievementCheckQueue.add('check', data);
  return job.id || null;
}

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<{
  raceCompletion: { waiting: number; active: number; completed: number; failed: number } | null;
  leaderboardUpdate: { waiting: number; active: number; completed: number; failed: number } | null;
  achievementCheck: { waiting: number; active: number; completed: number; failed: number } | null;
}> {
  const getStats = async (queue: Queue | null) => {
    if (!queue) return null;
    
    const [waiting, active, completed, failed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
    ]);
    
    return { waiting, active, completed, failed };
  };
  
  return {
    raceCompletion: await getStats(raceCompletionQueue),
    leaderboardUpdate: await getStats(leaderboardUpdateQueue),
    achievementCheck: await getStats(achievementCheckQueue),
  };
}

/**
 * Shutdown job queues gracefully
 */
export async function shutdownJobQueues(): Promise<void> {
  console.log('[JobQueue] Shutting down...');
  
  const closePromises: Promise<void>[] = [];
  
  // Close workers first (they should finish current jobs)
  if (raceCompletionWorker) {
    closePromises.push(raceCompletionWorker.close());
  }
  if (leaderboardUpdateWorker) {
    closePromises.push(leaderboardUpdateWorker.close());
  }
  if (achievementCheckWorker) {
    closePromises.push(achievementCheckWorker.close());
  }
  
  await Promise.all(closePromises);
  
  // Then close queues
  const queueClosePromises: Promise<void>[] = [];
  
  if (raceCompletionQueue) {
    queueClosePromises.push(raceCompletionQueue.close());
  }
  if (leaderboardUpdateQueue) {
    queueClosePromises.push(leaderboardUpdateQueue.close());
  }
  if (achievementCheckQueue) {
    queueClosePromises.push(achievementCheckQueue.close());
  }
  
  await Promise.all(queueClosePromises);
  
  console.log('[JobQueue] Shutdown complete');
}

/**
 * Check if job queues are available
 */
export function isJobQueueAvailable(): boolean {
  return raceCompletionQueue !== null;
}

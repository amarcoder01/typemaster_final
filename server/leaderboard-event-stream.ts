/**
 * Leaderboard Event Stream
 * 
 * Implements Redis Streams for high-throughput score event processing.
 * Separates write path from read path for horizontal scaling.
 * 
 * Key features:
 * - Event batching with configurable window
 * - Consumer groups for parallel processing
 * - Dead letter queue for failed events
 * - Idempotent event handling
 */

import { redisClient, REDIS_ENABLED, SERVER_ID, getRedis } from './redis-client';
import { 
  LeaderboardScoreEvent, 
  LeaderboardBatch,
  LeaderboardTimeframe,
  getLeaderboardConfig 
} from '../shared/leaderboard-types';
import crypto from 'node:crypto';

// Redis Stream keys
const STREAM_KEY = 'leaderboard:events:stream';
const CONSUMER_GROUP = 'leaderboard-processors';
const DEAD_LETTER_KEY = 'leaderboard:events:deadletter';
const PENDING_BATCHES_KEY = 'leaderboard:batches:pending';

// Configuration
const config = getLeaderboardConfig();
const DEAD_LETTER_MAXLEN = parseInt(process.env.LEADERBOARD_DEAD_LETTER_MAXLEN || '10000', 10);
const CONSUME_BACKOFF_BASE_MS = parseInt(process.env.LEADERBOARD_STREAM_BACKOFF_BASE_MS || '500', 10);
const CONSUME_BACKOFF_MAX_MS = parseInt(process.env.LEADERBOARD_STREAM_BACKOFF_MAX_MS || '10000', 10);

/**
 * In-memory fallback for when Redis is disabled
 */
class InMemoryEventStream {
  private events: LeaderboardScoreEvent[] = [];
  private batchCallbacks: ((batch: LeaderboardBatch) => Promise<void>)[] = [];
  private batchTimer: NodeJS.Timeout | null = null;

  async publish(event: LeaderboardScoreEvent): Promise<string> {
    const eventId = `mem-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    event.eventId = eventId;
    this.events.push(event);
    
    // Start batch timer if not running
    if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => this.flushBatch(), config.batchWindowMs);
    }
    
    // Force flush if max size reached
    if (this.events.length >= config.batchMaxSize) {
      this.flushBatch();
    }
    
    return eventId;
  }

  private async flushBatch(): Promise<void> {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    
    if (this.events.length === 0) return;
    
    const batch: LeaderboardBatch = {
      batchId: `batch-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      events: [...this.events],
      startTime: this.events[0].timestamp,
      endTime: Date.now(),
      affectedLanguages: [...new Set(this.events.map(e => e.language))],
      affectedTimeframes: this.determineTimeframes(),
    };
    
    this.events = [];
    
    // Process batch with all registered callbacks
    for (const callback of this.batchCallbacks) {
      try {
        await callback(batch);
      } catch (error) {
        console.error('[EventStream:InMemory] Batch processing failed:', error);
      }
    }
  }

  private determineTimeframes(): LeaderboardTimeframe[] {
    // All events affect all timeframes
    return ['daily', 'weekly', 'monthly', 'all'];
  }

  onBatch(callback: (batch: LeaderboardBatch) => Promise<void>): void {
    this.batchCallbacks.push(callback);
  }

  async shutdown(): Promise<void> {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      await this.flushBatch();
    }
  }
}

/**
 * Redis Streams based event stream for distributed processing
 */
class RedisEventStream {
  private consumerName: string;
  private isConsuming = false;
  private batchBuffer: Map<string, LeaderboardScoreEvent[]> = new Map();
  private batchCallbacks: ((batch: LeaderboardBatch) => Promise<void>)[] = [];
  private batchTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.consumerName = `consumer-${SERVER_ID}`;
  }

  /**
   * Initialize the stream and consumer group
   */
  async initialize(): Promise<void> {
    const redis = getRedis();
    
    try {
      // Create stream if it doesn't exist (MKSTREAM)
      await redis.xgroup('CREATE', STREAM_KEY, CONSUMER_GROUP, '0', 'MKSTREAM');
      console.log('[EventStream:Redis] Consumer group created');
    } catch (error: any) {
      // Group already exists - that's fine
      if (!error.message?.includes('BUSYGROUP')) {
        throw error;
      }
      console.log('[EventStream:Redis] Consumer group already exists');
    }
  }

  /**
   * Publish a score event to the stream
   */
  async publish(event: LeaderboardScoreEvent): Promise<string> {
    const redis = getRedis();
    
    // Generate event ID if not provided
    event.eventId = event.eventId || `evt-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    
    // Serialize event data for Redis Stream
    const fields: string[] = [];
    for (const [key, value] of Object.entries(event)) {
      if (value !== undefined && value !== null) {
        fields.push(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
      }
    }
    
    // Add to stream with auto-generated ID
    const streamId = await redis.xadd(STREAM_KEY, '*', ...fields);
    
    if (!streamId) {
      throw new Error('Failed to add event to stream');
    }
    
    console.log(`[EventStream:Redis] Published event ${event.eventId} -> ${streamId}`);
    return streamId;
  }

  /**
   * Start consuming events from the stream
   */
  async startConsuming(): Promise<void> {
    if (this.isConsuming) return;
    this.isConsuming = true;
    
    console.log(`[EventStream:Redis] Starting consumer: ${this.consumerName}`);
    
    // Process any pending messages first
    await this.processPending();
    
    // Start continuous consumption
    this.consumeLoop();
  }

  /**
   * Process pending messages that weren't acknowledged
   */
  private async processPending(): Promise<void> {
    const redis = getRedis();
    
    try {
      // Read pending messages for this consumer
      const pending = await redis.xreadgroup(
        'GROUP', CONSUMER_GROUP, this.consumerName,
        'COUNT', '100',
        'STREAMS', STREAM_KEY, '0'
      );
      
      if (pending && pending.length > 0) {
        const [, messages] = pending[0] as [string, [string, string[]][]];
        console.log(`[EventStream:Redis] Processing ${messages.length} pending messages`);
        
        for (const [id, fields] of messages) {
          await this.processMessage(id, fields);
        }
      }
    } catch (error) {
      console.error('[EventStream:Redis] Error processing pending:', error);
    }
  }

  /**
   * Main consumption loop
   */
  private async consumeLoop(): Promise<void> {
    const redis = getRedis();
    let backoffMs = CONSUME_BACKOFF_BASE_MS;
    
    while (this.isConsuming) {
      try {
        // Block for up to batchWindowMs waiting for new messages
        // Use call for proper argument typing with BLOCK
        const results = await (redis as any).call(
          'XREADGROUP',
          'GROUP', CONSUMER_GROUP, this.consumerName,
          'BLOCK', config.batchWindowMs.toString(),
          'COUNT', config.batchMaxSize.toString(),
          'STREAMS', STREAM_KEY, '>'
        ) as [string, [string, string[]][]][] | null;
        
        if (results && results.length > 0) {
          const [, messages] = results[0] as [string, [string, string[]][]];
          
          for (const [id, fields] of messages) {
            await this.processMessage(id, fields);
          }
        }
        
        // Flush any pending batches that have exceeded the window
        this.flushExpiredBatches();
        backoffMs = CONSUME_BACKOFF_BASE_MS;
        
      } catch (error) {
        console.error('[EventStream:Redis] Consumer error:', error);
        const jitter = Math.floor(Math.random() * 250);
        await new Promise(resolve => setTimeout(resolve, Math.min(backoffMs + jitter, CONSUME_BACKOFF_MAX_MS)));
        backoffMs = Math.min(backoffMs * 2, CONSUME_BACKOFF_MAX_MS);
      }
    }
  }

  /**
   * Process a single message from the stream
   */
  private async processMessage(messageId: string, fields: string[]): Promise<void> {
    const redis = getRedis();
    
    try {
      // Parse fields into event object
      const event = this.parseFields(fields);
      this.validateEvent(event);
      
      // Add to batch buffer by language (for targeted updates)
      const batchKey = `${event.language}:${event.leaderboardMode || 'global'}`;
      
      if (!this.batchBuffer.has(batchKey)) {
        this.batchBuffer.set(batchKey, []);
        
        // Set timer for this batch
        const timer = setTimeout(() => {
          this.flushBatch(batchKey);
        }, config.batchWindowMs);
        this.batchTimers.set(batchKey, timer);
      }
      
      this.batchBuffer.get(batchKey)!.push(event);
      
      // Force flush if max size reached
      if (this.batchBuffer.get(batchKey)!.length >= config.batchMaxSize) {
        this.flushBatch(batchKey);
      }
      
      // Acknowledge the message
      await redis.xack(STREAM_KEY, CONSUMER_GROUP, messageId);
      
    } catch (error) {
      console.error(`[EventStream:Redis] Failed to process message ${messageId}:`, error);
      
      // Move to dead letter queue after retries
      await this.moveToDeadLetter(messageId, fields, error);
    }
  }

  /**
   * Parse Redis Stream fields back into event object
   */
  private parseFields(fields: string[]): LeaderboardScoreEvent {
    const event: any = {};
    
    for (let i = 0; i < fields.length; i += 2) {
      const key = fields[i];
      const value = fields[i + 1];
      
      // Parse numeric fields
      if (['wpm', 'accuracy', 'mode', 'timestamp', 'testResultId'].includes(key)) {
        event[key] = parseFloat(value);
      } else if (['isVerified'].includes(key)) {
        event[key] = value === 'true';
      } else {
        event[key] = value;
      }
    }
    
    return event as LeaderboardScoreEvent;
  }

  private validateEvent(event: LeaderboardScoreEvent): void {
    if (!event.userId || !event.username || !event.language) {
      throw new Error('Invalid event: missing required fields');
    }
    if (!event.timestamp || !Number.isFinite(event.timestamp)) {
      throw new Error('Invalid event: missing timestamp');
    }
    if (!Number.isFinite(event.wpm) || event.wpm <= 0) {
      throw new Error('Invalid event: wpm');
    }
    if (!Number.isFinite(event.accuracy) || event.accuracy < 0 || event.accuracy > 100) {
      throw new Error('Invalid event: accuracy');
    }
  }

  /**
   * Flush a specific batch
   */
  private async flushBatch(batchKey: string): Promise<void> {
    // Clear timer
    const timer = this.batchTimers.get(batchKey);
    if (timer) {
      clearTimeout(timer);
      this.batchTimers.delete(batchKey);
    }
    
    const events = this.batchBuffer.get(batchKey);
    if (!events || events.length === 0) return;
    
    this.batchBuffer.delete(batchKey);
    
    // Create batch
    const batch: LeaderboardBatch = {
      batchId: `batch-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      events: this.deduplicateEvents(events),
      startTime: Math.min(...events.map(e => e.timestamp)),
      endTime: Date.now(),
      affectedLanguages: [...new Set(events.map(e => e.language))],
      affectedTimeframes: ['daily', 'weekly', 'monthly', 'all'],
    };
    
    console.log(`[EventStream:Redis] Flushing batch ${batch.batchId} with ${batch.events.length} events`);
    
    // Process batch with all registered callbacks
    for (const callback of this.batchCallbacks) {
      try {
        await callback(batch);
      } catch (error) {
        console.error('[EventStream:Redis] Batch callback failed:', error);
      }
    }
  }

  /**
   * Flush batches that have exceeded their time window
   */
  private flushExpiredBatches(): void {
    // Timers handle expiration, this is just for safety
    for (const batchKey of this.batchBuffer.keys()) {
      if (!this.batchTimers.has(batchKey)) {
        this.flushBatch(batchKey);
      }
    }
  }

  /**
   * Deduplicate events - keep only best score per user in batch
   */
  private deduplicateEvents(events: LeaderboardScoreEvent[]): LeaderboardScoreEvent[] {
    const bestByUser = new Map<string, LeaderboardScoreEvent>();
    
    for (const event of events) {
      const existing = bestByUser.get(event.userId);
      if (!existing || event.wpm > existing.wpm) {
        bestByUser.set(event.userId, event);
      }
    }
    
    return Array.from(bestByUser.values());
  }

  /**
   * Move failed message to dead letter queue
   */
  private async moveToDeadLetter(
    messageId: string, 
    fields: string[], 
    error: any
  ): Promise<void> {
    const redis = getRedis();
    
    try {
      // Add to dead letter stream with error info
      await redis.xadd(
        DEAD_LETTER_KEY, '*',
        'originalId', messageId,
        'error', String(error),
        'timestamp', Date.now().toString(),
        ...fields
      );
      try {
        await (redis as any).call(
          'XTRIM',
          DEAD_LETTER_KEY,
          'MAXLEN',
          '~',
          DEAD_LETTER_MAXLEN.toString()
        );
      } catch (trimError) {
        console.error('[EventStream:Redis] Dead letter trim failed:', trimError);
      }
      
      // Acknowledge original message
      await redis.xack(STREAM_KEY, CONSUMER_GROUP, messageId);
      
      console.log(`[EventStream:Redis] Moved message ${messageId} to dead letter queue`);
    } catch (dlError) {
      console.error('[EventStream:Redis] Failed to move to dead letter:', dlError);
    }
  }

  /**
   * Register a callback for batch processing
   */
  onBatch(callback: (batch: LeaderboardBatch) => Promise<void>): void {
    this.batchCallbacks.push(callback);
  }

  /**
   * Stop consuming and flush remaining batches
   */
  async shutdown(): Promise<void> {
    this.isConsuming = false;
    
    // Flush all pending batches
    for (const batchKey of this.batchBuffer.keys()) {
      await this.flushBatch(batchKey);
    }
    
    // Clear all timers
    for (const timer of this.batchTimers.values()) {
      clearTimeout(timer);
    }
    this.batchTimers.clear();
    
    console.log('[EventStream:Redis] Consumer shutdown complete');
  }

  /**
   * Get stream statistics
   */
  async getStats(): Promise<{
    streamLength: number;
    pendingCount: number;
    deadLetterCount: number;
    consumerLag: number;
  }> {
    const redis = getRedis();
    
    try {
      const [streamLength, pendingInfo, deadLetterLength] = await Promise.all([
        redis.xlen(STREAM_KEY),
        redis.xpending(STREAM_KEY, CONSUMER_GROUP),
        redis.xlen(DEAD_LETTER_KEY),
      ]);
      
      const pendingCount = Array.isArray(pendingInfo) ? (pendingInfo[0] as number) || 0 : 0;
      
      return {
        streamLength,
        pendingCount,
        deadLetterCount: deadLetterLength,
        consumerLag: pendingCount,
      };
    } catch {
      return {
        streamLength: 0,
        pendingCount: 0,
        deadLetterCount: 0,
        consumerLag: 0,
      };
    }
  }
}

// Export singleton instances
let inMemoryStream: InMemoryEventStream | null = null;
let redisStream: RedisEventStream | null = null;

/**
 * Get the appropriate event stream based on Redis availability
 */
export function getEventStream(): InMemoryEventStream | RedisEventStream {
  if (REDIS_ENABLED) {
    if (!redisStream) {
      redisStream = new RedisEventStream();
    }
    return redisStream;
  } else {
    if (!inMemoryStream) {
      inMemoryStream = new InMemoryEventStream();
    }
    return inMemoryStream;
  }
}

/**
 * Initialize the event stream
 */
export async function initializeEventStream(): Promise<void> {
  const stream = getEventStream();
  
  if (stream instanceof RedisEventStream) {
    await stream.initialize();
    await stream.startConsuming();
  }
  
  console.log(`[EventStream] Initialized (Redis: ${REDIS_ENABLED})`);
}

/**
 * Publish a score event to the stream
 */
export async function publishScoreEvent(event: LeaderboardScoreEvent): Promise<string> {
  const stream = getEventStream();
  return stream.publish(event);
}

/**
 * Register a callback for batch processing
 */
export function onBatchReady(callback: (batch: LeaderboardBatch) => Promise<void>): void {
  const stream = getEventStream();
  stream.onBatch(callback);
}

/**
 * Shutdown the event stream gracefully
 */
export async function shutdownEventStream(): Promise<void> {
  const stream = getEventStream();
  await stream.shutdown();
}

/**
 * Get stream statistics (Redis only)
 */
export async function getStreamStats(): Promise<{
  streamLength: number;
  pendingCount: number;
  deadLetterCount: number;
  consumerLag: number;
} | null> {
  const stream = getEventStream();
  if (stream instanceof RedisEventStream) {
    return stream.getStats();
  }
  return null;
}

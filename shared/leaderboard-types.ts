/**
 * Shared Leaderboard Types for Scale Architecture
 * Used across server and client for type-safe real-time updates
 */

// Client tier classification for tiered update delivery
export type ClientTier = 'active' | 'passive' | 'observer';

// Leaderboard modes supported
export type LeaderboardMode = 'global' | 'code' | 'stress' | 'dictation' | 'rating' | 'book';

// Timeframe options
export type LeaderboardTimeframe = 'all' | 'daily' | 'weekly' | 'monthly';

/**
 * Event published to Redis Stream when a score is submitted
 */
export interface LeaderboardScoreEvent {
  eventId?: string;
  userId: string;
  username: string;
  wpm: number;
  accuracy: number;
  mode: number; // Test duration mode (15, 30, 60, 120)
  language: string;
  leaderboardMode: LeaderboardMode;
  timestamp: number;
  testResultId?: number;
  isVerified?: boolean;
  avatarColor?: string;
}

/**
 * Aggregated batch of score events for processing
 */
export interface LeaderboardBatch {
  batchId: string;
  events: LeaderboardScoreEvent[];
  startTime: number;
  endTime: number;
  affectedLanguages: string[];
  affectedTimeframes: LeaderboardTimeframe[];
}

/**
 * Individual rank change within a delta update
 */
export interface RankChange {
  userId: string;
  username: string;
  oldRank: number | null;
  newRank: number;
  wpm: number;
  accuracy: number;
  avatarColor?: string | null;
  isVerified?: boolean;
  changeType: 'new' | 'improved' | 'dropped' | 'unchanged';
}

/**
 * Delta update payload - only changes, not full leaderboard
 * Significantly reduces bandwidth compared to full payloads
 */
export interface LeaderboardDelta {
  version: number;
  mode: LeaderboardMode;
  timeframe: LeaderboardTimeframe;
  language: string;
  changes: RankChange[];
  removed: string[]; // userIds no longer in visible range
  topN: number; // Number of top entries this delta covers
  timestamp: number;
  batchId?: string;
}

/**
 * Full leaderboard snapshot for cache and CDN
 */
export interface LeaderboardSnapshot {
  version: number;
  mode: LeaderboardMode;
  timeframe: LeaderboardTimeframe;
  language: string;
  entries: LeaderboardEntry[];
  total: number;
  generatedAt: number;
  expiresAt: number;
}

/**
 * Individual leaderboard entry
 */
export interface LeaderboardEntry {
  userId: string;
  username: string;
  wpm: number;
  accuracy: number;
  rank: number;
  mode?: number;
  totalTests?: number;
  avatarColor?: string | null;
  isVerified?: boolean;
  createdAt?: string;
}

/**
 * Around-me cache entry for personalized rank views
 */
export interface AroundMeCache {
  userId: string;
  userRank: number;
  entries: LeaderboardEntry[];
  mode: LeaderboardMode;
  timeframe: LeaderboardTimeframe;
  language: string;
  cachedAt: number;
  expiresAt: number;
}

/**
 * WebSocket subscription for a client
 */
export interface LeaderboardSubscription {
  clientId: string;
  userId?: string;
  mode: LeaderboardMode;
  timeframe: LeaderboardTimeframe;
  language: string;
  tier: ClientTier;
  subscribedAt: number;
  lastActivity: number;
  serverId: string;
}

/**
 * Metrics for observability
 */
export interface LeaderboardMetrics {
  // Connection metrics
  activeConnections: number;
  connectionsByTier: Record<ClientTier, number>;
  connectionsByMode: Record<string, number>;
  
  // Message metrics
  messagesSentPerSecond: number;
  messagesReceivedPerSecond: number;
  broadcastsPerSecond: number;
  averageFanOut: number;
  
  // Batch processing metrics
  batchesProcessed: number;
  averageBatchSize: number;
  eventsProcessedPerSecond: number;
  
  // Cache metrics
  cacheHitRate: number;
  topNCacheHits: number;
  aroundMeCacheHits: number;
  
  // Latency metrics
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  
  // Queue metrics
  streamLag: number;
  pendingEvents: number;
  deadLetterCount: number;
  
  // Error metrics
  errors: number;
  droppedMessages: number;
  
  // Timestamp
  collectedAt: number;
}

/**
 * Configuration for leaderboard scaling
 */
export interface LeaderboardConfig {
  // Event batching
  batchWindowMs: number;
  batchMaxSize: number;
  streamConsumers: number;
  
  // Tiered updates
  tierActiveIntervalMs: number;
  tierPassiveIntervalMs: number;
  tierObserverIntervalMs: number;
  
  // Caching
  topNSize: number;
  aroundMeRange: number;
  snapshotIntervalMs: number;
  
  // Backpressure
  maxQueuePerClient: number;
  backpressureThresholdBytes: number;
  
  // Rate limiting
  maxConnectionsPerIP: number;
  maxConnectionsInWindow: number;
  rateLimitWindowMs: number;
}

/**
 * Get default configuration with environment variable overrides
 */
export function getLeaderboardConfig(): LeaderboardConfig {
  return {
    // Event batching
    batchWindowMs: parseInt(process.env.LEADERBOARD_BATCH_WINDOW_MS || '2000', 10),
    batchMaxSize: parseInt(process.env.LEADERBOARD_BATCH_MAX_SIZE || '100', 10),
    streamConsumers: parseInt(process.env.LEADERBOARD_STREAM_CONSUMERS || '3', 10),
    
    // Tiered updates
    tierActiveIntervalMs: parseInt(process.env.LEADERBOARD_TIER_ACTIVE_INTERVAL_MS || '2000', 10),
    tierPassiveIntervalMs: parseInt(process.env.LEADERBOARD_TIER_PASSIVE_INTERVAL_MS || '10000', 10),
    tierObserverIntervalMs: parseInt(process.env.LEADERBOARD_TIER_OBSERVER_INTERVAL_MS || '30000', 10),
    
    // Caching
    topNSize: parseInt(process.env.LEADERBOARD_TOP_N_SIZE || '100', 10),
    aroundMeRange: parseInt(process.env.LEADERBOARD_AROUND_ME_RANGE || '10', 10),
    snapshotIntervalMs: parseInt(process.env.LEADERBOARD_SNAPSHOT_INTERVAL_MS || '60000', 10),
    
    // Backpressure
    maxQueuePerClient: parseInt(process.env.LEADERBOARD_MAX_QUEUE_PER_CLIENT || '50', 10),
    backpressureThresholdBytes: parseInt(process.env.LEADERBOARD_BACKPRESSURE_THRESHOLD_BYTES || '16384', 10),
    
    // Rate limiting
    maxConnectionsPerIP: parseInt(process.env.WS_MAX_CONNECTIONS_PER_IP || '10', 10),
    maxConnectionsInWindow: parseInt(process.env.WS_MAX_CONNECTIONS_IN_WINDOW || '20', 10),
    rateLimitWindowMs: parseInt(process.env.WS_RATE_LIMIT_WINDOW_MS || '60000', 10),
  };
}

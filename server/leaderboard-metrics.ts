/**
 * Comprehensive Leaderboard Metrics Collection
 * 
 * Aggregates metrics from all leaderboard subsystems:
 * - WebSocket connections and messages
 * - Event stream processing
 * - Cache hit rates
 * - Batch processing
 * - Update dispatcher
 * - Message queues
 * 
 * Exposes metrics via Prometheus-compatible endpoint and JSON API.
 */

import { LeaderboardMetrics, getLeaderboardConfig } from '../shared/leaderboard-types';
import { leaderboardWS } from './leaderboard-websocket';
import { getConnectionStats } from './leaderboard-connection-registry';
import { getBatchProcessorMetrics, getDetailedProcessorStats } from './jobs/leaderboard-batch-processor';
import { getStreamStats } from './leaderboard-event-stream';
import { leaderboardCache } from './leaderboard-cache';
import { getAroundMeStats } from './leaderboard-around-me-cache';
import { getDispatcherStats } from './leaderboard-update-dispatcher';
import { getGlobalQueueStats } from './leaderboard-message-queue';

// Latency tracking
const latencyBuckets: number[] = [];
const MAX_LATENCY_SAMPLES = 10000;

// Add latency sample
export function recordLatency(ms: number): void {
  latencyBuckets.push(ms);
  if (latencyBuckets.length > MAX_LATENCY_SAMPLES) {
    latencyBuckets.shift();
  }
}

// Calculate percentiles
function calculatePercentile(sorted: number[], percentile: number): number {
  if (sorted.length === 0) return 0;
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

/**
 * Get comprehensive metrics from all subsystems
 */
export async function getComprehensiveMetrics(): Promise<LeaderboardMetrics> {
  const config = getLeaderboardConfig();
  
  // Get WebSocket stats
  const wsStats = leaderboardWS.getStats();
  
  // Get connection registry stats
  const connStats = await getConnectionStats();
  
  // Get batch processor stats
  const batchStats = getBatchProcessorMetrics();
  
  // Get stream stats
  const streamStats = await getStreamStats();
  
  // Get cache stats
  const cacheStats = leaderboardCache.getStats();
  
  // Get around-me cache stats
  const aroundMeStats = getAroundMeStats();
  
  // Get dispatcher stats
  const dispatcherStats = getDispatcherStats();
  
  // Get queue stats
  const queueStats = getGlobalQueueStats();
  
  // Calculate latency percentiles
  const sortedLatencies = [...latencyBuckets].sort((a, b) => a - b);
  const p50 = calculatePercentile(sortedLatencies, 50);
  const p95 = calculatePercentile(sortedLatencies, 95);
  const p99 = calculatePercentile(sortedLatencies, 99);
  
  return {
    // Connection metrics
    activeConnections: wsStats.connectedClients,
    connectionsByTier: {
      active: 0, // Would need to track this in registry
      passive: 0,
      observer: 0,
    },
    connectionsByMode: wsStats.subscriptions,
    
    // Message metrics
    messagesSentPerSecond: 0, // Would need rate calculation
    messagesReceivedPerSecond: 0,
    broadcastsPerSecond: 0,
    averageFanOut: wsStats.connectedClients > 0 
      ? wsStats.metrics.broadcastsSent / Math.max(1, wsStats.connectedClients)
      : 0,
    
    // Batch processing metrics
    batchesProcessed: batchStats.batchesProcessed,
    averageBatchSize: batchStats.averageBatchSize || 0,
    eventsProcessedPerSecond: 0,
    
    // Cache metrics
    cacheHitRate: cacheStats.hitRate,
    topNCacheHits: cacheStats.hits,
    aroundMeCacheHits: aroundMeStats.hits,
    
    // Latency metrics
    p50LatencyMs: p50,
    p95LatencyMs: p95,
    p99LatencyMs: p99,
    
    // Queue metrics
    streamLag: streamStats?.consumerLag || 0,
    pendingEvents: streamStats?.pendingCount || 0,
    deadLetterCount: streamStats?.deadLetterCount || 0,
    
    // Error metrics
    errors: wsStats.metrics.errors + (batchStats.errors || 0),
    droppedMessages: queueStats.totalDropped,
    
    // Timestamp
    collectedAt: Date.now(),
  };
}

/**
 * Get Prometheus-formatted metrics
 */
export async function getPrometheusMetrics(): Promise<string> {
  const metrics = await getComprehensiveMetrics();
  const wsPrometheus = leaderboardWS.getPrometheusMetrics();
  
  const lines: string[] = [
    wsPrometheus,
    '',
    '# HELP leaderboard_active_connections Current active WebSocket connections',
    '# TYPE leaderboard_active_connections gauge',
    `leaderboard_active_connections ${metrics.activeConnections}`,
    '',
    '# HELP leaderboard_cache_hit_rate Cache hit rate (0-1)',
    '# TYPE leaderboard_cache_hit_rate gauge',
    `leaderboard_cache_hit_rate ${metrics.cacheHitRate}`,
    '',
    '# HELP leaderboard_cache_hits_total Total cache hits',
    '# TYPE leaderboard_cache_hits_total counter',
    `leaderboard_cache_hits_topn ${metrics.topNCacheHits}`,
    `leaderboard_cache_hits_aroundme ${metrics.aroundMeCacheHits}`,
    '',
    '# HELP leaderboard_batches_processed_total Total batches processed',
    '# TYPE leaderboard_batches_processed_total counter',
    `leaderboard_batches_processed_total ${metrics.batchesProcessed}`,
    '',
    '# HELP leaderboard_batch_size_avg Average batch size',
    '# TYPE leaderboard_batch_size_avg gauge',
    `leaderboard_batch_size_avg ${metrics.averageBatchSize.toFixed(2)}`,
    '',
    '# HELP leaderboard_latency_ms Latency percentiles in milliseconds',
    '# TYPE leaderboard_latency_ms gauge',
    `leaderboard_latency_p50_ms ${metrics.p50LatencyMs}`,
    `leaderboard_latency_p95_ms ${metrics.p95LatencyMs}`,
    `leaderboard_latency_p99_ms ${metrics.p99LatencyMs}`,
    '',
    '# HELP leaderboard_stream_lag Stream consumer lag',
    '# TYPE leaderboard_stream_lag gauge',
    `leaderboard_stream_lag ${metrics.streamLag}`,
    '',
    '# HELP leaderboard_pending_events Pending events in stream',
    '# TYPE leaderboard_pending_events gauge',
    `leaderboard_pending_events ${metrics.pendingEvents}`,
    '',
    '# HELP leaderboard_dead_letter_count Dead letter queue count',
    '# TYPE leaderboard_dead_letter_count gauge',
    `leaderboard_dead_letter_count ${metrics.deadLetterCount}`,
    '',
    '# HELP leaderboard_errors_total Total errors',
    '# TYPE leaderboard_errors_total counter',
    `leaderboard_errors_total ${metrics.errors}`,
    '',
    '# HELP leaderboard_dropped_messages_total Dropped messages due to backpressure',
    '# TYPE leaderboard_dropped_messages_total counter',
    `leaderboard_dropped_messages_total ${metrics.droppedMessages}`,
  ];
  
  return lines.join('\n');
}

/**
 * Get detailed metrics for admin dashboard
 */
export async function getDetailedMetrics(): Promise<{
  summary: LeaderboardMetrics;
  websocket: ReturnType<typeof leaderboardWS.getStats>;
  connections: Awaited<ReturnType<typeof getConnectionStats>>;
  batchProcessor: Awaited<ReturnType<typeof getDetailedProcessorStats>>;
  stream: Awaited<ReturnType<typeof getStreamStats>>;
  cache: ReturnType<typeof leaderboardCache.getStats>;
  aroundMe: ReturnType<typeof getAroundMeStats>;
  dispatcher: ReturnType<typeof getDispatcherStats>;
  queues: ReturnType<typeof getGlobalQueueStats>;
  config: ReturnType<typeof getLeaderboardConfig>;
}> {
  return {
    summary: await getComprehensiveMetrics(),
    websocket: leaderboardWS.getStats(),
    connections: await getConnectionStats(),
    batchProcessor: await getDetailedProcessorStats(),
    stream: await getStreamStats(),
    cache: leaderboardCache.getStats(),
    aroundMe: getAroundMeStats(),
    dispatcher: getDispatcherStats(),
    queues: getGlobalQueueStats(),
    config: getLeaderboardConfig(),
  };
}

/**
 * Health check for leaderboard system
 */
export async function leaderboardHealthCheck(): Promise<{
  healthy: boolean;
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    websocket: boolean;
    redis: boolean;
    stream: boolean;
    cache: boolean;
  };
  details: string[];
}> {
  const details: string[] = [];
  const checks = {
    websocket: true,
    redis: true,
    stream: true,
    cache: true,
  };
  
  // Check WebSocket
  const wsStats = leaderboardWS.getStats();
  if (wsStats.metrics.errors > 100) {
    checks.websocket = false;
    details.push(`High WebSocket error rate: ${wsStats.metrics.errors}`);
  }
  
  // Check stream
  const streamStats = await getStreamStats();
  if (streamStats) {
    if (streamStats.consumerLag > 1000) {
      checks.stream = false;
      details.push(`High stream lag: ${streamStats.consumerLag}`);
    }
    if (streamStats.deadLetterCount > 100) {
      checks.stream = false;
      details.push(`High dead letter count: ${streamStats.deadLetterCount}`);
    }
  }
  
  // Check cache
  const cacheStats = leaderboardCache.getStats();
  if (cacheStats.hitRate < 0.5 && cacheStats.hits + cacheStats.misses > 100) {
    checks.cache = false;
    details.push(`Low cache hit rate: ${(cacheStats.hitRate * 100).toFixed(1)}%`);
  }
  
  // Determine overall status
  const allHealthy = Object.values(checks).every(v => v);
  const anyUnhealthy = Object.values(checks).some(v => !v);
  
  let status: 'healthy' | 'degraded' | 'unhealthy';
  if (allHealthy) {
    status = 'healthy';
  } else if (anyUnhealthy && Object.values(checks).filter(v => !v).length >= 2) {
    status = 'unhealthy';
  } else {
    status = 'degraded';
  }
  
  return {
    healthy: allHealthy,
    status,
    checks,
    details,
  };
}

/**
 * Reset all metrics (for testing/monitoring intervals)
 */
export function resetMetrics(): void {
  leaderboardWS.resetMetrics();
  latencyBuckets.length = 0;
}

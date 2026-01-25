import { Registry, Counter, Gauge, Histogram, collectDefaultMetrics } from 'prom-client';

/**
 * Prometheus Metrics Exporter
 * 
 * Provides comprehensive observability for the TypeMasterAI platform.
 * Metrics are exposed at /metrics endpoint for Prometheus scraping.
 */

// Create a custom registry to avoid conflicts with other packages
export const register = new Registry();

// Collect default Node.js metrics (CPU, memory, event loop, etc.)
collectDefaultMetrics({
  register,
  prefix: 'typingrace_',
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
});

// ==================== WebSocket Metrics ====================

export const wsConnections = new Gauge({
  name: 'typingrace_websocket_connections_total',
  help: 'Total active WebSocket connections',
  registers: [register],
});

export const wsConnectionsByServer = new Gauge({
  name: 'typingrace_websocket_connections_by_server',
  help: 'WebSocket connections per server instance',
  labelNames: ['server_id'],
  registers: [register],
});

export const wsMessagesReceived = new Counter({
  name: 'typingrace_websocket_messages_received_total',
  help: 'Total WebSocket messages received',
  labelNames: ['type'],
  registers: [register],
});

export const wsMessagesSent = new Counter({
  name: 'typingrace_websocket_messages_sent_total',
  help: 'Total WebSocket messages sent',
  labelNames: ['type'],
  registers: [register],
});

export const wsMessagesDropped = new Counter({
  name: 'typingrace_websocket_messages_dropped_total',
  help: 'Total WebSocket messages dropped (rate limited)',
  labelNames: ['reason'],
  registers: [register],
});

export const wsConnectionDuration = new Histogram({
  name: 'typingrace_websocket_connection_duration_seconds',
  help: 'WebSocket connection duration in seconds',
  buckets: [1, 5, 10, 30, 60, 120, 300, 600, 1800, 3600],
  registers: [register],
});

// ==================== Race Metrics ====================

export const activeRaces = new Gauge({
  name: 'typingrace_active_races',
  help: 'Number of currently active races',
  labelNames: ['status'],
  registers: [register],
});

export const racesCreated = new Counter({
  name: 'typingrace_races_created_total',
  help: 'Total number of races created',
  labelNames: ['mode', 'type'],
  registers: [register],
});

export const racesCompleted = new Counter({
  name: 'typingrace_races_completed_total',
  help: 'Total number of races completed',
  labelNames: ['mode'],
  registers: [register],
});

export const raceDuration = new Histogram({
  name: 'typingrace_race_duration_seconds',
  help: 'Race duration from start to finish',
  labelNames: ['mode'],
  buckets: [10, 30, 60, 90, 120, 180, 240, 300, 600],
  registers: [register],
});

export const raceParticipants = new Histogram({
  name: 'typingrace_race_participants',
  help: 'Number of participants per race',
  buckets: [1, 2, 3, 4, 5, 6, 7, 8, 10, 15, 20],
  registers: [register],
});

// ==================== Database Metrics ====================

export const dbConnectionsActive = new Gauge({
  name: 'typingrace_db_connections_active',
  help: 'Active database connections',
  labelNames: ['pool'],
  registers: [register],
});

export const dbConnectionsIdle = new Gauge({
  name: 'typingrace_db_connections_idle',
  help: 'Idle database connections',
  labelNames: ['pool'],
  registers: [register],
});

export const dbConnectionsWaiting = new Gauge({
  name: 'typingrace_db_connections_waiting',
  help: 'Waiting database connections',
  labelNames: ['pool'],
  registers: [register],
});

export const dbQueryDuration = new Histogram({
  name: 'typingrace_db_query_duration_seconds',
  help: 'Database query duration',
  labelNames: ['operation', 'table'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

export const dbErrors = new Counter({
  name: 'typingrace_db_errors_total',
  help: 'Total database errors',
  labelNames: ['operation', 'error_type'],
  registers: [register],
});

// ==================== Redis Metrics ====================

export const redisOperations = new Counter({
  name: 'typingrace_redis_operations_total',
  help: 'Total Redis operations',
  labelNames: ['operation', 'status'],
  registers: [register],
});

export const redisOperationDuration = new Histogram({
  name: 'typingrace_redis_operation_duration_seconds',
  help: 'Redis operation duration',
  labelNames: ['operation'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
  registers: [register],
});

export const redisConnectionStatus = new Gauge({
  name: 'typingrace_redis_connection_status',
  help: 'Redis connection status (1 = connected, 0 = disconnected)',
  labelNames: ['client'],
  registers: [register],
});

// ==================== Cache Metrics ====================

export const cacheHits = new Counter({
  name: 'typingrace_cache_hits_total',
  help: 'Total cache hits',
  labelNames: ['cache_type'],
  registers: [register],
});

export const cacheMisses = new Counter({
  name: 'typingrace_cache_misses_total',
  help: 'Total cache misses',
  labelNames: ['cache_type'],
  registers: [register],
});

export const cacheSize = new Gauge({
  name: 'typingrace_cache_size',
  help: 'Current cache size (number of entries)',
  labelNames: ['cache_type'],
  registers: [register],
});

export const cacheEvictions = new Counter({
  name: 'typingrace_cache_evictions_total',
  help: 'Total cache evictions',
  labelNames: ['cache_type', 'reason'],
  registers: [register],
});

// ==================== HTTP Metrics ====================

export const httpRequestDuration = new Histogram({
  name: 'typingrace_http_request_duration_seconds',
  help: 'HTTP request duration',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

export const httpRequestsTotal = new Counter({
  name: 'typingrace_http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// ==================== Rate Limiting Metrics ====================

export const rateLimitHits = new Counter({
  name: 'typingrace_rate_limit_hits_total',
  help: 'Total rate limit hits',
  labelNames: ['type', 'action'],
  registers: [register],
});

export const rateLimitBans = new Counter({
  name: 'typingrace_rate_limit_bans_total',
  help: 'Total rate limit bans',
  labelNames: ['type'],
  registers: [register],
});

// ==================== Anticheat Metrics ====================

export const anticheatViolations = new Counter({
  name: 'typingrace_anticheat_violations_total',
  help: 'Total anticheat violations detected',
  labelNames: ['type', 'action'],
  registers: [register],
});

export const anticheatChecks = new Counter({
  name: 'typingrace_anticheat_checks_total',
  help: 'Total anticheat checks performed',
  labelNames: ['type', 'result'],
  registers: [register],
});

// ==================== User/Session Metrics ====================

export const activeUsers = new Gauge({
  name: 'typingrace_active_users',
  help: 'Number of currently active users',
  labelNames: ['type'],
  registers: [register],
});

export const userLogins = new Counter({
  name: 'typingrace_user_logins_total',
  help: 'Total user logins',
  labelNames: ['method', 'status'],
  registers: [register],
});

// ==================== Performance Metrics ====================

export const operationDuration = new Histogram({
  name: 'typingrace_operation_duration_seconds',
  help: 'Generic operation duration for custom timing',
  labelNames: ['operation', 'status'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

// ==================== Server Health Metrics ====================

export const serverUptime = new Gauge({
  name: 'typingrace_server_uptime_seconds',
  help: 'Server uptime in seconds',
  registers: [register],
});

export const serverInfo = new Gauge({
  name: 'typingrace_server_info',
  help: 'Server information',
  labelNames: ['version', 'node_version', 'server_id'],
  registers: [register],
});

// ==================== Helper Functions ====================

const startTime = Date.now();

/**
 * Update server metrics
 */
export function updateServerMetrics(serverId: string): void {
  serverUptime.set((Date.now() - startTime) / 1000);
  serverInfo.set({ 
    version: process.env.npm_package_version || '1.0.0',
    node_version: process.version,
    server_id: serverId,
  }, 1);
}

/**
 * Record an operation with timing
 */
export function recordOperation(
  operation: string,
  fn: () => Promise<any>
): Promise<any>;
export function recordOperation(
  operation: string,
  fn: () => any
): any;
export function recordOperation(
  operation: string,
  fn: () => any
): any {
  const timer = operationDuration.startTimer({ operation });
  try {
    const result = fn();
    if (result instanceof Promise) {
      return result
        .then((res) => {
          timer({ status: 'success' });
          return res;
        })
        .catch((err) => {
          timer({ status: 'error' });
          throw err;
        });
    }
    timer({ status: 'success' });
    return result;
  } catch (err) {
    timer({ status: 'error' });
    throw err;
  }
}

/**
 * Get all metrics as Prometheus format string
 */
export async function getMetrics(): Promise<string> {
  return await register.metrics();
}

/**
 * Get registry content type
 */
export function getContentType(): string {
  return register.contentType;
}

/**
 * Reset all metrics (for testing)
 */
export function resetMetrics(): void {
  register.resetMetrics();
}

// Export the main metrics object for easy access
export const metrics = {
  // WebSocket
  wsConnections,
  wsConnectionsByServer,
  wsMessagesReceived,
  wsMessagesSent,
  wsMessagesDropped,
  wsConnectionDuration,
  
  // Races
  activeRaces,
  racesCreated,
  racesCompleted,
  raceDuration,
  raceParticipants,
  
  // Database
  dbConnectionsActive,
  dbConnectionsIdle,
  dbConnectionsWaiting,
  dbQueryDuration,
  dbErrors,
  
  // Redis
  redisOperations,
  redisOperationDuration,
  redisConnectionStatus,
  
  // Cache
  cacheHits,
  cacheMisses,
  cacheSize,
  cacheEvictions,
  
  // HTTP
  httpRequestDuration,
  httpRequestsTotal,
  
  // Rate limiting
  rateLimitHits,
  rateLimitBans,
  
  // Anticheat
  anticheatViolations,
  anticheatChecks,
  
  // Users
  activeUsers,
  userLogins,
  
  // Performance
  operationDuration,
  
  // Server
  serverUptime,
  serverInfo,
  
  // Helpers
  updateServerMetrics,
  recordOperation,
  getMetrics,
  getContentType,
  resetMetrics,
  register,
};

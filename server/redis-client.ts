import Redis, { RedisOptions, Cluster } from 'ioredis';

/**
 * Redis Client Configuration for High Traffic Scaling
 * 
 * This module provides Redis connections for:
 * - Distributed race state storage
 * - Pub/Sub for cross-server WebSocket events
 * - Connection registry for single-connection integrity
 * - Rate limiting across server instances
 * - Session and cache storage
 */

// Environment configuration with fallbacks
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;
const REDIS_DB = parseInt(process.env.REDIS_DB || '0', 10);
const REDIS_TLS = process.env.REDIS_TLS === 'true';

// Check if Redis is enabled (explicit opt-in only)
// Prevents repeated reconnects/timeouts when REDIS_HOST is set but Redis is unavailable.
export const REDIS_ENABLED = process.env.REDIS_ENABLED === 'true';

// Common Redis configuration
const baseRedisConfig: RedisOptions = {
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD,
  db: REDIS_DB,
  retryStrategy: (times: number) => {
    // Exponential backoff with max delay of 2 seconds
    const delay = Math.min(times * 50, 2000);
    console.log(`[Redis] Retry attempt ${times}, waiting ${delay}ms`);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true, // Don't connect until first command
  connectTimeout: 10000,
  commandTimeout: 5000,
  // TLS configuration for production
  ...(REDIS_TLS && {
    tls: {
      rejectUnauthorized: false, // Allow self-signed certs in some environments
    },
  }),
};

// Main Redis client for general operations (GET/SET/HSET etc.)
export const redisClient = new Redis(baseRedisConfig);

// Dedicated client for Pub/Sub publishing
export const redisPub = new Redis(baseRedisConfig);

// Dedicated client for Pub/Sub subscribing
export const redisSub = new Redis(baseRedisConfig);

// Server identifier for distributed coordination
export const SERVER_ID = process.env.SERVER_ID || `server-${process.pid}-${Date.now()}`;

// Event handlers for connection management
const setupEventHandlers = (client: Redis, name: string) => {
  client.on('connect', () => {
    console.log(`[Redis:${name}] Connecting...`);
  });

  client.on('ready', () => {
    console.log(`[Redis:${name}] Connected and ready`);
  });

  client.on('error', (err: Error) => {
    console.error(`[Redis:${name}] Error:`, err.message);
  });

  client.on('close', () => {
    console.log(`[Redis:${name}] Connection closed`);
  });

  client.on('reconnecting', () => {
    console.log(`[Redis:${name}] Reconnecting...`);
  });

  client.on('end', () => {
    console.log(`[Redis:${name}] Connection ended`);
  });
};

setupEventHandlers(redisClient, 'client');
setupEventHandlers(redisPub, 'pub');
setupEventHandlers(redisSub, 'sub');

/**
 * Redis Cluster configuration (Phase 5)
 * Used when running in production with Redis Cluster
 */

// Check if cluster mode is enabled
const REDIS_CLUSTER_NODES = process.env.REDIS_CLUSTER_NODES;
export const REDIS_CLUSTER_ENABLED = !!REDIS_CLUSTER_NODES;

// Cluster client (initialized lazily)
let redisCluster: Cluster | null = null;

export const getRedisCluster = (): Cluster | null => {
  if (!REDIS_CLUSTER_NODES) {
    return null;
  }

  if (redisCluster) {
    return redisCluster;
  }

  const nodes = REDIS_CLUSTER_NODES.split(',').map(node => {
    const [host, port] = node.split(':');
    return { host, port: parseInt(port, 10) };
  });

  redisCluster = new Cluster(nodes, {
    redisOptions: {
      password: REDIS_PASSWORD,
      commandTimeout: 5000,
    },
    scaleReads: 'slave', // Read from replicas for better distribution
    natMap: {}, // For NAT environments like Kubernetes
    clusterRetryStrategy: (times: number) => Math.min(times * 100, 3000),
    enableReadyCheck: true,
  });

  // Cluster event handlers
  redisCluster.on('connect', () => {
    console.log('[Redis:Cluster] Connecting to cluster...');
  });

  redisCluster.on('ready', () => {
    console.log('[Redis:Cluster] Cluster ready');
  });

  redisCluster.on('error', (err: Error) => {
    console.error('[Redis:Cluster] Error:', err.message);
  });

  redisCluster.on('node error', (err: Error, node: { host: string; port: number }) => {
    console.error(`[Redis:Cluster] Node ${node.host}:${node.port} error:`, err.message);
  });

  redisCluster.on('+node', (node: { host: string; port: number }) => {
    console.log(`[Redis:Cluster] Node added: ${node.host}:${node.port}`);
  });

  redisCluster.on('-node', (node: { host: string; port: number }) => {
    console.log(`[Redis:Cluster] Node removed: ${node.host}:${node.port}`);
  });

  return redisCluster;
};

/**
 * Get the appropriate Redis client (cluster or standalone)
 */
export function getRedis(): Redis | Cluster {
  const cluster = getRedisCluster();
  return cluster || redisClient;
}

// Key prefixes for organized namespace
export const REDIS_KEYS = {
  // Race state keys
  race: (raceId: number) => `race:${raceId}`,
  raceParticipants: (raceId: number) => `race:${raceId}:participants`,
  raceEvents: (raceId: number) => `race:${raceId}:events`,
  raceConnections: (raceId: number) => `race:${raceId}:connections`,
  
  // Progress tracking
  progress: (participantId: number) => `progress:${participantId}`,
  participantRace: (participantId: number) => `participant:race:${participantId}`,
  
  // Connection registry
  connection: (identityKey: string) => `connection:${identityKey}`,
  serverChannel: (serverId: string) => `server:${serverId}:close`,
  
  // Rate limiting
  rateLimit: (identityKey: string, messageType: string) => `ratelimit:${identityKey}:${messageType}`,
  ipRateLimit: (ip: string) => `ratelimit:ip:${ip}`,
  ipBan: (ip: string) => `ban:ip:${ip}`,
  
  // Active servers tracking
  activeServers: () => 'servers:active',
  serverHeartbeat: (serverId: string) => `server:${serverId}:heartbeat`,
  
  // Leaderboard cache
  leaderboardCache: (type: string) => `cache:leaderboard:${type}`,
  
  // Timed race timer persistence (Phase 3 hardening)
  timedRaceExpiry: (raceId: number) => `race:${raceId}:timer_expiry`,
};

// TTL constants (in seconds)
export const REDIS_TTL = {
  race: 3600, // 1 hour
  progress: 300, // 5 minutes
  connection: 3600, // 1 hour
  rateLimit: 60, // 1 minute
  ipBan: 3600, // 1 hour
  serverHeartbeat: 60, // 1 minute
  leaderboardCache: 300, // 5 minutes
  timedRaceExpiry: 600, // 10 minutes - buffer for race completion
  raceConnections: 3600,
};

/**
 * Initialize Redis connections
 * Called during server startup
 */
export async function initializeRedis(): Promise<boolean> {
  if (!REDIS_ENABLED) {
    console.log('[Redis] Disabled - using in-memory fallback');
    return false;
  }

  try {
    // Check if using cluster mode
    if (REDIS_CLUSTER_ENABLED) {
      console.log('[Redis] Initializing in cluster mode...');
      const cluster = getRedisCluster();
      if (cluster) {
        await cluster.ping();
        console.log('[Redis] Cluster initialized successfully');
      }
    } else {
      // Connect standalone clients
      console.log('[Redis] Initializing in standalone mode...');
      await Promise.all([
        redisClient.connect().catch(() => {}), // May already be connected
        redisPub.connect().catch(() => {}),
        redisSub.connect().catch(() => {}),
      ]);

      // Test connection with PING
      await redisClient.ping();
      console.log('[Redis] Standalone clients initialized successfully');
    }

    // Register this server as active
    await registerServer();

    return true;
  } catch (error) {
    console.error('[Redis] Initialization failed:', error);
    return false;
  }
}

/**
 * Register this server in the active servers set
 */
async function registerServer(): Promise<void> {
  const now = Date.now();
  const redis = getRedis();
  
  // Add to active servers set
  await redis.zadd(REDIS_KEYS.activeServers(), now.toString(), SERVER_ID);
  
  // Set heartbeat
  await redis.set(
    REDIS_KEYS.serverHeartbeat(SERVER_ID),
    JSON.stringify({ startedAt: now, lastHeartbeat: now }),
    'EX',
    REDIS_TTL.serverHeartbeat
  );
  
  console.log(`[Redis] Server registered: ${SERVER_ID}`);
}

/**
 * Update server heartbeat (call periodically)
 */
export async function updateServerHeartbeat(): Promise<void> {
  if (!REDIS_ENABLED) return;
  
  try {
    const redis = getRedis();
    const now = Date.now();
    await redis.zadd(REDIS_KEYS.activeServers(), now.toString(), SERVER_ID);
    await redis.set(
      REDIS_KEYS.serverHeartbeat(SERVER_ID),
      JSON.stringify({ lastHeartbeat: now }),
      'EX',
      REDIS_TTL.serverHeartbeat
    );
  } catch (error) {
    console.error('[Redis] Heartbeat update failed:', error);
  }
}

/**
 * Clean up stale servers (call periodically)
 */
export async function cleanupStaleServers(): Promise<void> {
  if (!REDIS_ENABLED) return;
  
  try {
    const redis = getRedis();
    const staleThreshold = Date.now() - (REDIS_TTL.serverHeartbeat * 1000 * 2);
    await redis.zremrangebyscore(
      REDIS_KEYS.activeServers(),
      '-inf',
      staleThreshold.toString()
    );
  } catch (error) {
    console.error('[Redis] Stale server cleanup failed:', error);
  }
}

/**
 * Shutdown Redis connections gracefully
 */
export async function shutdownRedis(): Promise<void> {
  if (!REDIS_ENABLED) return;
  
  console.log('[Redis] Shutting down...');
  
  try {
    const redis = getRedis();
    
    // Deregister this server
    await redis.zrem(REDIS_KEYS.activeServers(), SERVER_ID);
    await redis.del(REDIS_KEYS.serverHeartbeat(SERVER_ID));
    
    // Close all connections based on mode
    if (REDIS_CLUSTER_ENABLED && redisCluster) {
      await redisCluster.quit();
      redisCluster = null;
    } else {
      await Promise.all([
        redisClient.quit(),
        redisPub.quit(),
        redisSub.quit(),
      ]);
    }
    
    console.log('[Redis] Shutdown complete');
  } catch (error) {
    console.error('[Redis] Shutdown error:', error);
    // Force disconnect if graceful shutdown fails
    if (REDIS_CLUSTER_ENABLED && redisCluster) {
      redisCluster.disconnect();
      redisCluster = null;
    } else {
      redisClient.disconnect();
      redisPub.disconnect();
      redisSub.disconnect();
    }
  }
}

/**
 * Health check for Redis connection
 */
export async function redisHealthCheck(): Promise<{ healthy: boolean; latencyMs?: number }> {
  if (!REDIS_ENABLED) {
    return { healthy: true }; // Not enabled means healthy (using fallback)
  }
  
  try {
    const redis = getRedis();
    const start = Date.now();
    await redis.ping();
    const latencyMs = Date.now() - start;
    return { healthy: true, latencyMs };
  } catch {
    return { healthy: false };
  }
}

/**
 * Distributed Connection Registry for Leaderboard WebSocket
 * 
 * Tracks WebSocket connections across multiple server instances using Redis.
 * Enables horizontal scaling by maintaining a shared view of all connections.
 * 
 * Key features:
 * - O(1) subscription lookups via Redis Sets
 * - Connection deduplication per user
 * - Automatic cleanup of stale connections
 * - Cross-server connection awareness
 */

import { getRedis, REDIS_ENABLED, SERVER_ID, redisSub, redisPub } from './redis-client';
import { 
  LeaderboardSubscription, 
  ClientTier, 
  LeaderboardMode, 
  LeaderboardTimeframe,
  getLeaderboardConfig 
} from '../shared/leaderboard-types';
import { WebSocket } from 'ws';

// Redis key patterns
const REDIS_KEYS = {
  // Server-specific connections
  serverConnections: (serverId: string) => `leaderboard:connections:${serverId}`,
  // Subscription index by mode:timeframe:language
  subscriptions: (mode: string, timeframe: string, language: string) => 
    `leaderboard:subscriptions:${mode}:${timeframe}:${language}`,
  // Client metadata
  client: (clientId: string) => `leaderboard:client:${clientId}`,
  // User's current connection (for deduplication)
  userConnection: (userId: string) => `leaderboard:user:${userId}`,
  // Active users (for tier tracking)
  activeUsers: () => 'leaderboard:active_users',
  // Termination channel for cross-server cleanup
  terminationChannel: (serverId: string) => `leaderboard:terminate:${serverId}`,
};

// TTLs in seconds
const TTL = {
  client: 3600,       // 1 hour
  subscription: 3600, // 1 hour
  activeUser: 300,    // 5 minutes
};

// Configuration
const config = getLeaderboardConfig();

// Local connection map (WebSocket instances can't be stored in Redis)
const localConnections = new Map<string, WebSocket>();

// Callbacks for connection termination
const terminationCallbacks: ((clientId: string, reason: string) => void)[] = [];

/**
 * Initialize the distributed registry
 * Sets up Redis pub/sub for cross-server termination
 */
export async function initializeConnectionRegistry(): Promise<void> {
  if (!REDIS_ENABLED) {
    console.log('[ConnectionRegistry] Redis disabled, using local-only mode');
    return;
  }

  // Subscribe to termination requests for this server
  const terminationChannel = REDIS_KEYS.terminationChannel(SERVER_ID);
  await redisSub.subscribe(terminationChannel);

  redisSub.on('message', (channel, message) => {
    if (channel === terminationChannel) {
      handleTerminationRequest(message);
    }
  });

  // Clean up any stale connections from previous server instances
  await cleanupStaleServerConnections();

  console.log(`[ConnectionRegistry] Initialized for server ${SERVER_ID}`);
}

/**
 * Register a new connection
 */
export async function registerConnection(
  clientId: string,
  ws: WebSocket,
  subscription: Omit<LeaderboardSubscription, 'clientId' | 'serverId' | 'subscribedAt'>
): Promise<{ success: boolean; existingConnection?: string }> {
  // Store WebSocket locally
  localConnections.set(clientId, ws);

  if (!REDIS_ENABLED) {
    return { success: true };
  }

  const redis = getRedis();
  const now = Date.now();

  // If user is authenticated, check for existing connection
  if (subscription.userId) {
    const previousClientId = await redis.set(
      REDIS_KEYS.userConnection(subscription.userId),
      clientId,
      'EX',
      TTL.client,
      'GET'
    );
    
    if (previousClientId && previousClientId !== clientId) {
      await terminateConnectionDistributed(previousClientId, 'duplicate_connection');
    }
  }

  // Store client metadata
  const clientData: LeaderboardSubscription = {
    clientId,
    ...subscription,
    serverId: SERVER_ID,
    subscribedAt: now,
  };

  await redis.hset(
    REDIS_KEYS.client(clientId),
    Object.entries(clientData).reduce((acc, [k, v]) => {
      acc[k] = typeof v === 'object' ? JSON.stringify(v) : String(v);
      return acc;
    }, {} as Record<string, string>)
  );
  await redis.expire(REDIS_KEYS.client(clientId), TTL.client);

  // Add to server's connection set
  await redis.sadd(REDIS_KEYS.serverConnections(SERVER_ID), clientId);

  // Add to subscription index
  await addToSubscriptionIndex(clientId, subscription.mode, subscription.timeframe, subscription.language);

  // If active tier, track in active users
  if (subscription.tier === 'active' && subscription.userId) {
    await redis.zadd(REDIS_KEYS.activeUsers(), now.toString(), subscription.userId);
  }

  return { success: true };
}

/**
 * Update a connection's subscription
 */
export async function updateSubscription(
  clientId: string,
  oldSubscription: { mode: LeaderboardMode; timeframe: LeaderboardTimeframe; language: string },
  newSubscription: { mode: LeaderboardMode; timeframe: LeaderboardTimeframe; language: string; tier?: ClientTier }
): Promise<void> {
  if (!REDIS_ENABLED) return;

  const redis = getRedis();

  // Remove from old subscription index
  await removeFromSubscriptionIndex(clientId, oldSubscription.mode, oldSubscription.timeframe, oldSubscription.language);

  // Add to new subscription index
  await addToSubscriptionIndex(clientId, newSubscription.mode, newSubscription.timeframe, newSubscription.language);

  // Update client metadata
  const updates: Record<string, string> = {
    mode: newSubscription.mode,
    timeframe: newSubscription.timeframe,
    language: newSubscription.language,
    lastActivity: Date.now().toString(),
  };
  if (newSubscription.tier) {
    updates.tier = newSubscription.tier;
  }

  await redis.hset(REDIS_KEYS.client(clientId), updates);
}

/**
 * Unregister a connection
 */
export async function unregisterConnection(clientId: string): Promise<void> {
  // Remove from local map
  localConnections.delete(clientId);

  if (!REDIS_ENABLED) return;

  const redis = getRedis();

  // Get client metadata for cleanup
  const clientData = await redis.hgetall(REDIS_KEYS.client(clientId));
  
  if (clientData && Object.keys(clientData).length > 0) {
    // Remove from subscription index
    await removeFromSubscriptionIndex(
      clientId,
      clientData.mode as LeaderboardMode,
      clientData.timeframe as LeaderboardTimeframe,
      clientData.language
    );

    // Remove user connection mapping if this was the current connection
    if (clientData.userId) {
      const currentClientId = await redis.get(REDIS_KEYS.userConnection(clientData.userId));
      if (currentClientId === clientId) {
        await redis.del(REDIS_KEYS.userConnection(clientData.userId));
      }
    }
  }

  // Remove from server's connection set
  await redis.srem(REDIS_KEYS.serverConnections(SERVER_ID), clientId);

  // Delete client metadata
  await redis.del(REDIS_KEYS.client(clientId));
}

/**
 * Get all client IDs subscribed to a specific mode/timeframe/language
 */
export async function getSubscribers(
  mode: LeaderboardMode,
  timeframe: LeaderboardTimeframe,
  language: string
): Promise<string[]> {
  if (!REDIS_ENABLED) {
    // Local-only: return all local connection IDs (caller must filter)
    return Array.from(localConnections.keys());
  }

  const redis = getRedis();
  return redis.smembers(REDIS_KEYS.subscriptions(mode, timeframe, language));
}

/**
 * Get local WebSocket for a client ID
 */
export function getLocalConnection(clientId: string): WebSocket | undefined {
  return localConnections.get(clientId);
}

/**
 * Get all local connections
 */
export function getAllLocalConnections(): Map<string, WebSocket> {
  return new Map(localConnections);
}

/**
 * Get local connection count
 */
export function getLocalConnectionCount(): number {
  return localConnections.size;
}

/**
 * Update client tier (e.g., when user submits a score)
 */
export async function updateClientTier(
  userId: string,
  tier: ClientTier
): Promise<void> {
  if (!REDIS_ENABLED) return;

  const redis = getRedis();
  const now = Date.now();

  // Find user's current connection
  const clientId = await redis.get(REDIS_KEYS.userConnection(userId));
  if (!clientId) return;

  // Update tier in client metadata
  await redis.hset(REDIS_KEYS.client(clientId), 'tier', tier);

  // Track active users
  if (tier === 'active') {
    await redis.zadd(REDIS_KEYS.activeUsers(), now.toString(), userId);
  } else {
    await redis.zrem(REDIS_KEYS.activeUsers(), userId);
  }
}

/**
 * Get active user IDs (users who submitted scores recently)
 */
export async function getActiveUserIds(): Promise<string[]> {
  if (!REDIS_ENABLED) return [];

  const redis = getRedis();
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

  // Get users active in the last 5 minutes
  return redis.zrangebyscore(
    REDIS_KEYS.activeUsers(),
    fiveMinutesAgo.toString(),
    '+inf'
  );
}

/**
 * Check if a user is currently connected
 */
export async function isUserConnected(userId: string): Promise<boolean> {
  if (!REDIS_ENABLED) return false;

  const redis = getRedis();
  const clientId = await redis.get(REDIS_KEYS.userConnection(userId));
  return !!clientId;
}

/**
 * Register a callback for connection termination events
 */
export function onConnectionTermination(
  callback: (clientId: string, reason: string) => void
): void {
  terminationCallbacks.push(callback);
}

/**
 * Get connection statistics
 */
export async function getConnectionStats(): Promise<{
  localConnections: number;
  totalConnections: number;
  subscriptionCounts: Record<string, number>;
  activeUsers: number;
}> {
  const stats = {
    localConnections: localConnections.size,
    totalConnections: localConnections.size,
    subscriptionCounts: {} as Record<string, number>,
    activeUsers: 0,
  };

  if (!REDIS_ENABLED) return stats;

  const redis = getRedis();

  try {
    // Get total connections across all servers
    const servers = await scanKeys(redis, 'leaderboard:connections:*');
    let total = 0;
    for (const serverKey of servers) {
      total += await redis.scard(serverKey);
    }
    stats.totalConnections = total;

    // Get active user count
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    stats.activeUsers = await redis.zcount(
      REDIS_KEYS.activeUsers(),
      fiveMinutesAgo.toString(),
      '+inf'
    );

  } catch (error) {
    console.error('[ConnectionRegistry] Error getting stats:', error);
  }

  return stats;
}

// --- Private helpers ---

async function addToSubscriptionIndex(
  clientId: string,
  mode: LeaderboardMode,
  timeframe: LeaderboardTimeframe,
  language: string
): Promise<void> {
  const redis = getRedis();
  const key = REDIS_KEYS.subscriptions(mode, timeframe, language);
  await redis.sadd(key, clientId);
  await redis.expire(key, TTL.subscription);
}

async function removeFromSubscriptionIndex(
  clientId: string,
  mode: LeaderboardMode,
  timeframe: LeaderboardTimeframe,
  language: string
): Promise<void> {
  const redis = getRedis();
  await redis.srem(REDIS_KEYS.subscriptions(mode, timeframe, language), clientId);
}

async function terminateConnectionDistributed(
  clientId: string,
  reason: string
): Promise<void> {
  if (!REDIS_ENABLED) return;

  const redis = getRedis();

  // Get the server that owns this connection
  const clientData = await redis.hgetall(REDIS_KEYS.client(clientId));
  if (!clientData || !clientData.serverId) return;

  const targetServerId = clientData.serverId;

  if (targetServerId === SERVER_ID) {
    // Local termination
    handleTerminationRequest(JSON.stringify({ clientId, reason }));
  } else {
    // Send termination request to the owning server
    await redisPub.publish(
      REDIS_KEYS.terminationChannel(targetServerId),
      JSON.stringify({ clientId, reason })
    );
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

function handleTerminationRequest(message: string): void {
  try {
    const { clientId, reason } = JSON.parse(message);
    
    // Invoke termination callbacks
    for (const callback of terminationCallbacks) {
      try {
        callback(clientId, reason);
      } catch (error) {
        console.error('[ConnectionRegistry] Termination callback error:', error);
      }
    }
  } catch (error) {
    console.error('[ConnectionRegistry] Failed to parse termination request:', error);
  }
}

async function cleanupStaleServerConnections(): Promise<void> {
  if (!REDIS_ENABLED) return;

  const redis = getRedis();

  try {
    // Get our server's old connections (from previous runs)
    const oldConnections = await redis.smembers(REDIS_KEYS.serverConnections(SERVER_ID));
    
    if (oldConnections.length > 0) {
      console.log(`[ConnectionRegistry] Cleaning up ${oldConnections.length} stale connections`);
      
      const pipeline = redis.pipeline();
      
      for (const clientId of oldConnections) {
        // Get client data for index cleanup
        const clientData = await redis.hgetall(REDIS_KEYS.client(clientId));
        
        if (clientData && clientData.mode && clientData.timeframe && clientData.language) {
          pipeline.srem(
            REDIS_KEYS.subscriptions(clientData.mode, clientData.timeframe, clientData.language),
            clientId
          );
        }
        
        if (clientData?.userId) {
          pipeline.del(REDIS_KEYS.userConnection(clientData.userId));
        }
        
        pipeline.del(REDIS_KEYS.client(clientId));
      }
      
      pipeline.del(REDIS_KEYS.serverConnections(SERVER_ID));
      
      await pipeline.exec();
    }
  } catch (error) {
    console.error('[ConnectionRegistry] Cleanup error:', error);
  }
}

/**
 * Shutdown the connection registry
 */
export async function shutdownConnectionRegistry(): Promise<void> {
  if (!REDIS_ENABLED) return;

  const redis = getRedis();

  // Unsubscribe from termination channel
  await redisSub.unsubscribe(REDIS_KEYS.terminationChannel(SERVER_ID));

  // Clean up all our connections
  const connections = await redis.smembers(REDIS_KEYS.serverConnections(SERVER_ID));
  
  for (const clientId of connections) {
    await unregisterConnection(clientId);
  }

  console.log(`[ConnectionRegistry] Shutdown complete, cleaned ${connections.length} connections`);
}

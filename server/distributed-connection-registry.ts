import { WebSocket } from "ws";
import { redisClient, redisPub, redisSub, REDIS_KEYS, REDIS_TTL, REDIS_ENABLED, SERVER_ID } from './redis-client';

/**
 * Distributed Connection Registry
 * 
 * Manages WebSocket connections across multiple server instances using Redis.
 * Ensures single-connection integrity by:
 * 1. Registering connections in Redis with server ID
 * 2. Detecting duplicate connections on other servers
 * 3. Sending termination requests via Pub/Sub
 */

interface DistributedConnectionInfo {
  serverId: string;
  raceId?: number;
  participantId?: number;
  connectedAt: number;
  lastActivity: number;
}

// Local connection map for this server instance
const localConnections: Map<string, WebSocket[]> = new Map();

// Callback for handling termination requests from other servers
let terminationCallback: ((identityKey: string) => void) | null = null;

/**
 * Initialize the distributed connection registry
 * Sets up Pub/Sub subscription for cross-server connection termination
 */
export async function initializeDistributedRegistry(
  onTerminationRequest: (identityKey: string) => void
): Promise<void> {
  terminationCallback = onTerminationRequest;
  
  if (!REDIS_ENABLED) {
    console.log('[DistributedRegistry] Redis disabled, using local-only mode');
    return;
  }
  
  try {
    // Subscribe to termination requests for this server
    const channel = REDIS_KEYS.serverChannel(SERVER_ID);
    await redisSub.subscribe(channel);
    
    redisSub.on('message', (receivedChannel, message) => {
      if (receivedChannel === channel) {
        try {
          const { identityKey, reason } = JSON.parse(message);
          console.log(`[DistributedRegistry] Termination request received for ${identityKey}: ${reason}`);
          
          if (terminationCallback) {
            terminationCallback(identityKey);
          }
        } catch (error) {
          console.error('[DistributedRegistry] Error parsing termination message:', error);
        }
      }
    });
    
    console.log(`[DistributedRegistry] Initialized, listening on ${channel}`);
  } catch (error) {
    console.error('[DistributedRegistry] Initialization error:', error);
  }
}

/**
 * Register a connection in the distributed registry
 * Returns information about any existing connection that should be terminated
 */
export async function registerConnectionDistributed(
  identityKey: string,
  ws: WebSocket,
  raceId?: number,
  participantId?: number
): Promise<{ existing?: DistributedConnectionInfo; registered: boolean }> {
  const now = Date.now();
  
  // Always update local connections map
  const local = localConnections.get(identityKey) || [];
  local.push(ws);
  localConnections.set(identityKey, local);
  
  if (!REDIS_ENABLED) {
    return { registered: true };
  }
  
  try {
    const key = REDIS_KEYS.connection(identityKey);
    const script = `
      local key = KEYS[1]
      local serverId = ARGV[1]
      local connectedAt = ARGV[2]
      local lastActivity = ARGV[3]
      local raceId = ARGV[4]
      local participantId = ARGV[5]
      local ttl = tonumber(ARGV[6])
      local existing = redis.call('HMGET', key, 'serverId', 'raceId', 'participantId', 'connectedAt', 'lastActivity')
      redis.call('HSET', key, 'serverId', serverId, 'connectedAt', connectedAt, 'lastActivity', lastActivity)
      if raceId ~= '' then
        redis.call('HSET', key, 'raceId', raceId)
      end
      if participantId ~= '' then
        redis.call('HSET', key, 'participantId', participantId)
      end
      redis.call('EXPIRE', key, ttl)
      return existing
    `;
    const result = await redisClient.eval(
      script,
      1,
      key,
      SERVER_ID,
      now.toString(),
      now.toString(),
      raceId !== undefined ? raceId.toString() : '',
      participantId !== undefined ? participantId.toString() : '',
      REDIS_TTL.connection.toString()
    ) as string[];
    
    let existing: DistributedConnectionInfo | undefined;
    if (result && result[0]) {
      existing = {
        serverId: result[0],
        raceId: result[1] ? parseInt(result[1], 10) : undefined,
        participantId: result[2] ? parseInt(result[2], 10) : undefined,
        connectedAt: parseInt(result[3] || '0', 10),
        lastActivity: parseInt(result[4] || '0', 10),
      };
      
      if (existing.serverId !== SERVER_ID) {
        console.log(`[DistributedRegistry] Found existing connection on ${existing.serverId}, sending termination request`);
        await redisPub.publish(
          REDIS_KEYS.serverChannel(existing.serverId),
          JSON.stringify({
            identityKey,
            reason: 'Connection superseded by new session',
            newServerId: SERVER_ID,
          })
        );
      }
    }

    return { existing, registered: true };
  } catch (error) {
    console.error('[DistributedRegistry] Registration error:', error);
    return { registered: false };
  }
}

/**
 * Update connection info (e.g., after joining a race)
 */
export async function updateConnectionDistributed(
  identityKey: string,
  raceId: number,
  participantId: number
): Promise<void> {
  if (!REDIS_ENABLED) return;
  
  try {
    const key = REDIS_KEYS.connection(identityKey);
    await redisClient.hset(key, {
      raceId: raceId.toString(),
      participantId: participantId.toString(),
      lastActivity: Date.now().toString(),
    });
    await redisClient.expire(key, REDIS_TTL.connection);
  } catch (error) {
    console.error('[DistributedRegistry] Update error:', error);
  }
}

/**
 * Unregister a connection from the distributed registry
 */
export async function unregisterConnectionDistributed(
  identityKey: string,
  ws: WebSocket
): Promise<void> {
  // Remove from local connections
  const local = localConnections.get(identityKey);
  if (local) {
    const filtered = local.filter(w => w !== ws);
    if (filtered.length === 0) {
      localConnections.delete(identityKey);
    } else {
      localConnections.set(identityKey, filtered);
    }
  }
  
  if (!REDIS_ENABLED) return;
  
  try {
    const key = REDIS_KEYS.connection(identityKey);
    
    // Only delete if this server owns the connection
    const serverIdFromRedis = await redisClient.hget(key, 'serverId');
    if (serverIdFromRedis === SERVER_ID) {
      // Check if there are no more local connections for this identity
      const remaining = localConnections.get(identityKey);
      if (!remaining || remaining.length === 0) {
        await redisClient.del(key);
        console.log(`[DistributedRegistry] Unregistered ${identityKey}`);
      }
    }
  } catch (error) {
    console.error('[DistributedRegistry] Unregistration error:', error);
  }
}

/**
 * Update last activity timestamp
 */
export async function touchConnectionDistributed(identityKey: string): Promise<void> {
  if (!REDIS_ENABLED) return;
  
  try {
    const key = REDIS_KEYS.connection(identityKey);
    await redisClient.hset(key, 'lastActivity', Date.now().toString());
    await redisClient.expire(key, REDIS_TTL.connection);
  } catch (error) {
    // Silently ignore - this is not critical
  }
}

/**
 * Get connection info from distributed registry
 */
export async function getConnectionInfoDistributed(
  identityKey: string
): Promise<DistributedConnectionInfo | null> {
  if (!REDIS_ENABLED) return null;
  
  try {
    const key = REDIS_KEYS.connection(identityKey);
    const data = await redisClient.hgetall(key);
    
    if (!data || !data.serverId) {
      return null;
    }
    
    return {
      serverId: data.serverId,
      raceId: data.raceId ? parseInt(data.raceId, 10) : undefined,
      participantId: data.participantId ? parseInt(data.participantId, 10) : undefined,
      connectedAt: parseInt(data.connectedAt || '0', 10),
      lastActivity: parseInt(data.lastActivity || '0', 10),
    };
  } catch (error) {
    console.error('[DistributedRegistry] Get connection info error:', error);
    return null;
  }
}

/**
 * Terminate a local connection by identity key
 * Called when receiving termination request from another server
 */
export function terminateLocalConnection(identityKey: string): void {
  const connections = localConnections.get(identityKey);
  if (!connections || connections.length === 0) {
    console.log(`[DistributedRegistry] No local connections found for ${identityKey}`);
    return;
  }
  
  for (const ws of connections) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: "connection_superseded",
        message: "Another session has connected. This connection will be closed.",
        code: "DUPLICATE_CONNECTION"
      }));
      ws.close(4000, "Connection superseded by new session");
      console.log(`[DistributedRegistry] Terminated local connection for ${identityKey}`);
    }
  }
  
  localConnections.delete(identityKey);
}

/**
 * Get local connection count for an identity
 */
export function getLocalConnectionCount(identityKey: string): number {
  const connections = localConnections.get(identityKey);
  return connections ? connections.length : 0;
}

/**
 * Get total local connections on this server
 */
export function getTotalLocalConnections(): number {
  let total = 0;
  for (const connections of localConnections.values()) {
    total += connections.length;
  }
  return total;
}

/**
 * Clean up all connections for shutdown
 */
export async function shutdownDistributedRegistry(): Promise<void> {
  console.log('[DistributedRegistry] Shutting down...');
  
  // Unsubscribe from termination channel
  if (REDIS_ENABLED) {
    try {
      await redisSub.unsubscribe(REDIS_KEYS.serverChannel(SERVER_ID));
    } catch (error) {
      console.error('[DistributedRegistry] Shutdown error:', error);
    }
  }
  
  // Clear all local connections without terminating them
  // (they should be handled by the WebSocket server shutdown)
  localConnections.clear();
  
  console.log('[DistributedRegistry] Shutdown complete');
}

/**
 * Broadcast a message to all connections for a race across all servers
 */
export async function broadcastToRaceDistributed(
  raceId: number,
  message: any,
  localBroadcast: (raceId: number, message: any) => void
): Promise<void> {
  // Always broadcast locally
  localBroadcast(raceId, message);
  
  if (!REDIS_ENABLED) return;
  
  try {
    // Publish to race events channel for other servers
    await redisPub.publish(
      REDIS_KEYS.raceEvents(raceId),
      JSON.stringify({
        serverId: SERVER_ID,
        ...message,
      })
    );
  } catch (error) {
    console.error('[DistributedRegistry] Broadcast error:', error);
  }
}

/**
 * Subscribe to race events from other servers
 */
export async function subscribeToRaceEventsDistributed(
  callback: (raceId: number, message: any) => void
): Promise<void> {
  if (!REDIS_ENABLED) return;
  
  try {
    // Use pattern subscribe for all race events
    await redisSub.psubscribe('race:*:events');
    
    redisSub.on('pmessage', (pattern, channel, rawMessage) => {
      try {
        // Extract race ID from channel: race:{raceId}:events
        const match = channel.match(/^race:(\d+):events$/);
        if (match) {
          const raceId = parseInt(match[1], 10);
          const message = JSON.parse(rawMessage);
          
          // Only process events from other servers
          if (message.serverId !== SERVER_ID) {
            callback(raceId, message);
          }
        }
      } catch (error) {
        console.error('[DistributedRegistry] Error processing race event:', error);
      }
    });
    
    console.log('[DistributedRegistry] Subscribed to race events');
  } catch (error) {
    console.error('[DistributedRegistry] Subscribe error:', error);
  }
}

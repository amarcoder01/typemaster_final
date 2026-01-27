/**
 * Real-time Leaderboard WebSocket Service
 * 
 * Enhanced for horizontal scaling:
 * - Redis Pub/Sub for cross-server broadcasting
 * - Distributed connection registry
 * - O(1) subscription lookups via indexing
 * - Tiered update delivery support
 */

import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import crypto from "node:crypto";
import { redisPub, redisSub, REDIS_ENABLED, SERVER_ID } from "./redis-client";
import { 
  registerConnection, 
  unregisterConnection, 
  updateSubscription,
  getSubscribers,
  getLocalConnection,
  getAllLocalConnections,
  initializeConnectionRegistry,
  onConnectionTermination,
  updateClientTier,
} from "./leaderboard-connection-registry";
import { 
  LeaderboardMode, 
  LeaderboardTimeframe, 
  ClientTier,
  getLeaderboardConfig 
} from "../shared/leaderboard-types";

interface LeaderboardClient {
  ws: WebSocket;
  userId?: string;
  timeframe: LeaderboardTimeframe;
  language: string;
  mode: LeaderboardMode;
  tier: ClientTier;
  lastActivity: number;
  ip: string;
}

interface LeaderboardUpdate {
  type: 'leaderboard_update' | 'rank_change' | 'new_entry' | 'score_update';
  updateType?: 'rank_change' | 'new_entry' | 'score_update';
  mode: string;
  timeframe: string;
  language: string;
  entry: {
    userId: string;
    username: string;
    rank: number;
    oldRank?: number;
    wpm: number;
    accuracy: number;
    mode?: number;
    avatarColor?: string;
    isVerified?: boolean;
  };
}

// Rate limiting configuration - configurable via environment variables
const MAX_CONNECTIONS_PER_IP = parseInt(process.env.WS_MAX_CONNECTIONS_PER_IP || '10', 10);
const CONNECTION_RATE_LIMIT_WINDOW_MS = parseInt(process.env.WS_RATE_LIMIT_WINDOW_MS || '60000', 10); // 1 minute
const MAX_CONNECTIONS_IN_WINDOW = parseInt(process.env.WS_MAX_CONNECTIONS_IN_WINDOW || '20', 10);
const WS_MAX_MESSAGE_BYTES = parseInt(process.env.WS_MAX_MESSAGE_BYTES || '65536', 10); // 64KB
const WS_HEARTBEAT_TIMEOUT_MS = parseInt(process.env.WS_HEARTBEAT_TIMEOUT_MS || '90000', 10); // 90s
const WS_HEARTBEAT_INTERVAL_MS = parseInt(process.env.WS_HEARTBEAT_INTERVAL_MS || '30000', 10); // 30s

// Metrics interface for monitoring
interface WebSocketMetrics {
  totalConnections: number;
  currentConnections: number;
  messagesSent: number;
  messagesReceived: number;
  broadcastsSent: number;
  errors: number;
  connectionAttempts: number;
  rejectedConnections: number;
  avgConnectionDuration: number;
  peakConnections: number;
  lastResetTime: number;
}

// Pub/Sub channel pattern for leaderboard updates
const PUBSUB_CHANNEL_PREFIX = 'leaderboard:broadcast:';

class LeaderboardWebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, LeaderboardClient> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private pubsubInitialized = false;
  
  // Local subscription index for O(1) lookups
  private subscriptionIndex: Map<string, Set<string>> = new Map();
  
  // Rate limiting state
  private connectionsByIP: Map<string, { count: number; timestamps: number[] }> = new Map();
  
  // Metrics tracking
  private metrics: WebSocketMetrics = {
    totalConnections: 0,
    currentConnections: 0,
    messagesSent: 0,
    messagesReceived: 0,
    broadcastsSent: 0,
    errors: 0,
    connectionAttempts: 0,
    rejectedConnections: 0,
    avgConnectionDuration: 0,
    peakConnections: 0,
    lastResetTime: Date.now(),
  };
  
  // Connection durations for avg calculation
  private connectionDurations: number[] = [];
  private readonly MAX_DURATION_SAMPLES = 1000;
  
  // Configuration
  private config = getLeaderboardConfig();

  async initialize(server: Server): Promise<void> {
    this.wss = new WebSocketServer({ 
      noServer: true,
      perMessageDeflate: false,
    });

    // Initialize distributed connection registry
    await initializeConnectionRegistry();
    
    // Register termination callback for cross-server connection cleanup
    onConnectionTermination((clientId, reason) => {
      this.terminateClient(clientId, reason);
    });
    
    // Initialize Redis Pub/Sub for cross-server broadcasting
    await this.initializePubSub();

    // Handle upgrade requests manually to avoid conflicts with Vite HMR
    server.on('upgrade', (request, socket, head) => {
      const pathname = request.url ? new URL(request.url, `http://${request.headers.host}`).pathname : '';
      
      if (pathname === '/ws/leaderboard') {
        this.wss!.handleUpgrade(request, socket, head, (ws) => {
          this.wss!.emit('connection', ws, request);
        });
      }
      // Don't destroy socket for other paths - let other handlers process them
    });

    this.wss.on('connection', async (ws: WebSocket, req) => {
      this.metrics.connectionAttempts++;
      
      // Get client IP for rate limiting
      const clientIP = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() 
        || req.socket.remoteAddress 
        || 'unknown';
      
      // Check rate limit
      const rateLimitCheck = this.checkRateLimit(clientIP);
      if (!rateLimitCheck.allowed) {
        this.metrics.rejectedConnections++;
        console.log(`[Leaderboard WS] Connection rejected for ${clientIP}: ${rateLimitCheck.reason}`);
        ws.close(1008, rateLimitCheck.reason || 'Rate limit exceeded');
        return;
      }
      
      const clientId = this.generateClientId();
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      const connectionStartTime = Date.now();
      
      // Parse subscription parameters
      const mode = (url.searchParams.get('mode') || 'global') as LeaderboardMode;
      const timeframe = (url.searchParams.get('timeframe') || 'all') as LeaderboardTimeframe;
      const language = url.searchParams.get('language') || 'en';
      const userId = url.searchParams.get('userId') || undefined;
      
      const client: LeaderboardClient = {
        ws,
        userId,
        timeframe,
        language,
        mode,
        tier: userId ? 'passive' : 'observer', // Start as passive, upgrade to active on score submit
        lastActivity: Date.now(),
        ip: clientIP,
      };

      this.clients.set(clientId, client);
      
      // Add to local subscription index for O(1) lookups
      this.addToLocalIndex(clientId, mode, timeframe, language);
      
      // Register with distributed connection registry
      try {
        await registerConnection(clientId, ws, {
          userId,
          mode,
          timeframe,
          language,
          tier: client.tier,
          lastActivity: client.lastActivity,
        });
      } catch (error) {
        console.error('[Leaderboard WS] Failed to register connection:', error);
        // Continue anyway - local-only mode
      }
      
      // Update metrics
      this.metrics.totalConnections++;
      this.metrics.currentConnections = this.clients.size;
      if (this.clients.size > this.metrics.peakConnections) {
        this.metrics.peakConnections = this.clients.size;
      }
      
      console.log(`[Leaderboard WS] Client connected: ${clientId} (mode: ${mode}, timeframe: ${timeframe}, tier: ${client.tier}, IP: ${clientIP})`);

      ws.on('message', (data) => {
        this.metrics.messagesReceived++;
        try {
          const normalized = Array.isArray(data) ? Buffer.concat(data) : data;
          const byteLength =
            typeof normalized === 'string'
              ? Buffer.byteLength(normalized)
              : Buffer.isBuffer(normalized)
                ? normalized.length
                : normalized.byteLength;
          if (byteLength > WS_MAX_MESSAGE_BYTES) {
            this.metrics.errors++;
            ws.close(1009, 'Message too large');
            return;
          }
          const message = JSON.parse(normalized.toString());
          this.handleMessage(clientId, message, client);
        } catch (error) {
          this.metrics.errors++;
          console.error('[Leaderboard WS] Invalid message:', error);
        }
      });

      ws.on('close', async () => {
        // Remove from local index
        this.removeFromLocalIndex(clientId, mode, timeframe, language);
        
        this.clients.delete(clientId);
        this.metrics.currentConnections = this.clients.size;
        this.decrementIPConnection(clientIP);
        this.recordConnectionDuration(connectionStartTime);
        
        // Unregister from distributed registry
        try {
          await unregisterConnection(clientId);
        } catch (error) {
          console.error('[Leaderboard WS] Failed to unregister connection:', error);
        }
        
        console.log(`[Leaderboard WS] Client disconnected: ${clientId}`);
      });

      ws.on('error', async (error) => {
        this.metrics.errors++;
        console.error('[Leaderboard WS] Client error:', error);
        
        // Remove from local index
        this.removeFromLocalIndex(clientId, mode, timeframe, language);
        
        this.clients.delete(clientId);
        this.metrics.currentConnections = this.clients.size;
        this.decrementIPConnection(clientIP);
        this.recordConnectionDuration(connectionStartTime);
        
        // Unregister from distributed registry
        try {
          await unregisterConnection(clientId);
        } catch (error) {
          console.error('[Leaderboard WS] Failed to unregister connection:', error);
        }
      });

      // Send initial connection confirmation
      this.metrics.messagesSent++;
      ws.send(JSON.stringify({
        type: 'connected',
        clientId,
        timestamp: Date.now(),
      }));
    });

    // Start heartbeat
    this.startHeartbeat();

    console.log('[Leaderboard WS] WebSocket service initialized');
  }

  private generateClientId(): string {
    return `lb_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  /**
   * Check if an IP address is allowed to connect (rate limiting)
   */
  private checkRateLimit(ip: string): { allowed: boolean; reason?: string } {
    const now = Date.now();
    const ipData = this.connectionsByIP.get(ip);
    
    if (!ipData) {
      // First connection from this IP
      this.connectionsByIP.set(ip, { count: 1, timestamps: [now] });
      return { allowed: true };
    }
    
    // Clean up old timestamps outside the rate limit window
    ipData.timestamps = ipData.timestamps.filter(ts => now - ts < CONNECTION_RATE_LIMIT_WINDOW_MS);
    if (ipData.count === 0 && ipData.timestamps.length === 0) {
      this.connectionsByIP.delete(ip);
      return { allowed: true };
    }
    
    // Check current connection count
    if (ipData.count >= MAX_CONNECTIONS_PER_IP) {
      return { allowed: false, reason: `Max ${MAX_CONNECTIONS_PER_IP} connections per IP exceeded` };
    }
    
    // Check connection rate in window
    if (ipData.timestamps.length >= MAX_CONNECTIONS_IN_WINDOW) {
      return { allowed: false, reason: `Rate limit: Max ${MAX_CONNECTIONS_IN_WINDOW} connections per ${CONNECTION_RATE_LIMIT_WINDOW_MS/1000}s` };
    }
    
    // Allow connection
    ipData.count++;
    ipData.timestamps.push(now);
    return { allowed: true };
  }

  /**
   * Decrement connection count for an IP when client disconnects
   */
  private decrementIPConnection(ip: string): void {
    const ipData = this.connectionsByIP.get(ip);
    if (ipData && ipData.count > 0) {
      ipData.count--;
      if (ipData.timestamps.length > 0) {
        const now = Date.now();
        ipData.timestamps = ipData.timestamps.filter(ts => now - ts < CONNECTION_RATE_LIMIT_WINDOW_MS);
      }
      if (ipData.count === 0 && ipData.timestamps.length === 0) {
        this.connectionsByIP.delete(ip);
      }
    }
  }

  /**
   * Record connection duration for metrics
   */
  private recordConnectionDuration(startTime: number): void {
    const duration = Date.now() - startTime;
    this.connectionDurations.push(duration);
    
    // Keep only last N samples
    if (this.connectionDurations.length > this.MAX_DURATION_SAMPLES) {
      this.connectionDurations.shift();
    }
    
    // Update average
    if (this.connectionDurations.length > 0) {
      this.metrics.avgConnectionDuration = 
        this.connectionDurations.reduce((a, b) => a + b, 0) / this.connectionDurations.length;
    }
  }

  /**
   * Initialize Redis Pub/Sub for cross-server broadcasting
   */
  private async initializePubSub(): Promise<void> {
    if (!REDIS_ENABLED || this.pubsubInitialized) {
      console.log('[Leaderboard WS] Pub/Sub skipped (Redis disabled or already initialized)');
      return;
    }

    try {
      // Subscribe to all leaderboard broadcast channels
      await redisSub.psubscribe(`${PUBSUB_CHANNEL_PREFIX}*`);
      
      // Handle incoming broadcasts from other servers
      redisSub.on('pmessage', (pattern, channel, message) => {
        if (channel.startsWith(PUBSUB_CHANNEL_PREFIX)) {
          this.handleRemoteBroadcast(channel, message);
        }
      });

      this.pubsubInitialized = true;
      console.log(`[Leaderboard WS] Pub/Sub initialized for server ${SERVER_ID}`);
    } catch (error) {
      console.error('[Leaderboard WS] Failed to initialize Pub/Sub:', error);
    }
  }

  /**
   * Handle broadcasts received from other servers via Pub/Sub
   */
  private handleRemoteBroadcast(channel: string, message: string): void {
    try {
      const data = JSON.parse(message);
      
      // Skip if this message originated from this server
      if (data.serverId === SERVER_ID) {
        return;
      }

      // Extract subscription key from channel
      const channelParts = channel.replace(PUBSUB_CHANNEL_PREFIX, '').split(':');
      const mode = channelParts[0] as LeaderboardMode;
      const timeframe = channelParts[1] as LeaderboardTimeframe;
      const language = channelParts[2];

      // Broadcast to local subscribers only
      this.broadcastToLocal(data.update, mode, timeframe, language);
      
    } catch (error) {
      console.error('[Leaderboard WS] Failed to handle remote broadcast:', error);
    }
  }

  /**
   * Add client to local subscription index
   */
  private addToLocalIndex(
    clientId: string,
    mode: LeaderboardMode,
    timeframe: LeaderboardTimeframe,
    language: string
  ): void {
    const key = `${mode}:${timeframe}:${language}`;
    
    if (!this.subscriptionIndex.has(key)) {
      this.subscriptionIndex.set(key, new Set());
    }
    this.subscriptionIndex.get(key)!.add(clientId);
  }

  /**
   * Remove client from local subscription index
   */
  private removeFromLocalIndex(
    clientId: string,
    mode: LeaderboardMode,
    timeframe: LeaderboardTimeframe,
    language: string
  ): void {
    const key = `${mode}:${timeframe}:${language}`;
    const subscribers = this.subscriptionIndex.get(key);
    
    if (subscribers) {
      subscribers.delete(clientId);
      if (subscribers.size === 0) {
        this.subscriptionIndex.delete(key);
      }
    }
  }

  /**
   * Get local subscribers for a specific subscription
   */
  private getLocalSubscribers(
    mode: LeaderboardMode,
    timeframe: LeaderboardTimeframe,
    language: string
  ): string[] {
    const exactKey = `${mode}:${timeframe}:${language}`;
    const allTimeframeKey = `${mode}:all:${language}`;
    
    const subscribers = new Set<string>();
    
    // Get exact match subscribers
    const exact = this.subscriptionIndex.get(exactKey);
    if (exact) {
      exact.forEach(id => subscribers.add(id));
    }
    
    // For non-'all' timeframes, also include clients subscribed to 'all'
    if (timeframe !== 'all') {
      const allSubscribers = this.subscriptionIndex.get(allTimeframeKey);
      if (allSubscribers) {
        allSubscribers.forEach(id => subscribers.add(id));
      }
    }
    
    // When timeframe is 'all', include all timeframe subscribers for this mode/language
    if (timeframe === 'all') {
      for (const tf of ['daily', 'weekly', 'monthly'] as LeaderboardTimeframe[]) {
        const tfKey = `${mode}:${tf}:${language}`;
        const tfSubscribers = this.subscriptionIndex.get(tfKey);
        if (tfSubscribers) {
          tfSubscribers.forEach(id => subscribers.add(id));
        }
      }
    }
    
    return Array.from(subscribers);
  }

  /**
   * Terminate a client connection (called from connection registry)
   */
  private terminateClient(clientId: string, reason: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    console.log(`[Leaderboard WS] Terminating client ${clientId}: ${reason}`);
    
    try {
      client.ws.close(1000, reason);
    } catch (error) {
      console.error('[Leaderboard WS] Error closing client:', error);
    }
    
    // Cleanup will happen in the close handler
  }

  /**
   * Update client tier (e.g., when user submits a score)
   */
  async upgradeToActiveTier(userId: string): Promise<void> {
    // Find client by userId
    for (const [clientId, client] of this.clients) {
      if (client.userId === userId) {
        client.tier = 'active';
        
        // Update in distributed registry
        try {
          await updateClientTier(userId, 'active');
        } catch (error) {
          console.error('[Leaderboard WS] Failed to update tier:', error);
        }
        
        console.log(`[Leaderboard WS] Upgraded client ${clientId} to active tier`);
        break;
      }
    }
  }

  private async handleMessage(clientId: string, message: any, client: LeaderboardClient): Promise<void> {
    const { type, userId, timeframe, language, mode } = message;

    switch (type) {
      case 'subscribe':
        {
          // Track old subscription for index updates
          const oldMode = client.mode;
          const oldTimeframe = client.timeframe;
          const oldLanguage = client.language;
          
          // Update client subscription
          const newMode = mode || client.mode;
          const newTimeframe = timeframe || client.timeframe;
          const newLanguage = language || client.language;
          
          // Update local index
          this.removeFromLocalIndex(clientId, oldMode, oldTimeframe, oldLanguage);
          this.addToLocalIndex(clientId, newMode, newTimeframe, newLanguage);
          
          // Update client
          client.mode = newMode;
          client.timeframe = newTimeframe;
          client.language = newLanguage;
          if (userId) client.userId = userId;
          client.lastActivity = Date.now();
          
          // Update distributed registry
          try {
            await updateSubscription(
              clientId,
              { mode: oldMode, timeframe: oldTimeframe, language: oldLanguage },
              { mode: newMode, timeframe: newTimeframe, language: newLanguage }
            );
          } catch (error) {
            console.error('[Leaderboard WS] Failed to update subscription:', error);
          }
          
          console.log(`[Leaderboard WS] Client ${clientId} subscribed to ${newMode}/${newTimeframe}/${newLanguage}`);
        }
        break;

      case 'ping':
        client.lastActivity = Date.now();
        client.ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        break;

      default:
        console.warn(`[Leaderboard WS] Unknown message type: ${type}`);
    }
  }

  /**
   * Broadcast a leaderboard update to relevant clients
   * Uses indexed lookups for O(1) subscriber selection instead of O(n) iteration
   * Also publishes to Redis Pub/Sub for cross-server broadcasting
   */
  async broadcastUpdate(update: LeaderboardUpdate): Promise<void> {
    if (!this.wss) return;

    const { mode, timeframe, language } = update;
    
    // Broadcast to local subscribers using indexed lookup
    const localCount = this.broadcastToLocal(
      update, 
      mode as LeaderboardMode, 
      timeframe as LeaderboardTimeframe, 
      language
    );

    // Publish to Redis Pub/Sub for other servers
    if (REDIS_ENABLED) {
      try {
        const channel = `${PUBSUB_CHANNEL_PREFIX}${mode}:${timeframe}:${language}`;
        const payload = JSON.stringify({
          serverId: SERVER_ID,
          update,
          timestamp: Date.now(),
        });
        if (Buffer.byteLength(payload) > WS_MAX_MESSAGE_BYTES) {
          this.metrics.errors++;
          console.warn('[Leaderboard WS] Skipping oversized Pub/Sub message');
        } else {
          await redisPub.publish(channel, payload);
        }
      } catch (error) {
        console.error('[Leaderboard WS] Failed to publish to Pub/Sub:', error);
      }
    }

    if (localCount > 0) {
      this.metrics.broadcastsSent++;
      console.log(`[Leaderboard WS] Broadcast update to ${localCount} local clients (${mode}/${timeframe}/${language})`);
    }
  }

  /**
   * Broadcast to local subscribers only (used by both local and remote broadcasts)
   */
  private broadcastToLocal(
    update: LeaderboardUpdate,
    mode: LeaderboardMode,
    timeframe: LeaderboardTimeframe,
    language: string
  ): number {
    // Get subscribers using indexed lookup - O(1) instead of O(n)
    const subscriberIds = this.getLocalSubscribers(mode, timeframe, language);
    
    let broadcastCount = 0;
    const deadConnections: string[] = [];

    const timestamp = Date.now();
    for (const clientId of subscriberIds) {
      const client = this.clients.get(clientId);
      if (!client) continue;

      // Clean up closed or closing connections
      if (client.ws.readyState === WebSocket.CLOSED || client.ws.readyState === WebSocket.CLOSING) {
        deadConnections.push(clientId);
        continue;
      }

      if (client.ws.readyState === WebSocket.OPEN) {
        try {
          const payload = JSON.stringify({
            ...update,
            timestamp,
          });
          if (Buffer.byteLength(payload) > WS_MAX_MESSAGE_BYTES) {
            this.metrics.errors++;
            console.warn('[Leaderboard WS] Dropping oversized payload');
            continue;
          }
          client.ws.send(payload);
          broadcastCount++;
          this.metrics.messagesSent++;
        } catch (error) {
          this.metrics.errors++;
          console.error('[Leaderboard WS] Broadcast error:', error);
          deadConnections.push(clientId);
        }
      }
    }

    // Clean up dead connections
    if (deadConnections.length > 0) {
      for (const clientId of deadConnections) {
        const client = this.clients.get(clientId);
        if (client) {
          this.removeFromLocalIndex(clientId, client.mode, client.timeframe, client.language);
          this.decrementIPConnection(client.ip);
          unregisterConnection(clientId).catch(() => undefined);
        }
        this.clients.delete(clientId);
      }
      this.metrics.currentConnections = this.clients.size;
      console.log(`[Leaderboard WS] Cleaned up ${deadConnections.length} dead connections`);
    }

    return broadcastCount;
  }

  /**
   * Broadcast rank change for a specific user
   */
  broadcastRankChange(
    userId: string,
    username: string,
    mode: string,
    timeframe: string,
    language: string,
    newRank: number,
    oldRank: number,
    wpm: number,
    accuracy: number,
    additionalData?: any
  ): void {
    this.broadcastUpdate({
      type: 'leaderboard_update',
      updateType: 'rank_change',
      mode,
      timeframe,
      language,
      entry: {
        userId,
        username,
        rank: newRank,
        oldRank,
        wpm,
        accuracy,
        ...additionalData,
      },
    });
  }

  /**
   * Broadcast new leaderboard entry
   */
  broadcastNewEntry(
    userId: string,
    username: string,
    mode: string,
    timeframe: string,
    language: string,
    rank: number,
    wpm: number,
    accuracy: number,
    additionalData?: any
  ): void {
    this.broadcastUpdate({
      type: 'leaderboard_update',
      updateType: 'new_entry',
      mode,
      timeframe,
      language,
      entry: {
        userId,
        username,
        rank,
        wpm,
        accuracy,
        ...additionalData,
      },
    });
  }

  /**
   * Start heartbeat to keep connections alive and clean up dead ones
   */
  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const timeout = WS_HEARTBEAT_TIMEOUT_MS;

      this.clients.forEach((client, clientId) => {
        if (now - client.lastActivity > timeout) {
          console.log(`[Leaderboard WS] Closing inactive client: ${clientId}`);
          client.ws.close();
          this.clients.delete(clientId);
        }
      });
    }, WS_HEARTBEAT_INTERVAL_MS);
  }

  /**
   * Get comprehensive service statistics and metrics
   */
  getStats(): {
    connectedClients: number;
    subscriptions: Record<string, number>;
    metrics: WebSocketMetrics;
    rateLimit: {
      maxConnectionsPerIP: number;
      maxConnectionsInWindow: number;
      windowMs: number;
      activeIPs: number;
    };
  } {
    const subscriptions: Record<string, number> = {};

    this.clients.forEach((client) => {
      const key = `${client.mode}/${client.timeframe}/${client.language}`;
      subscriptions[key] = (subscriptions[key] || 0) + 1;
    });

    return {
      connectedClients: this.clients.size,
      subscriptions,
      metrics: { ...this.metrics },
      rateLimit: {
        maxConnectionsPerIP: MAX_CONNECTIONS_PER_IP,
        maxConnectionsInWindow: MAX_CONNECTIONS_IN_WINDOW,
        windowMs: CONNECTION_RATE_LIMIT_WINDOW_MS,
        activeIPs: this.connectionsByIP.size,
      },
    };
  }

  /**
   * Reset metrics (useful for monitoring intervals)
   */
  resetMetrics(): void {
    this.metrics = {
      ...this.metrics,
      messagesSent: 0,
      messagesReceived: 0,
      broadcastsSent: 0,
      errors: 0,
      connectionAttempts: 0,
      rejectedConnections: 0,
      lastResetTime: Date.now(),
    };
    this.connectionDurations = [];
  }

  /**
   * Get metrics for Prometheus/monitoring systems
   */
  getPrometheusMetrics(): string {
    const m = this.metrics;
    return [
      `# HELP ws_leaderboard_connections_current Current WebSocket connections`,
      `# TYPE ws_leaderboard_connections_current gauge`,
      `ws_leaderboard_connections_current ${m.currentConnections}`,
      ``,
      `# HELP ws_leaderboard_connections_total Total WebSocket connections since start`,
      `# TYPE ws_leaderboard_connections_total counter`,
      `ws_leaderboard_connections_total ${m.totalConnections}`,
      ``,
      `# HELP ws_leaderboard_connections_peak Peak concurrent connections`,
      `# TYPE ws_leaderboard_connections_peak gauge`,
      `ws_leaderboard_connections_peak ${m.peakConnections}`,
      ``,
      `# HELP ws_leaderboard_messages_sent_total Total messages sent`,
      `# TYPE ws_leaderboard_messages_sent_total counter`,
      `ws_leaderboard_messages_sent_total ${m.messagesSent}`,
      ``,
      `# HELP ws_leaderboard_messages_received_total Total messages received`,
      `# TYPE ws_leaderboard_messages_received_total counter`,
      `ws_leaderboard_messages_received_total ${m.messagesReceived}`,
      ``,
      `# HELP ws_leaderboard_broadcasts_total Total broadcasts sent`,
      `# TYPE ws_leaderboard_broadcasts_total counter`,
      `ws_leaderboard_broadcasts_total ${m.broadcastsSent}`,
      ``,
      `# HELP ws_leaderboard_errors_total Total errors`,
      `# TYPE ws_leaderboard_errors_total counter`,
      `ws_leaderboard_errors_total ${m.errors}`,
      ``,
      `# HELP ws_leaderboard_rejected_connections_total Rejected connections (rate limited)`,
      `# TYPE ws_leaderboard_rejected_connections_total counter`,
      `ws_leaderboard_rejected_connections_total ${m.rejectedConnections}`,
      ``,
      `# HELP ws_leaderboard_connection_duration_avg_ms Average connection duration`,
      `# TYPE ws_leaderboard_connection_duration_avg_ms gauge`,
      `ws_leaderboard_connection_duration_avg_ms ${Math.round(m.avgConnectionDuration)}`,
    ].join('\n');
  }

  /**
   * Shutdown the WebSocket service
   */
  shutdown(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    this.clients.forEach((client) => {
      client.ws.close();
    });

    this.clients.clear();

    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }

    console.log('[Leaderboard WS] Service shutdown complete');
  }
}

export const leaderboardWS = new LeaderboardWebSocketService();
export type { LeaderboardUpdate, LeaderboardClient };


import { WebSocketServer, WebSocket } from "ws";
import DOMPurify from "isomorphic-dompurify";
import OpenAI from "openai";
import crypto from "node:crypto";
import { z } from "zod";
import { storage } from "./storage";
import { botService } from "./bot-service";
import { raceCache } from "./race-cache";
import { wsRateLimiter } from "./ws-rate-limiter";
import { raceCleanupScheduler } from "./race-cleanup";
import { metricsCollector } from "./metrics";
import { eloRatingService } from "./elo-rating-service";
import { antiCheatService } from "./anticheat-service";
import { 
  initializeDistributedRegistry, 
  registerConnectionDistributed, 
  unregisterConnectionDistributed,
  updateConnectionDistributed,
  touchConnectionDistributed,
  terminateLocalConnection,
  subscribeToRaceEventsDistributed,
  broadcastToRaceDistributed,
  shutdownDistributedRegistry,
} from "./distributed-connection-registry";
import { REDIS_ENABLED, redisClient, REDIS_KEYS, REDIS_TTL } from "./redis-client";
import type { Server } from "http";
import type { RaceParticipant } from "@shared/schema";

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

interface RaceClient {
  ws: WebSocket;
  raceId: number;
  participantId: number;
  username: string;
  lastActivity: number;
  isReady: boolean;
  isBot?: boolean;
}

interface DisconnectedPlayer {
  username: string;
  isReady: boolean;
  disconnectedAt: number;
}

interface RejoinRequest {
  participantId: number;
  username: string;
  ws: WebSocket;
  requestedAt: number;
}

interface ChatMessageCache {
  id: number;
  participantId: number;
  username: string;
  avatarColor: string | null;
  content: string;
  isSystem: boolean;
  createdAt: string;
}

interface RaceRoom {
  raceId: number;
  clients: Map<number, RaceClient>;
  countdownTimer?: NodeJS.Timeout;
  timedRaceTimer?: NodeJS.Timeout;
  raceStartTime?: number;
  shardId: number;
  isFinishing?: boolean; // Prevents cleanup during race completion
  isStarting?: boolean; // Prevents double-start race condition
  hostParticipantId?: number; // The first player to join controls the race
  hostVersion: number; // Increment on every host change for consistency
  hostLock: boolean; // Prevent concurrent host changes
  isLocked?: boolean; // Prevents new players from joining
  kickedPlayers: Set<number>; // List of kicked participant IDs
  pendingRejoinRequests: Map<number, RejoinRequest>; // Kicked players waiting for host approval
  timerVersion: number; // Invalidate stale timers
  chatHistory: ChatMessageCache[]; // Cached chat messages for reconnecting players
}

const MAX_CHAT_HISTORY_PER_RACE = 50; // Keep last 50 messages per race

interface ServerStats {
  totalConnections: number;
  activeRooms: number;
  totalParticipants: number;
  messagesProcessed: number;
  messagesDropped: number;
}

const NUM_SHARDS = 16;
const HEARTBEAT_INTERVAL_MS = 30 * 1000;
const CONNECTION_TIMEOUT_MS = 180 * 1000; // 3 minutes - longer than max race duration (2 min)

// Race configuration (can be overridden via environment variables)
const DEFAULT_COUNTDOWN_SECONDS = parseInt(process.env.RACE_COUNTDOWN_SECONDS || '3', 10);
const ALLOW_PRIVATE_CUSTOM_COUNTDOWN = process.env.RACE_PRIVATE_CUSTOM_COUNTDOWN === 'true';

const MAX_CONNECTIONS = 50000;
const LOAD_SHEDDING_THRESHOLD = 0.8;
const DB_FAILURE_THRESHOLD = 5;
const DB_RECOVERY_INTERVAL_MS = 30 * 1000;

interface LoadState {
  isUnderPressure: boolean;
  dbFailures: number;
  lastDbFailure: number;
  lastRecoveryCheck: number;
  connectionRejections: number;
}

interface ExtensionState {
  lastExtendedAt: number;
  extensionCount: number;
  pendingExtension: boolean;
}

const EXTENSION_COOLDOWN_MS = 5000;
const MAX_EXTENSIONS_PER_RACE = 5;

// Connection registry entry for single-connection integrity
interface ConnectionEntry {
  ws: WebSocket;
  connectedAt: number;
  raceId?: number;
  participantId?: number;
}

// Timer registry entry for safe timer cleanup
interface TimerRegistryEntry {
  countdown?: NodeJS.Timeout;
  timedRace?: NodeJS.Timeout;
  version: number;
}

// Maximum connections per identity to prevent abuse
const MAX_CONNECTIONS_PER_IDENTITY = 2;

// Maximum size for bounded maps to prevent memory leaks
const MAX_DISCONNECTED_PLAYERS = 10000;
const MAX_EXTENSION_STATES = 5000;
const MAX_PENDING_REJOIN_REQUESTS = 100;

class RaceWebSocketServer {
  private wss: WebSocketServer | null = null;
  private races: Map<number, RaceRoom> = new Map();
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private extensionStates: Map<number, ExtensionState> = new Map();
  private disconnectedPlayers: Map<number, Map<number, DisconnectedPlayer>> = new Map(); // raceId -> participantId -> info
  
  // Connection registry for single-connection integrity (Phase 1.1)
  // Maps identity key (user:123 or guest:abc) to their active connections
  private connectionRegistry: Map<string, ConnectionEntry[]> = new Map();

  // Reverse lookup: authenticated participantId -> identityKey
  private participantIdentityKey: Map<number, string> = new Map();
  
  // Timer registry for safe timer management (Phase 1.4)
  private timerRegistry: Map<number, TimerRegistryEntry> = new Map();
  
  // Track cleanup timeouts to prevent memory leaks
  private disconnectCleanupTimers: Map<string, NodeJS.Timeout> = new Map();
  
  // Phase 2 hardening: Lock to prevent concurrent race completion
  private completionLocks: Set<number> = new Set();
  
  // Chat rate limits map (tracks participantId -> last message timestamp)
  private chatRateLimits: Map<number, number> = new Map();
  private antiCheatStatus: Map<number, { disqualified: boolean; flagged: boolean; reason?: string }> = new Map();
  private speedViolations: Map<number, number> = new Map();
  
  private stats: ServerStats = {
    totalConnections: 0,
    activeRooms: 0,
    totalParticipants: 0,
    messagesProcessed: 0,
    messagesDropped: 0,
  };
  private loadState: LoadState = {
    isUnderPressure: false,
    dbFailures: 0,
    lastDbFailure: 0,
    lastRecoveryCheck: 0,
    connectionRejections: 0,
  };

  // ==================== CONNECTION REGISTRY METHODS (Phase 1.1) ====================
  
  /**
   * Generate a unique connection key for a user/guest identity
   * @param userId - The user ID for authenticated users
   * @param guestId - The guest ID (stored in guestName field) for guest users  
   * @param participantId - Fallback participant ID for edge cases
   */
  private getConnectionKey(userId?: string, guestId?: string, participantId?: number): string {
    if (userId) return `user:${userId}`;
    if (guestId) return `guest:${guestId}`;
    // Fallback to participant ID to maintain single-connection integrity
    // This handles edge cases where neither userId nor guestId is available
    if (participantId) return `participant:${participantId}`;
    // Last resort - should not happen in normal operation
    console.warn('[WS Connection] No identity found, generating anonymous key');
    return `anon:${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
  }

  /**
   * Phase 4: Extract client IP from HTTP request
   * Handles proxies via X-Forwarded-For header
   */
  /**
   * Phase 4 hardening: Secure IP extraction with validation
   * Only trusts X-Forwarded-For when behind trusted proxies
   * Returns 'REJECT' for invalid/unknown IPs to enable rejection
   */
  private extractClientIP(request: any): string {
    // Get the direct socket address (always available and trustworthy)
    const socketAddress = request.socket?.remoteAddress;
    const normalizedSocketAddr = socketAddress?.startsWith('::ffff:') 
      ? socketAddress.slice(7) 
      : socketAddress;
    
    // Only trust proxy headers if TRUSTED_PROXIES is configured
    // This prevents IP spoofing via X-Forwarded-For headers
    const trustedProxies = process.env.TRUSTED_PROXIES?.split(',').map(p => p.trim()).filter(Boolean) || [];
    
    if (trustedProxies.length > 0 && normalizedSocketAddr) {
      // Check if the immediate connection is from a trusted proxy
      const isTrustedProxy = trustedProxies.some(proxy => {
        if (proxy.includes('/')) {
          // CIDR notation - simplified check (exact match for now)
          return normalizedSocketAddr === proxy.split('/')[0];
        }
        return normalizedSocketAddr === proxy;
      });
      
      if (isTrustedProxy) {
        // Trust X-Forwarded-For from this proxy
        const forwardedFor = request.headers['x-forwarded-for'];
        if (forwardedFor) {
          const ips = forwardedFor.split(',').map((ip: string) => ip.trim());
          const clientIp = ips[0];
          if (clientIp && this.isValidIP(clientIp)) {
            return clientIp;
          }
        }
        
        // Also check X-Real-IP
        const realIp = request.headers['x-real-ip'];
        if (realIp && this.isValidIP(realIp)) {
          return realIp;
        }
      }
    }
    
    // Use socket address directly (no trusted proxy or not behind proxy)
    if (normalizedSocketAddr && this.isValidIP(normalizedSocketAddr)) {
      return normalizedSocketAddr;
    }
    
    // No valid IP available - return REJECT to signal the connection should be dropped
    console.warn('[WS Security] Unable to determine client IP, rejecting connection');
    return 'REJECT';
  }

  /**
   * Validate IP address format (IPv4 or IPv6)
   */
  private isValidIP(ip: string): boolean {
    // IPv4 regex
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    // IPv6 regex (simplified - covers common formats)
    const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
    
    if (ipv4Regex.test(ip)) {
      // Validate each octet is 0-255
      const octets = ip.split('.');
      return octets.every(octet => {
        const num = parseInt(octet, 10);
        return num >= 0 && num <= 255;
      });
    }
    
    return ipv6Regex.test(ip);
  }

  /**
   * Register a new connection for an identity and terminate old connections if needed
   * Ensures single-connection integrity per participant
   */
  private async registerConnectionAsync(ws: WebSocket, userId?: string, guestId?: string, raceId?: number, participantId?: number): Promise<void> {
    const key = this.getConnectionKey(userId, guestId, participantId);
    const now = Date.now();
    
    // CRITICAL: If this WebSocket already has a different connection key, unregister the old one first
    // This handles the case where a connection upgrades from participant:123 to user:456
    const oldKey = (ws as any).connectionKey as string | undefined;
    if (oldKey && oldKey !== key) {
      console.log(`[WS Connection Registry] Switching connection key from ${oldKey} to ${key}`);
      this.unregisterConnectionByKey(oldKey, ws);
    }
    
    // Register in distributed registry first (handles cross-server termination)
    if (REDIS_ENABLED) {
      await registerConnectionDistributed(key, ws, raceId, participantId);
    }
    
    const existing = this.connectionRegistry.get(key) || [];
    
    // Close old connections for the same identity that exceed the limit
    while (existing.length >= MAX_CONNECTIONS_PER_IDENTITY) {
      const oldest = existing.shift();
      if (oldest && oldest.ws !== ws && oldest.ws.readyState === WebSocket.OPEN) {
        console.log(`[WS Connection Registry] Terminating old connection for ${key} (single-connection integrity)`);
        oldest.ws.send(JSON.stringify({
          type: "connection_superseded",
          message: "Another session has connected. This connection will be closed.",
          code: "DUPLICATE_CONNECTION"
        }));
        oldest.ws.close(4000, "Connection superseded by new session");
      }
    }
    
    // Add the new connection
    const entry: ConnectionEntry = { ws, connectedAt: now, raceId, participantId };
    existing.push(entry);
    this.connectionRegistry.set(key, existing);
    
    // Store identity info on WebSocket for later cleanup
    (ws as any).connectionKey = key;
    
    console.log(`[WS Connection Registry] Registered connection for ${key} (total: ${existing.length})`);
  }

  /**
   * Synchronous wrapper for registerConnectionAsync for backward compatibility
   */
  private registerConnection(ws: WebSocket, userId?: string, guestId?: string, raceId?: number, participantId?: number): void {
    // Fire and forget the async registration
    this.registerConnectionAsync(ws, userId, guestId, raceId, participantId).catch(err => {
      console.error('[WS Connection Registry] Async registration error:', err);
    });
  }

  /**
   * Unregister a connection when it closes
   */
  private unregisterConnection(ws: WebSocket): void {
    const key = (ws as any).connectionKey as string | undefined;
    if (!key) return;
    
    const existing = this.connectionRegistry.get(key);
    if (!existing) return;
    
    const filtered = existing.filter(e => e.ws !== ws);
    if (filtered.length === 0) {
      this.connectionRegistry.delete(key);
    } else {
      this.connectionRegistry.set(key, filtered);
    }

    // Best-effort cleanup of participant->identity mapping for this socket only
    const participantId = (ws as any).authenticatedParticipantId as number | undefined;
    if (participantId) {
      this.participantIdentityKey.delete(participantId);
    }
    
    // Also unregister from distributed registry
    if (REDIS_ENABLED) {
      unregisterConnectionDistributed(key, ws).catch(err => {
        console.error('[WS Connection Registry] Distributed unregistration error:', err);
      });
    }
    
    console.log(`[WS Connection Registry] Unregistered connection for ${key} (remaining: ${filtered.length})`);
  }

  /**
   * Unregister a connection by key (used when switching connection keys)
   */
  private unregisterConnectionByKey(key: string, ws: WebSocket): void {
    const existing = this.connectionRegistry.get(key);
    if (!existing) return;
    
    const filtered = existing.filter(e => e.ws !== ws);
    if (filtered.length === 0) {
      this.connectionRegistry.delete(key);
    } else {
      this.connectionRegistry.set(key, filtered);
    }
    
    // Also unregister from distributed registry
    if (REDIS_ENABLED) {
      unregisterConnectionDistributed(key, ws).catch(err => {
        console.error('[WS Connection Registry] Distributed unregistration by key error:', err);
      });
    }
    
    console.log(`[WS Connection Registry] Unregistered old key ${key} (remaining: ${filtered.length})`);
  }

  /**
   * Update connection registry with race/participant info after join
   */
  private updateConnectionInfo(ws: WebSocket, raceId: number, participantId: number): void {
    const key = (ws as any).connectionKey as string | undefined;
    if (!key) return;
    
    const existing = this.connectionRegistry.get(key);
    if (!existing) return;
    
    const entry = existing.find(e => e.ws === ws);
    if (entry) {
      entry.raceId = raceId;
      entry.participantId = participantId;
    }

    this.participantIdentityKey.set(participantId, key);
    
    // Also update in distributed registry
    if (REDIS_ENABLED) {
      updateConnectionDistributed(key, raceId, participantId).catch(err => {
        console.error('[WS Connection Registry] Distributed update error:', err);
      });
    }
  }

  // ==================== TIMER REGISTRY METHODS (Phase 1.4) ====================

  /**
   * Register or update a timer for a race with version tracking
   */
  private registerTimer(raceId: number, type: 'countdown' | 'timedRace', timer: NodeJS.Timeout): number {
    let entry = this.timerRegistry.get(raceId);
    if (!entry) {
      entry = { version: 0 };
      this.timerRegistry.set(raceId, entry);
    }
    
    // Clear existing timer of this type
    if (type === 'countdown' && entry.countdown) {
      clearInterval(entry.countdown);
    } else if (type === 'timedRace' && entry.timedRace) {
      clearTimeout(entry.timedRace);
    }
    
    entry.version++;
    entry[type] = timer;
    
    return entry.version;
  }

  /**
   * Check if a timer version is still valid (not superseded)
   */
  private isTimerValid(raceId: number, version: number): boolean {
    const entry = this.timerRegistry.get(raceId);
    return entry !== undefined && entry.version === version;
  }

  /**
   * Clear all timers for a race
   */
  private clearRaceTimers(raceId: number): void {
    const entry = this.timerRegistry.get(raceId);
    if (!entry) return;
    
    if (entry.countdown) {
      clearInterval(entry.countdown);
      entry.countdown = undefined;
    }
    if (entry.timedRace) {
      clearTimeout(entry.timedRace);
      entry.timedRace = undefined;
    }
    
    entry.version++; // Invalidate any pending timer callbacks
    console.log(`[WS Timer Registry] Cleared all timers for race ${raceId}, version now ${entry.version}`);
  }

  // ==================== ATOMIC RACE COMPLETION (Phase 2 Hardening) ====================

  /**
   * Unified atomic race completion with locking
   * Prevents concurrent completion attempts and ensures exactly-once semantics
   * @param raceId - The race to complete
   * @param trigger - Source of the completion (for logging)
   * @returns true if this call completed the race, false if already completed or locked
   */
  private async completeRaceWithLock(raceId: number, trigger: string): Promise<boolean> {
    // Acquire lock - prevents concurrent completion attempts
    if (this.completionLocks.has(raceId)) {
      console.log(`[Race Complete] Race ${raceId} completion already in progress (trigger: ${trigger})`);
      return false;
    }
    this.completionLocks.add(raceId);
    
    console.log(`[Race Complete] Attempting completion for race ${raceId} (trigger: ${trigger})`);
    
    try {
      // Use atomic database completion - ensures exactly-once semantics
      const { completed, race: completedRace } = await storage.completeRaceAtomic(raceId);
      
      if (!completed) {
        console.log(`[Race Complete] Race ${raceId} not completed - not all finished or already completed`);
        return false;
      }
      
      console.log(`[Race Complete] Race ${raceId} atomically completed (trigger: ${trigger})`);
      
      // Mark room as finishing to prevent cleanup during async operations
      const raceRoom = this.races.get(raceId);
      if (raceRoom) {
        raceRoom.isFinishing = true;
        // Clear timers immediately to prevent duplicate triggers
        if (raceRoom.timedRaceTimer) {
          clearTimeout(raceRoom.timedRaceTimer);
          raceRoom.timedRaceTimer = undefined;
        }
      }
      
      // Fetch final participant state
      const participants = await storage.getRaceParticipants(raceId);
      const finishedAt = completedRace?.finishedAt || new Date();
      
      // Update cache
      raceCache.updateRaceStatus(raceId, "finished", undefined, finishedAt);
      
      // Stop all bots
      botService.stopAllBotsInRace(raceId, participants);
      this.cleanupExtensionState(raceId);
      
      // Sort results by position
      const sortedResults = participants.sort((a, b) => (a.finishPosition || 999) - (b.finishPosition || 999));
      
      // Enrich results with ratings (error won't stop completion)
      let enrichedResults;
      try {
        enrichedResults = await this.enrichResultsWithRatings(sortedResults);
      } catch (error) {
        console.error(`[Race Complete] Rating enrichment failed:`, error);
        enrichedResults = sortedResults;
      }
      
      // Create certificates (error won't stop completion)
      let certificates: Record<number, string> = {};
      try {
        certificates = await this.createRaceCertificates(raceId, sortedResults);
      } catch (error) {
        console.error(`[Race Complete] Certificate creation failed:`, error);
        // Continue without certificates
      }
      
      // Broadcast results - critical path
      console.log(`[Race Complete] Broadcasting race_finished for race ${raceId} with ${enrichedResults.length} results`);
      this.broadcastToRace(raceId, {
        type: "race_finished",
        results: enrichedResults,
        certificates,
      });
      
      // Trigger post-race bot chat
      this.triggerPostRaceBotChat(raceId, sortedResults);
      
      // Process race completion asynchronously (ELO, achievements, etc.)
      this.processRaceCompletion(raceId, sortedResults).catch(err => {
        console.error(`[Race Complete] Error in post-completion processing:`, err);
      });
      
      // Schedule cleanup after giving clients time to receive results
      const timerVersion = raceRoom?.timerVersion;
      setTimeout(() => {
        const currentRoom = this.races.get(raceId);
        if (currentRoom && (timerVersion === undefined || currentRoom.timerVersion === timerVersion)) {
          console.log(`[Race Complete] Cleaning up race room ${raceId}`);
          this.clearRaceTimers(raceId);
          this.timerRegistry.delete(raceId);
          this.races.delete(raceId);
          raceCache.deleteRace(raceId);
          if (REDIS_ENABLED) {
            redisClient.del(REDIS_KEYS.raceConnections(raceId)).catch(() => {});
          }
          this.cleanupExtensionState(raceId);
          // Clean up chat rate limits for this race's participants
          for (const p of participants) {
            this.chatRateLimits.delete(p.id);
          }
        }
      }, 5000);
      
      return true;
    } catch (error) {
      console.error(`[Race Complete] Error completing race ${raceId}:`, error);
      return false;
    } finally {
      // Always release lock
      this.completionLocks.delete(raceId);
    }
  }

  // ==================== TIMED RACE TIMER RESTORATION (Phase 3 Hardening) ====================

  /**
   * Restore timed race timers after server restart
   * Reads persisted timer expiry from Redis and sets up new timers
   */
  private async restoreTimedRaceTimers(): Promise<void> {
    if (!REDIS_ENABLED) {
      return;
    }
    
    console.log("[Timer Restore] Starting timer restoration for active timed races...");
    
    try {
      // Get all active races that are in 'racing' status
      const activeRaces = await storage.getActiveRaces();
      let restoredCount = 0;
      let expiredCount = 0;
      
      for (const race of activeRaces) {
        if (race.raceType !== 'timed' || race.status !== 'racing') {
          continue;
        }
        
        // Check if there's a persisted timer for this race
        const expiryKey = REDIS_KEYS.timedRaceExpiry(race.id);
        const expiryValue = await redisClient.get(expiryKey);
        
        if (!expiryValue) {
          console.log(`[Timer Restore] No persisted timer for race ${race.id}, checking age...`);
          // If no timer and race is old, force finish it
          const raceStartTime = race.startedAt || race.createdAt;
          const maxDuration = (race.timeLimitSeconds || 60) * 1000 + 60000; // time limit + 1 min buffer
          if (raceStartTime && Date.now() - new Date(raceStartTime).getTime() > maxDuration) {
            console.log(`[Timer Restore] Race ${race.id} is stale (no timer, past max duration), force finishing...`);
            await this.forceFinishTimedRace(race.id);
            expiredCount++;
          }
          continue;
        }
        
        const expiryTime = parseInt(expiryValue, 10);
        const remainingMs = expiryTime - Date.now();
        
        if (remainingMs <= 0) {
          // Timer expired during downtime - finish immediately
          console.log(`[Timer Restore] Timer for race ${race.id} expired during downtime, force finishing...`);
          await this.forceFinishTimedRace(race.id);
          // Clean up the Redis key
          await redisClient.del(expiryKey);
          expiredCount++;
        } else {
          // Timer still active - restore it
          console.log(`[Timer Restore] Restoring timer for race ${race.id}: ${remainingMs}ms remaining`);
          
          // Create a race room if one doesn't exist
          let raceRoom = this.races.get(race.id);
          if (!raceRoom) {
            raceRoom = {
              raceId: race.id,
              clients: new Map(),
              shardId: this.getShardId(race.id),
              kickedPlayers: new Set(),
              pendingRejoinRequests: new Map(),
              hostVersion: 0,
              hostLock: false,
              timerVersion: 0,
              raceStartTime: expiryTime - ((race.timeLimitSeconds || 60) * 1000) - 1000, // Approximate start time
              chatHistory: [],
            };
            this.races.set(race.id, raceRoom);
          }
          
          // Set up the timer
          const timerVersion = raceRoom.timerVersion;
          const timedRaceTimer = setTimeout(async () => {
            const currentRoom = this.races.get(race.id);
            if (!currentRoom || currentRoom.timerVersion !== timerVersion) {
              console.log(`[Timer Restore] Restored timer invalidated for race ${race.id}`);
              return;
            }
            
            console.log(`[Timer Restore] Restored timer expired for race ${race.id}, force-finishing...`);
            await this.forceFinishTimedRace(race.id);
            // Clean up the Redis key
            await redisClient.del(REDIS_KEYS.timedRaceExpiry(race.id));
          }, remainingMs);
          
          raceRoom.timedRaceTimer = timedRaceTimer;
          this.registerTimer(race.id, 'timedRace', timedRaceTimer);
          restoredCount++;
        }
      }
      
      console.log(`[Timer Restore] Completed: ${restoredCount} timers restored, ${expiredCount} expired races finished`);
    } catch (error) {
      console.error("[Timer Restore] Error during timer restoration:", error);
    }
  }

  // ==================== HOST MANAGEMENT METHODS (Phase 1.2) ====================

  /**
   * Atomically transfer host to a new participant with locking
   * Returns true if transfer was successful
   */
  private async transferHost(raceRoom: RaceRoom, newHostId: number, reason: string): Promise<boolean> {
    // Check if host transfer is already in progress
    if (raceRoom.hostLock) {
      console.log(`[WS Host] Host transfer blocked - lock active for race ${raceRoom.raceId}`);
      return false;
    }
    
    // Acquire lock
    raceRoom.hostLock = true;
    
    try {
      const previousHostId = raceRoom.hostParticipantId;
      
      // Validate new host is a valid client
      const newHostClient = raceRoom.clients.get(newHostId);
      if (!newHostClient) {
        console.log(`[WS Host] Cannot transfer to ${newHostId} - not a client`);
        return false;
      }
      
      // Don't transfer to bots
      if (newHostClient.isBot) {
        console.log(`[WS Host] Cannot transfer to ${newHostId} - is a bot`);
        return false;
      }
      
      // Perform the transfer
      raceRoom.hostParticipantId = newHostId;
      raceRoom.hostVersion++;
      
      console.log(`[WS Host] Host transferred: ${previousHostId} -> ${newHostId} (${reason}), version ${raceRoom.hostVersion}`);
      
      // Broadcast host change
      this.broadcastToRace(raceRoom.raceId, {
        type: "host_changed",
        newHostParticipantId: newHostId,
        newHostUsername: newHostClient.username,
        previousHostId,
        hostVersion: raceRoom.hostVersion,
        message: `${newHostClient.username} is now the host`,
      });
      
      // Forward pending rejoin requests to new host
      if (raceRoom.pendingRejoinRequests.size > 0) {
        for (const [_, request] of raceRoom.pendingRejoinRequests.entries()) {
          if (newHostClient.ws.readyState === WebSocket.OPEN) {
            newHostClient.ws.send(JSON.stringify({
              type: "rejoin_request",
              participantId: request.participantId,
              username: request.username,
              message: `${request.username} is requesting to rejoin the race`
            }));
          }
        }
        console.log(`[WS Host] Forwarded ${raceRoom.pendingRejoinRequests.size} pending rejoin requests to new host`);
      }
      
      return true;
    } finally {
      // Always release lock
      raceRoom.hostLock = false;
    }
  }

  /**
   * Find the next eligible host after current host disconnects/leaves
   */
  private findNextHost(raceRoom: RaceRoom): number | undefined {
    // Find human clients sorted by participantId (join order)
    const humanClients = Array.from(raceRoom.clients.entries())
      .filter(([_, c]) => !c.isBot)
      .sort((a, b) => a[0] - b[0]);
    
    if (humanClients.length === 0) {
      return undefined;
    }
    
    return humanClients[0][0];
  }

  /**
   * Validate that a participant is currently the host
   */
  private isHost(raceRoom: RaceRoom, participantId: number): boolean {
    return raceRoom.hostParticipantId === participantId;
  }

  private sanitizeParticipantForClient(participant: any): any {
    if (!participant || typeof participant !== "object") return participant;
    const { joinToken, ...rest } = participant;
    return rest;
  }

  private sanitizeParticipantsForClient(participants: any): any {
    if (!Array.isArray(participants)) return participants;
    return participants.map(p => this.sanitizeParticipantForClient(p));
  }

  private sanitizeMessageForClient(message: any): any {
    if (!message || typeof message !== "object") return message;
    const sanitized: any = { ...message };
    if (Array.isArray(sanitized.participants)) {
      sanitized.participants = this.sanitizeParticipantsForClient(sanitized.participants);
    }
    if (sanitized.participant && typeof sanitized.participant === "object") {
      sanitized.participant = this.sanitizeParticipantForClient(sanitized.participant);
    }
    if (Array.isArray(sanitized.results)) {
      sanitized.results = this.sanitizeParticipantsForClient(sanitized.results);
    }
    return sanitized;
  }

  // ==================== BOUNDED MAP UTILITIES (Phase 6) ====================

  /**
   * Add to disconnected players with bounds checking
   */
  private addDisconnectedPlayer(raceId: number, participantId: number, info: DisconnectedPlayer): void {
    // Check global size limit
    let totalSize = 0;
    for (const map of this.disconnectedPlayers.values()) {
      totalSize += map.size;
    }
    
    if (totalSize >= MAX_DISCONNECTED_PLAYERS) {
      // Evict oldest entry
      const oldestEntry = this.findOldestDisconnectedPlayer();
      if (oldestEntry) {
        const [evictRaceId, evictParticipantId] = oldestEntry;
        this.removeDisconnectedPlayer(evictRaceId, evictParticipantId);
        console.log(`[WS Bounded Map] Evicted oldest disconnected player entry (race ${evictRaceId}, participant ${evictParticipantId})`);
      }
    }
    
    if (!this.disconnectedPlayers.has(raceId)) {
      this.disconnectedPlayers.set(raceId, new Map());
    }
    this.disconnectedPlayers.get(raceId)!.set(participantId, info);
  }

  private findOldestDisconnectedPlayer(): [number, number] | null {
    let oldest: { raceId: number; participantId: number; time: number } | null = null;
    
    for (const [raceId, map] of this.disconnectedPlayers.entries()) {
      for (const [participantId, info] of map.entries()) {
        if (!oldest || info.disconnectedAt < oldest.time) {
          oldest = { raceId, participantId, time: info.disconnectedAt };
        }
      }
    }
    
    return oldest ? [oldest.raceId, oldest.participantId] : null;
  }

  private removeDisconnectedPlayer(raceId: number, participantId: number): void {
    const map = this.disconnectedPlayers.get(raceId);
    if (map) {
      map.delete(participantId);
      if (map.size === 0) {
        this.disconnectedPlayers.delete(raceId);
      }
    }
    
    // Also clear any pending cleanup timer
    const timerKey = `${raceId}-${participantId}`;
    const timer = this.disconnectCleanupTimers.get(timerKey);
    if (timer) {
      clearTimeout(timer);
      this.disconnectCleanupTimers.delete(timerKey);
    }
  }

  /**
   * Schedule cleanup for disconnected player with timer tracking
   */
  private scheduleDisconnectedPlayerCleanup(raceId: number, participantId: number, info: DisconnectedPlayer): void {
    const timerKey = `${raceId}-${participantId}`;
    
    // Clear existing timer if any
    const existingTimer = this.disconnectCleanupTimers.get(timerKey);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    
    const timer = setTimeout(async () => {
      this.disconnectCleanupTimers.delete(timerKey);
      const disconnectedMap = this.disconnectedPlayers.get(raceId);
      if (disconnectedMap) {
        const currentInfo = disconnectedMap.get(participantId);
        if (currentInfo && currentInfo.disconnectedAt === info.disconnectedAt) {
          // Player didn't reconnect - mark as inactive in DB if race is still waiting
          const cachedRace = raceCache.getRace(raceId);
          if (cachedRace?.race?.status === "waiting") {
            try {
              await storage.deleteRaceParticipant(participantId);
              raceCache.removeParticipant(raceId, participantId);
              console.log(`[WS Cleanup] Removed non-reconnecting participant ${participantId} from waiting race ${raceId}`);
              
              // Broadcast participant removal to remaining clients
              this.broadcastToRace(raceId, {
                type: "participant_left",
                participantId,
                username: info.username,
              });
            } catch (err: any) {
              if (!err?.message?.includes('compute time quota')) {
                console.error(`[WS Cleanup] Failed to cleanup participant ${participantId}:`, err);
              }
            }
          }
          this.removeDisconnectedPlayer(raceId, participantId);
        }
      }
    }, 5 * 60 * 1000);
    
    this.disconnectCleanupTimers.set(timerKey, timer);
  }

  private async enrichResultsWithRatings(participants: any[]): Promise<any[]> {
    const enrichedResults = await Promise.all(
      participants.map(async (p) => {
        if (p.isBot === 1) {
          return { ...p, isBot: true, rating: null, tier: null, ratingChange: null };
        }
        
        if (!p.userId) {
          return { ...p, isBot: false, rating: null, tier: null, ratingChange: null };
        }
        
        try {
          const userRating = await storage.getOrCreateUserRating(p.userId);
          const tierInfo = eloRatingService.getTierInfo(userRating.tier);
          return {
            ...p,
            isBot: false,
            rating: userRating.rating,
            tier: userRating.tier,
            tierInfo,
            ratingChange: null,
          };
        } catch (error) {
          console.error(`[Rating] Failed to fetch rating for user ${p.userId}:`, error);
          return { ...p, isBot: false, rating: null, tier: null, ratingChange: null };
        }
      })
    );
    return enrichedResults;
  }

  // Check if a race has active WebSocket connections
  hasActiveConnections(raceId: number): boolean {
    const raceRoom = this.races.get(raceId);
    if (!raceRoom) return false;
    
    // Check for any connected clients (including bots)
    return raceRoom.clients.size > 0;
  }

  // Check if a race room is locked (prevents new players from joining)
  isRoomLocked(raceId: number): boolean {
    const raceRoom = this.races.get(raceId);
    if (!raceRoom) return false;
    return raceRoom.isLocked === true;
  }

  // Check if a participant was kicked from a race
  isParticipantKicked(raceId: number, participantId: number): boolean {
    const raceRoom = this.races.get(raceId);
    if (!raceRoom) return false;
    return raceRoom.kickedPlayers.has(participantId);
  }

  // Broadcast new participant to all connected clients when someone joins via HTTP
  // This ensures real-time updates even before the new player connects via WebSocket
  broadcastNewParticipant(raceId: number, participant: RaceParticipant, allParticipants: RaceParticipant[]): void {
    const raceRoom = this.races.get(raceId);
    if (!raceRoom) {
      console.log(`[WS] Cannot broadcast new participant - no room for race ${raceId}`);
      return;
    }

    console.log(`[WS] Broadcasting new participant ${participant.username} to ${raceRoom.clients.size} clients in race ${raceId}`);

    this.broadcastToRace(raceId, {
      type: "participant_joined",
      participant,
      participants: allParticipants,
      hostParticipantId: raceRoom.hostParticipantId,
    });

    // Also send a full sync to ensure everyone is in sync
    this.broadcastToRace(raceId, {
      type: "participants_sync",
      participants: allParticipants,
      hostParticipantId: raceRoom.hostParticipantId,
    });
  }

  // Broadcast when a bot is removed to make room for a human player
  broadcastParticipantRemoved(raceId: number, removedParticipantId: number, allParticipants: RaceParticipant[]): void {
    const raceRoom = this.races.get(raceId);
    if (!raceRoom) return;

    this.broadcastToRace(raceId, {
      type: "participant_removed",
      participantId: removedParticipantId,
      participants: allParticipants,
      hostParticipantId: raceRoom.hostParticipantId,
    });
  }

  initialize(server: Server) {
    this.wss = new WebSocketServer({ noServer: true });
    
    // Handle upgrade requests manually to avoid conflicts with Vite HMR
    server.on('upgrade', (request, socket, head) => {
      const pathname = request.url ? new URL(request.url, `http://${request.headers.host}`).pathname : '';
      
      if (pathname === '/ws/race') {
        // Phase 4: Extract IP for rate limiting
        const ip = this.extractClientIP(request);
        
        this.wss!.handleUpgrade(request, socket, head, (ws) => {
          // Store IP on WebSocket for later use
          (ws as any).clientIP = ip;
          this.wss!.emit('connection', ws, request);
        });
      }
      // Don't destroy socket for other paths - let other handlers process them
    });

    raceCache.initialize(async (updates) => {
      await this.flushProgressToDatabase(updates);
    });

    wsRateLimiter.initialize();
    
    // Initialize distributed connection registry for cross-server coordination
    if (REDIS_ENABLED) {
      initializeDistributedRegistry((identityKey) => {
        // Handle termination requests from other servers
        terminateLocalConnection(identityKey);
      });
      
      // Subscribe to race events from other servers
      subscribeToRaceEventsDistributed((raceId, event) => {
        // Forward events from other servers to local clients
        this.handleDistributedRaceEvent(raceId, event);
      });
      
      console.log("[WS] Distributed connection registry initialized");
    }
    
    // Register callback so cleanup scheduler can check for active connections
    raceCleanupScheduler.setActiveConnectionsChecker((raceId) => this.hasActiveConnections(raceId));
    raceCleanupScheduler.initialize();

    // Phase 3 hardening: Restore timed race timers after startup
    if (REDIS_ENABLED) {
      this.restoreTimedRaceTimers().catch(err => {
        console.error("[WS] Failed to restore timed race timers:", err);
      });
    }

    this.wss.on("connection", (ws: WebSocket) => {
      this.acceptConnection(ws).then((allowed) => {
        if (!allowed) {
          return;
        }
      
        this.stats.totalConnections++;
        console.log(`[WS] New connection (total: ${this.stats.totalConnections})`);

        ws.on("message", async (data: Buffer | string) => {
          const dataStr = data.toString();

          const validation = wsRateLimiter.validatePayload(dataStr);
          if (!validation.valid) {
            ws.send(JSON.stringify({
              type: "error",
              message: validation.error,
              code: "INVALID_PAYLOAD",
            }));
            return;
          }

          try {
            const message = JSON.parse(dataStr);

            // Guardrail: allow larger payloads only for keystroke submissions
            const MAX_NON_KEYSTROKE_PAYLOAD = 16 * 1024;
            if (dataStr.length > MAX_NON_KEYSTROKE_PAYLOAD && message.type !== 'submit_keystrokes') {
              ws.send(JSON.stringify({
                type: "error",
                message: "Payload too large",
                code: "INVALID_PAYLOAD",
              }));
              return;
            }

            const rateLimit = wsRateLimiter.checkLimit(ws, message.type);
            if (!rateLimit.allowed) {
              this.stats.messagesDropped++;
              if (rateLimit.violation) {
                ws.send(JSON.stringify({
                  type: "error",
                  message: "Rate limit exceeded. Please slow down.",
                  code: "RATE_LIMITED",
                  retryAfter: rateLimit.retryAfter,
                }));
              }
              return;
            }

            // Distributed per-identity rate limiting (best-effort, fail-open)
            const authParticipantId = (ws as any).authenticatedParticipantId as number | undefined;
            const identityKey = authParticipantId ? this.participantIdentityKey.get(authParticipantId) : undefined;
            if (REDIS_ENABLED && identityKey) {
              try {
                const dist = await wsRateLimiter.checkLimitDistributed(identityKey, message.type);
                if (!dist.allowed) {
                  this.stats.messagesDropped++;
                  ws.send(JSON.stringify({
                    type: "error",
                    message: "Rate limit exceeded. Please slow down.",
                    code: "RATE_LIMITED",
                    retryAfter: dist.retryAfter,
                  }));
                  return;
                }

                const lastTouch = (ws as any).lastDistTouch as number | undefined;
                const now = Date.now();
                if (!lastTouch || now - lastTouch > 5000) {
                  (ws as any).lastDistTouch = now;
                  void touchConnectionDistributed(identityKey);
                }
              } catch {
                // Fail open (local limiter already applied)
              }
            }

            this.stats.messagesProcessed++;
            metricsCollector.recordWsMessage();
            await this.handleMessage(ws, message);
          } catch (error) {
            console.error("WebSocket message error:", error);
            ws.send(JSON.stringify({ type: "error", message: "Invalid message format" }));
          }
        });

        ws.on("close", () => {
          this.stats.totalConnections--;
          wsRateLimiter.removeClient(ws);
          this.unregisterConnection(ws); // Phase 1.1: Clean up connection registry
        void this.handleDisconnect(ws);
        });

        ws.on("error", (error) => {
          console.error("WebSocket error:", error);
          // Also cleanup on error to prevent ghost connections
          this.unregisterConnection(ws);
        });
      });
    });

    this.heartbeatTimer = setInterval(() => {
      void this.performHeartbeat();
    }, HEARTBEAT_INTERVAL_MS);

    console.log("[WS] WebSocket server initialized with scalability features");
    console.log(`[WS] Shards: ${NUM_SHARDS}, Heartbeat: ${HEARTBEAT_INTERVAL_MS}ms`);
  }

  async shutdown(): Promise<void> {
    console.log("[WS] Starting graceful shutdown...");
    
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    
    // Stop all active bots and update race statuses
    const raceRooms = Array.from(this.races.values());
    const shutdownPromises: Promise<void>[] = [];
    
    for (const raceRoom of raceRooms) {
      if (raceRoom.countdownTimer) {
        clearInterval(raceRoom.countdownTimer);
      }
      if (raceRoom.timedRaceTimer) {
        clearTimeout(raceRoom.timedRaceTimer);
      }
      
      // Stop all bots in this race
      const cachedRace = raceCache.getRace(raceRoom.raceId);
      if (cachedRace?.participants) {
        botService.stopAllBotsInRace(raceRoom.raceId, cachedRace.participants);
      }
      
      // Phase 6 hardening: Properly complete active races during shutdown
      // This ensures final positions are calculated and certificates are created
      if (cachedRace?.race?.status === "racing") {
        shutdownPromises.push(
          (async () => {
            try {
              console.log(`[WS Shutdown] Properly completing race ${raceRoom.raceId}...`);
              
              // For timed races, force-finish all participants first
              if (cachedRace.race?.raceType === "timed") {
                const participants = await storage.getRaceParticipants(raceRoom.raceId);
                const elapsedSeconds = cachedRace.race.timeLimitSeconds || 60;
                
                for (const participant of participants) {
                  if (participant.isFinished === 0) {
                    const correctChars = Math.max(0, participant.progress - participant.errors);
                    const calculatedWpm = elapsedSeconds > 0 
                      ? Math.round((correctChars / 5) / (elapsedSeconds / 60)) 
                      : 0;
                    const calculatedAccuracy = participant.progress > 0 
                      ? Math.round((correctChars / participant.progress) * 100 * 100) / 100
                      : 100;
                    
                    await storage.updateParticipantProgress(
                      participant.id,
                      participant.progress,
                      calculatedWpm,
                      calculatedAccuracy,
                      participant.errors
                    );
                    await storage.finishParticipant(participant.id);
                  }
                }
              }
              
              // Use unified atomic completion
              const completed = await this.completeRaceWithLock(raceRoom.raceId, 'shutdown');
              if (!completed) {
                // Fallback: just mark as finished if atomic completion fails
                console.log(`[WS Shutdown] Fallback: marking race ${raceRoom.raceId} as finished`);
                await storage.updateRaceStatus(raceRoom.raceId, "finished");
              }
            } catch (err) {
              console.error(`[WS Shutdown] Error completing race ${raceRoom.raceId}:`, err);
              // Fallback: just mark as finished
              await storage.updateRaceStatus(raceRoom.raceId, "finished").catch(() => {});
            }
          })()
        );
      } else if (cachedRace?.race?.status === "countdown") {
        // For countdown races, just mark as finished
        shutdownPromises.push(
          storage.updateRaceStatus(raceRoom.raceId, "finished")
            .catch(err => console.error(`[WS Shutdown] Failed to update race ${raceRoom.raceId} status:`, err))
        );
      }
      
      // Notify connected clients of shutdown
      this.broadcastToRace(raceRoom.raceId, {
        type: "server_shutdown",
        message: "Server is shutting down. Your progress has been saved."
      });
    }
    
    // Wait for all race status updates to complete
    if (shutdownPromises.length > 0) {
      console.log(`[WS Shutdown] Waiting for ${shutdownPromises.length} race status updates...`);
      await Promise.all(shutdownPromises);
    }
    
    raceCache.shutdown();
    wsRateLimiter.shutdown();
    raceCleanupScheduler.shutdown();
    
    // Shutdown distributed connection registry
    if (REDIS_ENABLED) {
      await shutdownDistributedRegistry();
    }
    
    // Phase 1.1 & 1.4 & 6: Clean up all registries and timers
    // Clear all timer registry entries
    for (const [raceId] of this.timerRegistry.entries()) {
      this.clearRaceTimers(raceId);
    }
    this.timerRegistry.clear();
    
    // Clear all disconnect cleanup timers
    for (const timer of this.disconnectCleanupTimers.values()) {
      clearTimeout(timer);
    }
    this.disconnectCleanupTimers.clear();
    
    // Clear other registries
    this.connectionRegistry.clear();
    this.disconnectedPlayers.clear();
    this.extensionStates.clear();
    
    this.races.clear();
    console.log("[WS] Graceful shutdown complete");
  }

  private async flushProgressToDatabase(updates: Map<number, { progress: number; wpm: number; accuracy: number; errors: number; lastUpdate: number; dirty: boolean }>): Promise<void> {
    if (this.loadState.dbFailures >= DB_FAILURE_THRESHOLD) {
      console.warn("[WS] DB circuit breaker open, skipping progress flush");
      return;
    }

    const dbUpdates = new Map<number, { progress: number; wpm: number; accuracy: number; errors: number }>();
    
    const updateEntries = Array.from(updates.entries());
    for (const [id, update] of updateEntries) {
      dbUpdates.set(id, {
        progress: update.progress,
        wpm: update.wpm,
        accuracy: update.accuracy,
        errors: update.errors,
      });
    }

    if (dbUpdates.size > 0) {
      try {
        await storage.bulkUpdateParticipantProgress(dbUpdates);
        this.recordDbSuccess();
      } catch (error) {
        console.error("[WS] Failed to flush progress to database:", error);
        this.recordDbFailure();
      }
    }
  }

  private getShardId(raceId: number): number {
    return raceId % NUM_SHARDS;
  }

  private async performHeartbeat(): Promise<void> {
    const now = Date.now();
    let staleConnections = 0;

    const raceEntries = Array.from(this.races.entries());
    for (const [raceId, raceRoom] of raceEntries) {
      const staleClients: number[] = [];
      
      const clientEntries = Array.from(raceRoom.clients.entries());
      for (const [participantId, client] of clientEntries) {
        if (now - client.lastActivity > CONNECTION_TIMEOUT_MS) {
          staleClients.push(participantId);
          staleConnections++;
        }
      }

      for (const participantId of staleClients) {
        const client = raceRoom.clients.get(participantId);
        if (!client) {
          continue;
        }

        try {
          await raceCache.flushParticipantProgress(participantId);
        } catch (error) {
          console.error(`[WS Heartbeat] Failed to flush progress for participant ${participantId}:`, error);
        }

        // Important: close the socket to trigger the normal close->unregisterConnection->handleDisconnect path.
        // That path is responsible for removing Redis raceConnections membership and preventing ghost connections.
        if (client.ws.readyState === WebSocket.OPEN) {
          try {
            client.ws.close(4001, "Connection timeout");
          } catch {
            // Best-effort
          }
        }
      }
      
      // Cleanup stale pending rejoin requests (older than 60 seconds)
      const REJOIN_REQUEST_TIMEOUT_MS = 60 * 1000;
      const staleRejoinRequests: number[] = [];
      for (const [pId, request] of raceRoom.pendingRejoinRequests.entries()) {
        if (now - request.requestedAt > REJOIN_REQUEST_TIMEOUT_MS) {
          staleRejoinRequests.push(pId);
        }
      }
      
      for (const pId of staleRejoinRequests) {
        const request = raceRoom.pendingRejoinRequests.get(pId);
        if (request && request.ws.readyState === WebSocket.OPEN) {
          request.ws.send(JSON.stringify({
            type: "rejoin_rejected",
            message: "Rejoin request timed out - host did not respond",
            code: "REQUEST_TIMEOUT"
          }));
        }
        raceRoom.pendingRejoinRequests.delete(pId);
        console.log(`[WS Heartbeat] Rejoin request from ${request?.username || pId} timed out in race ${raceId}`);
      }

      if (raceRoom.clients.size === 0) {
        // NEVER clean up a race that is currently finishing - prevents race condition
        if (raceRoom.isFinishing) {
          console.log(`[WS Heartbeat] Keeping race room ${raceId} alive - race is finishing`);
          continue;
        }
        
        // For timed races that are still racing, DON'T delete the room - let the timer complete
        const timerEntry = this.timerRegistry.get(raceId);
        if (timerEntry?.timedRace || raceRoom.timedRaceTimer) {
          console.log(`[WS Heartbeat] Keeping race room ${raceId} alive - timed race timer active`);
          continue;
        }
        
        // Phase 1.4: Clean up all timers via registry
        this.clearRaceTimers(raceId);
        this.timerRegistry.delete(raceId);
        
        if (raceRoom.countdownTimer) {
          clearInterval(raceRoom.countdownTimer);
        }
        this.races.delete(raceId);
        raceCache.deleteRace(raceId);
        this.cleanupExtensionState(raceId);
        
        // Clean up disconnected player entries and their timers
        const disconnectedMap = this.disconnectedPlayers.get(raceId);
        if (disconnectedMap) {
          for (const [pId] of disconnectedMap.entries()) {
            const timerKey = `${raceId}-${pId}`;
            const timer = this.disconnectCleanupTimers.get(timerKey);
            if (timer) {
              clearTimeout(timer);
              this.disconnectCleanupTimers.delete(timerKey);
            }
          }
          this.disconnectedPlayers.delete(raceId);
        }
      }
    }

    this.updateStats();

    if (staleConnections > 0) {
      console.log(`[WS] Heartbeat: cleaned ${staleConnections} stale connections`);
    }
  }

  private updateStats(): void {
    this.stats.activeRooms = this.races.size;
    let totalParticipants = 0;
    const rooms = Array.from(this.races.values());
    for (const room of rooms) {
      totalParticipants += room.clients.size;
    }
    this.stats.totalParticipants = totalParticipants;
  }

  // SECURITY: Validate that the message comes from an authenticated participant
  private validateAuthenticatedMessage(ws: WebSocket, message: any): boolean {
    const authParticipantId = (ws as any).authenticatedParticipantId;
    const authRaceId = (ws as any).authenticatedRaceId;
    
    // Skip validation for join messages (authentication happens there)
    if (message.type === "join") {
      return true;
    }
    
    // Spectate and get_replay don't require prior authentication
    if (message.type === "spectate" || message.type === "get_replay" || message.type === "stop_spectate" || message.type === "get_rating") {
      return true;
    }
    
    // Must be authenticated for all other messages
    if (!authParticipantId) {
      console.warn(`[WS Security] Unauthenticated message rejected: ${message.type}`);
      ws.send(JSON.stringify({ type: "error", message: "Not authenticated. Please join a race first." }));
      return false;
    }
    
    // Validate participantId in message matches authenticated ID
    if (message.participantId && message.participantId !== authParticipantId) {
      console.warn(`[WS Security] Participant ID mismatch: auth=${authParticipantId}, message=${message.participantId}`);
      ws.send(JSON.stringify({ type: "error", message: "Invalid participant ID" }));
      return false;
    }
    
    // Validate raceId in message matches authenticated race
    if (message.raceId && message.raceId !== authRaceId) {
      console.warn(`[WS Security] Race ID mismatch: auth=${authRaceId}, message=${message.raceId}`);
      ws.send(JSON.stringify({ type: "error", message: "Invalid race ID" }));
      return false;
    }
    
    return true;
  }

  private async handleMessage(ws: WebSocket, message: any) {
    // SECURITY: Validate authentication before processing
    if (!this.validateAuthenticatedMessage(ws, message)) {
      return;
    }
    
    // Update lastActivity on ANY message to keep connection alive
    const authRaceId = (ws as any).authenticatedRaceId;
    const authParticipantId = (ws as any).authenticatedParticipantId;
    if (authRaceId && authParticipantId) {
      const raceRoom = this.races.get(authRaceId);
      if (raceRoom) {
        const client = raceRoom.clients.get(authParticipantId);
        if (client) {
          client.lastActivity = Date.now();
        }
      }
    }
    
    switch (message.type) {
      case "join":
        {
          const parsed = RaceWebSocketServer.joinSchema.safeParse(message);
          if (!parsed.success) {
            ws.send(JSON.stringify({ type: "error", message: "Invalid join payload", code: "INVALID_PAYLOAD" }));
            return;
          }
          await this.handleJoin(ws, parsed.data);
        }
        break;
      case "ready":
        {
          const parsed = RaceWebSocketServer.readySchema.safeParse(message);
          if (!parsed.success) {
            ws.send(JSON.stringify({ type: "error", message: "Invalid ready payload", code: "INVALID_PAYLOAD" }));
            return;
          }
          await this.handleReady(parsed.data);
        }
        break;
      case "progress":
        {
          const parsed = RaceWebSocketServer.progressSchema.safeParse(message);
          if (!parsed.success) {
            ws.send(JSON.stringify({ type: "error", message: "Invalid progress payload", code: "INVALID_PAYLOAD" }));
            return;
          }
          // Pass authenticated raceId for O(1) lookup instead of O(n) scan
          await this.handleProgress(parsed.data, (ws as any).authenticatedRaceId);
        }
        break;
      case "finish":
        {
          const parsed = RaceWebSocketServer.finishSchema.safeParse(message);
          if (!parsed.success) {
            ws.send(JSON.stringify({ type: "error", message: "Invalid finish payload", code: "INVALID_PAYLOAD" }));
            return;
          }
          await this.handleFinish(parsed.data);
        }
        break;
      case "timed_finish":
        {
          const parsed = RaceWebSocketServer.timedFinishSchema.safeParse(message);
          if (!parsed.success) {
            ws.send(JSON.stringify({ type: "error", message: "Invalid timed finish payload", code: "INVALID_PAYLOAD" }));
            return;
          }
          await this.handleTimedFinish(parsed.data);
        }
        break;
      case "leave":
        {
          const parsed = RaceWebSocketServer.leaveSchema.safeParse(message);
          if (!parsed.success) {
            ws.send(JSON.stringify({ type: "error", message: "Invalid leave payload", code: "INVALID_PAYLOAD" }));
            return;
          }
          // Extra strict authorization: must match the authenticated socket
          const authParticipantId = (ws as any).authenticatedParticipantId;
          const authRaceId = (ws as any).authenticatedRaceId;
          if (authParticipantId !== parsed.data.participantId || authRaceId !== parsed.data.raceId) {
            ws.send(JSON.stringify({ type: "error", message: "Invalid participant or race", code: "NOT_AUTHORIZED" }));
            return;
          }
          await this.handleLeave(ws, parsed.data);
        }
        break;
      case "extend_paragraph":
        {
          const parsed = RaceWebSocketServer.extendParagraphSchema.safeParse(message);
          if (!parsed.success) {
            ws.send(JSON.stringify({ type: "error", message: "Invalid extend payload", code: "INVALID_PAYLOAD" }));
            return;
          }
          await this.handleExtendParagraph(ws, parsed.data);
        }
        break;
      case "submit_keystrokes":
        await this.handleSubmitKeystrokes(ws, message);
        break;
      case "chat_message":
        {
          const parsed = RaceWebSocketServer.chatMessageSchema.safeParse(message);
          if (!parsed.success) {
            ws.send(JSON.stringify({ type: "error", message: "Invalid chat payload", code: "INVALID_PAYLOAD" }));
            return;
          }
          await this.handleChatMessage(ws, parsed.data);
        }
        break;
      case "spectate":
        {
          const parsed = RaceWebSocketServer.spectateSchema.safeParse(message);
          if (!parsed.success) {
            ws.send(JSON.stringify({ type: "error", message: "Invalid spectate payload", code: "INVALID_PAYLOAD" }));
            return;
          }
          await this.handleSpectate(ws, parsed.data);
        }
        break;
      case "stop_spectate":
        {
          const parsed = RaceWebSocketServer.stopSpectateSchema.safeParse(message);
          if (!parsed.success) {
            ws.send(JSON.stringify({ type: "error", message: "Invalid stop spectate payload", code: "INVALID_PAYLOAD" }));
            return;
          }
          await this.handleStopSpectate(ws, parsed.data);
        }
        break;
      case "get_replay":
        {
          const parsed = RaceWebSocketServer.getReplaySchema.safeParse(message);
          if (!parsed.success) {
            ws.send(JSON.stringify({ type: "error", message: "Invalid replay request", code: "INVALID_PAYLOAD" }));
            return;
          }
          await this.handleGetReplay(ws, parsed.data);
        }
        break;
      case "get_rating":
        {
          const parsed = RaceWebSocketServer.getRatingSchema.safeParse(message);
          if (!parsed.success) {
            ws.send(JSON.stringify({ type: "error", message: "Invalid rating request", code: "INVALID_PAYLOAD" }));
            return;
          }
          await this.handleGetRating(ws, parsed.data);
        }
        break;
      case "ready_toggle":
        {
          const parsed = RaceWebSocketServer.readyToggleSchema.safeParse(message);
          if (!parsed.success) {
            ws.send(JSON.stringify({ type: "error", message: "Invalid ready toggle payload", code: "INVALID_PAYLOAD" }));
            return;
          }
          await this.handleReadyToggle(ws, parsed.data);
        }
        break;
      case "kick_player":
        {
          const parsed = RaceWebSocketServer.kickPlayerSchema.safeParse(message);
          if (!parsed.success) {
            ws.send(JSON.stringify({ type: "error", message: "Invalid kick payload", code: "INVALID_PAYLOAD" }));
            return;
          }
          await this.handleKickPlayer(ws, parsed.data);
        }
        break;
      case "rejoin_decision":
        {
          const parsed = RaceWebSocketServer.rejoinDecisionSchema.safeParse(message);
          if (!parsed.success) {
            ws.send(JSON.stringify({ type: "error", message: "Invalid rejoin decision payload", code: "INVALID_PAYLOAD" }));
            return;
          }
          await this.handleRejoinDecision(ws, parsed.data);
        }
        break;
      case "lock_room":
        {
          const parsed = RaceWebSocketServer.lockRoomSchema.safeParse(message);
          if (!parsed.success) {
            ws.send(JSON.stringify({ type: "error", message: "Invalid lock payload", code: "INVALID_PAYLOAD" }));
            return;
          }
          await this.handleLockRoom(ws, parsed.data);
        }
        break;
      case "rematch":
        {
          const parsed = RaceWebSocketServer.rematchSchema.safeParse(message);
          if (!parsed.success) {
            ws.send(JSON.stringify({ type: "error", message: "Invalid rematch payload", code: "INVALID_PAYLOAD" }));
            return;
          }
          await this.handleRematch(ws, parsed.data);
        }
        break;
      default:
        console.warn("Unknown message type:", message.type);
    }
  }

  private async handleJoin(ws: WebSocket, message: any) {
    const { raceId, participantId, username, joinToken } = message;

    if (!raceId || !participantId || !username) {
      ws.send(JSON.stringify({ type: "error", message: "Missing required fields" }));
      return;
    }

    // SECURITY: Require join token for authentication (Phase 1 hardening)
    if (!joinToken) {
      console.warn(`[WS Security] Join rejected: missing join token for participant ${participantId}`);
      ws.send(JSON.stringify({ type: "error", message: "Join token required", code: "TOKEN_REQUIRED" }));
      return;
    }

    let cachedRace = raceCache.getRace(raceId);
    let race;
    let participants;

    if (cachedRace) {
      race = cachedRace.race;
      participants = cachedRace.participants;
    } else {
      race = await storage.getRace(raceId);
      if (!race) {
        ws.send(JSON.stringify({ type: "error", message: "Race not found" }));
        return;
      }
      participants = await storage.getRaceParticipants(raceId);
      raceCache.setRace(race, participants);
    }

    // SECURITY: Verify participant exists and belongs to this race
    let participant = participants.find(p => p.id === participantId);
    
    // If not found in cache, the participant might have just been created via HTTP join
    // Fetch fresh data from database to ensure we have the latest state
    if (!participant) {
      console.log(`[WS] Participant ${participantId} not in cache, fetching fresh from database...`);
      participants = await storage.getRaceParticipants(raceId);
      participant = participants.find(p => p.id === participantId);
      
      if (participant) {
        // Update cache with fresh data
        raceCache.updateParticipants(raceId, participants, race);
        console.log(`[WS] Found participant ${participantId} in database, cache updated`);
      } else {
        console.warn(`[WS Security] Join rejected: participant ${participantId} not found in race ${raceId}`);
        ws.send(JSON.stringify({ type: "error", message: "Invalid participant" }));
        return;
      }
    }

    // SECURITY: Verify participant belongs to this race (prevents cross-race confusion)
    if (participant.raceId !== raceId) {
      console.warn(`[WS Security] Join rejected: participant ${participantId} belongs to race ${participant.raceId}, not ${raceId}`);
      ws.send(JSON.stringify({ type: "error", message: "Participant not in this race" }));
      return;
    }

    // SECURITY: Verify username matches (prevents impersonation)
    if (participant.username !== username) {
      console.warn(`[WS Security] Join rejected: username mismatch for participant ${participantId}. Expected: ${participant.username}, Got: ${username}`);
      ws.send(JSON.stringify({ type: "error", message: "Username mismatch" }));
      return;
    }

    // SECURITY: Verify join token matches (Phase 1 hardening - cryptographic authentication)
    // This prevents impersonation even if attacker knows participantId, raceId, and username
    if (participant.joinToken !== joinToken) {
      console.warn(`[WS Security] Join rejected: invalid join token for participant ${participantId}`);
      ws.send(JSON.stringify({ type: "error", message: "Invalid join token", code: "INVALID_TOKEN" }));
      return;
    }

    // Store authenticated participant ID on the WebSocket for future validation
    (ws as any).authenticatedParticipantId = participantId;
    (ws as any).authenticatedRaceId = raceId;

    // Phase 1.1: Register connection for single-connection integrity
    // This will terminate old connections for the same identity
    this.registerConnection(ws, participant.userId ?? undefined, participant.guestName ?? undefined, raceId, participantId);
    this.updateConnectionInfo(ws, raceId, participantId);

    let raceRoom = this.races.get(raceId);
    if (!raceRoom) {
      raceRoom = {
        raceId,
        clients: new Map(),
        shardId: this.getShardId(raceId),
        kickedPlayers: new Set(),
        pendingRejoinRequests: new Map(),
        hostVersion: 0,
        hostLock: false,
        timerVersion: 0,
        chatHistory: [],
      };
      this.races.set(raceId, raceRoom);
    }

    // Check if player was kicked from this room
    if (raceRoom.kickedPlayers.has(participantId)) {
      // Check race status - can only request rejoin during waiting, not during racing or finished
      const cachedRace = raceCache.getRace(raceId);
      const raceStatus = cachedRace?.race?.status;
      
      if (raceStatus === "racing" || raceStatus === "finished") {
        ws.send(JSON.stringify({ 
          type: "error", 
          message: "Cannot rejoin - race is already in progress or finished",
          code: "RACE_IN_PROGRESS"
        }));
        return;
      }
      
      // Check if there's a host to approve the request
      if (!raceRoom.hostParticipantId) {
        ws.send(JSON.stringify({ 
          type: "error", 
          message: "Cannot rejoin - no host available to approve",
          code: "NO_HOST"
        }));
        return;
      }
      
      // Check if player already has a pending request
      if (raceRoom.pendingRejoinRequests.has(participantId)) {
        ws.send(JSON.stringify({ 
          type: "rejoin_request_pending", 
          message: "Your rejoin request is still pending host approval"
        }));
        return;
      }
      
      // Store the pending rejoin request
      raceRoom.pendingRejoinRequests.set(participantId, {
        participantId,
        username,
        ws,
        requestedAt: Date.now()
      });
      
      // Notify the kicked player that their request is pending
      ws.send(JSON.stringify({ 
        type: "rejoin_request_pending", 
        message: "Rejoin request sent to host. Waiting for approval..."
      }));
      
      // Notify the host about the rejoin request
      const hostClient = raceRoom.clients.get(raceRoom.hostParticipantId);
      if (hostClient && hostClient.ws.readyState === WebSocket.OPEN) {
        hostClient.ws.send(JSON.stringify({
          type: "rejoin_request",
          participantId,
          username,
          message: `${username} is requesting to rejoin the race`
        }));
      }
      
      console.log(`[WS Rejoin] Player ${username} (${participantId}) requested to rejoin race ${raceId}`);
      return;
    }

    // Check if room is locked
    if (raceRoom.isLocked) {
      const existingClient = raceRoom.clients.get(participantId);
      if (!existingClient) {
        ws.send(JSON.stringify({ type: "error", message: "Room is locked - no new players allowed" }));
        return;
      }
    }

    const existingClient = raceRoom.clients.get(participantId);
    
    // Check if this is a reconnection (player was previously connected but disconnected)
    const disconnectedInfo = this.disconnectedPlayers.get(raceId)?.get(participantId);
    const isReconnect = !!existingClient || !!disconnectedInfo;
    
    // Clean up disconnected player entry if reconnecting
    if (disconnectedInfo) {
      this.disconnectedPlayers.get(raceId)?.delete(participantId);
      console.log(`[WS] Player ${username} (${participantId}) reconnected to race ${raceId} after ${Math.round((Date.now() - disconnectedInfo.disconnectedAt) / 1000)}s`);
    }

    // Set host based on race creator (production-ready host assignment)
    // The race creator is always the designated host. This prevents race conditions
    // where a different player might connect first via WebSocket.
    if (!raceRoom.hostParticipantId && participant.isBot !== 1) {
      // Check if race has a designated creator
      if (race.creatorParticipantId) {
        // Always use the race creator as the initial host
        raceRoom.hostParticipantId = race.creatorParticipantId;
        console.log(`[WS] Host set to creator: participant ${race.creatorParticipantId} for race ${raceId}`);
      } else {
        // Fallback for legacy races without creator: use first human player
        raceRoom.hostParticipantId = participantId;
        console.log(`[WS] Host set (legacy): ${username} (${participantId}) for race ${raceId}`);
      }
    }

    // Host is always ready by default, or restore previous ready state on reconnect
    const isHost = raceRoom.hostParticipantId === participantId;
    const restoredReadyState = disconnectedInfo?.isReady ?? isHost;
    
    const client: RaceClient = { 
      ws, 
      raceId, 
      participantId, 
      username,
      lastActivity: Date.now(),
      isReady: restoredReadyState,
      isBot: participant.isBot === 1,
    };
    raceRoom.clients.set(participantId, client);
    if (REDIS_ENABLED && !client.isBot) {
      redisClient.sadd(REDIS_KEYS.raceConnections(raceId), participantId.toString()).catch(() => {});
      redisClient.expire(REDIS_KEYS.raceConnections(raceId), REDIS_TTL.raceConnections).catch(() => {});
    }

    // Re-fetch participant from fresh list if needed
    let currentParticipant = participant;
    if (!currentParticipant) {
      participants = await storage.getRaceParticipants(raceId);
      currentParticipant = participants.find(p => p.id === participantId) || participant;
      raceCache.updateParticipants(raceId, participants);
    }
    
    if (!isReconnect) {
      // Broadcast participant_joined to ALL clients so everyone sees the new player
      this.broadcastToRace(raceId, {
        type: "participant_joined",
        participant: currentParticipant,
        participants,
        hostParticipantId: raceRoom.hostParticipantId,
      });
      
      // Also send a full sync to make sure everyone has the latest list
      this.broadcastToRace(raceId, {
        type: "participants_sync",
        participants,
        hostParticipantId: raceRoom.hostParticipantId,
      });
      console.log(`[WS] New join: ${username} (${participantId}) in race ${raceId}`);
    } else {
      // Broadcast reconnection to all clients so they know player is back
      this.broadcastToRace(raceId, {
        type: "participant_reconnected",
        participantId,
        username,
        isReady: restoredReadyState,
      });
      
      // Send full state sync to reconnected player
      ws.send(JSON.stringify(this.sanitizeMessageForClient({
        type: "participants_sync",
        participants,
        hostParticipantId: raceRoom.hostParticipantId,
      })));
      
      // Also send current ready states to reconnected player
      const readyStates = Array.from(raceRoom.clients.entries()).map(([pId, c]) => ({
        participantId: pId,
        isReady: c.isReady,
      }));
      ws.send(JSON.stringify({
        type: "ready_state_update",
        participantId,
        isReady: restoredReadyState,
        readyStates,
      }));
      
      // Send chat history to reconnecting player
      const chatHistory = this.getChatHistory(raceId);
      if (chatHistory.length > 0) {
        ws.send(JSON.stringify({
          type: "chat_history",
          messages: chatHistory,
        }));
      }
      
      console.log(`[WS] Reconnect: ${username} (${participantId}) in race ${raceId}, sent ${chatHistory.length} chat messages`);
    }

    ws.send(JSON.stringify(this.sanitizeMessageForClient({
      type: "joined",
      race,
      participants,
      hostParticipantId: raceRoom.hostParticipantId,
    })));

    this.updateStats();
    
    // Start spontaneous bot chat when a human joins a race with bots
    if (!client.isBot && participants.some(p => p.isBot === 1)) {
      this.startSpontaneousBotChat(raceId);
    }
  }

  private async handleReady(message: any) {
    const { raceId, participantId } = message;
    console.log(`[WS] Ready message received for race ${raceId} from participant ${participantId}`);
    
    const raceRoom = this.races.get(raceId);
    if (!raceRoom) {
      console.log(`[WS] No race room found for race ${raceId}`);
      return;
    }

    // Only the host can start the race
    if (raceRoom.hostParticipantId && participantId !== raceRoom.hostParticipantId) {
      console.log(`[WS] Non-host ${participantId} tried to start race ${raceId} (host: ${raceRoom.hostParticipantId})`);
      // Find the client and notify them
      const client = raceRoom.clients.get(participantId);
      if (client && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify({
          type: "error",
          message: "Only the room host can start the race",
          code: "NOT_HOST"
        }));
      }
      return;
    }

    let cachedRace = raceCache.getRace(raceId);
    let race;
    let participants;

    if (cachedRace) {
      race = cachedRace.race;
      participants = cachedRace.participants;
      console.log(`[WS] handleReady: Got race ${raceId} from cache, status: ${race?.status}, participants: ${participants?.length}`);
    } else {
      console.log(`[WS] handleReady: Race ${raceId} not in cache, fetching from DB...`);
      race = await storage.getRace(raceId);
      participants = await storage.getRaceParticipants(raceId);
      console.log(`[WS] handleReady: Got race ${raceId} from DB, status: ${race?.status}, participants: ${participants?.length}`);
      if (race) {
        raceCache.setRace(race, participants);
      }
    }
    
    if (!race || race.status !== "waiting") {
      console.log(`[WS] handleReady: Race ${raceId} invalid - race exists: ${!!race}, status: ${race?.status}`);
      // Send error to client instead of silently returning
      const client = raceRoom.clients.get(participantId);
      if (client && client.ws.readyState === WebSocket.OPEN) {
        const message = !race 
          ? "This race no longer exists. Please join a new race."
          : race.status === "finished" 
            ? "This race has ended. Please join a new race."
            : race.status === "racing"
              ? "This race is already in progress."
              : "Unable to start the race. Please try again.";
        client.ws.send(JSON.stringify({
          type: "error",
          message,
          code: "RACE_UNAVAILABLE",
          raceStatus: race?.status || "not_found"
        }));
      }
      return;
    }

    // Duration is already set when room was created - no need to update here

    // Use connected clients (not DB participants) for live player count
    // This handles kicked/disconnected players correctly
    const connectedHumansCount = await this.getConnectedHumanCount(raceId, raceRoom);
    
    // Check if there are bots in the race (from DB participants)
    const botParticipants = participants.filter(p => p.isBot === 1);
    const hasBots = botParticipants.length > 0;
    
    console.log(`[WS] handleReady: Race ${raceId} has ${participants.length} participants (bots: ${botParticipants.length}, connected humans: ${connectedHumansCount})`);
    
    // Minimum players required:
    // - With bots: 1 human can start alone (racing against bots)
    // - Without bots: 2 humans required (like TypeRacer)
    const requiredHumans = hasBots ? 1 : 2;
    
    if (connectedHumansCount < requiredHumans) {
      // Not enough connected human players
      const client = raceRoom.clients.get(participantId);
      if (client && client.ws.readyState === WebSocket.OPEN) {
        const needed = requiredHumans - connectedHumansCount;
        const message = hasBots 
          ? "No human players connected. Please reconnect and try again."
          : `Need ${needed} more player${needed > 1 ? 's' : ''} to start. Share your room code with friends!`;
        client.ws.send(JSON.stringify({
          type: "error",
          message,
          code: "NOT_ENOUGH_PLAYERS"
        }));
      }
      return;
    }
    
    // Prevent double-start race condition
    if (raceRoom.isStarting) {
      const client = raceRoom.clients.get(participantId);
      if (client && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify({
          type: "error",
          message: "Race is already starting...",
          code: "RACE_STARTING"
        }));
      }
      return;
    }
    
    // Set starting flag to prevent double-start
    raceRoom.isStarting = true;
    
    try {
      const started = await this.startCountdown(raceId);
      if (!started) {
        raceRoom.isStarting = false;
        const client = raceRoom.clients.get(participantId);
        if (client && client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(JSON.stringify({
            type: "error",
            message: "Unable to start the race. It may have already started.",
            code: "RACE_START_CONFLICT",
          }));
        }
        return;
      }
    } catch (error) {
      raceRoom.isStarting = false;
      console.error(`[WS] Failed to start countdown for race ${raceId}:`, error);
    }
  }

  private async handleReadyToggle(ws: WebSocket, message: any) {
    const { raceId, participantId } = message;
    
    // Validate required fields
    if (!raceId || !participantId) {
      ws.send(JSON.stringify({
        type: "error",
        message: "Missing required fields",
        code: "INVALID_REQUEST"
      }));
      return;
    }
    
    const raceRoom = this.races.get(raceId);
    if (!raceRoom) {
      ws.send(JSON.stringify({
        type: "error",
        message: "Race room not found",
        code: "ROOM_NOT_FOUND"
      }));
      return;
    }
    
    // Only allow ready toggle during waiting status
    const cachedRace = raceCache.getRace(raceId);
    const raceStatus = cachedRace?.race?.status;
    if (raceStatus && raceStatus !== "waiting") {
      ws.send(JSON.stringify({
        type: "error",
        message: "Cannot change ready state after race has started",
        code: "INVALID_RACE_STATUS"
      }));
      return;
    }

    const client = raceRoom.clients.get(participantId);
    if (!client) {
      ws.send(JSON.stringify({
        type: "error",
        message: "You are not connected to this race",
        code: "NOT_IN_RACE"
      }));
      return;
    }

    // Toggle ready state
    client.isReady = !client.isReady;

    // Collect ready states for all participants
    const readyStates: { participantId: number; isReady: boolean }[] = [];
    const clientEntries = Array.from(raceRoom.clients.entries());
    for (const [pId, c] of clientEntries) {
      readyStates.push({ participantId: pId, isReady: c.isReady });
    }

    // Broadcast ready state update to all clients
    this.broadcastToRace(raceId, {
      type: "ready_state_update",
      participantId,
      isReady: client.isReady,
      readyStates,
    });

    console.log(`[WS] Ready toggle: ${client.username} is now ${client.isReady ? 'ready' : 'not ready'} in race ${raceId}`);
  }

  private async handleKickPlayer(ws: WebSocket, message: any) {
    const { raceId, participantId, targetParticipantId } = message;
    
    // Validate required fields
    if (!raceId || !participantId || !targetParticipantId) {
      ws.send(JSON.stringify({
        type: "error",
        message: "Missing required fields for kick",
        code: "INVALID_REQUEST"
      }));
      return;
    }
    
    const raceRoom = this.races.get(raceId);
    if (!raceRoom) {
      ws.send(JSON.stringify({
        type: "error",
        message: "Race room not found",
        code: "ROOM_NOT_FOUND"
      }));
      return;
    }

    // Check race status - can only kick during waiting or countdown, not during active racing
    const cachedRace = raceCache.getRace(raceId);
    const raceStatus = cachedRace?.race?.status;
    if (raceStatus === "racing") {
      ws.send(JSON.stringify({
        type: "error",
        message: "Cannot kick players during an active race",
        code: "RACE_IN_PROGRESS"
      }));
      return;
    }
    
    if (raceStatus === "finished") {
      ws.send(JSON.stringify({
        type: "error",
        message: "Cannot kick players from a finished race",
        code: "RACE_FINISHED"
      }));
      return;
    }

    // Only host can kick players
    if (raceRoom.hostParticipantId !== participantId) {
      ws.send(JSON.stringify({
        type: "error",
        message: "Only the host can kick players",
        code: "NOT_HOST"
      }));
      return;
    }

    // Cannot kick yourself
    if (targetParticipantId === participantId) {
      ws.send(JSON.stringify({
        type: "error", 
        message: "You cannot kick yourself",
        code: "CANNOT_KICK_SELF"
      }));
      return;
    }
    
    // Check if player was already kicked (prevent duplicate processing)
    if (raceRoom.kickedPlayers.has(targetParticipantId)) {
      ws.send(JSON.stringify({
        type: "error",
        message: "Player has already been kicked",
        code: "ALREADY_KICKED"
      }));
      return;
    }

    // Look for the target player in both WebSocket clients AND cache/database
    // This handles cases where player is shown in UI but not connected via WebSocket
    const targetClient = raceRoom.clients.get(targetParticipantId);
    
    // Also check cache/database for the participant
    let kickedUsername: string | undefined = targetClient?.username;
    let targetParticipant: any = null;
    let isBot = false;
    
    // Try to find participant in cache first
    if (cachedRace?.participants) {
      targetParticipant = cachedRace.participants.find(p => p.id === targetParticipantId);
      if (targetParticipant) {
        if (!kickedUsername) kickedUsername = targetParticipant.username;
        isBot = targetParticipant.isBot === 1;
      }
    }
    
    // If not found in cache, check database
    if (!targetParticipant && !targetClient) {
      try {
        const dbParticipants = await storage.getRaceParticipants(raceId);
        targetParticipant = dbParticipants.find(p => p.id === targetParticipantId);
        if (targetParticipant) {
          if (!kickedUsername) kickedUsername = targetParticipant.username;
          isBot = targetParticipant.isBot === 1;
        }
      } catch (error) {
        console.error(`[WS Kick] Error fetching participants for kick in race ${raceId}:`, error);
      }
    }

    // If player not found anywhere, return error
    if (!targetClient && !targetParticipant) {
      ws.send(JSON.stringify({
        type: "error",
        message: "Player not found in this race",
        code: "PLAYER_NOT_FOUND"
      }));
      return;
    }

    // Add to kicked list so they can't rejoin
    raceRoom.kickedPlayers.add(targetParticipantId);

    // If the player is connected via WebSocket, notify them and close connection
    if (targetClient && targetClient.ws.readyState === WebSocket.OPEN) {
      targetClient.ws.send(JSON.stringify({
        type: "kicked",
        message: "You have been kicked from the room by the host"
      }));
      targetClient.ws.close();
    }

    // Remove from WebSocket clients map if present
    raceRoom.clients.delete(targetParticipantId);
    
    // Clean up any disconnected player entry for this participant
    const disconnectedMap = this.disconnectedPlayers.get(raceId);
    if (disconnectedMap) {
      disconnectedMap.delete(targetParticipantId);
    }

    // Mark participant as inactive in database (soft delete)
    try {
      await storage.deleteRaceParticipant(targetParticipantId);
      console.log(`[WS Kick] Marked participant ${targetParticipantId} as inactive in database`);
    } catch (error) {
      console.error(`[WS Kick] Error marking participant ${targetParticipantId} as inactive:`, error);
      // Continue with the kick even if database update fails
    }

    // Update the race cache with the new participant list
    let updatedParticipants: any[] = [];
    try {
      updatedParticipants = await storage.getRaceParticipants(raceId);
      raceCache.updateParticipants(raceId, updatedParticipants);
      console.log(`[WS Kick] Updated race cache after kicking player from race ${raceId}`);
    } catch (error) {
      console.error(`[WS Kick] Error updating race cache after kick in race ${raceId}:`, error);
    }
    
    // Check if countdown should be cancelled due to insufficient players after kick
    const connectedHumansCount = await this.getConnectedHumanCount(raceId, raceRoom);
    const botParticipants = updatedParticipants.filter(p => p.isBot === 1);
    const hasBots = botParticipants.length > 0;
    const requiredHumans = hasBots ? 1 : 2;
    
    if (raceStatus === "countdown" && connectedHumansCount < requiredHumans) {
      // Cancel countdown - not enough players after kick
      this.clearRaceTimers(raceId);
      raceRoom.countdownTimer = undefined;
      
      raceRoom.isStarting = false;
      
      // Revert race status to waiting
      const reverted = await storage.updateRaceStatusAtomic(raceId, "waiting", "countdown");
      if (reverted) {
        raceCache.updateRaceStatus(raceId, "waiting");

        this.broadcastToRace(raceId, {
          type: "countdown_cancelled",
          reason: hasBots 
            ? "Host left - waiting for new players"
            : `Not enough players - need at least ${requiredHumans} to start`,
          code: "INSUFFICIENT_PLAYERS"
        });

        console.log(`[WS Kick] Countdown cancelled for race ${raceId} after kicking - only ${connectedHumansCount} human player(s) remaining`);
      } else {
        const latest = await storage.getRace(raceId);
        if (latest) {
          raceCache.updateRaceStatus(raceId, latest.status, latest.startedAt ?? undefined, latest.finishedAt ?? undefined);
        }
      }
    }

    // Broadcast player kicked to remaining clients with updated participant list
    const finalParticipants = raceCache.getRace(raceId)?.participants || updatedParticipants;
    this.broadcastToRace(raceId, {
      type: "player_kicked",
      participantId: targetParticipantId,
      username: kickedUsername || "Unknown",
      participants: finalParticipants,
      isBot,
    });

    console.log(`[WS Kick] Player kicked: ${kickedUsername || targetParticipantId} (${targetParticipantId}) from race ${raceId} by host${isBot ? ' [BOT]' : ''}`);
  }

  private async handleRejoinDecision(ws: WebSocket, message: any) {
    const { raceId, participantId, targetParticipantId, approved } = message;
    
    // Validate required fields
    if (!raceId || !participantId || !targetParticipantId || typeof approved !== 'boolean') {
      ws.send(JSON.stringify({
        type: "error",
        message: "Missing required fields for rejoin decision",
        code: "INVALID_REQUEST"
      }));
      return;
    }
    
    const raceRoom = this.races.get(raceId);
    if (!raceRoom) {
      ws.send(JSON.stringify({
        type: "error",
        message: "Race room not found",
        code: "ROOM_NOT_FOUND"
      }));
      return;
    }
    
    // Only host can approve/reject rejoin requests
    if (raceRoom.hostParticipantId !== participantId) {
      ws.send(JSON.stringify({
        type: "error",
        message: "Only the host can approve or reject rejoin requests",
        code: "NOT_HOST"
      }));
      return;
    }
    
    // Check if there's a pending request for this player
    const pendingRequest = raceRoom.pendingRejoinRequests.get(targetParticipantId);
    if (!pendingRequest) {
      ws.send(JSON.stringify({
        type: "error",
        message: "No pending rejoin request found for this player",
        code: "REQUEST_NOT_FOUND"
      }));
      return;
    }
    
    // Check race status - can only approve during waiting
    const cachedRace = raceCache.getRace(raceId);
    const raceStatus = cachedRace?.race?.status;
    
    if (raceStatus === "racing" || raceStatus === "finished") {
      // Remove the pending request and notify the player
      raceRoom.pendingRejoinRequests.delete(targetParticipantId);
      if (pendingRequest.ws.readyState === WebSocket.OPEN) {
        pendingRequest.ws.send(JSON.stringify({
          type: "rejoin_rejected",
          message: "Race has already started or finished",
          code: "RACE_IN_PROGRESS"
        }));
      }
      ws.send(JSON.stringify({
        type: "error",
        message: "Cannot process rejoin - race is in progress or finished",
        code: "RACE_IN_PROGRESS"
      }));
      return;
    }
    
    // Remove from pending requests
    raceRoom.pendingRejoinRequests.delete(targetParticipantId);
    
    if (approved) {
      // Remove from kicked list to allow rejoining
      raceRoom.kickedPlayers.delete(targetParticipantId);
      
      // Notify the player that they can rejoin
      if (pendingRequest.ws.readyState === WebSocket.OPEN) {
        pendingRequest.ws.send(JSON.stringify({
          type: "rejoin_approved",
          message: "Host has approved your rejoin request. Reconnecting..."
        }));
      }
      
      // Notify host of success
      ws.send(JSON.stringify({
        type: "rejoin_decision_confirmed",
        approved: true,
        targetParticipantId,
        username: pendingRequest.username,
        message: `${pendingRequest.username} has been allowed to rejoin`
      }));
      
      // Broadcast to room that player was allowed to rejoin
      this.broadcastToRace(raceId, {
        type: "player_rejoin_allowed",
        participantId: targetParticipantId,
        username: pendingRequest.username,
        message: `${pendingRequest.username} has been allowed to rejoin by the host`
      });
      
      console.log(`[WS Rejoin] Host approved rejoin for ${pendingRequest.username} (${targetParticipantId}) in race ${raceId}`);
    } else {
      // Host rejected the rejoin request
      if (pendingRequest.ws.readyState === WebSocket.OPEN) {
        pendingRequest.ws.send(JSON.stringify({
          type: "rejoin_rejected",
          message: "Host has rejected your rejoin request"
        }));
      }
      
      // Notify host of success
      ws.send(JSON.stringify({
        type: "rejoin_decision_confirmed",
        approved: false,
        targetParticipantId,
        username: pendingRequest.username,
        message: `${pendingRequest.username}'s rejoin request has been rejected`
      }));
      
      console.log(`[WS Rejoin] Host rejected rejoin for ${pendingRequest.username} (${targetParticipantId}) in race ${raceId}`);
    }
  }

  private async handleLockRoom(ws: WebSocket, message: any) {
    const { raceId, participantId, locked } = message;
    
    // Validate required fields
    if (!raceId || !participantId || typeof locked !== 'boolean') {
      ws.send(JSON.stringify({
        type: "error",
        message: "Missing required fields for lock room",
        code: "INVALID_REQUEST"
      }));
      return;
    }
    
    const raceRoom = this.races.get(raceId);
    if (!raceRoom) {
      ws.send(JSON.stringify({
        type: "error",
        message: "Race room not found",
        code: "ROOM_NOT_FOUND"
      }));
      return;
    }
    
    // Check race status - can only lock/unlock during waiting
    const cachedRace = raceCache.getRace(raceId);
    const raceStatus = cachedRace?.race?.status;
    if (raceStatus && raceStatus !== "waiting") {
      ws.send(JSON.stringify({
        type: "error",
        message: "Can only lock/unlock room while waiting for players",
        code: "INVALID_RACE_STATUS"
      }));
      return;
    }

    // Only host can lock/unlock room
    if (raceRoom.hostParticipantId !== participantId) {
      ws.send(JSON.stringify({
        type: "error",
        message: "Only the host can lock/unlock the room",
        code: "NOT_HOST"
      }));
      return;
    }
    
    // No-op if already in desired state
    if (raceRoom.isLocked === locked) {
      return;
    }

    raceRoom.isLocked = locked;

    // Broadcast lock state to all clients
    this.broadcastToRace(raceId, {
      type: "room_lock_changed",
      isLocked: locked,
    });

    console.log(`[WS] Room ${raceId} ${locked ? 'locked' : 'unlocked'} by host`);
  }

  private async handleRematch(ws: WebSocket, message: any) {
    const { raceId, participantId } = message;
    const raceRoom = this.races.get(raceId);
    
    // Get the original race to copy settings
    let race = raceCache.getRace(raceId)?.race;
    if (!race) {
      race = await storage.getRace(raceId);
    }
    
    if (!race || race.status !== "finished") {
      ws.send(JSON.stringify({
        type: "error",
        message: "Can only request rematch after race is finished",
        code: "RACE_NOT_FINISHED"
      }));
      return;
    }

    let newRace: any | null = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const roomCode = this.generateRoomCode();
      try {
        newRace = await storage.createRace({
          roomCode,
          status: "waiting",
          paragraphContent: race.paragraphContent || "",
          maxPlayers: race.maxPlayers,
          isPrivate: race.isPrivate || 1,
          raceType: race.raceType as "standard" | "timed",
          timeLimitSeconds: race.timeLimitSeconds || undefined,
          paragraphId: race.paragraphId || null,
        });
        break;
      } catch (error: any) {
        const msg = String(error?.message || "");
        const code = (error as any)?.code;
        const isCollision = code === '23505' || msg.includes('duplicate key') || msg.includes('unique');
        if (!isCollision || attempt === 4) {
          console.error(`[WS] Rematch create failed for race ${raceId}:`, error);
          ws.send(JSON.stringify({ type: "error", message: "Failed to create rematch", code: "REMATCH_FAILED" }));
          return;
        }
      }
    }

    if (!newRace) {
      ws.send(JSON.stringify({ type: "error", message: "Failed to create rematch", code: "REMATCH_FAILED" }));
      return;
    }

    // Initialize the new race in the cache with empty participants
    // This ensures a clean slate for the new race
    raceCache.setRace(newRace, []);
    
    // Clean up old race from cache if it's still there
    raceCache.deleteRace(raceId);

    // Broadcast rematch available to all players in the room
    if (raceRoom) {
      const clientsArray = Array.from(raceRoom.clients.values());
      for (const client of clientsArray) {
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(JSON.stringify({
            type: "rematch_available",
            newRaceId: newRace.id,
            roomCode: newRace.roomCode,
            createdBy: message.username || "A player",
          }));
        }
      }
    }

    console.log(`[WS] Rematch created: Race ${newRace.id} (${newRace.roomCode}) from race ${raceId}`);
  }

  private async startCountdown(raceId: number): Promise<boolean> {
    const raceRoom = this.races.get(raceId);
    if (!raceRoom) return false;

    let cachedRace = raceCache.getRace(raceId);
    let race;
    let participants;

    if (cachedRace) {
      race = cachedRace.race;
      participants = cachedRace.participants;
    } else {
      race = await storage.getRace(raceId);
      if (!race) return false;
      participants = await storage.getRaceParticipants(raceId);
      raceCache.setRace(race, participants);
    }

    const updatedToCountdown = await storage.updateRaceStatusAtomic(raceId, "countdown", "waiting");
    if (!updatedToCountdown) {
      return false;
    }

    raceCache.updateRaceStatus(raceId, "countdown");

    // Determine countdown duration (private rooms can potentially have custom countdown)
    const countdownDuration = ALLOW_PRIVATE_CUSTOM_COUNTDOWN && race.isPrivate === 1 
      ? (race as any).countdownSeconds || DEFAULT_COUNTDOWN_SECONDS
      : DEFAULT_COUNTDOWN_SECONDS;

    this.broadcastToRace(raceId, {
      type: "countdown_start",
      countdown: countdownDuration,
      participants,
    });

    let countdown = countdownDuration;
    
    // Phase 1.4: Store timer version for validation
    const timerVersion = raceRoom.timerVersion + 1;
    raceRoom.timerVersion = timerVersion;
    
    const countdownTimer = setInterval(async () => {
      // Phase 1.4: Validate timer version before executing
      if (raceRoom.timerVersion !== timerVersion) {
        clearInterval(countdownTimer);
        console.log(`[WS Countdown] Timer invalidated for race ${raceId} (version mismatch: ${timerVersion} vs ${raceRoom.timerVersion})`);
        return;
      }
      
      // Check if room still exists
      if (!this.races.has(raceId)) {
        clearInterval(countdownTimer);
        console.log(`[WS Countdown] Timer stopped - race ${raceId} no longer exists`);
        return;
      }
      
      countdown--;
      
      if (countdown > 0) {
        this.broadcastToRace(raceId, {
          type: "countdown",
          countdown,
        });
      } else {
        clearInterval(countdownTimer);
        raceRoom.countdownTimer = undefined;
        
        // Reset the isStarting flag now that countdown is complete
        raceRoom.isStarting = false;
        
        const startedAt = new Date();
        const updatedToRacing = await storage.updateRaceStatusAtomic(raceId, "racing", "countdown", startedAt);
        if (!updatedToRacing) {
          return;
        }
        const effectiveStartedAt = updatedToRacing.startedAt || startedAt;
        raceCache.updateRaceStatus(raceId, "racing", effectiveStartedAt);
        
        // Stop spontaneous bot chat when race starts (bots are now typing)
        this.stopSpontaneousBotChat(raceId);
        
        // Store race start time for server-side timer validation
        raceRoom.raceStartTime = effectiveStartedAt.getTime();
        
        this.broadcastToRace(raceId, {
          type: "race_start",
          serverTimestamp: raceRoom.raceStartTime,
        });

        const freshRace = await storage.getRace(raceId);
        if (!freshRace || !freshRace.paragraphContent) {
          console.error(`[Bot Typing] Cannot start bots - race ${raceId} has no paragraph content`);
          return;
        }

        const cachedData = raceCache.getRace(raceId);
        const allParticipants = cachedData?.participants || await storage.getRaceParticipants(raceId);
        const bots = allParticipants.filter(p => p.isBot === 1);
        
        console.log(`[Bot Typing] Starting ${bots.length} bots for race ${raceId}, paragraph length: ${freshRace.paragraphContent.length}`);
        
        bots.forEach(bot => {
          console.log(`[Bot Typing] Starting bot ${bot.username} (${bot.id})`);
          botService.startBotTyping(
            bot.id,
            raceId,
            freshRace.paragraphContent.length,
            (data) => this.broadcastToRace(raceId, data),
            (botRaceId, botParticipantId, position) => this.handleBotFinished(botRaceId, botParticipantId, position),
            bot.username,
            freshRace.paragraphContent // Pass the actual paragraph text for character-level simulation
          );
        });

        // Phase 1.4: Set up server-side timer for timed races with version tracking
        if (freshRace.raceType === "timed" && freshRace.timeLimitSeconds) {
          const timeLimit = freshRace.timeLimitSeconds * 1000;
          console.log(`[Timed Race] Setting server-side timer for race ${raceId}: ${freshRace.timeLimitSeconds}s`);
          
          // Capture current timer version for validation
          const timedRaceVersion = raceRoom.timerVersion;
          
          const timedRaceTimer = setTimeout(async () => {
            // Validate timer version before executing
            const currentRoom = this.races.get(raceId);
            if (!currentRoom || currentRoom.timerVersion !== timedRaceVersion) {
              console.log(`[Timed Race] Timer invalidated for race ${raceId} (version mismatch or room gone)`);
              return;
            }
            
            console.log(`[Timed Race] Server timer expired for race ${raceId}, force-finishing all participants`);
            await this.forceFinishTimedRace(raceId);
          }, timeLimit + 1000); // Add 1 second buffer for client-server latency
          
          raceRoom.timedRaceTimer = timedRaceTimer;
          this.registerTimer(raceId, 'timedRace', timedRaceTimer);
          
          // Phase 3 hardening: Persist timer expiry to Redis for crash recovery
          if (REDIS_ENABLED) {
            const expiryTime = Date.now() + timeLimit + 1000; // Match the setTimeout delay
            redisClient.set(
              REDIS_KEYS.timedRaceExpiry(raceId),
              expiryTime.toString(),
              'EX',
              REDIS_TTL.timedRaceExpiry
            ).catch(err => {
              console.error(`[Timed Race] Failed to persist timer to Redis for race ${raceId}:`, err);
            });
            console.log(`[Timed Race] Persisted timer expiry to Redis for race ${raceId}: ${new Date(expiryTime).toISOString()}`);
          }
        }
      }
    }, 1000);
    
    // Store the countdown timer
    raceRoom.countdownTimer = countdownTimer;
    this.registerTimer(raceId, 'countdown', countdownTimer);

    return true;
  }

  private async handleProgress(message: any, authenticatedRaceId?: number) {
    const { participantId, progress, errors } = message;

    // SECURITY FIX: Validate progress values before processing
    // Validate numeric types
    if (typeof progress !== 'number' || typeof errors !== 'number') {
      return; // Silently reject invalid data
    }

    // Validate reasonable bounds
    if (progress < 0 || errors < 0) {
      console.warn(`[AntiCheat] Invalid progress values from participant ${participantId}: progress=${progress}, errors=${errors}`);
      return;
    }

    // Get previous progress for monotonic validation and speed check
    const previousProgress = raceCache.getProgressFromBuffer(participantId);
    const now = Date.now();
    
    if (previousProgress) {
      // SECURITY FIX: Reject progress regression (going backwards)
      if (progress < previousProgress.progress) {
        console.warn(`[AntiCheat] Progress regression rejected: participant ${participantId} went from ${previousProgress.progress} to ${progress}`);
        return;
      }
      
      // SECURITY FIX: Validate typing speed (max 25 chars/sec = ~300 WPM theoretical max)
      const timeDiffMs = now - previousProgress.lastUpdate;
      if (timeDiffMs > 50) { // Only check if enough time has passed
        const charDiff = progress - previousProgress.progress;
        const charsPerSec = (charDiff * 1000) / timeDiffMs;
        
        // Max 25 chars/sec is extremely generous (world record is ~20 chars/sec)
        if (charsPerSec > 25) {
          console.warn(`[AntiCheat] Suspicious speed from participant ${participantId}: ${charsPerSec.toFixed(1)} chars/sec (${charDiff} chars in ${timeDiffMs}ms)`);
          const violations = (this.speedViolations.get(participantId) || 0) + 1;
          this.speedViolations.set(participantId, violations);
          if (violations >= 3) {
            const raceIdForDq = authenticatedRaceId || this.findRaceIdByParticipant(participantId);
            if (raceIdForDq) {
              this.disqualifyParticipant(raceIdForDq, participantId, "speed_violation");
              return;
            }
          }
        }
      }
    }

    const raceId = authenticatedRaceId || this.findRaceIdByParticipant(participantId);
    if (!raceId) {
      return;
    }

    const cached = raceCache.getRace(raceId);
    if (!cached || cached.race.status !== "racing") {
      return;
    }

    const paragraphLength = cached.race.paragraphContent?.length || 0;
    const boundedProgress = paragraphLength > 0 ? Math.min(progress, paragraphLength) : progress;
    const boundedErrors = Math.max(0, Math.min(errors, boundedProgress));

    const serverStats = this.computeServerStats(raceId, participantId, boundedProgress, boundedErrors);
    raceCache.bufferProgress(participantId, boundedProgress, serverStats.wpm, serverStats.accuracy, boundedErrors);

    // Use authenticated raceId for O(1) lookup, fallback to O(n) scan only if not available
    const raceRoom = this.races.get(raceId);
    if (raceRoom) {
      const client = raceRoom.clients.get(participantId);
      if (client) {
        client.lastActivity = now;
      }
    }

    this.broadcastToRace(raceId, {
      type: "progress_update",
      participantId,
      progress: boundedProgress,
      wpm: serverStats.wpm,
      accuracy: serverStats.accuracy,
      errors: boundedErrors,
    });
  }

  private async handleFinish(message: any) {
    const { raceId, participantId } = message;

    const cachedRace = raceCache.getRace(raceId);
    let race = cachedRace?.race;
    
    if (!race) {
      race = await storage.getRace(raceId);
    }

    if (!race || race.status === "finished") {
      return;
    }
    
    if (race.raceType === "timed") {
      return;
    }

    const cachedParticipants = cachedRace?.participants;
    let participants = cachedParticipants;
    
    if (!participants) {
      participants = await storage.getRaceParticipants(raceId);
    }

    const participant = participants.find(p => p.id === participantId);
    
    if (!participant) {
      return;
    }

    const antiCheatState = this.antiCheatStatus.get(participantId);
    if (antiCheatState?.disqualified) {
      return;
    }

    const paragraphLength = race.paragraphContent?.length || 0;
    const buffered = raceCache.getProgressFromBuffer(participantId);
    const currentProgress = participant.progress || 0;
    const currentErrors = participant.errors || 0;
    const effectiveProgress = Math.max(currentProgress, buffered?.progress || 0);
    const effectiveErrors = Math.max(currentErrors, buffered?.errors || 0);
    if (paragraphLength > 0 && effectiveProgress < paragraphLength) {
      return;
    }

    const finalProgress = Math.max(effectiveProgress, paragraphLength);
    const finalErrors = Math.max(0, Math.min(effectiveErrors, finalProgress));

    const serverStats = this.computeServerStats(raceId, participantId, finalProgress, finalErrors);
    if (serverStats.wpm > 300) {
      this.disqualifyParticipant(raceId, participantId, "wpm_limit");
      return;
    }
    await storage.updateParticipantProgress(participantId, finalProgress, serverStats.wpm, serverStats.accuracy, finalErrors);

    const { position, isNewFinish } = await storage.finishParticipant(participantId);

    if (!isNewFinish) {
      return;
    }

    raceCache.finishParticipant(raceId, participantId, position);

    this.broadcastToRace(raceId, {
      type: "participant_finished",
      participantId,
      position,
    });

    // Phase 2 hardening: Use unified atomic completion with locking
    // This ensures exactly-once completion even with concurrent finish events
    await this.completeRaceWithLock(raceId, 'handleFinish');
  }

  private async handleTimedFinish(message: any) {
    const { raceId, participantId, progress, errors } = message;
    
    console.log(`[Timed Finish] Participant ${participantId} finished timed race ${raceId}`);

    const cachedRace = raceCache.getRace(raceId);
    let race = cachedRace?.race;
    
    if (!race) {
      race = await storage.getRace(raceId);
    }

    if (!race || race.status === "finished") {
      console.log(`[Timed Finish] Race ${raceId} already finished or not found, skipping participant ${participantId}`);
      return;
    }

    if (race.status !== "racing") {
      return;
    }

    const antiCheatState = this.antiCheatStatus.get(participantId);
    if (antiCheatState?.disqualified) {
      return;
    }

    // Get race room for server-side timing validation
    const raceRoom = this.races.get(raceId);
    
    // SERVER-SIDE WPM CALCULATION (don't trust client values)
    // Use the race start time stored on the server
    const elapsedSeconds = raceRoom?.raceStartTime 
      ? (Date.now() - raceRoom.raceStartTime) / 1000
      : race.timeLimitSeconds || 60;
    
    // Calculate WPM based on server-side elapsed time and client progress
    const safeErrors = Math.max(0, Math.min(errors, progress));
    const correctChars = Math.max(0, progress - safeErrors);
    const serverCalculatedWpm = elapsedSeconds > 0 
      ? Math.round((correctChars / 5) / (elapsedSeconds / 60)) 
      : 0;
    
    // Calculate accuracy properly on server side
    const serverCalculatedAccuracy = progress > 0 
      ? Math.round((correctChars / progress) * 100 * 100) / 100
      : 100; // No typing = 100% accuracy (no errors made)
    
    // Validate progress is reasonable (max 15 chars per second is extremely fast)
    const maxReasonableProgress = Math.ceil(elapsedSeconds * 15);
    const validatedProgress = Math.min(progress, maxReasonableProgress);
    
    console.log(`[Timed Finish] Server validation: elapsed=${elapsedSeconds.toFixed(1)}s, progress=${progress}, validated=${validatedProgress}, serverWPM=${serverCalculatedWpm}, accuracy=${serverCalculatedAccuracy}`);

    // Update participant's final stats with SERVER-CALCULATED values
    await storage.updateParticipantProgress(participantId, validatedProgress, serverCalculatedWpm, serverCalculatedAccuracy, safeErrors);
    raceCache.bufferProgress(participantId, validatedProgress, serverCalculatedWpm, serverCalculatedAccuracy, safeErrors);

    // Mark participant as finished
    const { position, isNewFinish } = await storage.finishParticipant(participantId);

    if (!isNewFinish) {
      console.log(`[Timed Finish] Participant ${participantId} was already finished, skipping`);
      return;
    }

    console.log(`[Timed Finish] Participant ${participantId} finished at position ${position}`);
    raceCache.finishParticipant(raceId, participantId, position);

    this.broadcastToRace(raceId, {
      type: "participant_finished",
      participantId,
      position,
      wpm: serverCalculatedWpm,
      accuracy: serverCalculatedAccuracy,
    });

    // Check if all participants finished
    const freshParticipants = await storage.getRaceParticipants(raceId);
    const allFinished = freshParticipants.every(p => p.isFinished === 1);
    
    console.log(`[Timed Finish] All finished check: ${allFinished}, participants: ${freshParticipants.map(p => `${p.username}:${p.isFinished}`).join(', ')}`);

    // For timed races, we should finish the race when the human finishes (timer expired on client)
    // Bots might still be "racing" but that's fine - the timer is the source of truth
    const connectedClients = raceRoom ? raceRoom.clients.size : 0;
    console.log(`[Timed Finish] Race room has ${connectedClients} connected clients`);

    // For timed races: Force-finish any bots that haven't finished yet
    // The human's timer is the source of truth - when it expires, the race ends for everyone
    if (!allFinished) {
      console.log(`[Timed Finish] Not all finished - force-finishing remaining bots for timed race ${raceId}`);
      const elapsedSeconds = race.timeLimitSeconds || 60;
      
      for (const p of freshParticipants) {
        if (p.isFinished === 0 && p.isBot === 1) {
          // Calculate WPM based on bot's current progress
          const correctChars = Math.max(0, p.progress - p.errors);
          const calculatedWpm = elapsedSeconds > 0 
            ? Math.round((correctChars / 5) / (elapsedSeconds / 60)) 
            : 0;
          const calculatedAccuracy = p.progress > 0 
            ? Math.round((correctChars / p.progress) * 100 * 100) / 100
            : 100;
          
          console.log(`[Timed Finish] Force finishing bot ${p.username}: progress=${p.progress}, WPM=${calculatedWpm}`);
          
          await storage.updateParticipantProgress(p.id, p.progress, calculatedWpm, calculatedAccuracy, p.errors);
          await storage.finishParticipant(p.id);
          
          // Update local object for sorting
          p.wpm = calculatedWpm;
          p.accuracy = calculatedAccuracy;
          p.isFinished = 1;
        }
      }
    }

    // For timed races, assign positions based on WPM before completing
    // Sort by WPM for timed races with proper tie-breaking:
    // 1. Higher WPM wins
    // 2. If WPM tied: higher accuracy wins
    // 3. If accuracy tied: more progress (characters typed) wins
    // 4. If still tied: lower ID (joined first) wins
    const sortedResults = freshParticipants.sort((a, b) => {
      if (b.wpm !== a.wpm) return b.wpm - a.wpm;
      if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
      if (b.progress !== a.progress) return b.progress - a.progress;
      return a.id - b.id;
    });
    
    // SECURITY FIX: Build rankings array for atomic position assignment
    const rankings: Array<{ participantId: number; position: number }> = [];
    for (let i = 0; i < sortedResults.length; i++) {
      let position = i + 1;
      
      // Check if this participant has identical stats to the previous one (tie)
      if (i > 0) {
        const prev = sortedResults[i - 1];
        const curr = sortedResults[i];
        if (prev.wpm === curr.wpm && prev.accuracy === curr.accuracy && prev.progress === curr.progress) {
          position = rankings[i - 1]?.position || position;
        }
      }
      
      sortedResults[i].finishPosition = position;
      rankings.push({ participantId: sortedResults[i].id, position });
    }
    
    // SECURITY FIX: Use atomic position assignment to prevent race conditions
    await storage.assignTimedRacePositionsAtomic(raceId, rankings);

    // Phase 2 hardening: Use unified atomic completion with locking
    // This ensures exactly-once completion even with concurrent timed finish events
    await this.completeRaceWithLock(raceId, 'handleTimedFinish');
  }

  // Force finish a timed race when server timer expires (anti-cheat: don't trust client timer)
  private async forceFinishTimedRace(raceId: number) {
    // CRITICAL: Get race room and set isFinishing flag FIRST to prevent race condition with heartbeat
    const raceRoom = this.races.get(raceId);
    if (!raceRoom) {
      console.log(`[Timed Race] No race room found for ${raceId}`);
      return;
    }
    
    // Mark as finishing BEFORE any async operations to prevent heartbeat cleanup
    raceRoom.isFinishing = true;
    
    // Clear the timer
    if (raceRoom.timedRaceTimer) {
      clearTimeout(raceRoom.timedRaceTimer);
      raceRoom.timedRaceTimer = undefined;
    }

    const race = await storage.getRace(raceId);
    if (!race || race.status === "finished") {
      console.log(`[Timed Race] Race ${raceId} already finished, skipping force finish`);
      raceRoom.isFinishing = false;
      return;
    }

    console.log(`[Timed Race] Force finishing race ${raceId}`);

    const participants = await storage.getRaceParticipants(raceId);
    const elapsedSeconds = race.timeLimitSeconds || 60;

    // Finish all unfinished participants with their current progress
    for (const participant of participants) {
      if (participant.isFinished === 0) {
        // Calculate WPM based on their last known progress
        const correctChars = Math.max(0, participant.progress - participant.errors);
        const serverCalculatedWpm = elapsedSeconds > 0 
          ? Math.round((correctChars / 5) / (elapsedSeconds / 60)) 
          : 0;
        
        // Calculate accuracy properly: if no typing, 100% (no errors); otherwise calculate from progress
        const calculatedAccuracy = participant.progress > 0 
          ? Math.round((correctChars / participant.progress) * 100 * 100) / 100
          : 100; // No typing = 100% accuracy (no errors made)
        
        console.log(`[Timed Race] Force finishing participant ${participant.username}: progress=${participant.progress}, calculated WPM=${serverCalculatedWpm}, accuracy=${calculatedAccuracy}`);

        // Update with server-calculated values
        await storage.updateParticipantProgress(
          participant.id,
          participant.progress,
          serverCalculatedWpm,
          calculatedAccuracy,
          participant.errors
        );
        
        await storage.finishParticipant(participant.id);
        participant.wpm = serverCalculatedWpm;
        participant.accuracy = calculatedAccuracy;
        participant.isFinished = 1;
      }
    }

    // Sort by WPM for timed races with proper tie-breaking:
    // 1. Higher WPM wins
    // 2. If WPM tied: higher accuracy wins
    // 3. If accuracy tied: more progress (characters typed) wins
    // 4. If still tied: lower ID (joined first) wins
    const sortedResults = participants.sort((a, b) => {
      if (b.wpm !== a.wpm) return b.wpm - a.wpm;
      if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
      if (b.progress !== a.progress) return b.progress - a.progress;
      return a.id - b.id;
    });

    // SECURITY FIX: Build rankings array for atomic position assignment
    const rankings: Array<{ participantId: number; position: number }> = [];
    for (let i = 0; i < sortedResults.length; i++) {
      let position = i + 1;
      
      // Check if this participant has identical stats to the previous one (tie)
      if (i > 0) {
        const prev = sortedResults[i - 1];
        const curr = sortedResults[i];
        if (prev.wpm === curr.wpm && prev.accuracy === curr.accuracy && prev.progress === curr.progress) {
          position = rankings[i - 1]?.position || position;
        }
      }
      
      sortedResults[i].finishPosition = position;
      rankings.push({ participantId: sortedResults[i].id, position });
    }
    
    // SECURITY FIX: Use atomic position assignment to prevent race conditions
    await storage.assignTimedRacePositionsAtomic(raceId, rankings);

    // Phase 2 hardening: Use unified atomic completion with locking
    // This ensures exactly-once completion even with concurrent timer triggers
    await this.completeRaceWithLock(raceId, 'forceFinishTimedRace');
  }

  private async handleBotFinished(raceId: number, participantId: number, position: number) {
    console.log(`[Bot Finish] Bot ${participantId} finished race ${raceId} in position ${position}`);
    
    // Check if race already finished
    const race = await storage.getRace(raceId);
    if (!race || race.status === "finished") {
      return; // Race already finished
    }
    
    // Persist bot finish to database (critical for allFinished check)
    const { position: dbPosition, isNewFinish } = await storage.finishParticipant(participantId);
    
    if (!isNewFinish) {
      console.log(`[Bot Finish] Bot ${participantId} already finished, skipping`);
      return;
    }
    
    // Update the cache with the bot's finish status
    raceCache.finishParticipant(raceId, participantId, dbPosition);
    
    // Phase 5: Use atomic completion check to prevent race conditions
    // This ensures only one handler completes the race even if multiple bots/humans finish simultaneously
    const { completed, race: completedRace } = await storage.completeRaceAtomic(raceId);
    
    if (!completed) {
      console.log(`[Bot Finish] Race ${raceId} not completed yet (waiting for other participants)`);
      return;
    }
    
    console.log(`[Bot Finish] Race ${raceId} atomically completed`);
    
    // Mark as finishing to prevent heartbeat cleanup during async operations
    const raceRoom = this.races.get(raceId);
    if (raceRoom) {
      raceRoom.isFinishing = true;
    }
    
    // Fetch fresh participants after atomic completion
    const freshParticipants = await storage.getRaceParticipants(raceId);
    const finishedAt = completedRace?.finishedAt || new Date();
    
    // Update cache after successful DB update
    raceCache.updateRaceStatus(raceId, "finished", undefined, finishedAt);
    
    botService.stopAllBotsInRace(raceId, freshParticipants);
    this.cleanupExtensionState(raceId);
    
    const sortedResults = freshParticipants.sort((a, b) => (a.finishPosition || 999) - (b.finishPosition || 999));
    
    const enrichedResults = await this.enrichResultsWithRatings(sortedResults);
    
    // Create certificates BEFORE broadcasting so we can include verification IDs
    const certificates = await this.createRaceCertificates(raceId, sortedResults);
    
    console.log(`[Bot Finish] Broadcasting race_finished for race ${raceId}`);
    
    this.broadcastToRace(raceId, {
      type: "race_finished",
      results: enrichedResults,
      certificates,
    });
    
    this.processRaceCompletion(raceId, sortedResults).catch(err => {
      console.error(`[RaceFinish] Error processing race completion:`, err);
    });
    
    // Phase 1.4 & 6: Clean up timers and race room AFTER broadcasting results
    const timerVersion = raceRoom?.timerVersion;
    setTimeout(() => {
      const currentRoom = this.races.get(raceId);
      if (currentRoom && (timerVersion === undefined || currentRoom.timerVersion === timerVersion)) {
        console.log(`[Bot Finish] Cleaning up race room ${raceId} after results broadcast`);
        this.clearRaceTimers(raceId);
        this.timerRegistry.delete(raceId);
        this.races.delete(raceId);
        raceCache.deleteRace(raceId);
        this.cleanupExtensionState(raceId);
        this.updateStats();
      }
    }, 5000); // 5 second delay to allow reconnecting clients
  }

  private async handleLeave(ws: WebSocket, message: any) {
    const { raceId, participantId, isRacing, progress, errors } = message;

    try {
      await raceCache.flushParticipantProgress(participantId);
    } catch (error) {
      console.error(`[WS Leave] Failed to flush progress for participant ${participantId}:`, error);
    }
    
    const raceRoom = this.races.get(raceId);
    let cachedRace = raceCache.getRace(raceId);
    let race = cachedRace?.race || await storage.getRace(raceId);
    
    // Check if participant is already finished (shouldn't be marked DNF)
    const currentParticipants = await storage.getRaceParticipants(raceId);
    const participant = currentParticipants.find(p => p.id === participantId);
    const isAlreadyFinished = participant?.isFinished === 1;
    
    // If leaving during an active race (racing or countdown), mark as DNF instead of deleting
    // But only if the participant hasn't already finished their race
    if (race && !isAlreadyFinished && (race.status === "racing" || race.status === "countdown" || isRacing)) {
      console.log(`[WS Leave] Participant ${participantId} leaving active race ${raceId} - marking as DNF`);
      
      const username = participant?.username || "Unknown";

      const cachedParticipant = cachedRace?.participants?.find(p => p.id === participantId);
      const buffered = raceCache.getProgressFromBuffer(participantId);
      const paragraphLength = cachedRace?.race?.paragraphContent?.length || race.paragraphContent?.length || 0;

      const candidateProgress = Math.max(
        cachedParticipant?.progress || 0,
        buffered?.progress || 0,
        typeof progress === "number" ? progress : 0
      );
      const safeProgress = paragraphLength > 0 ? Math.min(candidateProgress, paragraphLength) : candidateProgress;

      const candidateErrors = Math.max(
        cachedParticipant?.errors || 0,
        buffered?.errors || 0,
        typeof errors === "number" ? errors : 0
      );
      const safeErrors = Math.max(0, Math.min(candidateErrors, safeProgress));

      const serverStats = this.computeServerStats(raceId, participantId, safeProgress, safeErrors);
      const safeWpm = serverStats.wpm;
      const safeAccuracy = serverStats.accuracy;
      
      // Update progress first
      await storage.updateParticipantProgress(
        participantId, 
        safeProgress, 
        safeWpm, 
        safeAccuracy, 
        safeErrors
      );
      
      // Mark as finished with DNF position (999 indicates DNF)
      await storage.updateParticipantFinishPosition(participantId, 999);
      
      // Also mark as finished in the database
      await storage.finishParticipant(participantId);
      
      // Update cache
      const participants = await storage.getRaceParticipants(raceId);
      raceCache.updateParticipants(raceId, participants);
      
      // Broadcast DNF status to other participants
      if (raceRoom) {
        this.broadcastToRace(raceId, {
          type: "participant_dnf",
          participantId,
          username,
        });
      }
    } else {
      // For waiting or finished races (or already finished participants), just delete the participant
      const leavingUsername = participant?.username;
      
      await storage.deleteRaceParticipant(participantId);
      raceCache.removeParticipant(raceId, participantId);
      
      if (raceRoom) {
        this.broadcastToRace(raceId, {
          type: "participant_left",
          participantId,
          username: leavingUsername,
        });
      }
    }
    
    raceCache.clearProgressBuffer(participantId);
    
    // Phase 5 hardening: Clean up chat rate limits to prevent memory leaks
    this.chatRateLimits.delete(participantId);
    
    if (raceRoom) {
      raceRoom.clients.delete(participantId);
      if (REDIS_ENABLED) {
        await redisClient.srem(REDIS_KEYS.raceConnections(raceId), participantId.toString());
      }
      
      // Host transfer: If the leaving player was the host, transfer to next available HUMAN player
      if (raceRoom.hostParticipantId === participantId && raceRoom.clients.size > 0) {
        // Find next human player (exclude bots) sorted by join order
        const humanClients = Array.from(raceRoom.clients.entries())
          .filter(([_, c]) => !c.isBot)
          .sort((a, b) => a[0] - b[0]); // Sort by participantId (join order)
        
        if (humanClients.length > 0) {
          const [nextHostId, newHostClient] = humanClients[0];
          raceRoom.hostParticipantId = nextHostId;
          console.log(`[WS Leave] Host transferred to ${newHostClient.username} (${nextHostId}) for race ${raceId}`);
          
          this.broadcastToRace(raceId, {
            type: "host_changed",
            newHostParticipantId: nextHostId,
            newHostUsername: newHostClient.username,
            message: `${newHostClient.username} is now the host`,
          });
        } else {
          // No human players left, clear host
          raceRoom.hostParticipantId = undefined;
          console.log(`[WS Leave] No human players left in race ${raceId}, host cleared`);
        }
      }
      
      // Check if countdown should be cancelled due to insufficient players after leave
      const connectedHumansCount = await this.getConnectedHumanCount(raceId, raceRoom);
      const participants = cachedRace?.participants || [];
      const botParticipants = participants.filter(p => p.isBot === 1);
      const hasBots = botParticipants.length > 0;
      const requiredHumans = hasBots ? 1 : 2;
      const currentStatus = race?.status;
      
      if (currentStatus === "countdown" && connectedHumansCount < requiredHumans) {
        // Cancel countdown - not enough players after leave
        this.clearRaceTimers(raceId);
        raceRoom.countdownTimer = undefined;
        
        raceRoom.isStarting = false;
        
        // Revert race status to waiting
        const reverted = await storage.updateRaceStatusAtomic(raceId, "waiting", "countdown");
        if (reverted) {
          raceCache.updateRaceStatus(raceId, "waiting");

          this.broadcastToRace(raceId, {
            type: "countdown_cancelled",
            reason: hasBots 
              ? "Not enough players connected"
              : `Not enough players - need at least ${requiredHumans} to start`,
            code: "INSUFFICIENT_PLAYERS"
          });

          console.log(`[WS Leave] Countdown cancelled for race ${raceId} - only ${connectedHumansCount} human player(s) remaining`);
        } else {
          const latest = await storage.getRace(raceId);
          if (latest) {
            raceCache.updateRaceStatus(raceId, latest.status, latest.startedAt ?? undefined, latest.finishedAt ?? undefined);
          }
        }
      }
      
      if (raceRoom.clients.size === 0) {
        // Don't clean up if race is finishing
        if (raceRoom.isFinishing) {
          console.log(`[WS Leave] Keeping race room ${raceId} alive - race is finishing`);
          this.updateStats();
          return;
        }
        
        // Don't clean up if timed race timer is active
        if (raceRoom.timedRaceTimer) {
          console.log(`[WS Leave] Keeping race room ${raceId} alive - timed race timer active`);
          this.updateStats();
          return;
        }
        
        if (raceRoom.countdownTimer) {
          clearInterval(raceRoom.countdownTimer);
        }
        this.races.delete(raceId);
        raceCache.deleteRace(raceId); // Ensure cache is also cleared
        this.cleanupExtensionState(raceId);
      }
    }

    this.updateStats();
  }

  private async handleExtendParagraph(ws: WebSocket, message: any) {
    const { raceId, participantId } = message;
    
    if (!raceId || !participantId) {
      ws.send(JSON.stringify({ type: "error", message: "Missing raceId or participantId" }));
      return;
    }

    let extensionState = this.extensionStates.get(raceId);
    if (!extensionState) {
      extensionState = { lastExtendedAt: 0, extensionCount: 0, pendingExtension: false };
      this.extensionStates.set(raceId, extensionState);
    }

    const now = Date.now();
    if (extensionState.pendingExtension) {
      console.log(`[Paragraph Extend] Race ${raceId} extension already in progress, skipping`);
      return;
    }

    if (now - extensionState.lastExtendedAt < EXTENSION_COOLDOWN_MS) {
      console.log(`[Paragraph Extend] Race ${raceId} in cooldown, skipping`);
      return;
    }

    if (extensionState.extensionCount >= MAX_EXTENSIONS_PER_RACE) {
      console.log(`[Paragraph Extend] Race ${raceId} reached max extensions (${MAX_EXTENSIONS_PER_RACE})`);
      return;
    }

    extensionState.pendingExtension = true;

    try {
      const race = await storage.getRace(raceId);
      
      if (!race || race.status !== "racing") {
        ws.send(JSON.stringify({ type: "error", message: "Race not active" }));
        return;
      }

      // Don't extend if any participant has already finished - race should end soon
      const cachedData = raceCache.getRace(raceId);
      const participants = cachedData?.participants || await storage.getRaceParticipants(raceId);
      const hasFinisher = participants.some(p => p.isFinished === 1);
      
      if (hasFinisher) {
        console.log(`[Paragraph Extend] Race ${raceId} has finished participants, skipping extension`);
        return;
      }

      const additionalParagraph =
        (await storage.getRandomParagraph("en", "quotes")) ||
        (await storage.getRandomParagraph("en", "general"));
      if (!additionalParagraph) {
        ws.send(JSON.stringify({ type: "error", message: "No additional content available" }));
        return;
      }

      const newContent = additionalParagraph.content;
      const previousLength = race.paragraphContent.length;
      
      const updatedRace = await storage.extendRaceParagraph(raceId, newContent);
      const newTotalLength = updatedRace?.paragraphContent.length || previousLength + newContent.length + 1;
      
      raceCache.extendParagraph(raceId, newContent);

      extensionState.lastExtendedAt = now;
      extensionState.extensionCount++;

      console.log(`[Paragraph Extend] Race ${raceId} extended by ${newContent.length} chars (total: ${newTotalLength}, extension ${extensionState.extensionCount}/${MAX_EXTENSIONS_PER_RACE})`);

      this.broadcastToRace(raceId, {
        type: "paragraph_extended",
        additionalContent: newContent,
        newTotalLength,
        previousLength,
      });

      // Re-fetch participants to update bots with new paragraph length
      const currentParticipants = await storage.getRaceParticipants(raceId);
      const bots = currentParticipants.filter(p => p.isBot === 1 && p.isFinished !== 1);
      
      bots.forEach(bot => {
        botService.updateParagraphLength(bot.id, newTotalLength);
      });
    } finally {
      extensionState.pendingExtension = false;
    }
  }

  private cleanupExtensionState(raceId: number) {
    this.extensionStates.delete(raceId);
    this.stopSpontaneousBotChat(raceId);
  }

  private static readonly submitKeystrokesSchema = z.object({
    raceId: z.number().int().positive(),
    participantId: z.number().int().positive(),
    clientWpm: z.number().finite().min(0).max(400).optional(),
    keystrokes: z.array(z.object({
      key: z.string().min(1).max(5),
      timestamp: z.number().finite(),
      position: z.number().finite().int().min(0).max(1_000_000),
      isTrusted: z.boolean().optional(),
    })).max(5000),
  });

  private static readonly joinSchema = z.object({
    type: z.literal('join'),
    raceId: z.number().int().positive(),
    participantId: z.number().int().positive(),
    username: z.string().min(1).max(32),
    joinToken: z.string().min(8).max(128),
  });

  private static readonly readySchema = z.object({
    type: z.literal('ready'),
    raceId: z.number().int().positive(),
    participantId: z.number().int().positive(),
  });

  private static readonly progressSchema = z.object({
    type: z.literal('progress'),
    participantId: z.number().int().positive(),
    progress: z.number().int().min(0).max(1_000_000),
    errors: z.number().int().min(0).max(1_000_000),
  });

  private static readonly finishSchema = z.object({
    type: z.literal('finish'),
    raceId: z.number().int().positive(),
    participantId: z.number().int().positive(),
  });

  private static readonly timedFinishSchema = z.object({
    type: z.literal('timed_finish'),
    raceId: z.number().int().positive(),
    participantId: z.number().int().positive(),
    progress: z.number().int().min(0).max(1_000_000),
    errors: z.number().int().min(0).max(1_000_000),
  });

  private static readonly leaveSchema = z.object({
    type: z.literal('leave'),
    raceId: z.number().int().positive(),
    participantId: z.number().int().positive(),
    isRacing: z.boolean().optional(),
    progress: z.number().int().min(0).max(1_000_000).optional(),
    errors: z.number().int().min(0).max(1_000_000).optional(),
  });

  private static readonly chatMessageSchema = z.object({
    type: z.literal('chat_message'),
    raceId: z.number().int().positive(),
    participantId: z.number().int().positive(),
    content: z.string().min(1).max(500),
    messageType: z.string().optional(),
    emoteCode: z.string().optional(),
  });

  private static readonly readyToggleSchema = z.object({
    type: z.literal('ready_toggle'),
    raceId: z.number().int().positive(),
    participantId: z.number().int().positive(),
  });

  private static readonly kickPlayerSchema = z.object({
    type: z.literal('kick_player'),
    raceId: z.number().int().positive(),
    participantId: z.number().int().positive(),
    targetParticipantId: z.number().int().positive(),
  });

  private static readonly lockRoomSchema = z.object({
    type: z.literal('lock_room'),
    raceId: z.number().int().positive(),
    participantId: z.number().int().positive(),
    locked: z.boolean(),
  });

  private static readonly rematchSchema = z.object({
    type: z.literal('rematch'),
    raceId: z.number().int().positive(),
    participantId: z.number().int().positive(),
  });

  private static readonly extendParagraphSchema = z.object({
    type: z.literal('extend_paragraph'),
    raceId: z.number().int().positive(),
    participantId: z.number().int().positive(),
  });

  private static readonly rejoinDecisionSchema = z.object({
    type: z.literal('rejoin_decision'),
    raceId: z.number().int().positive(),
    participantId: z.number().int().positive(),
    targetParticipantId: z.number().int().positive(),
    approved: z.boolean(),
  });

  private static readonly spectateSchema = z.object({
    type: z.literal('spectate'),
    raceId: z.number().int().positive(),
    userId: z.string().optional(),
    sessionId: z.string().max(128).optional(),
  });

  private static readonly stopSpectateSchema = z.object({
    type: z.literal('stop_spectate'),
    raceId: z.number().int().positive(),
  });

  private static readonly getReplaySchema = z.object({
    type: z.literal('get_replay'),
    raceId: z.number().int().positive(),
  });

  private static readonly getRatingSchema = z.object({
    type: z.literal('get_rating'),
    userId: z.string().min(1).max(128),
  });

  private async handleSubmitKeystrokes(ws: WebSocket, message: any) {
    const parsed = RaceWebSocketServer.submitKeystrokesSchema.safeParse(message);
    if (!parsed.success) {
      ws.send(JSON.stringify({ type: "error", message: "Invalid keystroke data", code: "INVALID_PAYLOAD" }));
      return;
    }

    const { raceId, participantId, keystrokes, clientWpm } = parsed.data;

    // Bound payload size to protect server memory/CPU
    const MAX_KEYSTROKES = 3000;
    const boundedKeystrokes = keystrokes.slice(0, MAX_KEYSTROKES);

    // Authorization: must be a current participant in this race
    const raceRoom = this.races.get(raceId);
    const inRoom = raceRoom?.clients.has(participantId);
    if (raceRoom && !inRoom) {
      ws.send(JSON.stringify({ type: "error", message: "Unauthorized: not a participant", code: "NOT_IN_RACE" }));
      return;
    }

    // Derive userId server-side (do not trust client input)
    let userId: string | undefined;
    let paragraphContent: string | undefined;
    try {
      const participants = await storage.getRaceParticipants(raceId);
      const p = participants.find(p => p.id === participantId);
      if (p?.userId) {
        userId = p.userId;
      }
      const cached = raceCache.getRace(raceId);
      paragraphContent = cached?.race?.paragraphContent || (await storage.getRace(raceId))?.paragraphContent || undefined;
    } catch (error) {
      console.error("[AntiCheat] Failed to fetch participant for keystroke validation:", error);
    }

    // Normalize and harden keystroke data: accept minimal client events
    // and derive expected/correct server-side from paragraph content.
    const normalizedKeystrokes: Array<{ key: string; expected: string; timestamp: number; correct: boolean; position: number; isTrusted?: boolean }> = [];
    let lastTs = 0;
    const now = Date.now();
    for (const raw of boundedKeystrokes) {
      if (!raw || typeof raw !== 'object') continue;
      const key = (raw as any).key;
      const timestamp = (raw as any).timestamp;
      const position = (raw as any).position;
      const isTrusted = (raw as any).isTrusted;

      if (typeof key !== 'string' || key.length < 1 || key.length > 5) continue;
      if (typeof timestamp !== 'number' || !Number.isFinite(timestamp)) continue;
      if (typeof position !== 'number' || !Number.isFinite(position) || position < 0) continue;

      const safeTs = Math.max(Math.min(Math.floor(timestamp), now + 5000), lastTs + 1);
      lastTs = safeTs;

      const expected = paragraphContent && position < paragraphContent.length ? paragraphContent[position] : '';
      if (!expected) continue;

      normalizedKeystrokes.push({
        key,
        expected,
        timestamp: safeTs,
        correct: key === expected,
        position: Math.floor(position),
        isTrusted: typeof isTrusted === 'boolean' ? isTrusted : undefined,
      });
    }

    if (normalizedKeystrokes.length === 0) {
      ws.send(JSON.stringify({ type: "error", message: "Invalid keystroke data", code: "INVALID_PAYLOAD" }));
      return;
    }

    try {
      const validation = await antiCheatService.validateKeystrokes(
        raceId,
        participantId,
        normalizedKeystrokes,
        clientWpm || 0,
        userId
      );

      ws.send(JSON.stringify({
        type: "keystroke_validation",
        participantId,
        isValid: validation.isValid,
        isFlagged: validation.isFlagged,
        serverWpm: validation.serverCalculatedWpm,
        requiresCertification: validation.flagReasons.includes("requires_certification"),
      }));

      if (validation.isFlagged) {
        this.antiCheatStatus.set(participantId, { disqualified: !validation.isValid, flagged: true, reason: validation.flagReasons.join(",") });
        console.log(`[AntiCheat] Flagged participant ${participantId}: ${validation.flagReasons.join(", ")}`);
        if (!validation.isValid) {
          this.disqualifyParticipant(raceId, participantId, validation.flagReasons.join(","));
        }
      } else {
        this.antiCheatStatus.set(participantId, { disqualified: false, flagged: false });
      }
    } catch (error) {
      console.error("[AntiCheat] Keystroke validation error:", error);
    }
  }

  private readonly CHAT_RATE_LIMIT_MS = 2000; // 2 seconds between messages

  /**
   * Store a chat message in the race room's history for reconnecting players
   */
  private storeChatMessage(raceId: number, message: ChatMessageCache): void {
    const raceRoom = this.races.get(raceId);
    if (!raceRoom) return;
    
    raceRoom.chatHistory.push(message);
    
    // Keep only the last MAX_CHAT_HISTORY_PER_RACE messages
    if (raceRoom.chatHistory.length > MAX_CHAT_HISTORY_PER_RACE) {
      raceRoom.chatHistory = raceRoom.chatHistory.slice(-MAX_CHAT_HISTORY_PER_RACE);
    }
  }

  /**
   * Get chat history for a race (used when player reconnects)
   */
  private getChatHistory(raceId: number): ChatMessageCache[] {
    const raceRoom = this.races.get(raceId);
    return raceRoom?.chatHistory || [];
  }

  private async handleChatMessage(ws: WebSocket, message: any) {
    const { raceId, participantId, content, messageType = "text", emoteCode } = message;

    if (!raceId || !participantId || !content) {
      ws.send(JSON.stringify({ type: "error", message: "Missing chat message data" }));
      return;
    }

    if (typeof content !== 'string') {
      ws.send(JSON.stringify({ type: "error", message: "Invalid message content" }));
      return;
    }

    if (content.length > 500) {
      ws.send(JSON.stringify({ type: "error", message: "Message too long" }));
      return;
    }

    // Rate limiting: 1 message per 2 seconds
    // Ensure participantId is a number for consistent Map key lookups
    const participantIdNum = typeof participantId === 'string' ? parseInt(participantId, 10) : participantId;
    const now = Date.now();
    const lastMessageTime = this.chatRateLimits.get(participantIdNum) || 0;
    const timeSinceLastMessage = now - lastMessageTime;
    
    if (timeSinceLastMessage < this.CHAT_RATE_LIMIT_MS) {
      const waitTime = Math.ceil((this.CHAT_RATE_LIMIT_MS - timeSinceLastMessage) / 1000);
      ws.send(JSON.stringify({ 
        type: "error", 
        message: `Please wait ${waitTime} second${waitTime > 1 ? 's' : ''} before sending another message`,
        code: "CHAT_RATE_LIMITED"
      }));
      return;
    }
    
    // Update last message timestamp
    this.chatRateLimits.set(participantIdNum, now);

    const raceRoom = this.races.get(raceId);
    if (!raceRoom) return;

    const client = raceRoom.clients.get(participantId);
    if (!client) {
      ws.send(JSON.stringify({ type: "error", message: "Unauthorized: not a participant" }));
      return;
    }

    const sanitizedContent = DOMPurify.sanitize(content.trim(), {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
    });

    if (!sanitizedContent) {
      ws.send(JSON.stringify({ type: "error", message: "Empty message after sanitization" }));
      return;
    }

    try {
      const chatMessage = await storage.createRaceChatMessage({
        raceId,
        participantId,
        messageType,
        content: sanitizedContent,
        emoteCode,
      });

      const chatPayload = {
        id: chatMessage.id,
        participantId,
        username: client.username,
        avatarColor: null as string | null,
        content: sanitizedContent,
        isSystem: false,
        createdAt: chatMessage.createdAt?.toISOString() || new Date().toISOString(),
      };

      // Store in chat history for reconnecting players
      this.storeChatMessage(raceId, chatPayload);

      this.broadcastToRace(raceId, {
        type: "chat_message",
        message: {
          id: chatMessage.id,
          participantId,
          username: client.username,
          content: sanitizedContent,
          messageType,
          emoteCode,
          createdAt: chatMessage.createdAt,
        },
      });

      this.triggerBotChatResponses(raceId, sanitizedContent);
    } catch (error) {
      console.error("[Chat] Message save error:", error);
    }
  }

  private botChatCooldowns: Map<number, number> = new Map(); // per-bot cooldowns
  private raceBurstWindow: Map<number, { count: number; expiresAt: number }> = new Map();
  private spontaneousChatTimers: Map<number, NodeJS.Timeout> = new Map(); // raceId -> timer
  private readonly BOT_CHAT_COOLDOWN_MS = 4000; // 4 seconds per bot (faster, more natural)
  private readonly RACE_BURST_LIMIT = 6; // max 6 bot messages per window
  private readonly RACE_BURST_WINDOW_MS = 10000; // 10 second window
  private readonly SPONTANEOUS_CHAT_MIN_DELAY_MS = 4000; // Minimum 4 seconds between spontaneous messages
  private readonly SPONTANEOUS_CHAT_MAX_DELAY_MS = 12000; // Maximum 12 seconds between spontaneous messages

  // Start spontaneous bot chat for a race (bots initiate messages without human prompting)
  private startSpontaneousBotChat(raceId: number) {
    // Don't start if already running
    if (this.spontaneousChatTimers.has(raceId)) {
      return;
    }

    const scheduleNext = () => {
      // Random delay between min and max
      const delay = this.SPONTANEOUS_CHAT_MIN_DELAY_MS + 
        Math.random() * (this.SPONTANEOUS_CHAT_MAX_DELAY_MS - this.SPONTANEOUS_CHAT_MIN_DELAY_MS);
      
      const timer = setTimeout(async () => {
        await this.sendSpontaneousBotMessage(raceId);
        
        // Schedule next message if race is still active
        const cachedRace = raceCache.getRace(raceId);
        if (cachedRace?.race?.status !== "finished" && cachedRace?.race?.status !== "abandoned") {
          scheduleNext();
        } else {
          this.stopSpontaneousBotChat(raceId);
        }
      }, delay);
      
      this.spontaneousChatTimers.set(raceId, timer);
    };

    // Start with a quick initial delay (1-3 seconds) for natural feel
    const initialDelay = 1000 + Math.random() * 2000;
    const timer = setTimeout(async () => {
      await this.sendSpontaneousBotMessage(raceId);
      scheduleNext();
    }, initialDelay);
    
    this.spontaneousChatTimers.set(raceId, timer);
    console.log(`[Bot Chat] Started spontaneous chat for race ${raceId}`);
  }

  private stopSpontaneousBotChat(raceId: number) {
    const timer = this.spontaneousChatTimers.get(raceId);
    if (timer) {
      clearTimeout(timer);
      this.spontaneousChatTimers.delete(raceId);
      console.log(`[Bot Chat] Stopped spontaneous chat for race ${raceId}`);
    }
  }

  private async sendSpontaneousBotMessage(raceId: number) {
    try {
      const race = await storage.getRace(raceId);
      if (!race) return;

      // Only send during waiting or countdown phases (not during racing or after finish)
      if (race.status !== "waiting" && race.status !== "countdown") {
        return;
      }

      const participants = await storage.getRaceParticipants(raceId);
      const botParticipants = participants.filter(p => p.isBot === 1);
      const humanParticipants = participants.filter(p => p.isBot !== 1);

      if (botParticipants.length === 0 || humanParticipants.length === 0) {
        return; // Need at least one bot and one human
      }

      // Check burst limit
      const now = Date.now();
      const burst = this.raceBurstWindow.get(raceId);
      if (burst && now < burst.expiresAt && burst.count >= this.RACE_BURST_LIMIT) {
        return;
      }

      // 40% chance to send a spontaneous message each cycle
      if (Math.random() > 0.40) {
        return;
      }

      // Pick a random eligible bot
      const eligibleBots = botParticipants.filter(bot => {
        const lastChat = this.botChatCooldowns.get(bot.id) || 0;
        return (now - lastChat) >= this.BOT_CHAT_COOLDOWN_MS;
      });

      if (eligibleBots.length === 0) return;

      const bot = eligibleBots[Math.floor(Math.random() * eligibleBots.length)];
      
      // Generate a contextual spontaneous message
      const spontaneousMessages = this.getSpontaneousMessages(race.status);
      const message = spontaneousMessages[Math.floor(Math.random() * spontaneousMessages.length)];

      // Update cooldown
      this.botChatCooldowns.set(bot.id, now);

      // Update burst counter
      if (!burst || now >= burst.expiresAt) {
        this.raceBurstWindow.set(raceId, { count: 1, expiresAt: now + this.RACE_BURST_WINDOW_MS });
      } else {
        burst.count++;
      }

      // Save and broadcast the message
      const chatMessage = await storage.createRaceChatMessage({
        raceId,
        participantId: bot.id,
        messageType: "text",
        content: message,
      });

      const chatPayload: ChatMessageCache = {
        id: chatMessage.id,
        participantId: bot.id,
        username: bot.username,
        avatarColor: bot.avatarColor || null,
        content: message,
        isSystem: false,
        createdAt: chatMessage.createdAt?.toISOString() || new Date().toISOString(),
      };

      // Store in chat history
      this.storeChatMessage(raceId, chatPayload);

      this.broadcastToRace(raceId, {
        type: "chat_message",
        message: {
          id: chatMessage.id,
          participantId: bot.id,
          username: bot.username,
          content: message,
          messageType: "text",
          createdAt: chatMessage.createdAt,
        },
      });

      console.log(`[Bot Chat] Spontaneous: ${bot.username}: "${message}"`);

      // Small chance to trigger another bot to respond (30%)
      if (Math.random() < 0.30) {
        setTimeout(() => {
          this.triggerBotChatResponses(raceId, message, true, 0);
        }, 1500 + Math.random() * 2000);
      }

    } catch (error) {
      console.error("[Bot Chat] Spontaneous message error:", error);
    }
  }

  private getSpontaneousMessages(status: string): string[] {
    if (status === "waiting") {
      return [
        "yo when we starting",
        "lets gooo",
        "im so ready",
        "anyone else nervous lol",
        "first race today",
        "fingers warmed up 🔥",
        "gonna get that W",
        "gl everyone",
        "lets get it",
        "who else is hyped",
        "this is gonna be fun",
        "ready when yall are",
        "start start start",
        "im feeling fast today",
        "anyone wanna bet whos winning",
        "practice round 😅",
        "cmon lets race",
        "👀",
        "💪",
        "my keyboard is ready",
        "finally some competition",
        "hope im not rusty",
        "been practicing all day",
        "whos the fastest here",
        "no pressure no pressure",
      ];
    } else if (status === "countdown") {
      return [
        "here we go",
        "omg omg omg",
        "FOCUS",
        "lets goooo",
        "😤",
        "🔥",
        "starting!",
        "good luck!",
        "ahhh",
        "ready",
      ];
    }
    return ["nice", "yea", "👍"];
  }

  private async triggerPostRaceBotChat(raceId: number, results: any[]) {
    try {
      const botParticipants = results.filter(p => p.isBot === 1);
      if (botParticipants.length === 0) return;

      // 70% chance bots chat after race
      if (Math.random() > 0.70) return;

      const postRaceMessages = {
        winner: [
          "gg ez",
          "too easy 😎",
          "lets gooo i won",
          "that was close actually",
          "gg everyone",
          "yesss 🏆",
          "finally",
          "thats what im talking about",
        ],
        loser: [
          "gg",
          "ggs everyone",
          "good race",
          "nice one",
          "that was fun",
          "rematch?",
          "i was so close",
          "next time 😤",
          "wp",
          "not bad not bad",
          "gg yall are fast",
          "rip my fingers 😂",
        ],
        neutral: [
          "gg",
          "good game",
          "nice",
          "that was intense",
          "fun race",
          "👍",
          "good one",
        ],
      };

      // Pick 1-2 bots to chat
      const numChatters = Math.min(botParticipants.length, Math.random() < 0.6 ? 1 : 2);
      const shuffledBots = [...botParticipants].sort(() => Math.random() - 0.5);
      const chatters = shuffledBots.slice(0, numChatters);

      for (let i = 0; i < chatters.length; i++) {
        const bot = chatters[i];
        const isWinner = bot.finishPosition === 1;
        const messagePool = isWinner 
          ? postRaceMessages.winner 
          : (Math.random() < 0.7 ? postRaceMessages.loser : postRaceMessages.neutral);
        
        const message = messagePool[Math.floor(Math.random() * messagePool.length)];
        
        // Stagger messages with 1-3 second delays
        const delay = 1000 + (i * 1500) + Math.random() * 1500;
        
        setTimeout(async () => {
          try {
            const chatMessage = await storage.createRaceChatMessage({
              raceId,
              participantId: bot.id,
              messageType: "text",
              content: message,
            });

            this.broadcastToRace(raceId, {
              type: "chat_message",
              message: {
                id: chatMessage.id,
                participantId: bot.id,
                username: bot.username,
                content: message,
                messageType: "text",
                createdAt: chatMessage.createdAt,
              },
            });

            console.log(`[Bot Chat] Post-race: ${bot.username}: "${message}"`);
          } catch (error) {
            console.error("[Bot Chat] Post-race message error:", error);
          }
        }, delay);
      }
    } catch (error) {
      console.error("[Bot Chat] Post-race trigger error:", error);
    }
  }

  private async triggerBotChatResponses(raceId: number, message: string, senderIsBot: boolean = false, chainDepth: number = 0) {
    try {
      console.log(`[Bot Chat] Triggered for race ${raceId}: "${message.substring(0, 30)}..." (isBot=${senderIsBot}, depth=${chainDepth})`);
      
      const race = await storage.getRace(raceId);
      if (!race) {
        console.log(`[Bot Chat] Race ${raceId} not found`);
        return;
      }

      if (race.status === "finished" || race.status === "abandoned") {
        console.log(`[Bot Chat] Race ${raceId} is ${race.status}`);
        return;
      }

      // Limit chain depth to prevent infinite bot loops
      if (chainDepth >= 2) {
        console.log(`[Bot Chat] Chain depth ${chainDepth} reached, stopping`);
        return;
      }

      // Check race burst limit
      const now = Date.now();
      const burst = this.raceBurstWindow.get(raceId);
      if (burst && now < burst.expiresAt) {
        if (burst.count >= this.RACE_BURST_LIMIT) {
          console.log(`[Bot Chat] Race ${raceId} hit burst limit (${burst.count}/${this.RACE_BURST_LIMIT})`);
          return;
        }
        console.log(`[Bot Chat] Burst window active: ${burst.count}/${this.RACE_BURST_LIMIT}`);
      } else {
        console.log(`[Bot Chat] New burst window started`);
        this.raceBurstWindow.set(raceId, { count: 0, expiresAt: now + this.RACE_BURST_WINDOW_MS });
      }

      const participants = await storage.getRaceParticipants(raceId);
      const botParticipants = participants.filter(p => p.isBot === 1);

      console.log(`[Bot Chat] Found ${botParticipants.length} bots in race`);

      if (botParticipants.length === 0) return;

      // Filter bots by per-bot cooldown
      const eligibleBots = botParticipants.filter(bot => {
        const lastChat = this.botChatCooldowns.get(bot.id) || 0;
        const elapsed = now - lastChat;
        const isEligible = elapsed >= this.BOT_CHAT_COOLDOWN_MS;
        console.log(`[Bot Chat] Bot ${bot.username} (${bot.id}): lastChat=${lastChat}, elapsed=${elapsed}ms, eligible=${isEligible}`);
        return isEligible;
      });

      if (eligibleBots.length === 0) {
        console.log(`[Bot Chat] No eligible bots (all on cooldown)`);
        return;
      }
      
      console.log(`[Bot Chat] ${eligibleBots.length} bots eligible to respond`);

      // Small chance no one responds (like real group chats)
      // 10% chance no one responds
      if (Math.random() < 0.10) {
        console.log(`[Bot Chat] No one responded (realistic silence)`);
        return;
      }
      
      // If sender is bot, 60% chance to skip (bots don't always reply to bots)
      if (senderIsBot && Math.random() < 0.6) {
        console.log(`[Bot Chat] Skipping bot-to-bot response (random)`);
        return;
      }

      // Realistic distribution: 50% chance 1 bot, 35% chance 2 bots, 15% chance 3 bots
      const roll = Math.random();
      let numResponders: number;
      if (roll < 0.50) {
        numResponders = 1;
      } else if (roll < 0.85) {
        numResponders = Math.min(2, eligibleBots.length);
      } else {
        numResponders = Math.min(3, eligibleBots.length);
      }
      
      // For bot chains, max 1-2 responders
      if (senderIsBot) {
        numResponders = Math.min(numResponders, Math.random() < 0.7 ? 1 : 2);
      }

      // Shuffle and select bots
      const shuffled = [...eligibleBots].sort(() => Math.random() - 0.5);
      const respondingBots = shuffled.slice(0, numResponders);

      console.log(`[Bot Chat] ${respondingBots.length} bots will respond to: "${message.substring(0, 30)}..."`);

      // Schedule staggered responses with quick timing
      respondingBots.forEach((bot, index) => {
        // Fast response delays like texting friends
        const typingSpeed = Math.random();
        let delay: number;
        
        if (typingSpeed < 0.5) {
          // Quick responder (50%) - 0.8-1.5s
          delay = 800 + Math.random() * 700;
        } else if (typingSpeed < 0.8) {
          // Normal responder (30%) - 1.5-2.5s
          delay = 1500 + Math.random() * 1000;
        } else {
          // Slower responder (20%) - 2.5-4s
          delay = 2500 + Math.random() * 1500;
        }
        
        // Add stagger for multiple responders (0.5-1s between each)
        delay += index * (500 + Math.random() * 500);

        this.botChatCooldowns.set(bot.id, now);

        setTimeout(async () => {
          await this.sendBotChatMessage(raceId, bot, message, chainDepth);
        }, delay);
      });

      // Update burst counter
      const currentBurst = this.raceBurstWindow.get(raceId)!;
      currentBurst.count += respondingBots.length;

    } catch (error) {
      console.error("[Bot Chat] Error:", error);
    }
  }

  private async sendBotChatMessage(raceId: number, bot: any, userMessage: string, chainDepth: number) {
    try {
      const race = await storage.getRace(raceId);
      if (!race || race.status === "finished" || race.status === "abandoned") return;

      // Try AI first, always fallback to casual response
      let response = await this.generateAIBotResponse(userMessage, bot.username);
      
      if (!response) {
        const intent = this.detectMessageIntent(userMessage);
        response = this.getContextualResponse(intent);
        console.log(`[Bot Chat] Using fallback for ${bot.username}: "${response}"`);
      }

      const botChatMessage = await storage.createRaceChatMessage({
        raceId,
        participantId: bot.id,
        messageType: "text",
        content: response,
      });

      const chatPayload: ChatMessageCache = {
        id: botChatMessage.id,
        participantId: bot.id,
        username: bot.username,
        avatarColor: bot.avatarColor || null,
        content: response,
        isSystem: false,
        createdAt: botChatMessage.createdAt?.toISOString() || new Date().toISOString(),
      };

      // Store in chat history
      this.storeChatMessage(raceId, chatPayload);

      this.broadcastToRace(raceId, {
        type: "chat_message",
        message: {
          id: botChatMessage.id,
          participantId: bot.id,
          username: bot.username,
          content: response,
          messageType: "text",
          createdAt: botChatMessage.createdAt,
        },
      });

      console.log(`[Bot Chat] ${bot.username}: "${response}"`);

      // Trigger bot-to-bot response chain (with reduced probability)
      if (chainDepth < 1 && Math.random() < 0.3) {
        setTimeout(() => {
          this.triggerBotChatResponses(raceId, response!, true, chainDepth + 1);
        }, 2000 + Math.random() * 2000);
      }

    } catch (error) {
      console.error("[Bot Chat] Send error:", error);
    }
  }

  private async generateAIBotResponse(userMessage: string, botName: string): Promise<string | null> {
    // Random personality for this response
    const personalities = [
      { style: "hyped", desc: "super excited and energetic, uses caps sometimes, lots of emojis" },
      { style: "chill", desc: "laid back and cool, minimal words, very casual" },
      { style: "competitive", desc: "playfully trash-talking, confident, wants to win" },
      { style: "friendly", desc: "warm and supportive, encouraging others" },
      { style: "quiet", desc: "few words, observant, occasional short comment" },
      { style: "funny", desc: "jokes around, uses humor, playful teasing" },
    ];
    const personality = personalities[Math.floor(Math.random() * personalities.length)];
    
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You're ${botName} in a typing race game chat. Personality: ${personality.style} - ${personality.desc}

BE HUMAN - text like you're in a group chat with friends:
- 2-8 words max, super short
- Use: lol, haha, nah, yoo, bet, fr, lowkey, ngl, gg, rip, damn, nice, bruh, yo
- Skip punctuation, lowercase mostly
- Emoji only sometimes (30% of messages)
- Can have small typos occasionally
- React naturally - agree, disagree, joke, ignore parts
- Don't always directly answer - sometimes just react
- Match their energy or contrast it

${personality.style === 'hyped' ? 'Examples: "LETS GOOO", "yooo im ready 🔥", "this is gonna be good"' : ''}
${personality.style === 'chill' ? 'Examples: "yea", "cool", "aight", "we chilling"' : ''}
${personality.style === 'competitive' ? 'Examples: "ez clap", "yall arent ready", "watch me", "too slow 😤"' : ''}
${personality.style === 'friendly' ? 'Examples: "gl everyone!", "u got this", "have fun yall"' : ''}
${personality.style === 'quiet' ? 'Examples: "yo", "hm", "nice", "k"' : ''}
${personality.style === 'funny' ? 'Examples: "lmao", "bro what 😂", "im literally so bad", "rip my fingers"' : ''}

NEVER sound like AI. No "I'd be happy to" or formal language.`
          },
          {
            role: "user",
            content: userMessage
          }
        ],
        max_tokens: 20,
        temperature: 1.1,
      });

      const reply = response.choices[0]?.message?.content?.trim();
      if (reply && reply.length > 0 && reply.length < 60) {
        console.log(`[Bot Chat AI] ${botName} (${personality.style}): "${reply}"`);
        return reply;
      }
      return null;
    } catch (error) {
      console.error("[Bot Chat AI] OpenAI error:", error);
      return null;
    }
  }

  private getContextualResponse(intent: string): string {
    const responses: Record<string, string[]> = {
      greetings: [
        "yo", "yoo", "heyyy", "sup", "ayy", "hey", "yooo",
        "yo whats up", "heyy", "wassup", "hi", "ayy whats good",
      ],
      goodLuck: [
        "gl", "u2", "same", "ty", "gl gl", "thanks u too",
        "haha gl", "yea gl", "🍀", "gl everyone",
      ],
      finishing: [
        "gg", "ggs", "gg wp", "good game", "nice race",
        "that was fun", "gg everyone", "wp", "good one",
      ],
      reactions: [
        "fr", "lol", "haha", "nice", "damn", "yea",
        "true", "facts", "ikr", "real", "same", "mood",
      ],
      competitive: [
        "lets go", "ez", "bet", "watch", "im ready",
        "bring it", "too ez", "😤", "we'll see", "ok bet",
      ],
      encouragement: [
        "u got this", "lets get it", "we got this", "go go",
        "cmon", "yea", "lets gooo", "💪",
      ],
      question: [
        "idk", "maybe", "hm", "who knows", "lol idk",
        "not sure", "🤷", "we'll see",
      ],
      casual: [
        "yea", "lol", "haha", "nice", "ok", "bet", "fr",
        "true", "aight", "cool", "k", "ye", "word", "fasho",
      ],
    };

    const categoryResponses = responses[intent] || responses.casual;
    return categoryResponses[Math.floor(Math.random() * categoryResponses.length)];
  }

  private detectMessageIntent(content: string): string {
    const lower = content.toLowerCase();
    
    if (/\b(hi|hello|hey|sup|yo|hola|greetings|what'?s up)\b/.test(lower)) {
      return 'greetings';
    }
    if (/\b(good\s*luck|gl|best of luck|fingers crossed|luck)\b/.test(lower)) {
      return 'goodLuck';
    }
    if (/\b(gg|good\s*game|well\s*played|nice\s*race|great\s*race|congrat)\b/.test(lower)) {
      return 'finishing';
    }
    if (/\b(nice|great|awesome|cool|wow|amazing|impressive|sick|fire)\b/.test(lower)) {
      return 'reactions';
    }
    if (/\b(let'?s\s*go|come\s*on|race|challenge|beat|fast|ready|start|bring)\b/.test(lower)) {
      return 'competitive';
    }
    if (/\b(you\s*can|keep|going|try|practice|effort|hope|wish)\b/.test(lower)) {
      return 'encouragement';
    }
    if (/\?/.test(lower)) {
      return 'question';
    }
    
    return 'casual';
  }

  private spectators: Map<number, Map<WebSocket, string>> = new Map();
  private readonly MAX_SPECTATORS_PER_RACE = 50;
  private readonly MAX_TOTAL_SPECTATORS = 5000;

  private async handleSpectate(ws: WebSocket, message: any) {
    const { raceId, userId, sessionId } = message;

    if (!raceId) {
      ws.send(JSON.stringify({ type: "error", message: "Missing race ID" }));
      return;
    }

    const race = await storage.getRace(raceId);
    if (!race) {
      ws.send(JSON.stringify({ type: "error", message: "Race not found" }));
      return;
    }

    let spectatorMap = this.spectators.get(raceId);
    if (!spectatorMap) {
      spectatorMap = new Map();
      this.spectators.set(raceId, spectatorMap);
    }
    
    // Phase 6: Bounds check for spectators to prevent memory growth
    if (spectatorMap.size >= this.MAX_SPECTATORS_PER_RACE) {
      ws.send(JSON.stringify({ 
        type: "error", 
        message: "Too many spectators for this race",
        code: "SPECTATOR_LIMIT_REACHED"
      }));
      return;
    }
    
    // Check total spectators
    let totalSpectators = 0;
    for (const map of this.spectators.values()) {
      totalSpectators += map.size;
    }
    if (totalSpectators >= this.MAX_TOTAL_SPECTATORS) {
      ws.send(JSON.stringify({ 
        type: "error", 
        message: "Server spectator limit reached",
        code: "GLOBAL_SPECTATOR_LIMIT"
      }));
      return;
    }
    
    const generatedSessionId = sessionId || `ws_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    spectatorMap.set(ws, generatedSessionId);

    try {
      await storage.addRaceSpectator({
        raceId,
        userId,
        sessionId: generatedSessionId,
        isActive: true,
      });

      const spectatorCount = await storage.getActiveSpectatorCount(raceId);
      const participants = await storage.getRaceParticipants(raceId);

      ws.send(JSON.stringify(this.sanitizeMessageForClient({
        type: "spectate_joined",
        race,
        participants,
        spectatorCount,
      })));

      this.broadcastToRace(raceId, {
        type: "spectator_update",
        spectatorCount,
      });
    } catch (error) {
      console.error("[Spectator] Join error:", error);
    }
  }

  private async handleStopSpectate(ws: WebSocket, message: any) {
    const { raceId } = message;

    if (!raceId) return;

    await this.cleanupSpectator(ws, raceId);
  }

  private async cleanupSpectator(ws: WebSocket, raceId: number) {
    const spectatorMap = this.spectators.get(raceId);
    if (!spectatorMap) return;

    const sessionId = spectatorMap.get(ws);
    spectatorMap.delete(ws);
    
    if (spectatorMap.size === 0) {
      this.spectators.delete(raceId);
    }

    if (sessionId) {
      try {
        await storage.removeRaceSpectator(raceId, sessionId);
        const spectatorCount = await storage.getActiveSpectatorCount(raceId);
        
        this.broadcastToRace(raceId, {
          type: "spectator_update",
          spectatorCount,
        });
      } catch (error) {
        console.error("[Spectator] Leave error:", error);
      }
    }
  }

  private async handleGetReplay(ws: WebSocket, message: any) {
    const { raceId } = message;

    if (!raceId) {
      ws.send(JSON.stringify({ type: "error", message: "Missing race ID" }));
      return;
    }

    try {
      const authParticipantId = (ws as any).authenticatedParticipantId;
      const race = await storage.getRace(raceId);
      
      if (!race) {
        ws.send(JSON.stringify({ type: "error", message: "Race not found" }));
        return;
      }
      
      const replay = await storage.getRaceReplay(raceId);
      
      if (!replay) {
        ws.send(JSON.stringify({ type: "error", message: "Replay not found" }));
        return;
      }

      const requiresParticipantAuth = race.isPrivate === 1 || replay.isPublic !== true;
      if (requiresParticipantAuth) {
        if (!authParticipantId) {
          ws.send(JSON.stringify({ 
            type: "error", 
            message: "Authentication required to view this replay",
            code: "AUTH_REQUIRED"
          }));
          return;
        }

        const participants = await storage.getRaceParticipants(raceId);
        const isParticipant = participants.some(p => p.id === authParticipantId);
        if (!isParticipant) {
          ws.send(JSON.stringify({ 
            type: "error", 
            message: "Not authorized to view this replay",
            code: "NOT_AUTHORIZED"
          }));
          return;
        }
      }

      await storage.incrementReplayViewCount(raceId);

      ws.send(JSON.stringify({
        type: "replay_data",
        replay,
      }));
    } catch (error) {
      console.error("[Replay] Fetch error:", error);
      ws.send(JSON.stringify({ type: "error", message: "Failed to fetch replay" }));
    }
  }

  private async handleGetRating(ws: WebSocket, message: any) {
    const { userId } = message;

    if (!userId) {
      ws.send(JSON.stringify({ type: "error", message: "Missing user ID" }));
      return;
    }

    try {
      const rating = await storage.getOrCreateUserRating(userId);
      const tierInfo = eloRatingService.getTierInfo(rating.tier);

      ws.send(JSON.stringify({
        type: "rating_data",
        rating: {
          ...rating,
          tierInfo,
        },
      }));
    } catch (error) {
      console.error("[Rating] Fetch error:", error);
      ws.send(JSON.stringify({ type: "error", message: "Failed to fetch rating" }));
    }
  }

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bytes = crypto.randomBytes(6);
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(bytes[i] % chars.length);
    }
    return code;
  }

  // Create certificates for human participants and return a map of participantId -> verificationId
  private async createRaceCertificates(raceId: number, participants: any[]): Promise<Record<number, string>> {
    const certificateMap: Record<number, string> = {};
    
    // Filter to human participants who have userId and are finished
    const humanParticipants = participants.filter(p => p.userId && p.isBot !== 1);
    
    if (humanParticipants.length === 0) {
      return certificateMap;
    }
    
    try {
      const { generateVerificationData } = await import("./certificate-verification-service");
      const race = await storage.getRace(raceId);
      const totalParticipants = participants.length;
      
      for (const participant of humanParticipants) {
        try {
          const user = await storage.getUser(participant.userId);
          if (!user) {
            console.log(`[Race Certificate] User not found for participant ${participant.id} (userId: ${participant.userId})`);
            continue;
          }
          
          const duration = race?.timeLimitSeconds || 60;
          
          // Calculate consistency using same formula as client
          // Based on accuracy with slight variation for characters typed
          const chars = participant.progress || 0;
          const baseConsistency = participant.accuracy || 100;
          const calculatedConsistency = Math.max(70, Math.min(100, Math.round(
            baseConsistency * 0.95 + (chars > 100 ? 5 : chars / 20)
          )));
          
          // Normalize values for consistent signature
          const normalizedWpm = Math.round(participant.wpm || 0);
          const normalizedAccuracy = Math.round((participant.accuracy || 100) * 10) / 10;
          
          // Calculate performance tier
          const { getPerformanceTier } = await import("./certificate-verification-service");
          const tierInfo = getPerformanceTier(normalizedWpm, normalizedAccuracy, "race");
          
          // CRITICAL: Use the SAME metadata object for both signature and storage
          // Any mismatch will cause signature verification to fail
          const certificateMetadata = {
            username: participant.username,
            placement: participant.finishPosition || 999,
            totalParticipants,
            raceType: race?.raceType || "timed",
            tier: tierInfo.tier,
          };
          
          const verificationData = generateVerificationData({
            userId: participant.userId,
            certificateType: "race",
            wpm: normalizedWpm,
            accuracy: normalizedAccuracy,
            consistency: calculatedConsistency,
            duration,
            raceId, // raceId is a separate field in the signature payload
            metadata: certificateMetadata,
          });
          
          await storage.createCertificate({
            certificateType: "race",
            userId: participant.userId,
            wpm: normalizedWpm,
            accuracy: normalizedAccuracy,
            consistency: calculatedConsistency,
            duration,
            raceId,
            metadata: certificateMetadata, // Same metadata object
            ...verificationData,
          });
          
          certificateMap[participant.id] = verificationData.verificationId;
          console.log(`[Race Certificate] Created certificate ${verificationData.verificationId} for participant ${participant.id} (${participant.username})`);
        } catch (certError: any) {
          if (!certError?.message?.includes('compute time quota')) {
            console.error(`[Race Certificate] Failed to create certificate for participant ${participant.id}:`, certError);
          }
        }
      }
      
      console.log(`[Race Certificate] Created ${Object.keys(certificateMap).length} certificates for race ${raceId}`);
    } catch (error: any) {
      if (!error?.message?.includes('compute time quota')) {
        console.error(`[Race Certificate] Error creating certificates for race ${raceId}:`, error);
      }
    }
    
    return certificateMap;
  }

  private async processRaceCompletion(raceId: number, participants: any[]) {
    try {
      const results = participants
        .filter(p => p.isFinished === 1)
        .map(p => ({
          participantId: p.id,
          userId: p.userId,
          position: p.finishPosition || 999,
          wpm: p.wpm,
          accuracy: p.accuracy,
          isBot: p.isBot === 1,
        }));

      const ratingChanges = await eloRatingService.processRaceResults(raceId, results);

      if (ratingChanges.length > 0) {
        this.broadcastToRace(raceId, {
          type: "rating_changes",
          changes: ratingChanges.map(change => ({
            participantId: results.find(r => r.userId === change.userId)?.participantId,
            ...change,
            tierInfo: eloRatingService.getTierInfo(change.tier),
          })),
        });
      }

      // Note: Certificates are now created BEFORE race_finished broadcast (in createRaceCertificates)

      const keystrokesData = await storage.getRaceKeystrokes(raceId);
      const race = await storage.getRace(raceId);
      
      if (race && keystrokesData.length > 0) {
        try {
          await storage.createRaceReplay({
            raceId,
            paragraphContent: race.paragraphContent,
            duration: race.finishedAt && race.startedAt 
              ? Math.round((race.finishedAt.getTime() - race.startedAt.getTime()))
              : null,
            participantData: participants.map(p => ({
              participantId: p.id,
              username: p.username,
              wpm: p.wpm,
              accuracy: p.accuracy,
              position: p.finishPosition,
              keystrokes: keystrokesData.find(k => k.participantId === p.id)?.keystrokes || [],
            })),
            isPublic: false,
          });
          console.log(`[Replay] Saved replay for race ${raceId}`);
        } catch (error) {
          console.error(`[Replay] Failed to save replay for race ${raceId}:`, error);
        }
      }
    } catch (error) {
      console.error(`[RaceCompletion] Error processing race ${raceId}:`, error);
    }
  }

  private async handleDisconnect(ws: WebSocket) {
    const racesToCheck = Array.from(this.races.entries());
    for (const [raceId, raceRoom] of racesToCheck) {
      const clientsToCheck = Array.from(raceRoom.clients.entries());
      for (const [participantId, client] of clientsToCheck) {
        if (client.ws === ws) {
          try {
            await raceCache.flushParticipantProgress(participantId);
          } catch (error) {
            console.error(`[WS Disconnect] Failed to flush progress for participant ${participantId}:`, error);
          }

          raceRoom.clients.delete(participantId);
          if (REDIS_ENABLED && !client.isBot) {
            await redisClient.srem(REDIS_KEYS.raceConnections(raceId), participantId.toString());
          }
          
          // Phase 5 hardening: Clean up chat rate limits to prevent memory leaks
          this.chatRateLimits.delete(participantId);
          
          // Phase 1.1 & 6: Store disconnected player with bounded map and tracked cleanup
          const disconnectInfo: DisconnectedPlayer = {
            username: client.username,
            isReady: client.isReady,
            disconnectedAt: Date.now(),
          };
          this.addDisconnectedPlayer(raceId, participantId, disconnectInfo);
          this.scheduleDisconnectedPlayerCleanup(raceId, participantId, disconnectInfo);
          
          this.broadcastToRace(raceId, {
            type: "participant_disconnected",
            participantId,
            username: client.username,
          });
          
          // Phase 1.2: Use atomic host transfer with locking
          if (raceRoom.hostParticipantId === participantId && raceRoom.clients.size > 0) {
            const nextHostId = this.findNextHost(raceRoom);
            if (nextHostId !== undefined) {
              // Transfer host using the atomic method
              this.transferHost(raceRoom, nextHostId, "previous host disconnected").catch(err => {
                console.error(`[WS Disconnect] Host transfer failed:`, err);
              });
            } else {
              // No human players left, clear host with lock protection
              if (!raceRoom.hostLock) {
                raceRoom.hostLock = true;
                raceRoom.hostParticipantId = undefined;
                raceRoom.hostVersion++;
                raceRoom.hostLock = false;
                console.log(`[WS Disconnect] No human players left in race ${raceId}, host cleared (version ${raceRoom.hostVersion})`);
                
                // Reject all pending rejoin requests if no host available
                for (const [pId, request] of raceRoom.pendingRejoinRequests.entries()) {
                  if (request.ws.readyState === WebSocket.OPEN) {
                    request.ws.send(JSON.stringify({
                      type: "rejoin_rejected",
                      message: "No host available to approve your request",
                      code: "NO_HOST"
                    }));
                  }
                }
                raceRoom.pendingRejoinRequests.clear();
              }
            }
          }
          
          // Check if we need to cancel countdown due to insufficient players
          const connectedHumansCount = await this.getConnectedHumanCount(raceId, raceRoom);
          const cachedRace = raceCache.getRace(raceId);
          const currentStatus = cachedRace?.race?.status;
          
          // Check for bots to determine minimum required humans
          const participants = cachedRace?.participants || [];
          const botParticipants = participants.filter(p => p.isBot === 1);
          const hasBots = botParticipants.length > 0;
          const requiredHumans = hasBots ? 1 : 2;
          
          if (currentStatus === "countdown" && connectedHumansCount < requiredHumans) {
            // Phase 1.4: Use timer registry for cleanup
            this.clearRaceTimers(raceId);
            raceRoom.countdownTimer = undefined;
            
            // Reset the isStarting flag since countdown is cancelled
            raceRoom.isStarting = false;
            
            // Revert race status to waiting
            const reverted = await storage.updateRaceStatusAtomic(raceId, "waiting", "countdown");
            if (reverted) {
              raceCache.updateRaceStatus(raceId, "waiting");

              this.broadcastToRace(raceId, {
                type: "countdown_cancelled",
                reason: hasBots 
                  ? "Not enough players connected - waiting for reconnection"
                  : `Not enough players - need at least ${requiredHumans} to start`,
                code: "INSUFFICIENT_PLAYERS"
              });

              console.log(`[WS Disconnect] Countdown cancelled for race ${raceId} - only ${connectedHumansCount} human player(s) remaining (need ${requiredHumans})`);
            } else {
              const latest = await storage.getRace(raceId);
              if (latest) {
                raceCache.updateRaceStatus(raceId, latest.status, latest.startedAt ?? undefined, latest.finishedAt ?? undefined);
              }
            }
          }

          if (raceRoom.clients.size === 0) {
            // NEVER clean up a race that is currently finishing - prevents race condition
            if (raceRoom.isFinishing) {
              console.log(`[WS Disconnect] Keeping race room ${raceId} alive - race is finishing`);
              this.updateStats();
              return;
            }
            
            // For timed races that are still racing, DON'T delete the room - let the timer complete
            const timerEntry = this.timerRegistry.get(raceId);
            if (timerEntry?.timedRace || raceRoom.timedRaceTimer) {
              console.log(`[WS Disconnect] Keeping race room ${raceId} alive - timed race timer active`);
              this.updateStats();
              return;
            }
            
            // Phase 1.4: Clean up all timers via registry
            this.clearRaceTimers(raceId);
            this.timerRegistry.delete(raceId);
            
            if (raceRoom.countdownTimer) {
              clearInterval(raceRoom.countdownTimer);
            }
            this.races.delete(raceId);
            raceCache.deleteRace(raceId);
            this.cleanupExtensionState(raceId);
            
            // Clean up all disconnected player entries for this race
            const disconnectedMap = this.disconnectedPlayers.get(raceId);
            if (disconnectedMap) {
              for (const [pId] of disconnectedMap.entries()) {
                const timerKey = `${raceId}-${pId}`;
                const timer = this.disconnectCleanupTimers.get(timerKey);
                if (timer) {
                  clearTimeout(timer);
                  this.disconnectCleanupTimers.delete(timerKey);
                }
              }
              this.disconnectedPlayers.delete(raceId);
            }
            
            // Phase 5 hardening: Clean up chat rate limits for all participants in this race
            // (already done per-participant above, but clean up any stragglers)
            for (const pId of raceRoom.clients.keys()) {
              this.chatRateLimits.delete(pId);
            }
          }
          
          this.updateStats();
          return;
        }
      }
    }

    // Phase 5 hardening: Clean ALL spectator entries (removed break to fix bug)
    // A websocket could be spectating multiple races (edge case)
    const spectatorEntries = Array.from(this.spectators.entries());
    for (const [raceId, spectatorMap] of spectatorEntries) {
      if (spectatorMap.has(ws)) {
        this.cleanupSpectator(ws, raceId).catch(err => {
          console.error(`[Spectator] Cleanup error on disconnect:`, err);
        });
        // No break - continue to check other races
      }
    }
  }

  private findRaceIdByParticipant(participantId: number): number | null {
    const racesToCheck = Array.from(this.races.entries());
    for (const [raceId, raceRoom] of racesToCheck) {
      if (raceRoom.clients.has(participantId)) {
        return raceId;
      }
    }
    return null;
  }

  private broadcastToRaceLocal(raceId: number, message: any) {
    const raceRoom = this.races.get(raceId);
    if (!raceRoom) {
      console.log(`[WS Broadcast] No race room for race ${raceId}`);
      return;
    }

    const data = JSON.stringify(this.sanitizeMessageForClient(message));
    let sentCount = 0;
    raceRoom.clients.forEach(client => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(data);
        sentCount++;
      }
    });
    
    if (message.type === "countdown_start" || message.type === "countdown" || message.type === "race_start" || message.type === "race_finished") {
      console.log(`[WS Broadcast] Sent ${message.type} to ${sentCount}/${raceRoom.clients.size} clients in race ${raceId}`);
    }
  }

  private broadcastToRace(raceId: number, message: any) {
    void this.broadcastToRaceWithDistribution(raceId, message);
  }

  // Public method to broadcast messages to a race room by ID
  // Used by API endpoints like /api/races/leave
  broadcastToRaceById(raceId: number, message: any): void {
    this.broadcastToRace(raceId, message);
  }
  
  /**
   * Broadcast to race with cross-server distribution
   * Use this for important events that need to reach all servers
   */
  private async broadcastToRaceWithDistribution(raceId: number, message: any): Promise<void> {
    if (REDIS_ENABLED) {
      await broadcastToRaceDistributed(raceId, message, (id, msg) => this.broadcastToRaceLocal(id, msg));
    } else {
      this.broadcastToRaceLocal(raceId, message);
    }
  }
  
  /**
   * Handle race events received from other servers via Redis Pub/Sub
   * These events are forwarded to local clients connected to the same race
   */
  private handleDistributedRaceEvent(raceId: number, event: any): void {
    const raceRoom = this.races.get(raceId);
    if (!raceRoom) {
      // We don't have this race locally, ignore
      return;
    }
    
    // Forward the event to local clients
    // Remove the serverId as it's internal metadata
    const { serverId, ...eventData } = event;
    
    if (eventData.type === "countdown_start") {
      raceCache.updateRaceStatus(raceId, "countdown");
    } else if (eventData.type === "race_start") {
      const startedAt = eventData.serverTimestamp ? new Date(eventData.serverTimestamp) : undefined;
      raceCache.updateRaceStatus(raceId, "racing", startedAt);
    } else if (eventData.type === "race_finished") {
      raceCache.updateRaceStatus(raceId, "finished", undefined, new Date());
    } else if (eventData.type === "participant_joined" || eventData.type === "participants_sync") {
      if (Array.isArray(eventData.participants)) {
        const cached = raceCache.getRace(raceId);
        raceCache.updateParticipants(raceId, eventData.participants, cached?.race);
      }
    }
    
    const data = JSON.stringify(this.sanitizeMessageForClient(eventData));
    let sentCount = 0;
    
    raceRoom.clients.forEach(client => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(data);
        sentCount++;
      }
    });
    
    if (sentCount > 0) {
      console.log(`[WS Distributed] Forwarded ${eventData.type} from ${serverId} to ${sentCount} local clients in race ${raceId}`);
    }
  }

  getRaceRoom(raceId: number): RaceRoom | undefined {
    return this.races.get(raceId);
  }

  private computeServerStats(raceId: number, participantId: number, progress: number, errors: number): { wpm: number; accuracy: number; elapsedSeconds: number } {
    const raceRoom = this.races.get(raceId);
    const cachedRace = raceCache.getRace(raceId);
    const race = cachedRace?.race;
    const startTime = raceRoom?.raceStartTime || (race?.startedAt ? new Date(race.startedAt).getTime() : undefined);
    const elapsedSeconds = Math.max(1, startTime ? (Date.now() - startTime) / 1000 : 1);
    const safeErrors = Math.max(0, Math.min(errors, progress));
    const correctChars = Math.max(0, progress - safeErrors);
    const wpm = Math.round((correctChars / 5) / (elapsedSeconds / 60));
    const accuracy = progress > 0 ? Math.round((correctChars / progress) * 100 * 100) / 100 : 100;
    return { wpm, accuracy, elapsedSeconds };
  }

  private async getConnectedHumanCount(raceId: number, raceRoom?: RaceRoom): Promise<number> {
    if (REDIS_ENABLED) {
      try {
        const count = await redisClient.scard(REDIS_KEYS.raceConnections(raceId));
        return count;
      } catch {
        return raceRoom ? Array.from(raceRoom.clients.values()).filter(c => !c.isBot).length : 0;
      }
    }
    return raceRoom ? Array.from(raceRoom.clients.values()).filter(c => !c.isBot).length : 0;
  }

  private disqualifyParticipant(raceId: number, participantId: number, reason: string): void {
    this.antiCheatStatus.set(participantId, { disqualified: true, flagged: true, reason });
    void storage.updateParticipantFinishPosition(participantId, 999);
    void storage.finishParticipant(participantId);
    raceCache.finishParticipant(raceId, participantId, 999);
    this.broadcastToRace(raceId, {
      type: "participant_dnf",
      participantId,
      username: this.races.get(raceId)?.clients.get(participantId)?.username,
    });
  }

  private async acceptConnection(ws: WebSocket): Promise<boolean> {
    this.checkLoadState();

    if (this.stats.totalConnections >= MAX_CONNECTIONS) {
      this.loadState.connectionRejections++;
      ws.close(1013, "Server at capacity");
      console.warn(`[WS] Connection rejected: server at capacity (${this.stats.totalConnections}/${MAX_CONNECTIONS})`);
      return false;
    }

    // Phase 4 hardening: Reject connections with invalid/spoofed IPs
    const ip = (ws as any).clientIP || 'REJECT';
    if (ip === 'REJECT') {
      this.loadState.connectionRejections++;
      ws.close(1008, "Invalid connection source");
      console.warn(`[WS Security] Connection rejected: unable to determine client IP`);
      return false;
    }

    // Phase 4: Check IP-based connection limits
    // Use distributed check when Redis is enabled for cross-server coordination
    if (REDIS_ENABLED) {
      try {
        const distributedCheck = await wsRateLimiter.checkIPRateLimitDistributed(ip);
        if (!distributedCheck.allowed) {
          this.loadState.connectionRejections++;
          ws.send(JSON.stringify({
            type: "error",
            message: distributedCheck.reason || "Connection rejected",
            code: "IP_LIMIT_EXCEEDED"
          }));
          ws.close(1008, distributedCheck.reason || "Connection rejected");
          console.warn(`[WS] Distributed IP check rejected: ${distributedCheck.reason} (IP: ${ip})`);
          return false;
        }
      } catch (err) {
        console.error(`[WS] Distributed IP check failed:`, err);
      }
    }
    
    // Local IP check (always runs for immediate protection)
    const ipCheck = wsRateLimiter.checkIPConnection(ip, ws);
    if (!ipCheck.allowed) {
      this.loadState.connectionRejections++;
      ws.send(JSON.stringify({
        type: "error",
        message: ipCheck.reason || "Connection rejected",
        code: "IP_LIMIT_EXCEEDED"
      }));
      ws.close(1008, ipCheck.reason || "Connection rejected");
      console.warn(`[WS] Connection rejected: ${ipCheck.reason} (IP: ${ip})`);
      return false;
    }

    const loadFactor = this.stats.totalConnections / MAX_CONNECTIONS;
    if (loadFactor >= LOAD_SHEDDING_THRESHOLD) {
      this.loadState.isUnderPressure = true;
      
      if (Math.random() < (loadFactor - LOAD_SHEDDING_THRESHOLD) * 5) {
        this.loadState.connectionRejections++;
        ws.close(1013, "Server under heavy load");
        console.warn(`[WS] Connection shed: server under pressure (load: ${(loadFactor * 100).toFixed(1)}%)`);
        return false;
      }
    }

    return true;
  }

  private checkLoadState(): void {
    const now = Date.now();
    
    if (now - this.loadState.lastRecoveryCheck > DB_RECOVERY_INTERVAL_MS) {
      this.loadState.lastRecoveryCheck = now;
      
      if (this.loadState.dbFailures > 0) {
        this.loadState.dbFailures = Math.max(0, this.loadState.dbFailures - 1);
        console.log(`[WS] DB failure count recovered to ${this.loadState.dbFailures}`);
      }
    }

    const loadFactor = this.stats.totalConnections / MAX_CONNECTIONS;
    this.loadState.isUnderPressure = loadFactor >= LOAD_SHEDDING_THRESHOLD || 
                                      this.loadState.dbFailures >= DB_FAILURE_THRESHOLD;
  }

  private recordDbFailure(): void {
    this.loadState.dbFailures++;
    this.loadState.lastDbFailure = Date.now();
    
    if (this.loadState.dbFailures >= DB_FAILURE_THRESHOLD) {
      this.loadState.isUnderPressure = true;
      console.error(`[WS] DB failure threshold reached (${this.loadState.dbFailures}), entering degraded mode`);
    }
  }

  private recordDbSuccess(): void {
    if (this.loadState.dbFailures > 0) {
      this.loadState.dbFailures = Math.max(0, this.loadState.dbFailures - 1);
    }
  }

  isUnderPressure(): boolean {
    return this.loadState.isUnderPressure;
  }

  getStats(): ServerStats {
    this.updateStats();
    return { ...this.stats };
  }

  getCacheStats() {
    return raceCache.getStats();
  }

  getRateLimiterStats() {
    return wsRateLimiter.getStats();
  }

  getCleanupStats() {
    return raceCleanupScheduler.getStats();
  }

  getLoadState() {
    return { ...this.loadState };
  }
}

export const raceWebSocket = new RaceWebSocketServer();

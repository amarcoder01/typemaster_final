import type { WebSocket } from "ws";
import { getRedis, REDIS_ENABLED, REDIS_KEYS, REDIS_TTL } from "./redis-client";

interface RateLimitConfig {
  maxTokens: number;
  refillRate: number; // tokens per second
  refillInterval: number; // ms between refills
}

interface DistributedRateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter?: number;
}

interface ClientBucket {
  tokens: number;
  lastRefill: number;
  messageCount: number;
  lastReset: number;
  violations: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter?: number;
  violation?: boolean;
}

const MESSAGE_TYPE_LIMITS: Record<string, RateLimitConfig> = {
  progress: { maxTokens: 30, refillRate: 20, refillInterval: 50 }, // 20 per second max
  join: { maxTokens: 5, refillRate: 1, refillInterval: 1000 }, // 1 per second
  ready: { maxTokens: 3, refillRate: 1, refillInterval: 1000 },
  finish: { maxTokens: 3, refillRate: 1, refillInterval: 1000 },
  leave: { maxTokens: 3, refillRate: 1, refillInterval: 1000 },
  chat_message: { maxTokens: 20, refillRate: 2, refillInterval: 500 }, // 4 per second, burst of 20
  submit_keystrokes: { maxTokens: 2, refillRate: 1, refillInterval: 1000 }, // 1 per second, burst of 2
  // Host command rate limits - stricter to prevent abuse
  kick_player: { maxTokens: 3, refillRate: 1, refillInterval: 2000 }, // 1 kick per 2 seconds
  lock_room: { maxTokens: 2, refillRate: 1, refillInterval: 3000 }, // 1 lock toggle per 3 seconds
  ready_toggle: { maxTokens: 5, refillRate: 2, refillInterval: 1000 }, // 2 toggles per second
  rematch: { maxTokens: 2, refillRate: 1, refillInterval: 5000 }, // 1 rematch per 5 seconds
  spectate: { maxTokens: 3, refillRate: 1, refillInterval: 2000 }, // 1 spectate per 2 seconds
  stop_spectate: { maxTokens: 3, refillRate: 1, refillInterval: 1000 },
  keystroke_validation: { maxTokens: 10, refillRate: 5, refillInterval: 200 }, // 5 per second
  default: { maxTokens: 10, refillRate: 5, refillInterval: 200 },
};

const MAX_PAYLOAD_SIZE = 256 * 1024; // 256KB max payload
const MAX_VIOLATIONS = 10;
const VIOLATION_RESET_MS = 60 * 1000; // Reset violations after 1 minute
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // Clean up stale buckets every 5 minutes
const BUCKET_EXPIRE_MS = 10 * 60 * 1000; // Expire buckets after 10 minutes of inactivity

// Phase 4: IP-based rate limiting constants
const MAX_CONNECTIONS_PER_IP = 5;
const IP_BAN_THRESHOLD = 50; // Ban IP after this many violations
const IP_BAN_DURATION_MS = 15 * 60 * 1000; // 15-minute ban
const MAX_IP_ENTRIES = 10000; // Prevent unbounded growth

interface IPTracking {
  connections: Set<WebSocket>;
  violations: number;
  lastViolation: number;
  bannedUntil?: number;
}

interface GlobalRateLimitStats {
  totalMessages: number;
  droppedMessages: number;
  violations: number;
  activeConnections: number;
  ipBans: number;
  ipViolations: number;
}

class WebSocketRateLimiter {
  private buckets: Map<WebSocket, Map<string, ClientBucket>> = new Map();
  
  // Phase 4: IP-based tracking
  private ipTracking: Map<string, IPTracking> = new Map();
  private wsToIp: Map<WebSocket, string> = new Map();
  
  private globalStats: GlobalRateLimitStats = {
    totalMessages: 0,
    droppedMessages: 0,
    violations: 0,
    activeConnections: 0,
    ipBans: 0,
    ipViolations: 0,
  };
  private cleanupTimer: NodeJS.Timeout | null = null;

  initialize() {
    this.cleanupTimer = setInterval(() => {
      this.cleanupStaleBuckets();
      this.cleanupExpiredIPBans();
    }, CLEANUP_INTERVAL_MS);
    console.log("[WS RateLimiter] Initialized with IP-based limiting");
  }

  shutdown() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.ipTracking.clear();
    this.wsToIp.clear();
  }

  /**
   * Phase 4: Check if an IP can open a new connection
   * Returns false if IP is banned or has too many connections
   */
  checkIPConnection(ip: string, ws: WebSocket): { allowed: boolean; reason?: string } {
    const now = Date.now();
    
    // Check for bounded map size
    if (this.ipTracking.size >= MAX_IP_ENTRIES && !this.ipTracking.has(ip)) {
      // Evict oldest entry
      const oldestIp = this.findOldestIPEntry();
      if (oldestIp) {
        this.cleanupIPEntry(oldestIp);
      }
    }
    
    let tracking = this.ipTracking.get(ip);
    if (!tracking) {
      tracking = {
        connections: new Set(),
        violations: 0,
        lastViolation: 0,
      };
      this.ipTracking.set(ip, tracking);
    }
    
    // Check if IP is banned
    if (tracking.bannedUntil && tracking.bannedUntil > now) {
      const remainingSeconds = Math.ceil((tracking.bannedUntil - now) / 1000);
      return { 
        allowed: false, 
        reason: `IP temporarily banned. Try again in ${remainingSeconds} seconds.`
      };
    }
    
    // Reset ban if expired
    if (tracking.bannedUntil && tracking.bannedUntil <= now) {
      tracking.bannedUntil = undefined;
      tracking.violations = 0;
    }
    
    // Check connection limit
    if (tracking.connections.size >= MAX_CONNECTIONS_PER_IP) {
      this.recordIPViolation(ip);
      return { 
        allowed: false, 
        reason: `Too many connections from this IP (max: ${MAX_CONNECTIONS_PER_IP})`
      };
    }
    
    // Register connection
    tracking.connections.add(ws);
    this.wsToIp.set(ws, ip);
    
    return { allowed: true };
  }

  /**
   * Phase 4: Record an IP violation and potentially ban
   */
  private recordIPViolation(ip: string): void {
    const tracking = this.ipTracking.get(ip);
    if (!tracking) return;
    
    tracking.violations++;
    tracking.lastViolation = Date.now();
    this.globalStats.ipViolations++;
    
    if (tracking.violations >= IP_BAN_THRESHOLD) {
      tracking.bannedUntil = Date.now() + IP_BAN_DURATION_MS;
      this.globalStats.ipBans++;
      console.warn(`[WS RateLimiter] IP ${ip} banned for ${IP_BAN_DURATION_MS / 1000}s (${tracking.violations} violations)`);
    }
  }

  /**
   * Phase 4: Aggregate rate limit check across all connections from same IP
   */
  checkIPRateLimit(ip: string, messageType: string): boolean {
    const tracking = this.ipTracking.get(ip);
    if (!tracking) return true;
    
    // Count messages from all connections from this IP
    let totalMessages = 0;
    for (const ws of tracking.connections) {
      const clientBuckets = this.buckets.get(ws);
      if (clientBuckets) {
        const bucket = clientBuckets.get(messageType);
        if (bucket) {
          totalMessages += bucket.messageCount;
        }
      }
    }
    
    // Allow up to MAX_CONNECTIONS_PER_IP times the normal limit
    const config = MESSAGE_TYPE_LIMITS[messageType] || MESSAGE_TYPE_LIMITS.default;
    const maxAggregateMessages = config.maxTokens * MAX_CONNECTIONS_PER_IP * 2;
    
    if (totalMessages > maxAggregateMessages) {
      this.recordIPViolation(ip);
      return false;
    }
    
    return true;
  }

  /**
   * Phase 4: Clean up IP entry when all connections closed
   */
  private cleanupIPEntry(ip: string): void {
    const tracking = this.ipTracking.get(ip);
    if (tracking) {
      for (const ws of tracking.connections) {
        this.wsToIp.delete(ws);
      }
      this.ipTracking.delete(ip);
    }
  }

  private findOldestIPEntry(): string | null {
    let oldest: { ip: string; time: number } | null = null;
    
    for (const [ip, tracking] of this.ipTracking.entries()) {
      if (tracking.connections.size === 0) {
        const time = tracking.lastViolation || 0;
        if (!oldest || time < oldest.time) {
          oldest = { ip, time };
        }
      }
    }
    
    return oldest?.ip || null;
  }

  private cleanupExpiredIPBans(): void {
    const now = Date.now();
    const toClean: string[] = [];
    
    for (const [ip, tracking] of this.ipTracking.entries()) {
      // Clean up IPs with no connections and no active ban
      if (tracking.connections.size === 0) {
        if (!tracking.bannedUntil || tracking.bannedUntil <= now) {
          // If last violation was over an hour ago, clean up
          if (now - tracking.lastViolation > 60 * 60 * 1000) {
            toClean.push(ip);
          }
        }
      }
    }
    
    for (const ip of toClean) {
      this.ipTracking.delete(ip);
    }
    
    if (toClean.length > 0) {
      console.log(`[WS RateLimiter] Cleaned ${toClean.length} expired IP entries`);
    }
  }

  validatePayload(data: string): { valid: boolean; error?: string } {
    const size = Buffer.byteLength(data, 'utf8');
    if (size > MAX_PAYLOAD_SIZE) {
      return { valid: false, error: `Payload too large: ${size} bytes (max: ${MAX_PAYLOAD_SIZE})` };
    }

    try {
      const parsed = JSON.parse(data);
      if (!parsed || typeof parsed !== 'object') {
        return { valid: false, error: "Invalid message format: must be JSON object" };
      }
      if (!parsed.type || typeof parsed.type !== 'string') {
        return { valid: false, error: "Invalid message format: missing or invalid 'type' field" };
      }
      if (parsed.type.length > 50) {
        return { valid: false, error: "Invalid message type: too long" };
      }
      return { valid: true };
    } catch {
      return { valid: false, error: "Invalid JSON" };
    }
  }

  checkLimit(ws: WebSocket, messageType: string): RateLimitResult {
    this.globalStats.totalMessages++;

    if (!this.buckets.has(ws)) {
      this.buckets.set(ws, new Map());
      this.globalStats.activeConnections = this.buckets.size;
    }

    const clientBuckets = this.buckets.get(ws)!;
    const config = MESSAGE_TYPE_LIMITS[messageType] || MESSAGE_TYPE_LIMITS.default;

    if (!clientBuckets.has(messageType)) {
      clientBuckets.set(messageType, {
        tokens: config.maxTokens,
        lastRefill: Date.now(),
        messageCount: 0,
        lastReset: Date.now(),
        violations: 0,
      });
    }

    const bucket = clientBuckets.get(messageType)!;
    const now = Date.now();

    if (now - bucket.lastReset > VIOLATION_RESET_MS) {
      bucket.violations = 0;
      bucket.lastReset = now;
    }

    const timePassed = now - bucket.lastRefill;
    const tokensToAdd = Math.floor((timePassed / config.refillInterval) * config.refillRate);
    
    if (tokensToAdd > 0) {
      bucket.tokens = Math.min(config.maxTokens, bucket.tokens + tokensToAdd);
      bucket.lastRefill = now;
    }

    if (bucket.tokens < 1) {
      bucket.violations++;
      this.globalStats.droppedMessages++;
      
      if (bucket.violations >= MAX_VIOLATIONS) {
        this.globalStats.violations++;
        return {
          allowed: false,
          remaining: 0,
          retryAfter: Math.ceil(config.refillInterval / 1000),
          violation: true,
        };
      }

      return {
        allowed: false,
        remaining: 0,
        retryAfter: Math.ceil(config.refillInterval / 1000),
      };
    }

    bucket.tokens--;
    bucket.messageCount++;

    return {
      allowed: true,
      remaining: Math.floor(bucket.tokens),
    };
  }

  removeClient(ws: WebSocket): void {
    this.buckets.delete(ws);
    this.globalStats.activeConnections = this.buckets.size;
    
    // Phase 4: Clean up IP tracking
    const ip = this.wsToIp.get(ws);
    if (ip) {
      const tracking = this.ipTracking.get(ip);
      if (tracking) {
        tracking.connections.delete(ws);
      }
      this.wsToIp.delete(ws);
    }
  }

  /**
   * Phase 4: Get IP for a WebSocket connection
   */
  getIPForConnection(ws: WebSocket): string | undefined {
    return this.wsToIp.get(ws);
  }

  private cleanupStaleBuckets(): void {
    const now = Date.now();
    let cleaned = 0;

    const bucketEntries = Array.from(this.buckets.entries());
    for (const [ws, clientBuckets] of bucketEntries) {
      let allStale = true;
      const bucketValues = Array.from(clientBuckets.values());
      for (const bucket of bucketValues) {
        if (now - bucket.lastRefill < BUCKET_EXPIRE_MS) {
          allStale = false;
          break;
        }
      }
      if (allStale) {
        this.buckets.delete(ws);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[WS RateLimiter] Cleaned ${cleaned} stale client buckets`);
      this.globalStats.activeConnections = this.buckets.size;
    }
  }

  getStats() {
    return { ...this.globalStats };
  }

  getClientStats(ws: WebSocket): Record<string, { remaining: number; messageCount: number }> {
    const clientBuckets = this.buckets.get(ws);
    if (!clientBuckets) return {};

    const stats: Record<string, { remaining: number; messageCount: number }> = {};
    const clientBucketEntries = Array.from(clientBuckets.entries());
    for (const [type, bucket] of clientBucketEntries) {
      stats[type] = {
        remaining: Math.floor(bucket.tokens),
        messageCount: bucket.messageCount,
      };
    }
    return stats;
  }

  // ==================== Distributed Rate Limiting (Phase 7) ====================

  /**
   * Check rate limit using Redis for distributed rate limiting
   * Uses sliding window counter algorithm
   */
  async checkLimitDistributed(
    identityKey: string,
    messageType: string
  ): Promise<DistributedRateLimitResult> {
    if (!REDIS_ENABLED) {
      // Fall back to local rate limiting if Redis is disabled
      return { allowed: true, remaining: 10 };
    }

    const config = MESSAGE_TYPE_LIMITS[messageType] || MESSAGE_TYPE_LIMITS.default;
    const redis = getRedis();
    const key = REDIS_KEYS.rateLimit(identityKey, messageType);
    
    try {
      const now = Date.now();
      const windowStart = now - config.refillInterval;
      const script = `
        local key = KEYS[1]
        local now = tonumber(ARGV[1])
        local windowStart = tonumber(ARGV[2])
        local maxTokens = tonumber(ARGV[3])
        local ttlMs = tonumber(ARGV[4])
        redis.call('ZREMRANGEBYSCORE', key, '-inf', windowStart)
        local count = redis.call('ZCARD', key)
        if count >= maxTokens then
          redis.call('PEXPIRE', key, ttlMs)
          return {0, count}
        end
        redis.call('ZADD', key, now, tostring(now) .. '-' .. tostring(math.random()))
        redis.call('PEXPIRE', key, ttlMs)
        return {1, count}
      `;
      const result = await redis.eval(script, 1, key, now.toString(), windowStart.toString(), config.maxTokens.toString(), (config.refillInterval * 2).toString()) as [number, number];
      const allowed = result[0] === 1;
      const count = result[1] || 0;
      if (!allowed) {
        this.globalStats.droppedMessages++;
        return {
          allowed: false,
          remaining: 0,
          retryAfter: Math.ceil(config.refillInterval / 1000),
        };
      }
      return {
        allowed: true,
        remaining: Math.max(0, config.maxTokens - count - 1),
      };
    } catch (error) {
      console.error('[WS RateLimiter] Redis error:', error);
      return { allowed: true, remaining: config.maxTokens, retryAfter: Math.ceil(config.refillInterval / 1000) };
    }
  }

  /**
   * Check IP rate limit using Redis for distributed enforcement
   */
  async checkIPRateLimitDistributed(ip: string): Promise<{ allowed: boolean; reason?: string }> {
    if (!REDIS_ENABLED) {
      return { allowed: true };
    }

    const redis = getRedis();
    
    try {
      const banKey = REDIS_KEYS.ipBan(ip);
      const ipKey = REDIS_KEYS.ipRateLimit(ip);
      const now = Date.now();
      const windowStart = now - 60000;
      const limit = MAX_CONNECTIONS_PER_IP * 10;
      const script = `
        local banKey = KEYS[1]
        local ipKey = KEYS[2]
        local now = tonumber(ARGV[1])
        local windowStart = tonumber(ARGV[2])
        local limit = tonumber(ARGV[3])
        local banTtl = tonumber(ARGV[4])
        if redis.call('EXISTS', banKey) == 1 then
          return {0, redis.call('TTL', banKey)}
        end
        redis.call('ZREMRANGEBYSCORE', ipKey, '-inf', windowStart)
        local count = redis.call('ZCARD', ipKey)
        if count >= limit then
          redis.call('SET', banKey, tostring(now), 'EX', banTtl)
          return {0, banTtl}
        end
        redis.call('ZADD', ipKey, now, tostring(now) .. '-' .. tostring(math.random()))
        redis.call('EXPIRE', ipKey, 120)
        return {1, count}
      `;
      const result = await redis.eval(script, 2, banKey, ipKey, now.toString(), windowStart.toString(), limit.toString(), REDIS_TTL.ipBan.toString()) as [number, number];
      if (result[0] === 1) {
        return { allowed: true };
      }
      const ttl = result[1] || REDIS_TTL.ipBan;
      return { allowed: false, reason: `IP temporarily banned. Try again in ${ttl} seconds.` };
    } catch (error) {
      console.error('[WS RateLimiter] Redis IP check error:', error);
      return { allowed: true, reason: "Rate limit service unavailable" };
    }
  }

  /**
   * Ban an IP address in distributed cache
   */
  async banIPDistributed(ip: string): Promise<void> {
    if (!REDIS_ENABLED) return;

    const redis = getRedis();
    
    try {
      const banKey = REDIS_KEYS.ipBan(ip);
      await redis.set(banKey, Date.now().toString(), 'EX', REDIS_TTL.ipBan);
      this.globalStats.ipBans++;
      console.warn(`[WS RateLimiter] IP ${ip} banned (distributed)`);
    } catch (error) {
      console.error('[WS RateLimiter] Redis ban error:', error);
    }
  }

  /**
   * Record a violation for an identity across all servers
   */
  async recordViolationDistributed(identityKey: string): Promise<number> {
    if (!REDIS_ENABLED) return 0;

    const redis = getRedis();
    const key = `violations:${identityKey}`;
    
    try {
      const count = await redis.incr(key);
      await redis.expire(key, 3600); // 1 hour TTL
      
      if (count >= MAX_VIOLATIONS * 3) {
        // Consider banning based on identity if violations are too high
        console.warn(`[WS RateLimiter] High violation count for ${identityKey}: ${count}`);
      }
      
      return count;
    } catch (error) {
      console.error('[WS RateLimiter] Redis violation record error:', error);
      return 0;
    }
  }

  /**
   * Get distributed stats for monitoring
   */
  async getDistributedStats(): Promise<{
    totalBannedIPs: number;
    localStats: GlobalRateLimitStats;
  }> {
    if (!REDIS_ENABLED) {
      return {
        totalBannedIPs: 0,
        localStats: this.globalStats,
      };
    }

    const redis = getRedis();
    
    try {
      // Count banned IPs (keys matching ban:ip:*)
      const keys = await redis.keys('ban:ip:*');
      return {
        totalBannedIPs: keys.length,
        localStats: this.globalStats,
      };
    } catch {
      return {
        totalBannedIPs: 0,
        localStats: this.globalStats,
      };
    }
  }
}

export const wsRateLimiter = new WebSocketRateLimiter();

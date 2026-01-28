/**
 * Leaderboard WebSocket Durable Object
 * 
 * Handles real-time leaderboard updates on Cloudflare's edge.
 * Provides:
 * - WebSocket connections for live leaderboard updates
 * - Subscription-based update delivery
 * - Tiered update frequency based on client activity
 * - Efficient broadcast to interested clients
 */

/// <reference types="@cloudflare/workers-types" />

import type { Env } from "../cloudflare-worker";

interface LeaderboardSubscription {
  mode: string;
  language: string;
  timeframe: string;
}

interface WebSocketSession {
  webSocket: WebSocket;
  subscriptions: LeaderboardSubscription[];
  tier: "active" | "passive" | "observer";
  lastActivity: number;
}

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatarColor: string;
  score: number;
  wpm: number;
  accuracy: number;
}

export class LeaderboardWebSocket implements DurableObject {
  private state: DurableObjectState;
  private env: Env;
  private sessions: Map<string, WebSocketSession> = new Map();
  private sessionCounter = 0;
  private cachedLeaderboards: Map<string, LeaderboardEntry[]> = new Map();

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  /**
   * Handle incoming fetch requests (including WebSocket upgrades)
   */
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    // WebSocket upgrade request
    if (request.headers.get("Upgrade") === "websocket") {
      return this.handleWebSocketUpgrade(request, url);
    }
    
    // HTTP API for pushing updates (internal use)
    if (request.method === "POST" && url.pathname.endsWith("/broadcast")) {
      return this.handleBroadcast(request);
    }
    
    // Get connection stats
    if (request.method === "GET" && url.pathname.endsWith("/stats")) {
      return this.getStats();
    }
    
    return new Response("Not found", { status: 404 });
  }

  /**
   * Handle WebSocket upgrade
   */
  private handleWebSocketUpgrade(request: Request, url: URL): Response {
    const sessionId = `session-${++this.sessionCounter}-${Date.now()}`;
    
    // Create WebSocket pair
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    
    // Accept the WebSocket connection with hibernation
    this.state.acceptWebSocket(server, [sessionId]);
    
    // Store session
    this.sessions.set(sessionId, {
      webSocket: server,
      subscriptions: [],
      tier: "active",
      lastActivity: Date.now()
    });
    
    // Send welcome message
    this.sendToSocket(server, {
      type: "connected",
      sessionId,
      message: "Connected to leaderboard updates"
    });
    
    return new Response(null, {
      status: 101,
      webSocket: client
    });
  }

  /**
   * Handle WebSocket messages
   */
  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    try {
      const data = typeof message === "string" 
        ? JSON.parse(message) 
        : JSON.parse(new TextDecoder().decode(message));
      
      const tags = this.state.getTags(ws);
      const sessionId = tags[0];
      
      if (!sessionId) return;
      
      const session = this.sessions.get(sessionId);
      if (!session) return;
      
      // Update activity
      session.lastActivity = Date.now();
      session.tier = "active";
      
      switch (data.type) {
        case "subscribe":
          this.handleSubscribe(sessionId, data);
          break;
        case "unsubscribe":
          this.handleUnsubscribe(sessionId, data);
          break;
        case "ping":
          this.sendToSocket(ws, { type: "pong", timestamp: Date.now() });
          break;
        case "get_leaderboard":
          await this.handleGetLeaderboard(sessionId, data);
          break;
      }
    } catch (error) {
      console.error("Error handling WebSocket message:", error);
    }
  }

  /**
   * Handle WebSocket close
   */
  async webSocketClose(ws: WebSocket, code: number, reason: string): Promise<void> {
    const tags = this.state.getTags(ws);
    const sessionId = tags[0];
    
    if (sessionId) {
      this.sessions.delete(sessionId);
    }
  }

  /**
   * Handle WebSocket error
   */
  async webSocketError(ws: WebSocket, error: unknown): Promise<void> {
    console.error("WebSocket error:", error);
  }

  /**
   * Handle subscription request
   */
  private handleSubscribe(sessionId: string, data: any): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    
    const subscription: LeaderboardSubscription = {
      mode: data.mode || "standard",
      language: data.language || "en",
      timeframe: data.timeframe || "all"
    };
    
    // Check if already subscribed
    const exists = session.subscriptions.some(
      s => s.mode === subscription.mode && 
           s.language === subscription.language && 
           s.timeframe === subscription.timeframe
    );
    
    if (!exists) {
      session.subscriptions.push(subscription);
    }
    
    this.sendToSocket(session.webSocket, {
      type: "subscribed",
      subscription
    });
    
    // Send current cached data if available
    const key = this.getLeaderboardKey(subscription);
    const cached = this.cachedLeaderboards.get(key);
    if (cached) {
      this.sendToSocket(session.webSocket, {
        type: "leaderboard_update",
        ...subscription,
        entries: cached
      });
    }
  }

  /**
   * Handle unsubscribe request
   */
  private handleUnsubscribe(sessionId: string, data: any): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    
    session.subscriptions = session.subscriptions.filter(
      s => !(s.mode === data.mode && 
             s.language === data.language && 
             s.timeframe === data.timeframe)
    );
    
    this.sendToSocket(session.webSocket, {
      type: "unsubscribed",
      mode: data.mode,
      language: data.language,
      timeframe: data.timeframe
    });
  }

  /**
   * Handle get leaderboard request
   */
  private async handleGetLeaderboard(sessionId: string, data: any): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    
    // In production, fetch from database via API
    // For now, return cached or empty
    const key = this.getLeaderboardKey({
      mode: data.mode || "standard",
      language: data.language || "en",
      timeframe: data.timeframe || "all"
    });
    
    const entries = this.cachedLeaderboards.get(key) || [];
    
    this.sendToSocket(session.webSocket, {
      type: "leaderboard_data",
      mode: data.mode,
      language: data.language,
      timeframe: data.timeframe,
      entries
    });
  }

  /**
   * Handle broadcast from API (internal)
   */
  private async handleBroadcast(request: Request): Promise<Response> {
    try {
      const data = await request.json() as {
        mode: string;
        language: string;
        timeframe: string;
        entries: LeaderboardEntry[];
      };
      
      // Update cache
      const key = this.getLeaderboardKey(data);
      this.cachedLeaderboards.set(key, data.entries);
      
      // Broadcast to subscribed clients
      let sentCount = 0;
      
      for (const [sessionId, session] of this.sessions) {
        const isSubscribed = session.subscriptions.some(
          s => s.mode === data.mode && 
               s.language === data.language && 
               s.timeframe === data.timeframe
        );
        
        if (isSubscribed) {
          // Apply tier-based throttling
          if (this.shouldSendUpdate(session)) {
            this.sendToSocket(session.webSocket, {
              type: "leaderboard_update",
              mode: data.mode,
              language: data.language,
              timeframe: data.timeframe,
              entries: data.entries
            });
            sentCount++;
          }
        }
      }
      
      return new Response(JSON.stringify({ 
        success: true, 
        sentTo: sentCount 
      }), {
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      return new Response("Invalid request", { status: 400 });
    }
  }

  /**
   * Get connection statistics
   */
  private getStats(): Response {
    const stats = {
      totalConnections: this.sessions.size,
      byTier: {
        active: 0,
        passive: 0,
        observer: 0
      },
      totalSubscriptions: 0,
      cachedLeaderboards: this.cachedLeaderboards.size
    };
    
    for (const session of this.sessions.values()) {
      stats.byTier[session.tier]++;
      stats.totalSubscriptions += session.subscriptions.length;
    }
    
    return new Response(JSON.stringify(stats), {
      headers: { "Content-Type": "application/json" }
    });
  }

  /**
   * Determine if update should be sent based on tier
   */
  private shouldSendUpdate(session: WebSocketSession): boolean {
    const now = Date.now();
    const timeSinceActivity = now - session.lastActivity;
    
    // Update tier based on activity
    if (timeSinceActivity > 60000) {
      session.tier = "observer";
    } else if (timeSinceActivity > 10000) {
      session.tier = "passive";
    }
    
    // Active clients get all updates
    if (session.tier === "active") return true;
    
    // Passive clients get updates every 10 seconds
    if (session.tier === "passive") {
      return Math.random() < 0.1; // ~10% of updates
    }
    
    // Observer clients get updates every 30 seconds
    return Math.random() < 0.03; // ~3% of updates
  }

  /**
   * Generate leaderboard cache key
   */
  private getLeaderboardKey(sub: LeaderboardSubscription): string {
    return `${sub.mode}:${sub.language}:${sub.timeframe}`;
  }

  /**
   * Send message to specific socket
   */
  private sendToSocket(ws: WebSocket, message: object): void {
    try {
      ws.send(JSON.stringify(message));
    } catch (e) {
      // Socket may be closed
    }
  }

  /**
   * Handle alarm for periodic cleanup
   */
  async alarm(): Promise<void> {
    // Clean up inactive sessions
    const now = Date.now();
    const timeout = 5 * 60 * 1000; // 5 minutes
    
    for (const [sessionId, session] of this.sessions) {
      if (now - session.lastActivity > timeout) {
        try {
          session.webSocket.close(1000, "Inactive");
        } catch (e) {
          // Already closed
        }
        this.sessions.delete(sessionId);
      }
    }
    
    // Schedule next cleanup
    if (this.sessions.size > 0) {
      await this.state.storage.setAlarm(Date.now() + 60000);
    }
  }
}

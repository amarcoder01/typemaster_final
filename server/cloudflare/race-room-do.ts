/**
 * Race Room Durable Object
 * 
 * Handles real-time multiplayer typing race sessions on Cloudflare's edge.
 * Each race gets its own Durable Object instance, providing:
 * - Consistent state across all participants
 * - WebSocket connection management
 * - Real-time game state synchronization
 * - Automatic cleanup when race ends
 */

import type { Env } from "../cloudflare-worker";

interface RaceParticipant {
  participantId: number;
  username: string;
  avatarColor: string;
  progress: number;
  wpm: number;
  accuracy: number;
  isReady: boolean;
  isFinished: boolean;
  finishTime?: number;
  position?: number;
}

interface RaceState {
  raceId: string;
  status: "waiting" | "countdown" | "racing" | "finished";
  text: string;
  duration: number;
  startTime?: number;
  participants: Map<string, RaceParticipant>;
  hostParticipantId?: number;
}

interface WebSocketSession {
  webSocket: WebSocket;
  participantId: number;
  username: string;
  lastActivity: number;
}

export class RaceRoom implements DurableObject {
  private state: DurableObjectState;
  private env: Env;
  private sessions: Map<string, WebSocketSession> = new Map();
  private raceState: RaceState | null = null;
  private countdownTimer: number | null = null;
  private raceTimer: number | null = null;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
    
    // Restore state from storage
    this.state.blockConcurrencyWhile(async () => {
      const stored = await this.state.storage.get<RaceState>("raceState");
      if (stored) {
        this.raceState = {
          ...stored,
          participants: new Map(Object.entries(stored.participants || {}))
        };
      }
    });
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
    
    // HTTP API endpoints for the race
    if (request.method === "GET" && url.pathname.endsWith("/state")) {
      return this.getRaceState();
    }
    
    if (request.method === "POST" && url.pathname.endsWith("/start")) {
      return this.startRace(request);
    }
    
    return new Response("Not found", { status: 404 });
  }

  /**
   * Handle WebSocket upgrade
   */
  private handleWebSocketUpgrade(request: Request, url: URL): Response {
    const params = url.searchParams;
    const participantId = parseInt(params.get("participantId") || "0");
    const username = params.get("username") || "Guest";
    
    if (!participantId) {
      return new Response("Missing participantId", { status: 400 });
    }
    
    // Create WebSocket pair
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    
    // Accept the WebSocket connection
    this.state.acceptWebSocket(server, [participantId.toString()]);
    
    // Store session
    this.sessions.set(participantId.toString(), {
      webSocket: server,
      participantId,
      username,
      lastActivity: Date.now()
    });
    
    // Add participant to race state
    this.addParticipant(participantId, username);
    
    // Send current state to new participant
    this.sendToSocket(server, {
      type: "race_state",
      data: this.getStateForClient()
    });
    
    // Broadcast join to others
    this.broadcast({
      type: "player_joined",
      data: { participantId, username }
    }, participantId.toString());
    
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
      const participantId = tags[0];
      
      if (!participantId) return;
      
      // Update last activity
      const session = this.sessions.get(participantId);
      if (session) {
        session.lastActivity = Date.now();
      }
      
      switch (data.type) {
        case "ready":
          await this.handleReady(participantId);
          break;
        case "progress":
          await this.handleProgress(participantId, data);
          break;
        case "finish":
          await this.handleFinish(participantId, data);
          break;
        case "chat":
          await this.handleChat(participantId, data);
          break;
        case "ping":
          this.sendToSocket(ws, { type: "pong", timestamp: Date.now() });
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
    const participantId = tags[0];
    
    if (participantId) {
      this.sessions.delete(participantId);
      
      // Broadcast leave
      this.broadcast({
        type: "player_left",
        data: { participantId: parseInt(participantId) }
      });
      
      // Clean up if no participants left
      if (this.sessions.size === 0) {
        await this.cleanup();
      }
    }
  }

  /**
   * Handle WebSocket error
   */
  async webSocketError(ws: WebSocket, error: unknown): Promise<void> {
    console.error("WebSocket error:", error);
  }

  /**
   * Add participant to race
   */
  private addParticipant(participantId: number, username: string): void {
    if (!this.raceState) {
      this.raceState = {
        raceId: this.state.id.toString(),
        status: "waiting",
        text: "",
        duration: 60,
        participants: new Map()
      };
    }
    
    this.raceState.participants.set(participantId.toString(), {
      participantId,
      username,
      avatarColor: "bg-primary",
      progress: 0,
      wpm: 0,
      accuracy: 100,
      isReady: false,
      isFinished: false
    });
    
    // Set host if first participant
    if (!this.raceState.hostParticipantId) {
      this.raceState.hostParticipantId = participantId;
    }
    
    this.saveState();
  }

  /**
   * Handle ready state change
   */
  private async handleReady(participantId: string): Promise<void> {
    if (!this.raceState) return;
    
    const participant = this.raceState.participants.get(participantId);
    if (participant) {
      participant.isReady = true;
      
      this.broadcast({
        type: "player_ready",
        data: { participantId: parseInt(participantId) }
      });
      
      // Check if all ready
      const allReady = Array.from(this.raceState.participants.values())
        .every(p => p.isReady);
      
      if (allReady && this.raceState.participants.size >= 2) {
        await this.startCountdown();
      }
      
      this.saveState();
    }
  }

  /**
   * Handle progress update
   */
  private async handleProgress(participantId: string, data: any): Promise<void> {
    if (!this.raceState || this.raceState.status !== "racing") return;
    
    const participant = this.raceState.participants.get(participantId);
    if (participant) {
      participant.progress = data.progress || 0;
      participant.wpm = data.wpm || 0;
      participant.accuracy = data.accuracy || 100;
      
      this.broadcast({
        type: "progress_update",
        data: {
          participantId: parseInt(participantId),
          progress: participant.progress,
          wpm: participant.wpm,
          accuracy: participant.accuracy
        }
      });
    }
  }

  /**
   * Handle race finish
   */
  private async handleFinish(participantId: string, data: any): Promise<void> {
    if (!this.raceState) return;
    
    const participant = this.raceState.participants.get(participantId);
    if (participant && !participant.isFinished) {
      participant.isFinished = true;
      participant.finishTime = Date.now();
      participant.progress = 100;
      participant.wpm = data.wpm || 0;
      participant.accuracy = data.accuracy || 100;
      
      // Calculate position
      const finishedCount = Array.from(this.raceState.participants.values())
        .filter(p => p.isFinished).length;
      participant.position = finishedCount;
      
      this.broadcast({
        type: "player_finished",
        data: {
          participantId: parseInt(participantId),
          position: participant.position,
          wpm: participant.wpm,
          accuracy: participant.accuracy
        }
      });
      
      // Check if all finished
      const allFinished = Array.from(this.raceState.participants.values())
        .every(p => p.isFinished);
      
      if (allFinished) {
        await this.endRace();
      }
      
      this.saveState();
    }
  }

  /**
   * Handle chat message
   */
  private async handleChat(participantId: string, data: any): Promise<void> {
    const session = this.sessions.get(participantId);
    if (!session || !data.message) return;
    
    this.broadcast({
      type: "chat",
      data: {
        participantId: parseInt(participantId),
        username: session.username,
        message: data.message.slice(0, 200), // Limit message length
        timestamp: Date.now()
      }
    });
  }

  /**
   * Start countdown
   */
  private async startCountdown(): Promise<void> {
    if (!this.raceState) return;
    
    this.raceState.status = "countdown";
    
    this.broadcast({
      type: "countdown_start",
      data: { seconds: 3 }
    });
    
    // Schedule race start
    await this.state.storage.setAlarm(Date.now() + 3000);
    
    this.saveState();
  }

  /**
   * Handle alarm (countdown complete)
   */
  async alarm(): Promise<void> {
    if (this.raceState?.status === "countdown") {
      this.raceState.status = "racing";
      this.raceState.startTime = Date.now();
      
      this.broadcast({
        type: "race_start",
        data: {
          startTime: this.raceState.startTime,
          duration: this.raceState.duration
        }
      });
      
      // Schedule race end
      await this.state.storage.setAlarm(
        Date.now() + this.raceState.duration * 1000
      );
      
      this.saveState();
    } else if (this.raceState?.status === "racing") {
      // Time's up
      await this.endRace();
    }
  }

  /**
   * End the race
   */
  private async endRace(): Promise<void> {
    if (!this.raceState) return;
    
    this.raceState.status = "finished";
    
    // Calculate final standings
    const results = Array.from(this.raceState.participants.values())
      .sort((a, b) => {
        if (a.isFinished && !b.isFinished) return -1;
        if (!a.isFinished && b.isFinished) return 1;
        return (b.progress - a.progress) || (b.wpm - a.wpm);
      })
      .map((p, i) => ({ ...p, position: i + 1 }));
    
    this.broadcast({
      type: "race_end",
      data: { results }
    });
    
    this.saveState();
    
    // Schedule cleanup
    await this.state.storage.setAlarm(Date.now() + 60000);
  }

  /**
   * Get race state for API
   */
  private getRaceState(): Response {
    return new Response(JSON.stringify(this.getStateForClient()), {
      headers: { "Content-Type": "application/json" }
    });
  }

  /**
   * Start race via API
   */
  private async startRace(request: Request): Promise<Response> {
    try {
      const body = await request.json() as { text: string; duration?: number };
      
      if (!this.raceState) {
        return new Response("Race not initialized", { status: 400 });
      }
      
      this.raceState.text = body.text;
      this.raceState.duration = body.duration || 60;
      
      await this.startCountdown();
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      return new Response("Invalid request", { status: 400 });
    }
  }

  /**
   * Get state for client
   */
  private getStateForClient(): object {
    if (!this.raceState) {
      return { status: "not_found" };
    }
    
    return {
      raceId: this.raceState.raceId,
      status: this.raceState.status,
      text: this.raceState.text,
      duration: this.raceState.duration,
      startTime: this.raceState.startTime,
      hostParticipantId: this.raceState.hostParticipantId,
      participants: Array.from(this.raceState.participants.values())
    };
  }

  /**
   * Broadcast message to all connected clients
   */
  private broadcast(message: object, excludeId?: string): void {
    const data = JSON.stringify(message);
    
    for (const [id, session] of this.sessions) {
      if (id !== excludeId) {
        try {
          session.webSocket.send(data);
        } catch (e) {
          // Socket may be closed
        }
      }
    }
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
   * Save state to storage
   */
  private saveState(): void {
    if (this.raceState) {
      this.state.storage.put("raceState", {
        ...this.raceState,
        participants: Object.fromEntries(this.raceState.participants)
      });
    }
  }

  /**
   * Clean up race resources
   */
  private async cleanup(): Promise<void> {
    await this.state.storage.deleteAll();
    this.raceState = null;
    this.sessions.clear();
  }
}

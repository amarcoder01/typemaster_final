/**
 * Cloudflare Worker Entry Point
 * 
 * This file serves as the main entry point for Cloudflare Workers deployment.
 * It adapts the Express.js application to run on Cloudflare's edge network.
 * 
 * Key Features:
 * - Express.js compatibility via nodejs_compat
 * - Static asset serving via Workers Assets
 * - Neon PostgreSQL database connection
 * - Durable Objects for WebSocket handling
 * - KV for session storage and caching
 * - R2 for file uploads
 * - Queues for background job processing
 */

/// <reference types="@cloudflare/workers-types" />

import { app } from "./app";

// Cloudflare Worker Environment Types
export interface Env {
  // KV Namespaces (optional - will be auto-provisioned if not specified)
  SESSIONS?: KVNamespace;
  CACHE?: KVNamespace;
  
  // R2 Buckets (optional - will be auto-provisioned if not specified)
  UPLOADS?: R2Bucket;
  
  // Durable Objects
  RACE_ROOMS: DurableObjectNamespace;
  LEADERBOARD_WS: DurableObjectNamespace;
  
  // Queues
  LEADERBOARD_QUEUE: Queue;
  ACHIEVEMENT_QUEUE: Queue;
  
  // Static Assets
  ASSETS: Fetcher;
  
  // Environment Variables
  DATABASE_URL: string;
  OPENAI_API_KEY: string;
  AI_INTEGRATIONS_OPENAI_API_KEY: string;
  BING_GROUNDING_KEY: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  MAILGUN_API_KEY: string;
  MAILGUN_DOMAIN: string;
  MAILGUN_FROM_EMAIL: string;
  SESSION_SECRET: string;
  VAPID_PUBLIC_KEY: string;
  VAPID_PRIVATE_KEY: string;
  APP_URL: string;
  NODE_ENV: string;
}

// Export Durable Object classes
export { RaceRoom } from "./cloudflare/race-room-do";
export { LeaderboardWebSocket } from "./cloudflare/leaderboard-ws-do";

export default {
  /**
   * Main fetch handler for all HTTP requests
   */
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    // Inject environment variables into process.env for Express compatibility
    injectEnvVariables(env);
    
    // Handle WebSocket upgrade requests
    if (request.headers.get("Upgrade") === "websocket") {
      return handleWebSocketUpgrade(request, env, url);
    }
    
    // Serve static assets for non-API routes
    if (!url.pathname.startsWith("/api/") && !url.pathname.startsWith("/ws/")) {
      try {
        const assetResponse = await env.ASSETS.fetch(request);
        if (assetResponse.status !== 404) {
          return assetResponse;
        }
      } catch (e) {
        // Asset not found, continue to app
      }
    }
    
    // Convert Cloudflare Request to Node.js compatible format for Express
    return handleExpressRequest(request, env, ctx);
  },
  
  /**
   * Queue consumer handler for background jobs
   */
  async queue(batch: MessageBatch<unknown>, env: Env): Promise<void> {
    const queueName = batch.queue;
    
    for (const message of batch.messages) {
      try {
        if (queueName === "typemasterai-leaderboard") {
          await processLeaderboardJob(message.body, env);
        } else if (queueName === "typemasterai-achievements") {
          await processAchievementJob(message.body, env);
        }
        message.ack();
      } catch (error) {
        console.error(`Failed to process message in ${queueName}:`, error);
        message.retry();
      }
    }
  },
  
  /**
   * Scheduled handler for cron triggers
   */
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    // Refresh leaderboard cache periodically
    ctx.waitUntil(refreshLeaderboardCache(env));
  },
};

/**
 * Inject Cloudflare env bindings into process.env for Express compatibility
 */
function injectEnvVariables(env: Env): void {
  // Only inject if not already set (prevents overwriting in subsequent requests)
  const envVars = [
    "DATABASE_URL",
    "OPENAI_API_KEY",
    "AI_INTEGRATIONS_OPENAI_API_KEY",
    "BING_GROUNDING_KEY",
    "GITHUB_CLIENT_ID",
    "GITHUB_CLIENT_SECRET",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "MAILGUN_API_KEY",
    "MAILGUN_DOMAIN",
    "MAILGUN_FROM_EMAIL",
    "SESSION_SECRET",
    "VAPID_PUBLIC_KEY",
    "VAPID_PRIVATE_KEY",
    "APP_URL",
    "NODE_ENV",
  ];
  
  for (const key of envVars) {
    if (env[key as keyof Env] && typeof env[key as keyof Env] === "string") {
      (globalThis as any).process = (globalThis as any).process || { env: {} };
      (globalThis as any).process.env[key] = env[key as keyof Env];
    }
  }
}

/**
 * Handle WebSocket upgrade requests by routing to Durable Objects
 */
async function handleWebSocketUpgrade(
  request: Request,
  env: Env,
  url: URL
): Promise<Response> {
  const pathname = url.pathname;
  
  // Race WebSocket connections
  if (pathname.startsWith("/ws/race/")) {
    const raceId = pathname.split("/")[3];
    if (!raceId) {
      return new Response("Missing race ID", { status: 400 });
    }
    
    // Get or create Durable Object for this race
    const id = env.RACE_ROOMS.idFromName(raceId);
    const stub = env.RACE_ROOMS.get(id);
    
    return stub.fetch(request);
  }
  
  // Leaderboard WebSocket connections
  if (pathname.startsWith("/ws/leaderboard")) {
    // Use a single Durable Object for leaderboard (or shard by region)
    const id = env.LEADERBOARD_WS.idFromName("global");
    const stub = env.LEADERBOARD_WS.get(id);
    
    return stub.fetch(request);
  }
  
  return new Response("Unknown WebSocket endpoint", { status: 404 });
}

/**
 * Convert Cloudflare Request to Express-compatible format and handle
 */
async function handleExpressRequest(
  request: Request,
  env: Env,
  ctx: ExecutionContext
): Promise<Response> {
  // Use the cloudflare:node httpServerHandler for Express compatibility
  // This requires the nodejs_compat flag and wrangler 4.28.0+
  try {
    // For now, create a simple adapter
    // Full Express compatibility requires the httpServerHandler API
    const url = new URL(request.url);
    const method = request.method;
    const headers: Record<string, string> = {};
    
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });
    
    // Create a mock request/response for Express
    const body = method !== "GET" && method !== "HEAD" 
      ? await request.text()
      : undefined;
    
    // Import and use the Express app
    // Note: Full compatibility requires additional setup
    // This is a simplified handler for basic routes
    
    // For production deployment, use the full httpServerHandler API:
    // import { httpServerHandler } from "cloudflare:node";
    // return httpServerHandler(app)(request, env, ctx);
    
    // Fallback: Return a placeholder response
    // The actual implementation will use the Express app directly
    return new Response(JSON.stringify({ 
      message: "Cloudflare Worker is running",
      path: url.pathname,
      method: method,
      note: "Configure httpServerHandler for full Express compatibility"
    }), {
      headers: { "Content-Type": "application/json" }
    });
    
  } catch (error) {
    console.error("Error handling request:", error);
    return new Response(JSON.stringify({ 
      error: "Internal Server Error",
      message: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

/**
 * Process leaderboard update jobs from the queue
 */
async function processLeaderboardJob(body: unknown, env: Env): Promise<void> {
  // TODO: Implement leaderboard batch processing
  // This replaces BullMQ job processing
  console.log("Processing leaderboard job:", body);
}

/**
 * Process achievement check jobs from the queue
 */
async function processAchievementJob(body: unknown, env: Env): Promise<void> {
  // TODO: Implement achievement checking
  console.log("Processing achievement job:", body);
}

/**
 * Refresh leaderboard cache (called by cron trigger)
 */
async function refreshLeaderboardCache(env: Env): Promise<void> {
  // TODO: Implement cache refresh logic
  console.log("Refreshing leaderboard cache");
}

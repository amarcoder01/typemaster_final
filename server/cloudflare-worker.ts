/**
 * Cloudflare Worker Entry Point
 * 
 * This worker serves static assets from Cloudflare Pages/Workers Assets
 * and proxies API/WebSocket requests to the backend server.
 * 
 * Architecture:
 * - Static assets: Served from Workers Assets (frontend)
 * - API requests: Proxied to backend server (Fly.io/Cloud Run)
 * - WebSocket: Proxied to backend server for real-time features
 */

/// <reference types="@cloudflare/workers-types" />

// Cloudflare Worker Environment Types
export interface Env {
  // Static Assets binding
  ASSETS: Fetcher;
  
  // Backend URL for API proxy (set as environment variable)
  BACKEND_URL?: string;
  
  // Environment Variables
  APP_URL?: string;
  NODE_ENV?: string;
}

// Backend URL - configure this to your deployed backend
const DEFAULT_BACKEND_URL = "https://typemasterai.fly.dev";

export default {
  /**
   * Main fetch handler for all HTTP requests
   */
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const backendUrl = env.BACKEND_URL || DEFAULT_BACKEND_URL;
    
    // Handle API requests - proxy to backend
    if (url.pathname.startsWith("/api/")) {
      return proxyToBackend(request, backendUrl, url);
    }
    
    // Handle WebSocket upgrade requests - proxy to backend
    if (request.headers.get("Upgrade") === "websocket") {
      return proxyWebSocket(request, backendUrl, url);
    }
    
    // Handle WebSocket routes (non-upgrade) - proxy to backend
    if (url.pathname.startsWith("/ws/")) {
      return proxyToBackend(request, backendUrl, url);
    }
    
    // Serve static assets for all other routes
    try {
      const assetResponse = await env.ASSETS.fetch(request);
      
      // Add security headers to static responses
      const headers = new Headers(assetResponse.headers);
      headers.set("X-Content-Type-Options", "nosniff");
      headers.set("X-Frame-Options", "DENY");
      headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
      
      return new Response(assetResponse.body, {
        status: assetResponse.status,
        statusText: assetResponse.statusText,
        headers,
      });
    } catch (e) {
      // If asset not found, serve index.html for SPA routing
      const indexRequest = new Request(new URL("/index.html", url.origin), request);
      const indexResponse = await env.ASSETS.fetch(indexRequest);
      return indexResponse;
    }
  },
};

/**
 * Proxy HTTP requests to the backend server
 */
async function proxyToBackend(
  request: Request,
  backendUrl: string,
  originalUrl: URL
): Promise<Response> {
  try {
    // Construct backend URL
    const targetUrl = new URL(originalUrl.pathname + originalUrl.search, backendUrl);
    
    // Clone the request with the new URL
    const headers = new Headers(request.headers);
    
    // Add forwarded headers for the backend
    headers.set("X-Forwarded-Host", originalUrl.host);
    headers.set("X-Forwarded-Proto", originalUrl.protocol.replace(":", ""));
    headers.set("X-Real-IP", request.headers.get("CF-Connecting-IP") || "");
    
    // Remove host header to avoid conflicts
    headers.delete("host");
    
    const proxyRequest = new Request(targetUrl.toString(), {
      method: request.method,
      headers,
      body: request.body,
      redirect: "manual",
    });
    
    const response = await fetch(proxyRequest);
    
    // Clone response with CORS headers
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set("Access-Control-Allow-Origin", originalUrl.origin);
    responseHeaders.set("Access-Control-Allow-Credentials", "true");
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return new Response(JSON.stringify({
      error: "Backend Unavailable",
      message: "Unable to connect to the backend server. Please try again later.",
    }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/**
 * Proxy WebSocket connections to the backend server
 */
async function proxyWebSocket(
  request: Request,
  backendUrl: string,
  originalUrl: URL
): Promise<Response> {
  try {
    // Convert backend URL to WebSocket URL
    const wsBackendUrl = backendUrl.replace("https://", "wss://").replace("http://", "ws://");
    const targetUrl = new URL(originalUrl.pathname + originalUrl.search, wsBackendUrl);
    
    // Create WebSocket pair for proxying
    const headers = new Headers(request.headers);
    headers.set("X-Forwarded-Host", originalUrl.host);
    headers.set("X-Real-IP", request.headers.get("CF-Connecting-IP") || "");
    headers.delete("host");
    
    // Proxy the WebSocket upgrade to the backend
    const upgradeRequest = new Request(targetUrl.toString(), {
      method: "GET",
      headers,
    });
    
    return await fetch(upgradeRequest);
  } catch (error) {
    console.error("WebSocket proxy error:", error);
    return new Response("WebSocket connection failed", { status: 502 });
  }
}

import fs from "node:fs";
import { type Server } from "node:http";
import path from "node:path";

import express, { type Express, type Request, type Response, type NextFunction } from "express";

import runApp from "./app";
import { createSEOPrerender } from "./seo-prerender";
import { BASE_URL } from "./config";
import { precompressAssets, servePrecompressed } from "./precompress";

/**
 * Cache durations for different asset types (in seconds)
 * These values are optimized for Core Web Vitals and SEO performance
 */
const CACHE_DURATIONS = {
  // Immutable assets (hashed filenames) - 1 year
  immutable: 31536000,
  // Static assets (images, fonts) - 30 days
  static: 2592000,
  // HTML and dynamic content - no cache (for fresh content)
  html: 0,
  // Service worker - short cache for updates
  serviceWorker: 3600,
  // Sitemap and robots - 1 day
  seo: 86400,
};

/**
 * BASE_URL imported from env-driven config
 */
// BASE_URL is centralized in server/config.ts

/**
 * Middleware to add optimal cache headers based on file type
 * This improves page load performance and Core Web Vitals scores
 */
function cacheHeadersMiddleware(req: Request, res: Response, next: NextFunction) {
  const url = req.url;
  const cleanPath = url.split('?')[0]; // Remove query string for path matching
  const privateHtmlPaths = new Set<string>([
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
    '/admin',
    '/settings',
    '/notifications',
    '/profile/edit',
  ]);

  // Immutable hashed assets (JS/CSS with hash in filename)
  if (url.match(/\.(js|css)$/) && url.includes('-')) {
    res.set('Cache-Control', `public, max-age=${CACHE_DURATIONS.immutable}, immutable`);
  }
  // Static assets (images, fonts, icons)
  else if (url.match(/\.(png|jpg|jpeg|gif|webp|avif|svg|ico|woff|woff2|ttf|eot)$/i)) {
    res.set('Cache-Control', `public, max-age=${CACHE_DURATIONS.static}`);
    // Add content-type for images to improve performance
    if (url.match(/\.(jpg|jpeg)$/i)) {
      res.set('Content-Type', 'image/jpeg');
    } else if (url.match(/\.webp$/i)) {
      res.set('Content-Type', 'image/webp');
    }
  }
  // Service worker - shorter cache for updates
  else if (url === '/service-worker.js') {
    res.set('Cache-Control', `public, max-age=${CACHE_DURATIONS.serviceWorker}`);
  }
  // SEO files (sitemap, robots, IndexNow key)
  else if (url.match(/\.(xml|txt)$/) && (url.includes('sitemap') || url.includes('robots') || url.includes('indexnow'))) {
    res.set('Cache-Control', `public, max-age=${CACHE_DURATIONS.seo}`);
  }
  // Manifest file - moderate cache
  else if (url === '/manifest.json') {
    res.set('Cache-Control', `public, max-age=${CACHE_DURATIONS.seo}`);
  }
  // HTML - no cache to ensure fresh content, but add SEO headers
  else if (url.match(/\.html$/) || url === '/' || !url.includes('.')) {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    // Add canonical Link header for SEO
    res.set('Link', `<${BASE_URL}${cleanPath}>; rel="canonical"`);

    // Add X-Robots-Tag for proper indexing
    const defaultRobots = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
    const isPrivate = privateHtmlPaths.has(cleanPath);
    res.set('X-Robots-Tag', isPrivate ? 'noindex, nofollow' : defaultRobots);

    // Add Content-Language header based on URL locale
    const isSpanish = cleanPath.startsWith('/es/');
    res.set('Content-Language', isSpanish ? 'es' : 'en');

    // Ensure caches vary by language and UA (for crawler-specific prerender)
    res.set('Vary', 'User-Agent, Accept-Language');
  }

  // Add security headers for all responses
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'SAMEORIGIN');
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Add performance hints
  res.set('X-DNS-Prefetch-Control', 'on');

  // Add preconnect hints via Link header for external resources
  if (!url.includes('.')) {
    res.append('Link', '<https://fonts.googleapis.com>; rel="preconnect"');
    res.append('Link', '<https://fonts.gstatic.com>; rel="preconnect"; crossorigin');
  }

  next();
}

export async function serveStatic(app: Express, server: Server) {
  const distPath = path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Add cache headers middleware before static file serving
  app.use(cacheHeadersMiddleware);

  await precompressAssets(distPath);
  app.use(servePrecompressed(distPath));

  // SEO Pre-rendering middleware for search engine crawlers
  // This injects proper meta tags for bots that don't execute JavaScript
  app.use(createSEOPrerender(distPath));

  // Serve static files with etag support for efficient caching
  app.use(express.static(distPath, {
    etag: true,
    lastModified: true,
    index: false, // Don't auto-serve index.html, we handle it below
  }));

  // fall through to index.html if the file doesn't exist
  // This enables client-side routing for the SPA
  app.use("*", (_req, res) => {
    // Ensure no caching for HTML
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

(async () => {
  await runApp(serveStatic);
})();

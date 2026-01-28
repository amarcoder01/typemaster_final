# Cloudflare Deployment Guide

This guide explains how to deploy TypeMasterAI on Cloudflare's Supercloud stack.

## Overview

TypeMasterAI can be deployed on Cloudflare using:

| Service | Purpose |
|---------|---------|
| **Cloudflare Pages** | Frontend (React + Vite) |
| **Cloudflare Workers** | Backend (Express.js API) |
| **Neon PostgreSQL** | Database (external, compatible with Workers) |
| **Cloudflare KV** | Session storage and caching |
| **Cloudflare R2** | File uploads (images, documents) |
| **Cloudflare Queues** | Background job processing |
| **Durable Objects** | WebSocket connections (multiplayer races) |

## Prerequisites

1. **Cloudflare Account** with Workers Paid plan ($5/month)
2. **Neon PostgreSQL** database (already configured)
3. **Node.js 18+** installed locally
4. **Wrangler CLI** (included in devDependencies)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Login to Cloudflare

```bash
npx wrangler login
```

### 3. Set Up Secrets

Add your secrets to Cloudflare (never commit these to git):

```bash
# Database
npx wrangler secret put DATABASE_URL

# OpenAI
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put AI_INTEGRATIONS_OPENAI_API_KEY

# OAuth Providers
npx wrangler secret put GITHUB_CLIENT_ID
npx wrangler secret put GITHUB_CLIENT_SECRET
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET

# Email
npx wrangler secret put MAILGUN_API_KEY

# Session
npx wrangler secret put SESSION_SECRET

# Push Notifications
npx wrangler secret put VAPID_PUBLIC_KEY
npx wrangler secret put VAPID_PRIVATE_KEY
```

### 4. Create Required Resources

#### KV Namespaces

```bash
# Create KV namespaces for sessions and cache
npx wrangler kv namespace create SESSIONS
npx wrangler kv namespace create CACHE
```

After creating, update `wrangler.jsonc` with the returned IDs:

```jsonc
"kv_namespaces": [
  {
    "binding": "SESSIONS",
    "id": "YOUR_SESSIONS_KV_ID"
  },
  {
    "binding": "CACHE", 
    "id": "YOUR_CACHE_KV_ID"
  }
]
```

#### R2 Bucket

```bash
# Create R2 bucket for file uploads
npx wrangler r2 bucket create typemasterai-uploads
```

Update `wrangler.jsonc`:

```jsonc
"r2_buckets": [
  {
    "binding": "UPLOADS",
    "bucket_name": "typemasterai-uploads"
  }
]
```

#### Queues

```bash
# Create queues for background jobs
npx wrangler queues create typemasterai-leaderboard
npx wrangler queues create typemasterai-achievements
npx wrangler queues create typemasterai-dlq
```

### 5. Deploy

#### Deploy to Staging

```bash
npm run cf:deploy:staging
```

#### Deploy to Production

```bash
npm run cf:deploy:production
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run cf:dev` | Local development with Wrangler |
| `npm run cf:dev:remote` | Development with remote resources |
| `npm run cf:deploy` | Deploy to default environment |
| `npm run cf:deploy:staging` | Deploy to staging |
| `npm run cf:deploy:production` | Deploy to production |
| `npm run cf:tail` | View real-time logs |
| `npm run cf:secrets` | List configured secrets |
| `npm run cf:secret:put` | Add a new secret |
| `npm run cf:pages:deploy` | Deploy frontend only to Pages |

## Configuration Files

### wrangler.jsonc

Main Cloudflare Workers configuration file. Key sections:

- **Compatibility flags**: `nodejs_compat` for Node.js API support
- **Assets**: Static frontend files
- **KV/R2/Queues**: Storage and messaging bindings
- **Durable Objects**: WebSocket handlers
- **Environment variables**: Non-sensitive configuration

### .dev.vars

Local development secrets (copy from `.dev.vars.example`):

```bash
cp .dev.vars.example .dev.vars
# Edit .dev.vars with your actual values
```

### client/public/_headers

Cloudflare Pages headers for caching and security.

### client/public/_redirects

Cloudflare Pages routing configuration.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Cloudflare Edge Network                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌────────────────────────────────┐     │
│  │  Static      │    │         Worker                  │     │
│  │  Assets      │───▶│  ┌────────────────────────┐    │     │
│  │  (Pages/     │    │  │  Express.js Backend    │    │     │
│  │   Assets)    │    │  │  - API Routes          │    │     │
│  └──────────────┘    │  │  - Authentication      │    │     │
│                      │  │  - Rate Limiting       │    │     │
│                      │  └────────────────────────┘    │     │
│                      └────────────────────────────────┘     │
│                                   │                          │
│         ┌─────────────────────────┼──────────────────┐      │
│         │                         │                   │      │
│         ▼                         ▼                   ▼      │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │   Durable    │    │      KV      │    │      R2      │   │
│  │   Objects    │    │  (Sessions,  │    │  (Uploads)   │   │
│  │  (WebSocket) │    │   Cache)     │    │              │   │
│  └──────────────┘    └──────────────┘    └──────────────┘   │
│         │                                                    │
│         ▼                                                    │
│  ┌──────────────┐    ┌──────────────────────────────────┐   │
│  │    Queues    │    │     External Services            │   │
│  │  (Background │    │  - Neon PostgreSQL               │   │
│  │   Jobs)      │    │  - OpenAI API                    │   │
│  └──────────────┘    │  - Mailgun                       │   │
│                      └──────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Durable Objects

### RaceRoom

Handles multiplayer typing race sessions:

- WebSocket connection management
- Real-time game state synchronization
- Participant progress tracking
- Race countdown and timing
- Chat messages

### LeaderboardWebSocket

Handles real-time leaderboard updates:

- Subscription-based updates
- Tiered update frequency (active/passive/observer)
- Efficient broadcast to interested clients

## Database

TypeMasterAI uses **Neon PostgreSQL**, which is fully compatible with Cloudflare Workers via the `@neondatabase/serverless` driver.

**No migration to D1 is required** - Neon works directly with Workers.

### Connection

The database connection is handled automatically via the `DATABASE_URL` environment variable/secret.

## Background Jobs

Cloudflare Queues replace BullMQ for background processing:

| Queue | Purpose |
|-------|---------|
| `typemasterai-leaderboard` | Leaderboard updates and cache refresh |
| `typemasterai-achievements` | Achievement checking |
| `typemasterai-dlq` | Dead letter queue for failed messages |

## Monitoring

### View Logs

```bash
# Real-time logs
npm run cf:tail

# Staging logs
npm run cf:tail:staging
```

### Metrics

Workers Observability is enabled in `wrangler.jsonc`. View metrics in the Cloudflare dashboard under Workers → Metrics.

## Custom Domain

To use a custom domain:

1. Add your domain to Cloudflare (DNS management)
2. In Cloudflare Dashboard → Workers → your-worker → Triggers
3. Add Custom Domain: `typemasterai.com`

## Environment-Specific Configuration

### Staging

```bash
npm run cf:deploy:staging
```

- Worker name: `typemasterai-staging`
- URL: `typemasterai-staging.YOUR_SUBDOMAIN.workers.dev`

### Production

```bash
npm run cf:deploy:production
```

- Worker name: `typemasterai`
- URL: `typemasterai.YOUR_SUBDOMAIN.workers.dev` or custom domain

## Troubleshooting

### Common Issues

1. **"KV namespace not found"**
   - Create the namespace: `npx wrangler kv namespace create SESSIONS`
   - Add the ID to `wrangler.jsonc`

2. **"Database connection failed"**
   - Verify `DATABASE_URL` secret is set: `npx wrangler secret list`
   - Check Neon dashboard for connection issues

3. **"Worker script too large"**
   - Enable minification in `wrangler.jsonc`
   - Use code splitting in Vite config

4. **"WebSocket connection failed"**
   - Ensure Durable Objects are properly configured
   - Check migrations are applied

### Debug Mode

```bash
# Local development with verbose logging
WRANGLER_LOG=debug npm run cf:dev
```

## Cost Estimation

| Resource | Free Tier | Paid ($5/mo) |
|----------|-----------|--------------|
| Workers Requests | 100K/day | 10M/month included |
| Workers CPU | 10ms/request | 50ms/request |
| KV Reads | 100K/day | 10M/month |
| KV Writes | 1K/day | 1M/month |
| R2 Storage | 10GB | 10GB + $0.015/GB |
| R2 Operations | 1M Class A | 1M Class A |
| Durable Objects | - | $0.15/million requests |
| Queues | - | $0.40/million messages |

## Migration from Cloud Run

This deployment is **additive** - it doesn't affect the existing Cloud Run deployment. You can run both in parallel during migration:

1. Deploy to Cloudflare staging
2. Test all features
3. Update DNS to point to Cloudflare
4. Monitor for issues
5. Decommission Cloud Run when stable

## Support

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)
- [Durable Objects Guide](https://developers.cloudflare.com/durable-objects/)
- [Neon + Cloudflare Integration](https://neon.tech/docs/guides/cloudflare-workers)

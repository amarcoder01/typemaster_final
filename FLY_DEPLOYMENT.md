# Fly.io Deployment Guide

This guide explains how to deploy TypeMasterAI on Fly.io.

## Overview

Fly.io is a platform that runs your Docker containers on a global network of edge locations. It's perfect for:
- **Global distribution** - Deploy close to your users
- **Automatic scaling** - Scale based on traffic
- **WebSocket support** - Native support for real-time features
- **PostgreSQL** - Can use Fly Postgres or external (Neon)
- **Redis** - Optional Fly Redis or external

## Prerequisites

1. **Fly.io Account** - Sign up at [fly.io](https://fly.io)
2. **Fly CLI** - Install: `curl -L https://fly.io/install.sh | sh`
3. **Docker** - Already configured in this project
4. **Neon PostgreSQL** - Your existing database (or use Fly Postgres)

## Quick Start

### 1. Install Fly CLI

**Windows (PowerShell):**
```powershell
iwr https://fly.io/install.ps1 -useb | iex
```

**macOS/Linux:**
```bash
curl -L https://fly.io/install.sh | sh
```

### 2. Login to Fly.io

```bash
flyctl auth login
```

### 3. Initialize Your App (First Time Only)

```bash
# This will create fly.toml if it doesn't exist
flyctl launch --no-deploy
```

Or use the existing `fly.toml` that's already configured.

### 4. Set Secrets

Set your environment variables as secrets (never commit these):

```bash
# Database
flyctl secrets set DATABASE_URL="postgresql://..."

# OpenAI
flyctl secrets set OPENAI_API_KEY="sk-proj-..."
flyctl secrets set AI_INTEGRATIONS_OPENAI_API_KEY="sk-proj-..."

# OAuth Providers
flyctl secrets set GITHUB_CLIENT_ID="..."
flyctl secrets set GITHUB_CLIENT_SECRET="..."
flyctl secrets set GOOGLE_CLIENT_ID="..."
flyctl secrets set GOOGLE_CLIENT_SECRET="..."

# Email
flyctl secrets set MAILGUN_API_KEY="..."
flyctl secrets set MAILGUN_DOMAIN="mg.typemasterai.com"
flyctl secrets set MAILGUN_FROM_EMAIL="no-reply@typemasterai.com"

# Session
flyctl secrets set SESSION_SECRET="your-random-32-char-string"

# Push Notifications
flyctl secrets set VAPID_PUBLIC_KEY="..."
flyctl secrets set VAPID_PRIVATE_KEY="..."

# App URL
flyctl secrets set APP_URL="https://typemasterai.fly.dev"
```

### 5. Deploy

```bash
npm run fly:deploy
```

Or manually:
```bash
flyctl deploy
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run fly:launch` | Initialize app (first time only) |
| `npm run fly:deploy` | Deploy to Fly.io |
| `npm run fly:open` | Open app in browser |
| `npm run fly:logs` | View application logs |
| `npm run fly:status` | Check app status |
| `npm run fly:secrets` | List all secrets |
| `npm run fly:secret:set` | Set a secret (use: `flyctl secrets set KEY=value`) |
| `npm run fly:scale` | Scale instances (use: `flyctl scale count 2`) |
| `npm run fly:ssh` | SSH into running machine |
| `npm run fly:monitor` | Monitor app in real-time |

## Configuration

### fly.toml

The `fly.toml` file contains your app configuration:

- **app**: Your app name (`typemasterai`)
- **primary_region**: Default region (change to closest to your users)
- **vm**: Machine size (1 CPU, 512MB RAM - adjust as needed)
- **scaling**: Auto-scaling configuration
- **health checks**: Automatic health monitoring

### Regions

To change the primary region:

```bash
flyctl regions set iad  # Washington, D.C.
flyctl regions set dfw  # Dallas
flyctl regions set lhr  # London
flyctl regions set sin  # Singapore
```

See all regions: `flyctl regions list`

### Scaling

**Manual scaling:**
```bash
flyctl scale count 2        # 2 instances
flyctl scale vm shared-cpu-2x  # Larger VM
flyctl scale memory 1024   # 1GB RAM
```

**Auto-scaling** is configured in `fly.toml`:
```toml
[scaling]
  min_machines = 1
  max_machines = 3
```

## Database Options

### Option 1: Use Existing Neon PostgreSQL (Recommended)

Your existing Neon database works perfectly with Fly.io. Just set the `DATABASE_URL` secret:

```bash
flyctl secrets set DATABASE_URL="postgresql://..."
```

### Option 2: Use Fly Postgres

```bash
# Create Postgres cluster
flyctl postgres create --name typemasterai-db

# Attach to your app
flyctl postgres attach typemasterai-db
```

## Redis (Optional)

If you need Redis for distributed state:

### Option 1: External Redis
Set `REDIS_ENABLED=true` and configure your Redis connection.

### Option 2: Fly Redis (Upstream)
```bash
flyctl redis create
flyctl redis attach <redis-app-name>
```

## WebSocket Support

Fly.io has native WebSocket support. Your existing WebSocket implementation will work without changes.

The `fly.toml` is configured for:
- HTTP/HTTPS on ports 80/443
- WebSocket upgrades automatically handled
- Health checks for monitoring

## Monitoring

### View Logs

```bash
# Real-time logs
npm run fly:logs

# Follow logs
flyctl logs -a typemasterai

# Filter logs
flyctl logs | grep ERROR
```

### Metrics

View metrics in the Fly.io dashboard:
- CPU usage
- Memory usage
- Request rates
- Error rates

### Health Checks

Health checks are configured in `fly.toml`:
- Endpoint: `/api/health`
- Interval: 30 seconds
- Timeout: 5 seconds

## Custom Domain

### 1. Add Your Domain

```bash
flyctl certs add typemasterai.com
```

### 2. Update DNS

Add the CNAME record provided by Fly.io to your DNS provider.

### 3. Update APP_URL Secret

```bash
flyctl secrets set APP_URL="https://typemasterai.com"
```

## Troubleshooting

### Build Fails

```bash
# Check build logs
flyctl logs --build

# Build locally first
docker build -t typemasterai .
```

### App Won't Start

```bash
# Check logs
flyctl logs

# SSH into machine
flyctl ssh console

# Check status
flyctl status
```

### Health Check Fails

Verify your health endpoint:
```bash
flyctl open /api/health
```

### Out of Memory

Increase memory:
```bash
flyctl scale memory 1024  # 1GB
```

### High CPU Usage

Scale horizontally:
```bash
flyctl scale count 2
```

Or vertically:
```bash
flyctl scale vm shared-cpu-2x
```

## Cost Estimation

Fly.io pricing (as of 2025):

| Resource | Free Tier | Paid |
|----------|-----------|------|
| Machines | 3 shared-cpu-256mb | $0.0000002315/sec |
| Bandwidth | 160GB/month | $0.02/GB after |
| Storage | 3GB | $0.15/GB/month |

**Estimated Monthly Cost**: $5-20 for small to medium traffic

## Migration from Cloud Run

Your existing Dockerfile works perfectly with Fly.io. The main differences:

1. **Configuration**: `fly.toml` instead of `cloudrun-service.yaml`
2. **Secrets**: `flyctl secrets` instead of Google Secret Manager
3. **Scaling**: Automatic in Fly.io vs manual in Cloud Run
4. **Regions**: Global edge network vs single region

## Best Practices

1. **Use Secrets** for sensitive data (never in `fly.toml`)
2. **Set Health Checks** for automatic recovery
3. **Enable Auto-scaling** for cost efficiency
4. **Monitor Logs** regularly
5. **Use Multiple Regions** for global users
6. **Set Resource Limits** to prevent cost overruns

## Support

- [Fly.io Documentation](https://fly.io/docs)
- [Fly.io Community](https://community.fly.io)
- [Status Page](https://status.fly.io)

# Fly.io Quick Start

## First Time Deployment

### 1. Install Fly CLI

**Windows:**
```powershell
iwr https://fly.io/install.ps1 -useb | iex
```

**macOS/Linux:**
```bash
curl -L https://fly.io/install.sh | sh
```

### 2. Login

```bash
flyctl auth login
```

### 3. Set All Secrets

```bash
# Copy from your .env file and set each one:
flyctl secrets set DATABASE_URL="postgresql://..."
flyctl secrets set OPENAI_API_KEY="sk-proj-..."
flyctl secrets set AI_INTEGRATIONS_OPENAI_API_KEY="sk-proj-..."
flyctl secrets set GITHUB_CLIENT_ID="..."
flyctl secrets set GITHUB_CLIENT_SECRET="..."
flyctl secrets set GOOGLE_CLIENT_ID="..."
flyctl secrets set GOOGLE_CLIENT_SECRET="..."
flyctl secrets set MAILGUN_API_KEY="..."
flyctl secrets set MAILGUN_DOMAIN="mg.typemasterai.com"
flyctl secrets set MAILGUN_FROM_EMAIL="no-reply@typemasterai.com"
flyctl secrets set SESSION_SECRET="your-secret-here"
flyctl secrets set VAPID_PUBLIC_KEY="..."
flyctl secrets set VAPID_PRIVATE_KEY="..."
flyctl secrets set APP_URL="https://typemasterai.fly.dev"
```

### 4. Deploy

```bash
npm run fly:deploy
```

That's it! Your app will be live at `https://typemasterai.fly.dev`

## Common Commands

```bash
# View logs
npm run fly:logs

# Open in browser
npm run fly:open

# Check status
npm run fly:status

# Scale up
flyctl scale count 2

# SSH into machine
npm run fly:ssh
```

## Next Steps

1. **Add Custom Domain**: `flyctl certs add typemasterai.com`
2. **Scale**: Adjust in `fly.toml` or via CLI
3. **Monitor**: Use `flyctl monitor` for real-time metrics

See `FLY_DEPLOYMENT.md` for full documentation.

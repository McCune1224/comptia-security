# Railway Deployment Guide

This guide explains how to deploy the CompTIA Security+ Course app to Railway with PostgreSQL.

## Prerequisites

1. A Railway account ([railway.app](https://railway.app))
2. Railway CLI installed ([docs](https://docs.railway.app/cli/getting-started))
3. Git repository pushed to GitHub/GitLab

## Step 1: Create a New Railway Project

```bash
# Login to Railway
railway login

# Initialize a new project
railway init

# Link to your repo (if not already linked)
railway link
```

## Step 2: Add PostgreSQL Database

```bash
# Add a PostgreSQL database to your project
railway add --database postgresql
```

This will:
- Create a new PostgreSQL database
- Set the `DATABASE_URL` environment variable automatically

## Step 3: Set Environment Variables

```bash
# Set Google Calendar credentials (if using)
railway variables set GOOGLE_CLIENT_ID=your_client_id
railway variables set GOOGLE_CLIENT_SECRET=your_client_secret

# Optional: Set custom OAuth redirect URI
railway variables set GOOGLE_REDIRECT_URI=https://your-app.up.railway.app/api/calendar/google/callback
```

## Step 4: Deploy

```bash
# Deploy to Railway
railway up

# Or deploy from GitHub (recommended for CI/CD)
# Connect your GitHub repo in the Railway dashboard
```

## Step 5: Initialize the Database

After the first deployment, run the database setup:

```bash
# Connect to your Railway project
railway shell

# Run the database setup script
npm run db:setup

# Seed the database with course content
npm run db:seed
```

Or run these commands remotely:

```bash
railway run npm run db:setup
railway run npm run db:seed
```

## Step 6: Migrate Existing Data (Optional)

If you have existing SQLite data you want to migrate:

```bash
# Copy your SQLite database to the project
cp /path/to/your/quiz.db ./data/quiz.db

# Run the migration script
railway run npx tsx scripts/migrate-sqlite-to-pg.ts --sqlite-path ./data/quiz.db
```

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (set automatically by Railway) |
| `PORT` | No | Server port (default: 3000, Railway sets this automatically) |
| `GOOGLE_CLIENT_ID` | No | Google Calendar API client ID |
| `GOOGLE_CLIENT_SECRET` | No | Google Calendar API client secret |
| `GOOGLE_REDIRECT_URI` | No | OAuth redirect URI (default: auto-detected) |

## Architecture

### Database Choice

- **Local development**: Uses SQLite (zero-config, file-based)
- **Production (Railway)**: Uses PostgreSQL (managed, scalable)

The app automatically detects the database based on the `DATABASE_URL` environment variable:
- If `DATABASE_URL` is set → PostgreSQL
- If `DATABASE_URL` is not set → SQLite (local file)

### File Structure

```
comptia-security/
├── Dockerfile            # Multi-stage build for Railway
├── railway.toml          # Railway configuration
└── web/
    ├── src/lib/server/
    │   ├── db.ts           # SQLite database layer (local dev)
    │   ├── db-pg.ts        # PostgreSQL database layer (production)
    │   └── schema-pg.sql   # PostgreSQL schema
    └── scripts/
        ├── setup-pg.ts           # Initialize PostgreSQL schema
        ├── seed-pg.ts            # Seed course data
        └── migrate-sqlite-to-pg.ts  # Migrate from SQLite
```

## Local Development

For local development, continue using SQLite:

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Database is automatically created at data/quiz.db
```

## Production Build

The Dockerfile uses a multi-stage build:

1. **Builder stage**: Installs dependencies and builds the SvelteKit app
2. **Production stage**: Copies built assets and runs the production server

```bash
# Build Docker image locally (for testing)
docker build -t comptia-security .

# Run locally with PostgreSQL
docker run -p 3000:3000 -e DATABASE_URL=postgresql://... comptia-security
```

## Troubleshooting

### Database Connection Issues

```bash
# Test database connection
railway run node -e "const sql = require('postgres')(process.env.DATABASE_URL); sql\`SELECT 1\`.then(() => console.log('Connected')).catch(e => console.error(e)).finally(() => sql.end())"
```

### Schema Migration Errors

If you see schema errors, run the setup script again:

```bash
railway run npm run db:setup
```

### Performance Tuning

Railway's PostgreSQL includes connection pooling. The app uses:
- Max 10 connections
- 20 second idle timeout
- 10 second connect timeout

Adjust in `db-pg.ts` if needed.

## Cost Considerations

Railway offers:
- **Hobby plan**: $5/month + usage
- **PostgreSQL**: ~$1-5/month for small databases
- **Compute**: Pay per second of usage

For a study app with moderate usage, expect ~$5-10/month total.

## Next Steps

1. Set up a custom domain (optional)
2. Configure automatic deployments from GitHub
3. Set up monitoring and alerts
4. Consider adding a CDN for static assets

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

### Schema vs. content after a release

**Schema is automatic.** `src/hooks.server.ts` exports SvelteKit's `init` hook,
which calls `applyPgSchema` before the server answers its first request. Every
statement is `CREATE ... IF NOT EXISTS`, so a deploy that adds a table creates it
itself. No `db:setup` step is needed for schema changes.

**Content is not.** `db:seed` writes rows (course modules, lessons, assignments,
default profiles), so a release that changes _content_ still needs:

```bash
railway run npm run db:seed   # idempotent upsert; keeps profile edits
```

`db:setup` remains useful for a first-ever database and for scripts/CI.

## Step 6: Migrate Existing Data (Optional)

If you have existing SQLite data you want to migrate:

```bash
# Copy your SQLite database to the project
cp /path/to/your/quiz.db ./data/quiz.db

# Run the migration script
railway run npm run db:migrate
```

## Environment Variables Reference

| Variable               | Required | Description                                                                                                                                                                                                                            |
| ---------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`         | Yes      | PostgreSQL connection string (set automatically by Railway)                                                                                                                                                                            |
| `PORT`                 | No       | Server port. The Docker image sets `PORT=8080` (`EXPOSE 8080`); Railway injects its own `PORT`, which overrides the image value. Without either, adapter-node falls back to 3000                                                       |
| `BODY_SIZE_LIMIT`      | No       | Largest request body adapter-node will accept (default **512K**). The Docker image sets `6M`, which the `.ics` calendar import needs — its files go up to 4 MB (`web/CALENDAR-FILES.md`). Set it here only to override the image value |
| `GOOGLE_CLIENT_ID`     | No       | Google Calendar API client ID                                                                                                                                                                                                          |
| `GOOGLE_CLIENT_SECRET` | No       | Google Calendar API client secret                                                                                                                                                                                                      |
| `GOOGLE_REDIRECT_URI`  | No       | OAuth redirect URI (default: auto-detected)                                                                                                                                                                                            |

## Architecture

### Database Choice

PostgreSQL is the only runtime database, in every environment:

- `DATABASE_URL` resolves through the same mechanism as the Google Calendar
  credentials (`$env/dynamic/private`): `web/.env` in local dev, the Railway
  environment in production.
- A missing/unreachable `DATABASE_URL` is a hard error — there is no file-based
  fallback.
- Tests use a separate `TEST_DATABASE_URL` and never touch `DATABASE_URL`.

### File Structure

```
comptia-security/
├── Dockerfile            # Multi-stage build (build context = repo root)
├── .dockerignore         # Keeps node_modules, build output, data, .env out of the context
├── package.json          # Root package exists only for the IaC SDK (see below)
├── .railway/
│   └── railway.ts        # Infrastructure as Code — the Railway service config
└── web/
    ├── src/lib/server/
    │   ├── db.ts           # QuizRepository contract (promise-based)
    │   ├── db-pg.ts        # PostgreSQL implementation
    │   ├── schema-pg.ts    # PostgreSQL schema (single source of DDL)
    │   └── pg-seed.ts      # Shared course-content seeding
    └── scripts/
        ├── setup-pg.ts               # Initialize PostgreSQL schema (db:setup)
        ├── seed-pg.ts                # Seed course data (db:seed)
        └── migrate-sqlite-to-pg.ts   # Import legacy SQLite data (db:migrate)
```

## Infrastructure as Code

The Railway service is defined in `.railway/railway.ts`, not in `railway.toml`
(Config as Code, which stopped being read on 2026-12-01). It is applied with the
Railway CLI, which is a local tool — **Railway does not read `.railway/` during a
deploy**, so the service's stored settings are what a build actually uses.

```bash
npm install                  # root package: resolves railway/iac for the CLI
railway login                # once per machine
railway link --project ef941ef0-971f-4fcd-ba69-42bf8b241088 --environment production
railway config plan          # preview; never changes anything
railway config apply         # apply after reviewing the plan
```

`railway config plan` should print `Your Railway configuration is already up to
date.` when the file matches the live service. A plan that proposes deletes needs
reading before it is applied.

The file exports `partial = "comptia-security"`, and ownership is recorded on the
environment (`railway config partials list`). That is deliberate: the project also
holds the **Prod** and **Test** Postgres services and their 5 GB volumes, and a
partial only deletes resources it owns, so an apply from this repository cannot
remove them. Whole-project planning is blocked while named ownership exists. Do
not drop the partial export.

Variables are `managed: false` — IaC never reads or writes them, so `DATABASE_URL`
stays on Railway instead of landing in the repo.

## Local Development

Local development uses PostgreSQL too:

```bash
# Install dependencies
npm install

# Point DATABASE_URL at any PostgreSQL instance (web/.env), then:
npm run db:setup
npm run db:seed

# Run development server
npm run dev
```

> **Manual verification goes to `TEST_DATABASE_URL`, not `DATABASE_URL`.**
> `web/.env` points `DATABASE_URL` at the deployed database (a Railway public
> proxy URL, `…proxy.rlwy.net:…`), so `npm run dev`, `db:seed`, `db:setup` and any
> ad-hoc script run against live data. The test suite and Playwright already
> prefer `TEST_DATABASE_URL`; do the same for anything manual:
>
> ```bash
> DATABASE_URL="$TEST_DATABASE_URL" npm run db:setup
> DATABASE_URL="$TEST_DATABASE_URL" node build/index.js
> ```

## Production Build

The `Dockerfile` lives at the **repo root** and uses a multi-stage build. Its
`COPY` paths are relative to the repo root, so the build context must be the
repo root (which is also where `.dockerignore` lives — Railway builds with the
repo root as context and resolves the root `Dockerfile` by default):

1. **Builder stage**: Installs dependencies and builds the SvelteKit app
2. **Production stage**: Copies built assets and runs the production server

```bash
# From the repo root — build the Docker image locally (for testing)
docker build -t comptia-security .

# Run locally with PostgreSQL. The image listens on 8080 (ENV PORT=8080),
# so map host port 3000 to container port 8080:
docker run -p 3000:8080 -e DATABASE_URL=postgresql://... comptia-security
```

Note: the service's `startCommand` is `node build` (set in `.railway/railway.ts`),
which Railway runs in the container's working directory (`/app`) instead of the
image `CMD`. Both are the same command (`node build`), so behavior is identical
either way.

## Troubleshooting

### Database Connection Issues

```bash
# Test database connection
railway run node -e "const sql = require('postgres')(process.env.DATABASE_URL); sql\`SELECT 1\`.then(() => console.log('Connected')).catch(e => console.error(e)).finally(() => sql.end())"
```

### Schema Migration Errors

Schema changes apply themselves at server startup (`hooks.server.ts` →
`applyPgSchema`), so a missing table usually means the deploy did not restart.
Redeploy, then re-check the boot logs:

```bash
railway run npm run db:setup   # still available for a first-ever database
```

### Calendar import fails with "too large for the server to accept"

The request body passed adapter-node's `BODY_SIZE_LIMIT`. The image sets `6M`; if
you overrode it, raise it above the import cap (see the environment variables
table). `npm run dev` has no such limit, so this only shows up in production.

### Deploy fails in seconds with an empty build log

Symptom: the deployment goes `FAILED` in under ten seconds, `failureStage` is
`BUILD_IMAGE`, and the build stream holds only `scheduling build on Metal
builder` — no `npm ci`, no `vite build`.

Cause: Railway could not resolve the Dockerfile, so the build never started. The
service keeps a `dockerfilePath` setting that is independent of where the file
actually lives, and it goes stale whenever the Dockerfile moves. Check the live
value against the authoring file:

```bash
railway config plan     # shows any drift between .railway/railway.ts and the service
```

`dockerfilePath` must name the Dockerfile's real path relative to the repo root
(`Dockerfile`, not `web/Dockerfile`). `.railway/railway.ts` states it explicitly,
so the authoring file is the authority; a `railway config apply` restores it.

Also check `watchPatterns`: a commit that touches nothing in them is skipped
(`no changes detected in watch paths, build will skip`). They are `/web/**` and
`/Dockerfile` — the two things a build actually depends on. Note that a change to
`.railway/` itself does not deploy, because IaC is applied with the CLI rather
than read at deploy time.

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

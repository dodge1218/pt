# Deployment

ProofTicket is currently private and local-first, but the app is prepared for a standard Vercel + Supabase deployment.

For an invited hosted alpha, use `docs/ALPHA-DEPLOYMENT.md` as the runbook. This file covers the general deployment mechanics.

For a production-like local database without Supabase:

```bash
docker compose up -d postgres
npm run setup:postgres
set -a; . ./.env.postgres.local; set +a
npm run dev
```

SQLite remains the default quickstart. Postgres local development uses `prisma/schema.postgres.prisma` because Prisma database providers are declared in the schema, not only in `DATABASE_URL`. When switching back to SQLite, rerun `npm run setup:local -- --skip-seed` or `npx prisma generate`.

## Required Production Env

```env
DATABASE_URL="postgresql://..."
AUTH_URL="https://your-domain.example"
AUTH_SECRET="generate-a-long-random-secret"
NEXTAUTH_URL="https://your-domain.example"
NEXTAUTH_SECRET="same-or-equivalent-long-random-secret"
GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."
PROOFTICKET_ALLOWED_EMAILS="builder@example.com,reviewer@example.com"
```

`DATABASE_URL` should be a pooled Supabase/Postgres connection string for the app runtime. Do not deploy production on SQLite.
`PROOFTICKET_ALLOWED_EMAILS` is optional locally. In hosted alpha it should be set to a comma-separated list of invited tester emails.

## Optional Env

```env
GROQ_API_KEY="..."
GEMINI_API_KEY="..."
PROOFTICKET_CRON_SECRET="long-random-token-for-delivery-processing"
PROOFTICKET_CONTEXTCLAW_SECRET="long-random-token-for-contextclaw-ingest"
PROOFTICKET_BASE_URL="https://your-domain.example"
PROOFTICKET_AGENT_ACTION_SECRET="long-random-token-for-agent-action-review"
PROOFTICKET_OPENCLAW_SECRET="long-random-token-for-openclaw-hermes-webhooks"
PROOFTICKET_GITHUB_WEBHOOK_SECRET="long-random-token-for-github-webhooks"
ENABLE_DEMO_AUTH="false"
```

`PROOFTICKET_CRON_SECRET` protects `POST /api/proofticket/queue` when called by a scheduled worker.
`PROOFTICKET_BASE_URL` is used by `npm run queue:process` when cron runs from a shell.
`PROOFTICKET_CONTEXTCLAW_SECRET` protects machine-to-machine ContextClaw ingestion at `POST /api/contextclaw/receipts`, `POST /api/contextclaw/manifests`, and `POST /api/webhooks/contextclaw`.
`PROOFTICKET_AGENT_ACTION_SECRET` protects terminal listing and approval at `GET/POST /api/webhooks/openclaw/agent-actions`. If unset, ProofTicket falls back to `PROOFTICKET_OPENCLAW_SECRET` for backward compatibility.
`PROOFTICKET_OPENCLAW_SECRET` protects `POST /api/webhooks/openclaw` for OpenClaw/Hermes ticket creation.
`PROOFTICKET_GITHUB_WEBHOOK_SECRET` protects `POST /api/webhooks/github` for GitHub event ingestion.
`ENABLE_DEMO_AUTH` may be `true` for local demos, but production preflight rejects it.

## OpenClaw/Hermes Sender

Run this from a terminal manager or proceed loop when a pass should become a durable ProofTicket handoff:

```bash
npm run openclaw:ticket -- \
  --url "$PROOFTICKET_BASE_URL" \
  --idempotency-key "$SESSION_ID:$PASS_ID:handoff" \
  --actor-email "$PROOFTICKET_ACTOR_EMAIL" \
  --source hermes \
  --title "Agent handoff" \
  --content "$SUMMARY"
```

The command posts to `POST /api/webhooks/openclaw` using `PROOFTICKET_OPENCLAW_SECRET`.

Terminal list/approve/reject uses `PROOFTICKET_AGENT_ACTION_SECRET`:

```bash
npm run proofticket:actions -- \
  --url "$PROOFTICKET_BASE_URL" \
  --actor-email "$PROOFTICKET_ACTOR_EMAIL"
```

```bash
npm run proofticket:action -- \
  --url "$PROOFTICKET_BASE_URL" \
  --decision approve \
  --action-id "$ACTION_ID" \
  --actor-email "$PROOFTICKET_ACTOR_EMAIL"
```

The commands call `GET/POST /api/webhooks/openclaw/agent-actions`.

## Checks

Run these before deployment:

```bash
npm run preflight:production
npx prisma validate
npm run build
npm audit --audit-level=moderate --omit=dev
```

The normal `npm run build` runs a non-blocking preflight locally. In production, preflight fails on missing GitHub OAuth, missing Auth.js secret/url, placeholder secrets, localhost URLs, or SQLite.

After the server starts, verify runtime health:

```bash
npm run health -- --url "$PROOFTICKET_BASE_URL"
```

The command checks `GET /api/health`, including database connectivity.

## Local Setup

For local development:

```bash
npm install
npm run setup:local
npm run dev
```

`setup:local` creates `.env` from `.env.example` only if `.env` does not exist. It does not overwrite local secrets.

## Database

For the current prototype:

```bash
npx prisma db push
```

Before public launch, switch to a migration-based deploy flow:

```bash
npx prisma migrate deploy
```

For hosted alpha with the Postgres schema:

```bash
DATABASE_URL="postgresql://..." npx prisma migrate deploy --schema prisma/schema.postgres.prisma
```

Do not commit `.env`, local SQLite databases, `.next`, screenshots with private data, or generated logs.

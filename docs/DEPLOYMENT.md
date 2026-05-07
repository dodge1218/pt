# Deployment

Kairos is currently private and local-first, but the app is prepared for a standard Vercel + Supabase deployment.

## Required Production Env

```env
DATABASE_URL="postgresql://..."
AUTH_URL="https://your-domain.example"
AUTH_SECRET="generate-a-long-random-secret"
NEXTAUTH_URL="https://your-domain.example"
NEXTAUTH_SECRET="same-or-equivalent-long-random-secret"
GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."
```

`DATABASE_URL` should be a pooled Supabase/Postgres connection string for the app runtime. Do not deploy production on SQLite.

## Optional Env

```env
GROQ_API_KEY="..."
GEMINI_API_KEY="..."
KAIROS_CRON_SECRET="long-random-token-for-delivery-processing"
KAIROS_CONTEXTCLAW_SECRET="long-random-token-for-contextclaw-ingest"
KAIROS_BASE_URL="https://your-domain.example"
KAIROS_AGENT_ACTION_SECRET="long-random-token-for-agent-action-review"
KAIROS_OPENCLAW_SECRET="long-random-token-for-openclaw-hermes-webhooks"
ENABLE_DEMO_AUTH="false"
```

`KAIROS_CRON_SECRET` protects `POST /api/kairos/queue` when called by a scheduled worker.
`KAIROS_BASE_URL` is used by `npm run queue:process` when cron runs from a shell.
`KAIROS_CONTEXTCLAW_SECRET` protects machine-to-machine ContextClaw ingestion at `POST /api/contextclaw/receipts`, `POST /api/contextclaw/manifests`, and `POST /api/webhooks/contextclaw`.
`KAIROS_AGENT_ACTION_SECRET` protects terminal listing and approval at `GET/POST /api/webhooks/openclaw/agent-actions`. If unset, Kairos falls back to `KAIROS_OPENCLAW_SECRET` for backward compatibility.
`KAIROS_OPENCLAW_SECRET` protects `POST /api/webhooks/openclaw` for OpenClaw/Hermes ticket creation.
`ENABLE_DEMO_AUTH` may be `true` for local demos, but production preflight rejects it.

## OpenClaw/Hermes Sender

Run this from a terminal manager or proceed loop when a pass should become a durable Kairos handoff:

```bash
npm run openclaw:ticket -- \
  --url "$KAIROS_BASE_URL" \
  --idempotency-key "$SESSION_ID:$PASS_ID:handoff" \
  --actor-email "$KAIROS_ACTOR_EMAIL" \
  --source hermes \
  --title "Agent handoff" \
  --content "$SUMMARY"
```

The command posts to `POST /api/webhooks/openclaw` using `KAIROS_OPENCLAW_SECRET`.

Terminal list/approve/reject uses `KAIROS_AGENT_ACTION_SECRET`:

```bash
npm run kairos:actions -- \
  --url "$KAIROS_BASE_URL" \
  --actor-email "$KAIROS_ACTOR_EMAIL"
```

```bash
npm run kairos:action -- \
  --url "$KAIROS_BASE_URL" \
  --decision approve \
  --action-id "$ACTION_ID" \
  --actor-email "$KAIROS_ACTOR_EMAIL"
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
npm run health -- --url "$KAIROS_BASE_URL"
```

The command checks `GET /api/health`, including database connectivity.

## Database

For the current prototype:

```bash
npx prisma db push
```

Before public launch, switch to a migration-based deploy flow:

```bash
npx prisma migrate deploy
```

Do not commit `.env`, local SQLite databases, `.next`, screenshots with private data, or generated logs.

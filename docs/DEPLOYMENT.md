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
ENABLE_DEMO_AUTH="false"
```

`KAIROS_CRON_SECRET` protects `POST /api/kairos/queue` when called by a scheduled worker.
`KAIROS_CONTEXTCLAW_SECRET` protects machine-to-machine ContextClaw ingestion at `POST /api/contextclaw/receipts`, `POST /api/contextclaw/manifests`, and `POST /api/webhooks/contextclaw`.
`ENABLE_DEMO_AUTH` may be `true` for local demos, but production preflight rejects it.

## Checks

Run these before deployment:

```bash
npm run preflight:production
npx prisma validate
npm run build
npm audit --audit-level=moderate --omit=dev
```

The normal `npm run build` runs a non-blocking preflight locally. In production, preflight fails on missing GitHub OAuth, missing Auth.js secret/url, placeholder secrets, localhost URLs, or SQLite.

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

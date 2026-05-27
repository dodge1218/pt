# Hosted Alpha Runbook

Status: hosted-alpha prep, not public launch approval.

This runbook is for a small invited ProofTicket alpha on managed hosting. It assumes the repository stays private, access is limited to named testers, and production data is treated as real user data.

## Target Shape

- Runtime: Vercel or equivalent Node-capable host.
- Database: managed Postgres.
- Auth: GitHub OAuth through Auth.js.
- Access: invite-only via `PROOFTICKET_ALLOWED_EMAILS`.
- Background processing: scheduled call to `POST /api/proofticket/queue`.
- Webhooks: signed secrets only; no unsigned machine endpoints.

Do not use SQLite, demo auth, seed demo users, local callback URLs, or placeholder secrets in hosted alpha.

## Required Env

```env
DATABASE_URL="postgresql://..."
AUTH_URL="https://your-alpha-domain.example"
AUTH_SECRET="long-random-secret"
NEXTAUTH_URL="https://your-alpha-domain.example"
NEXTAUTH_SECRET="long-random-secret"
GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."
PROOFTICKET_ALLOWED_EMAILS="builder@example.com,reviewer@example.com"
```

`PROOFTICKET_ALLOWED_EMAILS` is a comma-separated list. When it is set, only matching authenticated email addresses may sign in.

## Strongly Recommended Env

```env
PROOFTICKET_BASE_URL="https://your-alpha-domain.example"
PROOFTICKET_CRON_SECRET="long-random-token"
PROOFTICKET_AGENT_ACTION_SECRET="long-random-token"
PROOFTICKET_CONTEXTCLAW_SECRET="long-random-token"
PROOFTICKET_OPENCLAW_SECRET="long-random-token"
PROOFTICKET_GITHUB_WEBHOOK_SECRET="long-random-token"
ENABLE_DEMO_AUTH="false"
```

Each machine-to-machine integration should use its own secret. Reusing one secret across all integrations makes rotation and incident response harder.

## Database Deploy

The local default schema is SQLite for quick demos. Hosted alpha must use the Postgres schema.

Before first deploy:

```bash
DATABASE_URL="postgresql://..." npx prisma validate --schema prisma/schema.postgres.prisma
DATABASE_URL="postgresql://..." npx prisma db push --schema prisma/schema.postgres.prisma
```

For later production-style deploys, prefer generated migrations:

```bash
DATABASE_URL="postgresql://..." npx prisma migrate deploy --schema prisma/schema.postgres.prisma
```

Do not run `setup:local` against hosted data.

## Preflight

Run before every hosted alpha deploy:

```bash
NODE_ENV=production npm run preflight:production
DATABASE_URL="postgresql://..." npx prisma validate --schema prisma/schema.postgres.prisma
npm run mcp:smoke
npm run smoke:redaction
npm run build
npm audit --audit-level=moderate --omit=dev
```

The GitHub Actions workflow runs the same non-secret shape checks for pull requests and pushes to `main`: SQLite schema validation, Postgres schema validation with a placeholder Postgres URL, MCP smoke, redaction smoke, production preflight with throwaway hosted-alpha-shaped env, build, and production dependency audit.

After deploy:

```bash
npm run health -- --url "$PROOFTICKET_BASE_URL"
```

Then run one manual user flow:

1. Sign in with an invited GitHub account.
2. Create a private ticket.
3. Register or configure an agent key.
4. Submit an agent action.
5. Approve the action.
6. Export the resulting evidence bundle.

## Invite Operation

For a first alpha, keep invites manual:

- add tester email to `PROOFTICKET_ALLOWED_EMAILS`,
- redeploy or refresh env depending on host behavior,
- confirm the tester can sign in,
- remove the email to revoke future access.

This is intentionally simple. Full organization membership, roles, and invite tokens are not built yet.

## Data Controls

Current controls:

- authenticated account data export at `GET /api/profile/export`,
- deterministic ticket evidence export through `npm run proofticket:evidence`,
- soft-delete routes for tickets and responses,
- stored-input redaction for obvious secrets,
- audit log entries for important actions.

Alpha policy:

- treat exported evidence bundles as user data,
- do not publish screenshots or exports without tester approval,
- honor deletion requests manually until self-serve account deletion exists,
- rotate integration secrets if an invited tester loses access or a token is exposed.

Known gaps before public launch:

- no self-serve account deletion flow,
- no organization-level RBAC,
- no formal data retention settings,
- no paid-plan billing or payout movement.

## Launch Boundary

Hosted alpha can be described as:

> Invite-only prototype for structured agent handoffs and proof-of-work receipts.

Do not describe it as public, enterprise-ready, compliance-ready, or a replacement for issue trackers.

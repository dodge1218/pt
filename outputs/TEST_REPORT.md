# ProofTicket Test Report

Updated: 2026-05-27

## ProofTicket Finish Slice

- Reframed the project around public-safe ProofTicket naming.
- Removed remaining public references to the previous project name and private demo identities.
- Removed old private strategy docs from the tracked public package.
- Added `docs/DOCTRINE.md` and `docs/AGENT-HANDOFF-PROOFTICKET.md`.
- Added local receipt/evidence scripts:
  - `scripts/inspect-agent-action.mjs`
  - `scripts/export-ticket-evidence.mjs`
  - `scripts/lib/env.mjs`
  - `scripts/lib/redact.mjs`
- Added package scripts:
  - `npm run proofticket:agent`
  - `npm run proofticket:actions`
  - `npm run proofticket:action`
  - `npm run proofticket:receipt`
  - `npm run proofticket:evidence`
  - `npm run github:webhook:demo`
- Added signed GitHub webhook ingestion at `POST /api/webhooks/github`.
  - Supports `pull_request`, `push`, and `check_run`.
  - Requires `PROOFTICKET_GITHUB_WEBHOOK_SECRET`.
  - Creates private ProofTicket tickets with GitHub artifacts and idempotency.
  - Performs no GitHub write operations.
- Added GitHub webhook fixture and sender under `examples/github-webhook/`.
- Updated the five-minute demo to include:
  - spend/context receipt artifact in the sample payload,
  - action receipt inspection,
  - evidence bundle export,
  - optional signed GitHub PR event ingestion.
- Updated README positioning and command references around proof-of-work receipts and evidence bundles.
- Ran `npm audit fix`, which updated Next.js from `15.5.16` to `15.5.18` and cleared the high Next.js advisory.

## Local Postgres Slice

- Added `docker-compose.yml` for a local Postgres 16 database.
- Added `.env.postgres.example` and ignored `.env.postgres.local` through the existing `.env.*.local` rule.
- Added `prisma/schema.postgres.prisma` because Prisma database providers are schema-level, not only `DATABASE_URL`-level.
- Added `npm run setup:postgres` for Postgres generate/db-push/seed/preflight.
- Updated README, deployment notes, public-release checklist, and next-ticket status with SQLite vs Postgres setup.

## Agent Registration CLI Slice

- Added `npm run proofticket:agent-register`.
- Added `scripts/register-agent.mjs`.
- The CLI resolves an existing local owner by email or id, creates an agent, prints the raw `proofticket_...` key once, and stores only the SHA-256 digest.
- The CLI writes an `agent.register.local_cli` audit entry.
- Updated the five-minute demo to register a fresh local agent instead of relying on the seeded demo key.

## Stored-Input Redaction Slice

- Added `src/lib/redact.ts` for server-side stored-input redaction.
- Added `npm run smoke:redaction` and `scripts/smoke-redaction.ts`.
- Applied redaction before storage for:
  - authenticated ticket, response, comment, and artifact creation,
  - agent-submitted action payloads,
  - agent approval payload revisions,
  - OpenClaw/Hermes ticket webhook input,
  - OpenClaw/Hermes terminal approval revisions,
  - GitHub webhook mapped ticket/artifact content,
  - ContextClaw receipt and manifest artifact content/metadata.
- This is prospective only; it does not mutate existing database rows.

## API Reference Slice

- Added `docs/API.md`.
- Documented current local API routes and CLI-only flows for:
  - health,
  - agent registration/action creation,
  - terminal action list/approve/reject,
  - OpenClaw/Hermes ticket webhook,
  - GitHub webhook,
  - ContextClaw receipt/manifest ingest,
  - ticket artifacts,
  - delivery queue,
  - evidence export CLI.
- Linked the API reference from `README.md`.
- Marked Ticket 6 shipped in `NEXT_TICKETS.md`.

## MCP Adapter Slice

- Added `scripts/mcp-server.mjs` as a local stdio MCP adapter.
- Added `scripts/smoke-mcp-server.mjs` for MCP framing and tool discovery smoke coverage.
- Added package scripts:
  - `npm run mcp:server`
  - `npm run mcp:smoke`
- Added `docs/MCP.md`.
- Exposed thin wrappers over existing HTTP API routes for:
  - creating agent actions,
  - listing pending/resolved actions,
  - approving or rejecting actions,
  - attaching ticket artifacts with a session cookie.
- Linked the adapter docs from `README.md`.
- Marked Ticket 8 shipped in `NEXT_TICKETS.md`.

## Hosted Alpha Prep Slice

- Added `docs/ALPHA-DEPLOYMENT.md` as the invite-only hosted alpha runbook.
- Added `PROOFTICKET_ALLOWED_EMAILS` invite gating to Auth.js sign-in.
- Updated login copy for invite-only hosted alpha mode.
- Added `PROOFTICKET_ALLOWED_EMAILS` and GitHub webhook env coverage to examples/preflight.
- Refined `docs/DEPLOYMENT.md` with hosted alpha env, webhook secret, and Postgres migration guidance.
- Updated `docs/PUBLIC-RELEASE-CHECKLIST.md` with hosted alpha requirements.
- Updated README status and roadmap to stop listing shipped MCP/evidence/GitHub work as future work.
- Marked Tickets 1, 4, 7, 9, and 10 shipped in `NEXT_TICKETS.md`.

## CI Alpha Verification Slice

- Added Postgres Prisma schema validation to CI.
- Added MCP adapter smoke coverage to CI.
- Added redaction smoke coverage to CI.
- Added hosted-alpha-shaped production preflight to CI.
- Marked Ticket 11 shipped in `NEXT_TICKETS.md`.

## Verification

- `npm run proofticket:receipt -- --help` passed.
- `npm run proofticket:evidence -- --help` passed.
- `npm run setup:local` passed with approved permissions for `tsx` IPC.
- `npm run health` passed against the local dev server.
- `npm run proofticket:agent` created a pending ticket action from the five-minute demo fixture.
- `npm run proofticket:receipt` inspected the pending action receipt.
- `npm run proofticket:action` approved the pending action and created ticket `cmpmuirju0006twnpvuzztnpm`.
- `npm run proofticket:evidence` exported JSON and Markdown evidence for ticket `cmpmuirju0006twnpvuzztnpm`.
- `npm run github:webhook:demo` created GitHub PR ticket `cmpmukfke000btwnp3x8pfrua`.
- `npx prisma validate` passed.
- `DATABASE_URL=postgresql://... npx prisma validate --schema prisma/schema.postgres.prisma` passed.
- `docker compose config` passed.
- `docker compose up -d postgres` started a healthy local Postgres container.
- `npm run setup:postgres -- --skip-seed` pushed the schema to local Postgres and ran preflight.
- `docker compose stop postgres` stopped the local Postgres container after verification.
- `npx prisma generate` regenerated the default SQLite Prisma client after Postgres verification.
- `npm run proofticket:agent-register -- --help` passed.
- `npm run proofticket:agent-register -- --owner-email builder@example.com --name "Smoke CLI Agent" --json` created a local agent with a one-time key.
- `npm run proofticket:agent` created a pending action using the newly registered key.
- `npm run smoke:redaction` passed.
- `npx tsc --noEmit` passed.
- Placeholder/stale-claim scan for `docs/API.md` returned no matches.
- Full private-name/stale-claim scan across public docs, scripts, source, examples, Prisma, package metadata, and outputs returned no matches.
- Stale shipped-feature scan for old brand labels and completed roadmap items returned no matches.
- `npm run mcp:smoke` passed and discovered all four MCP tools.
- `npm run preflight` passed with expected local placeholder warnings for GitHub OAuth/auth/API secrets.
- `npm run preflight:production` passed with hosted-alpha-shaped env overrides.
- `DATABASE_URL=postgresql://... npx prisma validate --schema prisma/schema.postgres.prisma` passed after overriding the default SQLite `DATABASE_URL`.
- `npm run build` passed with Next.js `15.5.18`.
- `npm audit --audit-level=moderate --omit=dev` passed with `0 vulnerabilities`.
- `git diff --check` passed.

## Note

The default sandbox blocked the Next/PostCSS build worker from binding a local helper port. Running `npm run build` with approved escalated permissions completed successfully.

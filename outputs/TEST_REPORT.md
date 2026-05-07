# Test Report

Date: 2026-05-06

## Scope

Fix broken CSS baseline and verify Kairos remains buildable as the local AI coworking app.

## Checks

- `npx prisma validate` passed.
- `npm run build` passed.
- Compiled CSS check passed: no raw `@tailwind base`, `@tailwind components`, or `@tailwind utilities` directives remained in `.next/static/css`.
- Compiled CSS check passed: standard responsive width utility `.max-w-sm` was emitted.
- Production smoke checks passed against `http://localhost:3001`:
  - `/` returned `200`
  - `/login` returned `200`
  - `/tickets` returned `307` to `/login`
  - `/api/tickets?visibility=PUBLIC&limit=1` returned `200`
  - unauthenticated `/api/kairos/queue` returned `401`
- Mobile overflow probe passed at `390x844`: `documentElement.scrollWidth === 390`.
- Screenshot capture completed:
  - `outputs/ui-screenshots/home.png`
  - `outputs/ui-screenshots/login.png`
  - `outputs/ui-screenshots/home-mobile.png`

## Current Result

CSS baseline is fixed and production build/smoke/screenshot verification passes.

## 2026-05-06 Follow-up

- Added delivery queue wiring for the core async coworking paths:
  - bridge ticket creation queues `NEW_TICKET` deliveries for other bridge members
  - ticket responses queue `NEW_RESPONSE` deliveries for the ticket author and bridge members, excluding the responder
  - pending agent actions queue high-urgency `AGENT_ACTION_PENDING` delivery rows for the owning human
- Added project ownership validation to ticket creation when `projectId` is supplied by the form.
- Added `/api/kairos/queue`:
  - `GET` lists delivered unread queue items for the authenticated user
  - `PATCH` marks one delivery item read
  - `POST` processes due delivery rows for an authenticated local caller or a cron caller with `KAIROS_CRON_SECRET`
- Re-ran `npm run build`, `npx prisma validate`, CSS artifact checks, production smoke checks, and screenshot capture after these changes.

## 2026-05-07 Follow-up

- Added response comment creation:
  - `POST /api/responses/:id/comments`
  - ticket/bridge visibility checks match response access rules
  - comments queue `NEW_COMMENT` delivery rows for response/ticket/bridge recipients, excluding the commenter
  - ticket detail page now renders a comment form under each response
- Replaced the inline ticket-detail response script with the existing React `ResponseForm` component.
- Re-ran `npm run build`, `npx prisma validate`, and `npm audit --omit=dev` after these changes.
- Production smoke checks passed:
  - `/` returned `200`
  - `/api/tickets?visibility=PUBLIC&limit=1` returned `200`
  - unauthenticated `POST /api/responses/does-not-matter/comments` returned `401`

## 2026-05-07 Bridge Follow-up

- Added private bridge management:
  - `/bridges` page lists bridges, members, ticket counts, and owner state
  - bridge owners can add accepted friends to a bridge
  - bridge owners can remove non-self bridge members
  - solo owner bridges can now be created before inviting members
- Added `POST` and `DELETE` handlers at `/api/bridges/:id/members` with owner-only authorization.
- Re-ran `npm run build`, `npx prisma validate`, and `npm audit --audit-level=moderate --omit=dev` after these changes.
- Production smoke checks passed:
  - `/` returned `200`
  - `/bridges` returned `307` to `/login` when unauthenticated
  - unauthenticated `GET /api/bridges` returned `401`
  - unauthenticated `POST /api/bridges/does-not-matter/members` returned `401`

## 2026-05-07 Attribution Follow-up

- Added persistent agent attribution fields to comments so agent-created comments are not flattened into human-authored comments.
- Agent-created tickets, responses, and comments now surface the agent proxy name where it can be resolved.
- Agent action execution now stamps agent-created comments with `createdByAgent`, `agentProxyId`, `approvedBy`, and `approvedAt`.
- Re-ran `npx prisma db push`, `npm run build`, `npx prisma validate`, and `npm audit --audit-level=moderate --omit=dev` after these changes.
- Production smoke checks passed:
  - `/` returned `200`
  - `/public` returned `200`
  - `/tickets` returned `307` to `/login` when unauthenticated
  - unauthenticated `POST /api/responses/does-not-matter/comments` returned `401`

## 2026-05-07 Approval Queue Follow-up

- Replaced blind agent queue approval controls with a client review flow:
  - pending actions show a full editable JSON payload
  - humans can approve the revised payload, reset it, or reject the action
  - revised payloads are revalidated server-side before execution
  - history shows result links for ticket/response actions when resolvable
- Added an API guard so revised approval only applies to currently executable create action types.
- Re-ran `npm run build`, `npx prisma validate`, and `npm audit --audit-level=moderate --omit=dev` after these changes.
- Production smoke checks passed:
  - `/agent/queue` returned `307` to `/login` when unauthenticated
  - unauthenticated `GET /api/agent` returned `401`
  - unauthenticated `POST /api/agent` approve returned `401`
  - unauthenticated `POST /api/agent` reject returned `401`

## 2026-05-07 Inbox Follow-up

- Added `/inbox` for delivered smart-delivery items.
- Inbox items resolve links for tickets, responses, comments, agent approvals, matches, and friend requests where possible.
- Added client-side mark-read behavior backed by `PATCH /api/kairos/queue`.
- Sidebar now shows an unread inbox badge from delivered unread `SmartDelivery` rows.
- Re-ran `npm run build`, `npx prisma validate`, and `npm audit --audit-level=moderate --omit=dev` after these changes.
- Production smoke checks passed:
  - `/` returned `200`
  - `/inbox` returned `307` to `/login` when unauthenticated
  - unauthenticated `GET /api/kairos/queue` returned `401`
  - unauthenticated `PATCH /api/kairos/queue` returned `401`

## 2026-05-07 Audit Follow-up

- Added `AuditLog` persistence for enterprise-grade control-plane traceability.
- Added `/audit` for recent authenticated-user audit events.
- Added audit writes for:
  - agent registration
  - agent action creation
  - agent action approval, including revised-payload approvals
  - agent action rejection
  - bridge creation
  - bridge member add/remove
  - delivery mark-read and queue processing
- Re-ran `npx prisma db push`, `npm run build`, `npx prisma validate`, and `npm audit --audit-level=moderate --omit=dev` after these changes.
- Production smoke checks passed:
  - `/audit` returned `307` to `/login` when unauthenticated
  - unauthenticated `POST /api/bridges` returned `401`
  - unauthenticated `POST /api/agent` register returned `401`
  - unauthenticated `PATCH /api/kairos/queue` returned `401`

## 2026-05-07 Deployment Preflight Follow-up

- Added deployment documentation for Vercel + Supabase/Postgres.
- Normalized `.env.example` around the env names the code actually reads.
- Added `scripts/preflight.mjs` and npm scripts:
  - `npm run preflight`
  - `npm run preflight:production`
  - `prebuild` hook for build-time checks
- CI now runs `npm run preflight`.
- Verified:
  - `npm run preflight` exits `0` locally with warnings for placeholder local config
  - `npm run preflight:production` exits `1` for placeholder/local production config
  - `npm run build` passes with the new `prebuild` hook
  - `npx prisma validate` passed
  - `npm audit --audit-level=moderate --omit=dev` passed

## 2026-05-07 Seed Data Follow-up

- Made `prisma/seed.ts` rerunnable without duplicating the core demo bridge, Conductor agent, seed tickets, pending seed action, seed delivery, or seed audit row.
- Added accepted friendship seed data so bridge membership behavior matches the app's accepted-friends rule.
- Switched the demo agent to a hashed deterministic API key while still printing the raw demo key for local testing.
- Added a delivered inbox item and audit seed event so the inbox/audit features have demo state.
- Verified:
  - `npm run db:seed` passed twice consecutively
  - seed counts after repeated runs: 6 tickets, 1 demo bridge, 1 Conductor, 1 pending seed action, 1 seed delivery, 1 seed audit row
  - `npm run build` passed
  - `npx prisma validate` passed
  - `npm audit --audit-level=moderate --omit=dev` passed

## 2026-05-07 Rate Limit Follow-up

- Added baseline in-memory rate limiting for mutation endpoints:
  - `POST /api/agent`
  - `POST /api/tickets`
  - `POST /api/tickets/:id/responses`
  - `POST /api/responses/:id/comments`
  - `POST /api/bridges`
  - `POST` and `DELETE /api/bridges/:id/members`
- Rate-limit responses return `429`, `Retry-After`, and rate-limit headers.
- Re-ran `npm run build`, `npx prisma validate`, and `npm audit --audit-level=moderate --omit=dev` after these changes.
- Production smoke checks passed:
  - unauthenticated `POST /api/tickets` returned `401`
  - unauthenticated `POST /api/responses/does-not-matter/comments` returned `401`
  - unauthenticated `POST /api/bridges` returned `401`
  - malformed `POST /api/agent` returned `400`

## 2026-05-07 Demo Auth Follow-up

- Added optional local demo auth through a NextAuth Credentials provider.
- `ENABLE_DEMO_AUTH=true` shows a "Continue as demo user" login action that creates/reuses the seeded Ryan demo user.
- Production preflight rejects `ENABLE_DEMO_AUTH=true`.
- Verified:
  - `ENABLE_DEMO_AUTH=true npm run build` passed
  - demo-mode `/login` rendered both "Sign in with GitHub" and "Continue as demo user"
  - unauthenticated `/dashboard` still returned `307` to `/login`
  - `npm run build` passed without demo auth
  - production preflight with otherwise valid env and `ENABLE_DEMO_AUTH=true` exited `1`
  - `npx prisma validate` passed
  - `npm audit --audit-level=moderate --omit=dev` passed

## 2026-05-07 Ticket Edit/Delete Follow-up

- Added owner-only ticket edit controls on the ticket detail page.
- Owners can update title, content, type, status, visibility, and tags from the UI.
- Owners can archive tickets through the existing soft-delete API behavior.
- Added rate limiting to `PATCH /api/tickets/:id` and `DELETE /api/tickets/:id`.
- Added audit log writes for ticket update and ticket soft-delete events.
- Verified:
  - `npm run build` passed
  - `npx prisma validate` passed
  - `npm audit --audit-level=moderate --omit=dev` passed
  - public ticket list API returned `200`
  - public ticket detail page returned `200`
  - unauthenticated `/tickets` returned `307` to `/login`
  - unauthenticated `PATCH /api/tickets/does-not-matter` returned `401`
  - unauthenticated `DELETE /api/tickets/does-not-matter` returned `401`

## 2026-05-07 Artifact/Receipt Follow-up

- Added durable `TicketArtifact` storage for links, files, notes, ContextClaw manifests, and ContextClaw receipts.
- Added `GET` and `POST /api/tickets/:id/artifacts`.
- Added owner/bridge-member artifact attachment controls on ticket detail pages.
- Ticket detail pages now render artifact cards and aggregate ContextClaw receipt totals for spend, input tokens, output tokens, and context saved.
- Added rate limiting and audit logging for artifact creation.
- Verified:
  - `npx prisma format` passed
  - `npx prisma validate` passed
  - `npx prisma db push` passed and generated Prisma Client
  - `npm run build` passed
  - `npm audit --audit-level=moderate --omit=dev` passed
  - public ticket list API returned `200`
  - public artifact list API returned `200`
  - public ticket detail page returned `200`
  - unauthenticated `POST /api/tickets/does-not-matter/artifacts` returned `401`
  - unauthenticated `/tickets` returned `307` to `/login`

## 2026-05-07 ContextClaw Ingest Follow-up

- Added direct ContextClaw ingestion endpoints:
  - `POST /api/contextclaw/receipts`
  - `POST /api/contextclaw/manifests`
- Added `POST /api/webhooks/contextclaw` for typed `receipt` and `manifest` webhook payloads.
- Added `KAIROS_CONTEXTCLAW_SECRET` for local machine-to-machine ingestion.
- ContextClaw bearer calls must identify an existing user with `actorUserId` or `actorEmail`; session-authenticated calls use the signed-in user.
- Ingested receipts and manifests are stored as `TicketArtifact` rows and audit-logged.
- Verified:
  - `npm run build` passed
  - `npx prisma validate` passed
  - `npm audit --audit-level=moderate --omit=dev` passed
  - unauthenticated `POST /api/contextclaw/receipts` returned `401`
  - bearer-authenticated receipt ingest returned `201`
  - bearer-authenticated ContextClaw webhook manifest ingest returned `201`
  - smoke artifacts were visible in the local dev database

## 2026-05-07 Delivery Cron Follow-up

- Added `scripts/process-delivery-queue.mjs` for shell/cron processing of due delivery rows.
- Added `npm run queue:process`.
- Added `KAIROS_BASE_URL` env support so cron can target local, preview, or deployed Kairos.
- Documented cron env in README and deployment notes.
- Verified:
  - missing `KAIROS_CRON_SECRET` exits `1`
  - `npm run build` passed
  - `npx prisma validate` passed
  - `npm audit --audit-level=moderate --omit=dev` passed
  - `KAIROS_CRON_SECRET=test-cron-secret KAIROS_BASE_URL=http://localhost:3001 npm run queue:process` returned `200` with `{ "processed": 0 }`

## 2026-05-07 OpenClaw/Hermes Webhook Follow-up

- Added `POST /api/webhooks/openclaw` for signed OpenClaw/Hermes ticket creation.
- Added `KAIROS_OPENCLAW_SECRET`.
- Webhook payloads require an `idempotencyKey` and an existing `actorUserId` or `actorEmail`.
- Webhook-created tickets can include bridge/project scope, tags, mission/pass metadata, and up to 20 artifacts.
- Duplicate idempotency keys return the original ticket instead of creating another ticket.
- Webhook-created tickets are audit-logged and queued through smart delivery.
- Verified:
  - `npm run build` passed
  - `npx prisma validate` passed
  - `npm audit --audit-level=moderate --omit=dev` passed
  - unsigned webhook call returned `401`
  - signed webhook ticket creation returned `201`
  - duplicate signed webhook call returned `200` with `idempotent: true`
  - smoke-created ticket persisted one artifact and `createdByAgent: true`

## 2026-05-07 Dashboard Metrics Follow-up

- Added dashboard control-plane metrics for:
  - tracked ContextClaw spend
  - context saved tokens
  - active and visible ticket counts
  - decision resolution rate
  - pending agent actions and agent-created tickets
  - input/output token ledger
  - recent decision tickets
- Metrics are scoped to tickets authored by the current user or visible through bridge membership.
- Verified:
  - first `npm run build` caught nullable receipt accumulator typing; fixed with an explicit numeric accumulator
  - `npm run build` passed after the fix
  - `npx prisma validate` passed
  - `npm audit --audit-level=moderate --omit=dev` passed
  - unauthenticated `/dashboard` returned `307` to `/login`
  - `/` returned `200`

## 2026-05-07 Demo Artifact/Receipt Seed Follow-up

- Added deterministic seed artifacts for the demo dashboard:
  - ContextClaw manifest for the framework decision ticket
  - ContextClaw receipt for the framework decision ticket
  - OpenClaw handoff link for the resume-parser branch ticket
  - ContextClaw receipt for the weekly job scan ticket
- Seed artifacts include mission/pass metadata, budget decisions, included/excluded artifact IDs, model/provider fields, spend, and context-saved token counts.
- Verified:
  - `npm run db:seed` passed twice consecutively
  - deterministic seed artifact count: 4
  - deterministic seed receipt count: 2
  - deterministic seed manifest count: 1
  - deterministic seed context saved: 72,600 tokens
  - deterministic seed artifact spend field total: `$0.0472`
  - `npm run build` passed
  - `npx prisma validate` passed
  - `npm audit --audit-level=moderate --omit=dev` passed

## 2026-05-07 OpenClaw/Hermes Sender Follow-up

- Added `scripts/create-openclaw-ticket.mjs`.
- Added `npm run openclaw:ticket`.
- Sender supports:
  - flags for common terminal handoff fields
  - JSON stdin for artifacts and metadata
  - `KAIROS_BASE_URL`
  - `KAIROS_OPENCLAW_SECRET`
  - idempotent retries through the existing signed webhook
- Documented sender usage in README and deployment notes.
- Verified:
  - `npm run openclaw:ticket -- --help` passed
  - missing `KAIROS_OPENCLAW_SECRET` exits `1`
  - `npm run build` passed
  - `npx prisma validate` passed
  - `npm audit --audit-level=moderate --omit=dev` passed
  - sender created a ticket through local production server with JSON stdin artifact
  - duplicate sender call returned `200` with `idempotent: true`

## 2026-05-07 Terminal Agent Action Follow-up

- Added signed terminal approval endpoint:
  - `POST /api/webhooks/openclaw/agent-actions`
- Added `scripts/resolve-agent-action.mjs`.
- Added `npm run openclaw:action`.
- Terminal approvals/rejections require `KAIROS_OPENCLAW_SECRET` and an owning actor identified by `actorUserId` or `actorEmail`.
- Approve supports optional revised payload via JSON stdin.
- Verified:
  - `npm run openclaw:action -- --help` passed
  - missing `KAIROS_OPENCLAW_SECRET` exits `1`
  - `npm run build` passed
  - `npx prisma validate` passed
  - `npm audit --audit-level=moderate --omit=dev` passed
  - terminal approval returned `200` and created a result ticket
  - terminal rejection returned `200` with `status: rejected`

## 2026-05-07 Product Split Positioning Follow-up

- Added `docs/MARKET-WEDGE.md`.
- Added `docs/INTEROPERABILITY-ROADMAP.md`.
- Updated `docs/PUBLIC-RELEASE-CHECKLIST.md` so the new private positioning docs are reviewed before any public release.
- Documented the product boundary:
  - Kairos remains the standalone ticket layer for agentic work.
  - ContextClaw remains the standalone context/spend governance layer.
  - CodeBurn-like spend observability and Caveman-like compression stay adjacent, not part of the Kairos install reason.
  - Interoperability is delayed until both products are independently useful.
- Verified:
  - `npm run build` passed
  - `npx prisma validate` passed
  - `npm audit --audit-level=moderate --omit=dev` passed

## 2026-05-07 Generic Agent CLI + Artifact Follow-up

- Added `scripts/create-agent-action.mjs`.
- Added `npm run kairos:agent`.
- Generic agent CLI supports:
  - `CREATE_TICKET`
  - `CREATE_RESPONSE`
  - `CREATE_COMMENT`
  - `KAIROS_AGENT_API_KEY`
  - JSON stdin payloads
  - ticket artifacts on agent-created tickets
  - idempotency keys
- Extended generic agent-created tickets so approved `CREATE_TICKET` payloads can attach up to 20 artifacts.
- Kept OpenClaw/Hermes approval compatibility by adding the same artifact-aware ticket execution path to the signed terminal approval endpoint.
- Verified:
  - `npm run kairos:agent -- --help` passed
  - missing `KAIROS_AGENT_API_KEY` exits `1`
  - `npm run build` passed
  - `npm run db:seed` passed
  - `npx prisma validate` passed
  - `npm audit --audit-level=moderate --omit=dev` passed
  - generic CLI created pending action `cmovz8oh20001twja4h1gzuxa`
  - signed terminal approval returned `200` with result ticket `cmovz8swn0006twjak8yu3n1b`
  - local DB smoke confirmed the result ticket was agent-created and has one attached `NOTE` artifact titled `Smoke evidence`

## 2026-05-07 Terminal Agent Action List Follow-up

- Added signed terminal listing support to `GET /api/webhooks/openclaw/agent-actions`.
- Added `scripts/list-agent-actions.mjs`.
- Added `npm run kairos:actions`.
- Listing supports:
  - `KAIROS_OPENCLAW_SECRET`
  - `KAIROS_ACTOR_EMAIL` / `KAIROS_ACTOR_USER_ID`
  - `--status PENDING|APPROVED|REJECTED|ALL`
  - `--limit`
  - compact terminal output or `--json`
- Verified:
  - `npm run kairos:actions -- --help` passed
  - missing `KAIROS_OPENCLAW_SECRET` exits `1`
  - `npm run build` passed
  - `npm run db:seed` passed
  - `npx prisma validate` passed
  - `npm audit --audit-level=moderate --omit=dev` passed
  - local production server returned pending action `cmouvxxam000otwuzkpgbu719` through compact CLI output
  - local production server returned approved/rejected action history through `--json`

## 2026-05-07 Kairos-Native Agent Action Approval Follow-up

- Added `npm run kairos:action` as the Kairos-native terminal approve/reject command.
- Kept `npm run openclaw:action` as a backward-compatible alias.
- Added `KAIROS_AGENT_ACTION_SECRET` as the preferred secret for terminal action list/approval.
- Kept `KAIROS_OPENCLAW_SECRET` as a fallback for compatibility.
- Updated README and deployment docs with the Kairos-native terminal workflow.
- Verified:
  - initial `npm run kairos:action -- --help` caught a help-path initialization bug; fixed before ship
  - `npm run kairos:action -- --help` passed after the fix
  - missing `KAIROS_AGENT_ACTION_SECRET` and `KAIROS_OPENCLAW_SECRET` exits `1`
  - `npm run build` passed
  - `npm run db:seed` passed
  - `npx prisma validate` passed
  - `npm audit --audit-level=moderate --omit=dev` passed
  - local production server accepted `KAIROS_AGENT_ACTION_SECRET` for `kairos:actions --json`
  - local production server accepted `KAIROS_AGENT_ACTION_SECRET` for `kairos:action --decision approve`
  - terminal approval returned result ticket `cmow074az0001tw11rr75a977`

## Notes

- `NEXT_TICKET.md` was not present inside `kairos`; `BUILD-TICKET.md` was used as the local active ticket equivalent.
- npm reported 2 audit findings after dependency install. I did not run `npm audit fix --force` because it can introduce broad dependency churn unrelated to the CSS blocker.
- A stale `.next` build artifact was moved aside to `.next.bak-20260506-181612` instead of deleted.

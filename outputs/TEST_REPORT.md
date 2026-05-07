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

## Notes

- `NEXT_TICKET.md` was not present inside `kairos`; `BUILD-TICKET.md` was used as the local active ticket equivalent.
- npm reported 2 audit findings after dependency install. I did not run `npm audit fix --force` because it can introduce broad dependency churn unrelated to the CSS blocker.
- A stale `.next` build artifact was moved aside to `.next.bak-20260506-181612` instead of deleted.

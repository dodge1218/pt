# ProofTicket Next Tickets

Status: active private build plan.

## Current Baseline

ProofTicket now has:

- local setup command,
- health endpoint,
- CI build/Prisma/audit checks,
- ticket/detail/response flows,
- bridge/project scoping,
- first-class ticket artifacts,
- ContextClaw receipt ingestion/display,
- OpenClaw/Hermes ticket webhook,
- generic agent action CLI,
- terminal list/approve/reject commands,
- delivery queue worker.

The next work should make the project more runnable, more demoable, and more credible to professional devtools users.

## Ticket 1: Public-Safe Five-Minute Demo

Status: shipped in public demo slice.

Goal: make the core workflow understandable without reading the whole repo.

Build:

- [x] `examples/five-minute-demo/README.md`
- [x] a small shell script that prints the exact local demo commands
- [x] a sample JSON payload for an agent ticket with evidence
- [x] a sample approval command
- [x] references to `setup:local`, `proofticket:agent`, `proofticket:actions`, `proofticket:action`, and `health`

Acceptance:

- [x] no private names, emails, local paths, or strategy
- [x] demo uses generic actors and placeholder secrets
- [x] demo can be followed from fresh clone after `npm install`
- [x] `npm run build`, `npx prisma validate`, and audit pass

## Ticket 2: Docker Compose Postgres

Status: shipped in local Postgres slice.

Goal: make local setup closer to production without requiring Supabase.

Build:

- [x] `docker-compose.yml` with Postgres
- [x] `.env.postgres.example`
- [x] `prisma/schema.postgres.prisma`
- [x] `npm run setup:postgres`
- [x] docs for SQLite quickstart vs Postgres local
- [x] update setup docs without removing SQLite support

Acceptance:

- `docker compose up -d postgres` starts Postgres
- `DATABASE_URL` example works with Prisma through `prisma/schema.postgres.prisma`
- no existing SQLite workflow breaks

## Ticket 3: Agent Registration CLI

Status: shipped in local CLI slice.

Goal: remove the remaining browser-only setup step for agent demos.

Build:

- [x] demo-safe terminal registration flow
- [x] `npm run proofticket:agent-register`
- [x] prints one-time API key
- [x] documents that production registration remains authenticated

Acceptance:

- generated key is hashed at rest
- existing browser registration still works
- terminal demo can register a fresh local agent without manual DB edits

## Ticket 4: Agent Action Receipts

Status: shipped in receipt/evidence slice.

Goal: make every agent action inspectable as a durable receipt.

Build:

- [x] receipt JSON shape for pending/resolved actions
- [x] terminal command to inspect one action by id
- [x] UI display for payload, result id, approver, timestamps, agent, scope
- [x] optional artifact link to resulting ticket

Acceptance:

- [x] action receipt explains who/what/when/result
- [x] approval/rejection history remains available after resolution
- [x] no raw secrets displayed in receipt

## Ticket 5: Secret Redaction

Status: shipped in stored-input redaction slice.

Goal: reduce accidental leakage in tickets/artifacts before broader demos.

Build:

- [x] shared redaction helper
- [x] apply to terminal-submitted ticket content/artifact summaries
- [x] apply to webhook-created content where feasible
- [x] tests or smoke fixtures for common API keys/tokens

Acceptance:

- obvious secrets are masked before storage
- metadata still preserves enough context for audit
- no destructive mutation of existing rows

## Ticket 6: OpenAPI Reference

Status: shipped as `docs/API.md` API reference.

Goal: make ProofTicket usable by agents and developers without reading source.

Build:

- [x] `docs/API.md`
- [x] request/response examples for:
  - health
  - agent create action
  - terminal list/approve/reject
  - OpenClaw/Hermes ticket webhook
  - GitHub webhook
  - ContextClaw receipt/manifest ingest
  - ticket artifacts
  - delivery queue
  - evidence export CLI

Acceptance:

- examples match current routes
- auth/secret requirements are explicit
- docs avoid claims about features not built

## Ticket 7: GitHub Event Ingestion MVP

Status: shipped in GitHub webhook slice.

Goal: make ProofTicket sit next to real developer work.

Build:

- [x] signed GitHub webhook endpoint
- [x] minimal payload support for check failure, PR opened, branch pushed
- [x] creates ProofTicket STATUS or PROPOSAL ticket with repo/branch/PR artifacts

Acceptance:

- [x] webhook secret required
- [x] idempotency prevents duplicate event tickets
- [x] no GitHub write operations yet

## Ticket 8: MCP Adapter MVP

Status: shipped as local stdio adapter.

Goal: expose the existing API as tools for agent runtimes.

Build:

- [x] local MCP server wrapper
- tools:
  - [x] create ticket/action
  - [x] list pending actions
  - [x] approve/reject action
  - [x] attach artifact

Acceptance:

- [x] wrapper is thin over existing API
- [x] no direct DB writes
- [x] works with local server URL and secrets

## Ticket 9: Exportable Evidence Bundle

Status: shipped in receipt/evidence slice.

Goal: support professional review and audit trails.

Build:

- [x] export ticket with responses, comments, artifacts, audit entries, agent actions
- [x] JSON and markdown output
- [x] terminal script for local export

Acceptance:

- [x] export is deterministic
- [x] redaction applied
- [x] bundle links result ticket/action ids

## Ticket 10: Hosted Alpha Prep

Status: shipped as hosted alpha prep slice.

Goal: make deployment credible after local proof.

Build:

- [x] Postgres migration deploy docs
- [x] invite-only access mode
- [x] export/delete controls plan
- [x] production env checklist refinement

Acceptance:

- [x] no public launch claims
- [x] deployment path is documented
- [x] private repo guardrails remain clear

## Build Rule

Ship one ticket at a time. For each ticket:

1. implement the smallest useful slice,
2. update docs,
3. update `outputs/TEST_REPORT.md`,
4. run build, Prisma validate, and audit,
5. commit,
6. push,
7. wait for CI.

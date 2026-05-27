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

Goal: make the core workflow understandable without reading the whole repo.

Build:

- `examples/five-minute-demo/README.md`
- a small shell script that prints the exact local demo commands
- a sample JSON payload for an agent ticket with evidence
- a sample approval command
- references to `setup:local`, `proofticket:agent`, `proofticket:actions`, `proofticket:action`, and `health`

Acceptance:

- no private names, emails, local paths, or strategy
- demo uses generic actors and placeholder secrets
- demo can be followed from fresh clone after `npm install`
- `npm run build`, `npx prisma validate`, and audit pass

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

Goal: make every agent action inspectable as a durable receipt.

Build:

- receipt JSON shape for pending/resolved actions
- terminal command to inspect one action by id
- UI display for payload, result id, approver, timestamps, agent, scope
- optional artifact link to resulting ticket

Acceptance:

- action receipt explains who/what/when/result
- approval/rejection history remains available after resolution
- no raw secrets displayed in receipt

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

Goal: make ProofTicket sit next to real developer work.

Build:

- signed GitHub webhook endpoint
- minimal payload support for check failure, PR opened, branch pushed
- creates ProofTicket STATUS or PROPOSAL ticket with repo/branch/PR artifacts

Acceptance:

- webhook secret required
- idempotency prevents duplicate event tickets
- no GitHub write operations yet

## Ticket 8: MCP Adapter MVP

Goal: expose the existing API as tools for agent runtimes.

Build:

- local MCP server wrapper
- tools:
  - create ticket/action
  - list pending actions
  - approve/reject action
  - attach artifact

Acceptance:

- wrapper is thin over existing API
- no direct DB writes
- works with local server URL and secrets

## Ticket 9: Exportable Evidence Bundle

Goal: support professional review and audit trails.

Build:

- export ticket with responses, comments, artifacts, audit entries, agent actions
- JSON and markdown output
- terminal script for local export

Acceptance:

- export is deterministic
- redaction applied
- bundle links result ticket/action ids

## Ticket 10: Hosted Alpha Prep

Goal: make deployment credible after local proof.

Build:

- Postgres migration deploy docs
- invite-only access mode
- export/delete controls plan
- production env checklist refinement

Acceptance:

- no public launch claims
- deployment path is documented
- private repo guardrails remain clear

## Build Rule

Ship one ticket at a time. For each ticket:

1. implement the smallest useful slice,
2. update docs,
3. update `outputs/TEST_REPORT.md`,
4. run build, Prisma validate, and audit,
5. commit,
6. push,
7. wait for CI.

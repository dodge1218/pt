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
- signed machine-webhook ingestion,
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
  - signed machine-webhook ingestion
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

## Ticket 11: CI Alpha Verification

Status: shipped as CI hardening slice.

Goal: make CI prove the same alpha-critical checks used locally.

Build:

- [x] Postgres Prisma schema validation in CI
- [x] MCP adapter smoke in CI
- [x] redaction smoke in CI
- [x] hosted-alpha-shaped production preflight in CI

Acceptance:

- [x] CI still keeps SQLite quickstart validation
- [x] production preflight does not rely on local secrets
- [x] checks avoid networked database access

## Ticket 12: Account Export MVP

Status: shipped as self-serve export slice.

Goal: give alpha users a non-destructive data control before hosted testing.

Build:

- [x] authenticated account export endpoint
- [x] Settings export link
- [x] redacted JSON bundle with profile, authored content, agents, deliveries, and audit events
- [x] no OAuth/session token export

Acceptance:

- [x] export requires a signed-in user
- [x] export does not include raw agent API keys
- [x] destructive account deletion remains out of scope

## Ticket 13: Deletion Request MVP

Status: shipped as alpha deletion-request slice.

Goal: give alpha users an in-app deletion request path without unsafe destructive deletion.

Build:

- [x] authenticated deletion-request endpoint
- [x] Settings request form
- [x] audit event for manual operator processing
- [x] confirmation phrase guardrail

Acceptance:

- [x] request requires a signed-in user
- [x] request is rate-limited
- [x] shared records are not immediately deleted or anonymized

## Ticket 14: Deletion Request Operator CLI

Status: shipped as alpha operator tooling slice.

Goal: let an alpha operator review account deletion requests without adding admin UI yet.

Build:

- [x] local CLI for `account.deletion_request` audit events
- [x] human-readable and JSON output
- [x] redacted request metadata
- [x] alpha docs reference

Acceptance:

- [x] CLI does not delete data
- [x] CLI reads existing audit log state
- [x] no hosted admin privileges are introduced

## Ticket 15: Demo Readiness Gate

Status: shipped as local readiness gate slice.

Goal: make public demo/submission drift easy to catch.

Build:

- [x] `npm run demo:readiness`
- [x] required docs/examples/scripts presence check
- [x] required package-script check
- [x] private/stale string scan
- [x] CI coverage

Acceptance:

- [x] no app server required
- [x] command fails on missing demo-critical files
- [x] command fails on forbidden private/stale strings

## Ticket 16: Submission Packet

Status: shipped as submission handoff slice.

Goal: make the project easy to present without inventing claims during submission.

Build:

- [x] one-liner and short description
- [x] five-minute demo story
- [x] built-feature list
- [x] claims boundary
- [x] asset checklist
- [x] verification command set

Acceptance:

- [x] no public launch overclaim
- [x] no private names or local paths
- [x] included in demo readiness gate

## Ticket 17: Demo Asset Manifest

Status: shipped as asset inventory slice.

Goal: make current visual assets explicit and catch missing baseline screenshots.

Build:

- [x] `docs/DEMO-ASSETS.md`
- [x] list current screenshot files and purpose
- [x] note missing workflow screenshots before external submission
- [x] include existing screenshots in demo readiness gate

Acceptance:

- [x] no private screenshot claims
- [x] no external-hosting requirement
- [x] missing baseline screenshots fail readiness

## Ticket 18: Devpost Draft

Status: shipped as submission-copy slice.

Goal: make external submission copy ready without inventing claims under time pressure.

Build:

- [x] Devpost-style project name and tagline
- [x] inspiration/problem copy
- [x] what-it-does section
- [x] how-it-was-built section
- [x] challenges, accomplishments, lessons, next steps
- [x] built-with list and demo commands

Acceptance:

- [x] no deadline or prize claims
- [x] no public launch overclaim
- [x] included in demo readiness gate

## Ticket 19: Public GitHub and Article Prep

Status: shipped as public-surface prep.

Goal: make the repository and article draft credible without leaking private planning material or overclaiming readiness.

Build:

- [x] public article draft
- [x] README verification copy with DevOps-level command set
- [x] public release checklist refresh
- [x] public-facing machine-webhook wording
- [x] old strategy/planning docs removed from the public tree

Acceptance:

- [x] article is linked from README
- [x] included in demo readiness gate
- [x] no public launch overclaim
- [x] repo visibility remains private until repository rename/public flip is explicit

## Ticket 20: Finish-Up-A-Thon Packaging

Status: in progress as finish-up-a-thon submission slice.

Goal: make the repo read clearly as a revived, intentionally finished old project without drifting into the wrong hackathon framing.

Build:

- [x] capture the explicit finish-up-a-thon prompt/context inside the repo
- [x] audit existing submission surfaces against the local repo and public `ProofTicket` naming
- [ ] add a dedicated finish-up-a-thon packaging brief that consolidates story, claims boundary, asset needs, and next submission steps
- [ ] refresh README/docs links so this lane is easy to find from the repo root
- [ ] keep local verification and public naming clean after edits

Acceptance:

- [ ] no wrong-hackathon framing in the active ProofTicket submission path
- [ ] finish-up-a-thon story is documented in one obvious place
- [ ] public name stays ProofTicket consistently across public-facing materials
- [ ] repo docs stay aligned on prototype-not-fully-launched positioning

## Build Rule

Ship one ticket at a time. For each ticket:

1. implement the smallest useful slice,
2. update docs,
3. update `outputs/TEST_REPORT.md`,
4. run build, Prisma validate, and audit,
5. commit,
6. push,
7. wait for CI.

# Devpost Draft

Status: draft copy for a "finish an old project" style submission.

## Project Name

ProofTicket

## Tagline

Structured handoffs and proof-of-work receipts for human and AI coworkers.

## Inspiration

AI coding agents are useful, but their work often disappears into terminal scrollback, chat history, or private notes. When a human comes back later, it is hard to tell what was proposed, what was approved, what evidence was attached, and whether the work was worth trusting.

ProofTicket was revived to make agent work auditable. Instead of treating agents like chat participants, it treats their work like operations work: scoped requests, human approval, durable tickets, receipts, artifacts, and exportable evidence.

## What It Does

ProofTicket lets humans and AI agents coordinate through structured tickets:

- agents submit typed actions,
- humans approve or reject pending work,
- approved work becomes durable shared project context,
- tickets can include artifacts, spend/context receipts, and GitHub event evidence,
- reviewers can export deterministic evidence bundles later.

The app includes local-first setup, a browser UI, CLI workflows, signed webhooks, GitHub event ingestion, account data export, alpha deletion-request capture, and a local MCP adapter.

## How We Built It

ProofTicket is a Next.js app with Prisma models for users, tickets, bridges, projects, agents, delivery queues, artifacts, audit logs, and matches. The local default uses SQLite for fast demos, while a separate Postgres schema and Docker Compose profile support production-like development.

The agent workflow is API-first:

- registered agents get one-time API keys,
- keys are stored as SHA-256 digests,
- agent actions are validated and queued,
- humans approve or reject actions from the UI or terminal,
- resulting tickets/responses/comments keep agent attribution and audit history.

The repo also includes:

- signed webhook routes,
- GitHub PR/push/check-run ingestion,
- deterministic evidence export,
- local MCP stdio adapter,
- CI gates for build, Prisma, audit, redaction, MCP smoke, production preflight, and demo readiness.

## Challenges

The hard part was cutting the old project down into a coherent public-safe product. There were many adjacent ideas: collaboration matching, context manifests, payouts, ZK proofs, GitHub sync, and hosted SaaS controls. The finished slice focuses on the smallest serious workflow: agent proposes work, human approves it, evidence is attached, and the result can be audited later.

Another challenge was avoiding overclaiming. ProofTicket is not presented as enterprise-ready or compliance-ready. It is an invite-ready prototype with clear local setup, data controls, and documented boundaries.

## Accomplishments

- Finished a coherent local demo path.
- Added agent registration and approval workflows.
- Added deterministic evidence exports.
- Added signed GitHub and machine webhook ingestion.
- Added local MCP adapter for agent runtimes.
- Added account export and deletion-request capture for alpha data controls.
- Added hosted-alpha deployment docs and invite gating.
- Added CI and local readiness gates so the demo does not silently drift.

## What We Learned

The main lesson is that agent collaboration needs boring primitives before it needs bigger autonomy: identity, scoped permissions, receipts, approval queues, audit logs, and exports. A clean handoff record is often more valuable than a smarter chat surface.

## What's Next

Near-term:

- capture workflow screenshots and a short demo video,
- validate the hosted alpha path with invited testers,
- add richer MCP examples,
- improve GitHub issue/PR write-back,
- add organization and RBAC models.

Deferred:

- billing,
- payout movement,
- production ZK proofs,
- compliance claims,
- full self-serve account deletion.

## Built With

- Next.js
- React
- Prisma
- SQLite
- Postgres
- Docker Compose
- Auth.js / NextAuth
- GitHub webhooks
- MCP-style stdio JSON-RPC
- TypeScript

## Demo Commands

```bash
npm install
npm run setup:local
npm run dev
```

In another terminal:

```bash
bash examples/five-minute-demo/print-demo-commands.sh
```

Before submitting:

```bash
npm run demo:readiness
npm run build
npm audit --audit-level=moderate --omit=dev
```

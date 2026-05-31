# Finishing ProofTicket: Turning Agent Work Into Auditable Tickets

AI agents are getting better at doing pieces of developer work, but the surrounding workflow is still messy. A useful agent run often ends as a terminal scrollback, a chat thread, a half-written note, or a branch with no durable explanation of what happened. That is fine for experiments. It is not enough for teams that need to review work, approve changes, refund contributors, or reconstruct why a decision was made.

ProofTicket is a local-first ticketing surface for human and AI coworking. The core idea is simple: agent work should become structured project state before it becomes trusted project state.

The public repo is here: https://github.com/dodge1218/pt

Instead of treating an agent like another chat participant, ProofTicket treats the agent like an operational actor. It can submit a typed action. The action is validated. A human can approve or reject it. If approved, the result becomes a durable ticket, response, comment, artifact, audit entry, or evidence bundle that can be inspected later.

## Why Tickets, Not Chat

Chat is good for exploration. It is weak as an audit trail.

When a project has multiple people or agents involved, the important questions are rarely "what did the model say?" The important questions are:

- what was requested,
- who requested it,
- what evidence was attached,
- what was approved,
- what changed durable project state,
- what can be exported later for review.

ProofTicket is built around those questions. It keeps the human approval step explicit and gives agents a narrow surface for creating work without giving them unbounded authority.

## What Is Built

The current ProofTicket prototype includes:

- structured tickets, responses, comments, projects, bridges, and a public board,
- agent registration with one-time API keys and hashed key storage,
- an agent action queue with approve/reject flow,
- terminal commands for registration, action creation, action review, receipt inspection, and evidence export,
- deterministic ticket evidence bundles in JSON and Markdown,
- signed GitHub PR, push, and check-run ingestion,
- signed machine-webhook ingestion,
- a local MCP adapter for agent runtimes,
- account data export and alpha deletion-request capture,
- SQLite quickstart plus a Postgres Docker Compose profile,
- hosted-alpha preflight and invite-gate documentation,
- CI coverage for build, Prisma validation, audit, redaction smoke, MCP smoke, production preflight, and demo readiness.

It is still intentionally bounded. ProofTicket is not claiming public SaaS readiness, enterprise RBAC, compliance certification, live payouts, billing, GitHub write-back, or production ZK proofs. Those are future product surfaces. The finished slice proves the workflow: an agent proposes work, a human approves it, evidence is attached, and the result can be audited later.

## The Five-Minute Demo

The local demo path is designed to be boring in the best way:

1. Start ProofTicket locally.
2. Register a local agent.
3. Submit an agent-created ticket with evidence.
4. Inspect the pending action receipt.
5. Approve the action.
6. Open the resulting ticket.
7. Export the ticket evidence bundle.
8. Optionally ingest a signed GitHub pull-request fixture.

That flow shows the product thesis without needing a hosted account, a production database, or a live third-party integration.

## Why This Matters

As agent work becomes normal, teams will need more than prompts and screenshots. They will need identity, scoped permissions, approval queues, durable receipts, evidence export, and clean boundaries between suggestion and authority.

ProofTicket is a step toward that operating model. It gives human and AI coworkers a shared work surface where the work can be reviewed later without replaying the whole session.

The immediate next steps are screenshots, a short demo video, invited hosted-alpha testing, richer MCP examples, and deeper GitHub issue/PR workflows.

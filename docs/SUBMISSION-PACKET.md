# ProofTicket Submission Packet

Status: private working packet for demo/submission preparation.

## One-Liner

ProofTicket turns AI-agent work into scoped tickets, human approvals, durable receipts, and exportable evidence bundles.

## Short Description

ProofTicket is a local-first ticketing surface for human and AI coworking. Agents can request structured work actions, humans approve or reject them, and the resulting tickets keep the decision, evidence, artifacts, and audit trail in one place.

It is not a chatbot or a project-manager wrapper. The core primitive is an auditable work ticket that can be read later by a person, local agent, remote agent, or reviewer without replaying a whole terminal or chat transcript.

## Demo Story

The clean demo is a five-minute terminal-to-browser flow:

1. Start ProofTicket locally.
2. Register a local agent.
3. Submit an agent-created ticket with evidence.
4. List the pending action.
5. Inspect the action receipt.
6. Approve the action.
7. Open the resulting ticket in the app.
8. Export the ticket evidence bundle.
9. Optionally ingest a signed GitHub pull-request fixture.

Runbook:

```bash
bash examples/five-minute-demo/print-demo-commands.sh
```

## Built Features To Show

- Local Next.js app with GitHub OAuth and local demo auth.
- Structured tickets, responses, comments, projects, bridges, and public board.
- Agent registration with one-time API keys and hashed key storage.
- Agent action queue with approve/reject flow.
- Agent action receipt inspection.
- Ticket artifacts and ContextClaw receipt/manifest ingestion.
- Deterministic ticket evidence export as JSON/Markdown.
- Authenticated account data export.
- Account deletion request capture for alpha operations.
- Signed OpenClaw/Hermes webhook ingestion.
- Signed GitHub PR/push/check-run webhook ingestion.
- Local MCP stdio adapter for agent runtimes.
- Local Postgres Docker Compose profile.
- Hosted-alpha invite gate with `PROOFTICKET_ALLOWED_EMAILS`.
- CI checks for build, Prisma, Postgres schema, MCP smoke, redaction smoke, production preflight, audit, and demo readiness.

## Claims Boundary

Safe claims:

- Local-first prototype.
- Invite-only hosted alpha ready with documented guardrails.
- Agent actions are approval-gated unless a registered agent is configured otherwise.
- Evidence bundles are deterministic and redacted before output.
- Machine endpoints use bearer secrets or signed webhook secrets.
- CI verifies demo-critical checks.

Do not claim:

- Public SaaS launch readiness.
- Enterprise RBAC or org administration.
- Compliance certification.
- GitHub write-back.
- Live billing, payout movement, or automatic refund allocation.
- Production ZK proofs.
- Full self-serve account deletion.

## Judge-Relevant Differentiators

- It treats agent work as operations work, not chat.
- It makes human approval explicit before durable shared state changes.
- It creates receipts and exportable evidence, which are useful for review, refunds, audits, and handoffs.
- It is designed for local/private repos and security-sensitive work before hosted scale.
- It has actual integration surfaces: CLI, HTTP APIs, signed webhooks, GitHub ingestion, and MCP adapter.

## Asset Checklist

Required before external submission:

- README link.
- Five-minute demo commands.
- Devpost draft: `docs/DEVPOST-DRAFT.md`.
- Current asset inventory: `docs/DEMO-ASSETS.md`.
- One screenshot of dashboard or ticket detail.
- One screenshot of agent queue or receipt.
- One exported evidence bundle sample with private data removed.
- Repository URL or private access instructions.
- Short video or GIF if the platform expects visual proof.

Optional:

- Screenshot of MCP smoke output.
- Screenshot of GitHub fixture ingestion.
- Hosted alpha URL if invite-gated and stable.

## Verification Command Set

Run before packaging:

```bash
npm run demo:readiness
npm run preflight
npx prisma validate
DATABASE_URL="postgresql://proofticket:proofticket@example.com:5432/proofticket" npx prisma validate --schema prisma/schema.postgres.prisma
npm run mcp:smoke
npm run smoke:redaction
npm audit --audit-level=moderate --omit=dev
npm run build
```

For hosted alpha:

```bash
DATABASE_URL="postgresql://..." \
AUTH_URL="https://your-alpha-domain.example" \
NEXTAUTH_URL="https://your-alpha-domain.example" \
AUTH_SECRET="long-random-secret" \
NEXTAUTH_SECRET="long-random-secret" \
GITHUB_CLIENT_ID="..." \
GITHUB_CLIENT_SECRET="..." \
ENABLE_DEMO_AUTH=false \
PROOFTICKET_ALLOWED_EMAILS="builder@example.com" \
npm run preflight:production
```

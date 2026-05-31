# ProofTicket

Structured handoffs and proof-of-work receipts for human and AI coworkers.

ProofTicket is a local-first ticketing surface for teams that use coding agents, shell agents, background jobs, review queues, or other machine actors. It turns agent work into scoped tickets, human approvals, durable receipts, artifacts, and exportable evidence bundles.

It is not a chatbot, a Jira clone, or an "AI project manager" wrapper. The core primitive is a work ticket that can be reviewed later without replaying an entire chat transcript or terminal session.

## Status

ProofTicket is a finished prototype and hosted-alpha candidate. It is ready for local demos and review, but it is not presented as a public SaaS, compliance product, or enterprise RBAC system.

Built:

- Next.js 15 app with Prisma models for users, tickets, bridges, projects, agents, deliveries, audit logs, and artifacts.
- GitHub OAuth through Auth.js / NextAuth.
- Structured ticket, response, comment, project, bridge, and public-board flows.
- Agent registration with one-time API keys and SHA-256 key digests at rest.
- Agent action queue with approve/reject flow.
- Agent action receipts and deterministic ticket evidence exports.
- Signed machine-webhook and GitHub PR/push/check-run ingestion.
- Local MCP stdio adapter for agent runtimes.
- SQLite quickstart plus local Postgres Docker Compose profile.
- Hosted-alpha invite gate, account export, and deletion-request capture.
- CI/local checks for build, Prisma, audit, redaction smoke, MCP smoke, production preflight, and demo readiness.

Not built yet:

- hosted multi-tenant launch
- org-level RBAC and admin controls
- GitHub issue/PR write-back
- billing, payouts, or compliance certification
- production zero-knowledge proofs

## Why It Exists

Agent workflows usually fail at the handoff layer:

- context lives in terminal scrollback or chat history,
- decisions are mixed with brainstorming,
- humans cannot quickly audit what was requested or approved,
- evidence is scattered across logs, screenshots, files, and branches,
- agents can act, but their authority boundaries are unclear.

ProofTicket treats agent work like operations work: typed requests, scoped permissions, explicit approval, delivery windows, durable receipts, and exportable evidence.

## Core Workflow

1. An actor submits a typed action.
2. ProofTicket validates scope and payload.
3. The action becomes a pending ticketed event.
4. A human or trusted policy approves or rejects it.
5. Approved work becomes durable project context.
6. Other humans or agents can inspect the ticket, receipt, artifacts, and audit trail later.

## Quickstart

SQLite local demo:

```bash
npm install
npm run setup:local
npm run dev
```

Health check:

```bash
npm run health
```

Five-minute local workflow:

```bash
bash examples/five-minute-demo/print-demo-commands.sh
```

Full walkthrough: [examples/five-minute-demo/README.md](examples/five-minute-demo/README.md)

## Local Postgres

```bash
docker compose up -d postgres
npm run setup:postgres
set -a; . ./.env.postgres.local; set +a
npm run dev
```

If you switch back from Postgres to SQLite, regenerate the default Prisma client:

```bash
npm run setup:local -- --skip-seed
```

## Useful Commands

Register a local demo agent:

```bash
npm run proofticket:agent-register -- \
  --owner-email builder@example.com \
  --name "Local Demo Agent"
```

Create an agent action:

```bash
cat examples/five-minute-demo/agent-ticket-with-evidence.json \
  | npm run proofticket:agent -- \
    --type CREATE_TICKET \
    --idempotency-key demo:agent:evidence:001
```

List pending actions:

```bash
npm run proofticket:actions -- \
  --actor-email builder@example.com \
  --status PENDING
```

Inspect an action receipt:

```bash
npm run proofticket:receipt -- --action-id <agent-action-id>
```

Approve an action:

```bash
npm run proofticket:action -- \
  --decision approve \
  --action-id <agent-action-id> \
  --actor-email builder@example.com
```

Export ticket evidence:

```bash
npm run proofticket:evidence -- --ticket-id <ticket-id>
```

Run the local MCP adapter:

```bash
npm run mcp:server
```

## Verification

```bash
npm run demo:readiness
npm run preflight
npx prisma validate
DATABASE_URL="postgresql://proofticket:proofticket@example.com:5432/proofticket" npx prisma validate --schema prisma/schema.postgres.prisma
npm run mcp:smoke
npm run smoke:redaction
npm run build
npm audit --audit-level=moderate --omit=dev
```

Latest local verification notes: [outputs/TEST_REPORT.md](outputs/TEST_REPORT.md)

## Documentation

- [API reference](docs/API.md)
- [Architecture](docs/ARCHITECTURE.md)
- [MCP Adapter](docs/MCP.md)
- [Deployment Notes](docs/DEPLOYMENT.md)
- [Hosted alpha runbook](docs/ALPHA-DEPLOYMENT.md)
- [Public Release Checklist](docs/PUBLIC-RELEASE-CHECKLIST.md)
- [Submission Packet](docs/SUBMISSION-PACKET.md)
- [Devpost Draft](docs/DEVPOST-DRAFT.md)
- [Public Article Draft](docs/ARTICLE.md)
- [Demo Asset Inventory](docs/DEMO-ASSETS.md)

## Design Principles

- **Tickets over chat**: chat is useful for exploration, but weak as durable state.
- **Approval before authority**: agents can propose work; humans or policy gates decide what becomes shared state.
- **Evidence travels with the work**: tickets can carry artifacts, receipts, and audit entries.
- **Local-first before SaaS**: the workflow needs to work for private repos and security-sensitive work before hosted scale.
- **Boring infrastructure wins**: typed APIs, audit logs, queues, explicit permissions, and deterministic exports.

## License

MIT

# ProofTicket

Structured handoffs and proof-of-work receipts for human and AI coworkers.

ProofTicket is an experimental A2A ticketing system for teams that already use coding agents, shell agents, background jobs, and review queues. It is not a chatbot, a Jira clone, or another "AI project manager" wrapper. The core primitive is a durable work ticket that can be read by a person, a local agent, or a remote agent without replaying an entire chat transcript.

The current app is a local-first Next.js prototype. It is meant to prove the workflow before adding hosted multi-tenant infrastructure.

## Why This Exists

Most agent workflows break in the same places:

- context lives in a terminal scrollback or chat session
- decisions are mixed with brainstorming
- agents can act, but humans cannot audit intent quickly
- handoffs require pasting large context blobs into another model
- cost, approvals, and provenance are afterthoughts
- "agent collaboration" usually means another unstructured message bus

ProofTicket treats agent work like operations work: typed tickets, scoped permissions, approvals, delivery windows, durable receipts, and exportable evidence.

## What ProofTicket Does

- **Tickets**: structured units of work with type, status, visibility, tags, author, bridge, and project context.
- **Responses**: explicit positions such as agree, disagree, counter-proposal, neutral, or question.
- **Bridges**: private coordination spaces for a person, another person, and their agents.
- **Agent proxies**: API-keyed agents can request ticket, response, or comment actions.
- **Human approval queue**: agent-created work is queued before it becomes durable shared state.
- **Proof receipts**: agent actions and ticket artifacts can be inspected as evidence.
- **Evidence bundles**: tickets can be exported as deterministic JSON and Markdown bundles.
- **Smart delivery**: updates are queued and delivered according to each user's active window.
- **Public board**: public tickets for discovery and collaboration.
- **GitHub event ingestion**: signed PR, push, and check-run events can become ProofTicket tickets.

## The A2A Shape

ProofTicket is designed around a simple contract:

1. An actor submits a typed action.
2. ProofTicket validates scope and payload.
3. The action becomes a pending ticketed event.
4. A human or trusted policy approves it.
5. The result is written as durable project context.
6. Other humans or agents consume the ticket later with minimal context replay.

This gives agents a shared work surface without giving them unbounded authority.

## Current Status

Implemented:

- Next.js 15 app shell
- Prisma schema for users, tickets, bridges, projects, agents, delivery, profiles, and matches
- GitHub OAuth via NextAuth
- ticket creation/list/detail flows
- response flow
- public board
- bridge-scoped tickets
- agent registration and approval queue
- hashed API keys for newly registered agents
- typed agent payload validation
- idempotency keys for agent action creation
- delivery queue wiring for tickets, responses, and pending agent actions
- `/api/proofticket/queue` for delivery polling/read/process behavior
- delivery inbox and unread badge
- control-plane audit log
- ContextClaw receipt and manifest ingestion
- local agent action receipt inspector
- deterministic ticket evidence bundle export
- signed OpenClaw/Hermes webhook ingestion
- signed GitHub PR/push/check-run webhook ingestion
- CI for build, Prisma validation, and dependency audit

Still early:

- no hosted multi-tenant deployment yet
- no production RBAC model yet
- no GitHub write-back or full issue/PR bridge yet
- no MCP/A2A protocol adapter yet
- no live payout movement, billing, orgs, or enterprise admin controls yet

## Local Development

SQLite quickstart:

```bash
npm install
npm run setup:local
npm run dev
```

`setup:local` creates `.env` from `.env.example` only when `.env` is missing, then runs Prisma generate, DB push, seed, and preflight.

Postgres local setup:

```bash
docker compose up -d postgres
npm run setup:postgres
set -a; . ./.env.postgres.local; set +a
npm run dev
```

`setup:postgres` creates `.env.postgres.local` from `.env.postgres.example` only when missing, then runs Prisma generate and DB push with `prisma/schema.postgres.prisma`. The default SQLite workflow remains the fastest path for local demos.

If you switch back from Postgres to SQLite, rerun `npm run setup:local -- --skip-seed` or `npx prisma generate` so the generated Prisma client matches the default schema again.

Health check after the server starts:

```bash
npm run health
```

Five-minute local workflow:

```bash
bash examples/five-minute-demo/print-demo-commands.sh
```

Agent ticket submission example:

```bash
cat examples/five-minute-demo/agent-ticket-with-evidence.json \
  | npm run proofticket:agent -- --type CREATE_TICKET --idempotency-key demo:agent:evidence:001
```

Full walkthrough: `examples/five-minute-demo/README.md`.

Inspect an agent action receipt:

```bash
npm run proofticket:receipt -- --action-id <agent-action-id>
```

Export a ticket evidence bundle:

```bash
npm run proofticket:evidence -- --ticket-id <ticket-id>
```

Default local database:

```env
DATABASE_URL="file:./dev.db"
```

Postgres local database:

```env
DATABASE_URL="postgresql://proofticket:proofticket_dev_password@localhost:5432/proofticket?schema=public"
```

Required for GitHub OAuth:

```env
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="change-me"
AUTH_URL="http://localhost:3000"
AUTH_SECRET="change-me"
GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."
```

Optional for delivery cron:

```env
PROOFTICKET_CRON_SECRET="..."
PROOFTICKET_BASE_URL="http://localhost:3000"
```

Optional for ContextClaw ingestion:

```env
PROOFTICKET_CONTEXTCLAW_SECRET="..."
```

Optional for OpenClaw/Hermes ticket ingestion:

```env
PROOFTICKET_OPENCLAW_SECRET="..."
```

Optional for GitHub webhook ingestion:

```env
PROOFTICKET_GITHUB_WEBHOOK_SECRET="..."
PROOFTICKET_GITHUB_ACTOR_EMAIL="builder@example.com"
```

Optional for terminal agent-action list/approval:

```env
PROOFTICKET_AGENT_ACTION_SECRET="..."
```

Optional for local demos:

```env
ENABLE_DEMO_AUTH="true"
```

Demo auth is for local demos and is rejected by production preflight.

## Verification

```bash
npm run preflight
npx prisma validate
npm run build
npm audit --audit-level=moderate --omit=dev
```

The latest local verification report is in `outputs/TEST_REPORT.md`.

Deployment notes are in `docs/DEPLOYMENT.md`.

## API Sketch

Agent action creation:

```http
POST /api/agent
Content-Type: application/json

{
  "action": "create",
  "agentApiKey": "proofticket_...",
  "type": "CREATE_TICKET",
  "idempotencyKey": "agent-run-2026-05-06-001",
  "payload": {
    "title": "Review branch before merge",
    "content": "The agent found a migration risk and attached the relevant files.",
    "type": "PROPOSAL",
    "visibility": "PRIVATE",
    "bridgeId": "...",
    "artifacts": [
      {
        "kind": "NOTE",
        "title": "Evidence summary",
        "summary": "The migration touches a high-risk table."
      }
    ]
  }
}
```

Generic agent CLI:

```bash
export PROOFTICKET_AGENT_API_KEY="proofticket_..."

npm run proofticket:agent -- \
  --type CREATE_TICKET \
  --idempotency-key demo-agent:ticket:001 \
  --title "Review branch before merge" \
  --content "The agent found a migration risk and attached the relevant files." \
  --ticket-type PROPOSAL \
  --tags agent,review
```

For ticket artifacts, pipe JSON on stdin:

```bash
echo '{"artifacts":[{"kind":"NOTE","title":"Evidence summary","summary":"The migration touches a high-risk table."}]}' \
  | npm run proofticket:agent -- \
    --type CREATE_TICKET \
    --idempotency-key demo-agent:ticket:002 \
    --title "Agent evidence attached" \
    --content "Evidence is attached for human approval."
```

List pending agent actions from a terminal:

```bash
export PROOFTICKET_AGENT_ACTION_SECRET="..."

npm run proofticket:actions -- \
  --actor-email builder@example.com
```

Approve or reject an action from a terminal:

```bash
npm run proofticket:action -- \
  --decision approve \
  --action-id <agent-action-id> \
  --actor-email builder@example.com

npm run proofticket:action -- \
  --decision reject \
  --action-id <agent-action-id> \
  --actor-email builder@example.com
```

Inspect an action as a receipt:

```bash
npm run proofticket:receipt -- \
  --action-id <agent-action-id>
```

Export a ticket evidence bundle:

```bash
npm run proofticket:evidence -- \
  --ticket-id <ticket-id>
```

Delivery queue:

```http
GET /api/health
GET /api/proofticket/queue
PATCH /api/proofticket/queue
POST /api/proofticket/queue
```

OpenClaw/Hermes ticket webhook:

```http
POST /api/webhooks/openclaw
Authorization: Bearer <PROOFTICKET_OPENCLAW_SECRET>
Content-Type: application/json

{
  "source": "hermes",
  "idempotencyKey": "session-123:pass-4:handoff",
  "actorEmail": "builder@example.com",
  "title": "Agent pass blocked on migration risk",
  "content": "The runtime stopped before modifying the migration.",
  "type": "PROPOSAL",
  "tags": ["handoff", "migration"]
}
```

OpenClaw/Hermes local sender:

```bash
npm run openclaw:ticket -- \
  --idempotency-key session-123:pass-4:handoff \
  --actor-email builder@example.com \
  --source hermes \
  --title "Agent pass blocked on migration risk" \
  --content "The runtime stopped before modifying the migration." \
  --type PROPOSAL \
  --tags handoff,migration
```

For artifacts, pipe JSON on stdin:

```bash
echo '{"artifacts":[{"kind":"NOTE","title":"Terminal trace","summary":"Stopped before write."}]}' \
  | npm run openclaw:ticket -- \
    --idempotency-key session-123:pass-4:trace \
    --actor-email builder@example.com \
    --title "Terminal trace captured" \
    --content "Trace is attached."
```

OpenClaw/Hermes agent action approval also works through the compatibility alias:

```bash
npm run openclaw:action -- \
  --decision approve \
  --action-id <agent-action-id> \
  --actor-email builder@example.com

npm run openclaw:action -- \
  --decision reject \
  --action-id <agent-action-id> \
  --actor-email builder@example.com
```

GitHub webhook demo:

```bash
export PROOFTICKET_GITHUB_WEBHOOK_SECRET="local-github-webhook-secret"
export PROOFTICKET_ACTOR_EMAIL="builder@example.com"
npm run github:webhook:demo
```

## Design Principles

- **Tickets over chat**: chat is good for conversation, bad for durable state.
- **Approval before authority**: agents can draft and propose; humans or policy gates decide.
- **Context should be inspectable**: every handoff needs enough structure to be trusted later.
- **Local-first before SaaS**: the workflow needs to work for private repos and security work.
- **Boring infrastructure wins**: typed APIs, audit trails, queues, and explicit permissions.

## Roadmap

- GitHub issue/PR ingestion
- scoped bridge tokens
- org/team model
- agent action receipts
- context manifests
- MCP/A2A adapter
- Docker compose deployment
- Postgres production profile
- policy engine for auto-approval

## License

MIT

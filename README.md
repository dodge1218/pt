# Kairos

Structured handoffs for human and AI coworkers.

Kairos is an experimental A2A ticketing system for teams that already use coding agents, shell agents, background jobs, and review queues. It is not a chatbot, a Jira clone, or another "AI project manager" wrapper. The core primitive is a durable work ticket that can be read by a person, a local agent, or a remote agent without replaying an entire chat transcript.

The current app is a local-first Next.js prototype. It is meant to prove the workflow before adding hosted multi-tenant infrastructure.

## Why This Exists

Most agent workflows break in the same places:

- context lives in a terminal scrollback or chat session
- decisions are mixed with brainstorming
- agents can act, but humans cannot audit intent quickly
- handoffs require pasting large context blobs into another model
- cost, approvals, and provenance are afterthoughts
- "agent collaboration" usually means another unstructured message bus

Kairos treats agent work like operations work: typed tickets, scoped permissions, approvals, delivery windows, and a durable queue.

## What Kairos Does

- **Tickets**: structured units of work with type, status, visibility, tags, author, bridge, and project context.
- **Responses**: explicit positions such as agree, disagree, counter-proposal, neutral, or question.
- **Bridges**: private coordination spaces for a person, another person, and their agents.
- **Agent proxies**: API-keyed agents can request ticket, response, or comment actions.
- **Human approval queue**: agent-created work is queued before it becomes durable shared state.
- **Smart delivery**: updates are queued and delivered according to each user's active window.
- **Public board**: public tickets for discovery and collaboration.

## The A2A Shape

Kairos is designed around a simple contract:

1. An actor submits a typed action.
2. Kairos validates scope and payload.
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
- `/api/kairos/queue` for delivery polling/read/process behavior
- delivery inbox and unread badge
- control-plane audit log
- signed OpenClaw/Hermes webhook ingestion
- CI for build, Prisma validation, and dependency audit

Still early:

- no hosted multi-tenant deployment yet
- no production RBAC model yet
- no GitHub issue/PR bridge yet
- no MCP/A2A protocol adapter yet
- no billing, orgs, or enterprise admin controls yet

## Local Development

```bash
npm install
cp .env.example .env
npx prisma db push
npm run db:seed
npm run dev
```

Default local database:

```env
DATABASE_URL="file:./dev.db"
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
KAIROS_CRON_SECRET="..."
KAIROS_BASE_URL="http://localhost:3000"
```

Optional for ContextClaw ingestion:

```env
KAIROS_CONTEXTCLAW_SECRET="..."
```

Optional for OpenClaw/Hermes ticket ingestion:

```env
KAIROS_OPENCLAW_SECRET="..."
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
  "agentApiKey": "kairos_...",
  "type": "CREATE_TICKET",
  "idempotencyKey": "agent-run-2026-05-06-001",
  "payload": {
    "title": "Review branch before merge",
    "content": "The agent found a migration risk and attached the relevant files.",
    "type": "PROPOSAL",
    "visibility": "PRIVATE",
    "bridgeId": "..."
  }
}
```

Delivery queue:

```http
GET /api/kairos/queue
PATCH /api/kairos/queue
POST /api/kairos/queue
```

OpenClaw/Hermes ticket webhook:

```http
POST /api/webhooks/openclaw
Authorization: Bearer <KAIROS_OPENCLAW_SECRET>
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

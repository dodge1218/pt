# ProofTicket Market Wedge

Status: private positioning doc.

## One-Line Position

ProofTicket is the ticket layer for agentic work: durable handoffs, scoped agent actions, human approvals, and evidence trails for teams already using coding agents.

## Product Boundary

ProofTicket should be sold and built as one product with one install reason:

> Coordinate asynchronous human/agent work without replaying chat transcripts or giving agents unbounded authority.

ProofTicket owns:

- tickets,
- responses,
- bridge/project membership,
- agent action requests,
- approval and rejection decisions,
- delivery queues,
- artifact references,
- audit trails,
- webhook and API ingestion.

ProofTicket does not own:

- context compression,
- model routing,
- spend governance,
- terminal process management,
- benchmark execution,
- prompt optimization,
- social posting,
- autonomous code execution.

Those adjacent systems can create ProofTicket tickets or attach artifacts later. They should not be bundled into the ProofTicket pitch.

## Primary User

The first user is a professional builder already running coding agents in terminals, IDEs, GitHub Actions, or background jobs.

They do not need another chatbot. They need a boring place where agent work becomes reviewable, resumable, and accountable.

## Pain

Current agent workflows fail because:

- intent lives in terminal scrollback,
- evidence is pasted between sessions,
- review decisions disappear into chat,
- one agent cannot cleanly hand work to another agent,
- humans get interrupted for low-value updates,
- agents either cannot act or act with too much authority,
- audit trails are reconstructed after the fact.

## Wedge Against Existing Tools

### GitHub Issues

GitHub Issues is excellent for human-visible project work. It is not designed as an agent action queue.

ProofTicket should sit beside GitHub, not replace it:

- agent creates ProofTicket ticket,
- human approves action,
- agent opens branch or PR,
- GitHub remains source and review substrate,
- ProofTicket stores the decision that authorized the action.

### Linear and Jira

Linear and Jira are planning systems. They are strong for teams, roadmap, and assignment.

ProofTicket is narrower:

- short-lived agent handoffs,
- action approvals,
- evidence receipts,
- low-friction local-first usage,
- devtool/webhook integration.

ProofTicket should not compete on enterprise planning breadth.

### Slack and Discord

Slack and Discord are streams. Streams are useful for presence and quick discussion, but weak for durable work state.

ProofTicket should compete on:

- typed work items,
- durable decisions,
- explicit approval state,
- minimal context replay,
- async consumption by humans and agents.

### MCP and A2A Protocols

MCP and A2A are integration protocols. ProofTicket should use them as adapters, not claim to replace them.

ProofTicket's value is the persisted work ledger behind those adapters.

### CodeBurn

CodeBurn is a local observability tool for token and cost visibility. It helps users understand where usage happened.

ProofTicket is not a spend dashboard. The connection is later:

- CodeBurn-like receipts can be attached to ProofTicket tickets,
- ProofTicket can show cost evidence for a specific agent action,
- ProofTicket should not become the cost engine.

### Caveman

Caveman is a compression workflow. It reduces token usage through terse communication and context discipline.

ProofTicket is not a compression layer. The connection is later:

- compressed summaries can be attached to tickets,
- ProofTicket can preserve the decision trail around compressed context,
- ProofTicket should not pitch token reduction as its core value.

### ContextClaw

ContextClaw is the context and spend governance product. It should remain separately installable and independently valuable.

The eventual relationship:

- ContextClaw emits context manifests and spend receipts.
- ProofTicket stores those receipts as ticket artifacts or references.
- ContextClaw can request approval through ProofTicket when a call exceeds policy.

The near-term rule:

> ProofTicket must work without ContextClaw. ContextClaw must work without ProofTicket.

## Professional README Claim

Use:

> Structured handoffs for human and AI coworkers.

Alternative:

> The ticket layer for agentic work.

Avoid:

- "Jira for AI",
- "Slack killer",
- "agent swarm",
- "autonomous AI project manager",
- "billion-dollar savings",
- "vibe coding platform".

## Five-Minute Demo

The public demo should show only ProofTicket:

1. Start ProofTicket locally.
2. Register two agents or use two demo agents.
3. Agent A files a ticket with evidence.
4. Agent B proposes a follow-up action.
5. Human approves or rejects.
6. ProofTicket stores the final decision and artifact references.

No ContextClaw dependency. No model spend dashboard dependency. No external hosted account requirement.

## Public Proof Standard

ProofTicket can claim:

- scoped agent API,
- idempotent agent actions,
- approval queue,
- delivery queue,
- durable ticket history,
- artifact references,
- local-first operation.

ProofTicket should not claim:

- cost savings without measured receipts,
- enterprise governance before RBAC exists,
- security compliance before a real threat model and audit,
- broad protocol support before adapters exist.

## Build Order

1. Make the local demo one-command.
2. Add CLI-first agent workflow.
3. Add first-class artifact references.
4. Add GitHub issue/PR bridge.
5. Add MCP/A2A adapters.
6. Add org/RBAC/audit hardening.
7. Add optional ContextClaw receipt integration.

This keeps the product easy to explain and useful before wider integrations are connected.

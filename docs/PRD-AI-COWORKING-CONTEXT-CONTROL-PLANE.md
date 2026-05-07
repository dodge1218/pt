# PRD: AI Coworking Context Control Plane

Status: Draft v1
Date: 2026-05-06
Owner: Ryan
Primary local surfaces: `kairos/`, `contextclaw/`, `openclaw-fork/`

## 1. Executive Summary

This product is an async coworking system for humans and AI agents. The core unit is not chat. The core unit is a structured ticket that carries intent, context, evidence, decisions, and agent-readable handoff state across time.

Kairos is the coworking and ticketing application.
ContextClaw is the context, spend, and quality control plane.
OpenClaw/Hermes is the runtime and terminal command center.

Together they create a system where two people, two agents, or a person and an agent can work on the same mission at different times without losing context, spamming each other, or resending massive prompt blobs.

The product should start local-first and API-first, then become a hosted coworking layer once the protocol is proven.

## 2. Product Thesis

Agentic work fails at scale because context is trapped in ephemeral sessions, chat history, terminals, and private mental state. People and agents need a durable handoff surface that is:

- structured enough for agents to consume,
- readable enough for humans to trust,
- asynchronous enough for real coworking,
- budgeted enough for frontier-model use,
- auditable enough for enterprise adoption,
- local-first enough for private/security-sensitive work.

The winning primitive is the coworking ticket: a durable, typed, context-linked work object with clear ownership, state, artifacts, decisions, approvals, and receipts.

## 3. Existing Local Assets

### 3.1 Kairos app

Path: `kairos/`

Current state:

- Next.js 15 app scaffold exists.
- Prisma schema exists.
- SQLite dev database exists.
- Ticket model exists.
- Bridge model exists.
- Project model exists.
- AgentProxy and AgentAction models exist.
- Agent API exists for registering agents, creating queued actions, approving, and rejecting.
- Smart delivery engine exists.
- UI pages exist for dashboard, tickets, projects, public board, friends, matches, profile, settings.

Relevant docs:

- `kairos/README.md`
- `kairos/PRD.md`
- `kairos/docs/VISION.md`
- `kairos/docs/ARCHITECTURE.md`
- `kairos/docs/FEATURES-V2.md`
- `kairos/docs/SILOS.md`
- `kairos/docs/SCALING.md`

### 3.2 ContextClaw

Path: `contextclaw/`

Current state:

- OpenClaw plugin exists.
- Request ledger exists.
- Estimate and receipt model exists.
- Budget gate exists.
- Mission ledger exists in TypeScript core.
- Python prototype exists in `main/contextclaw.py`.
- Article and outreach drafts exist.
- Quality eval framework exists.
- Claude Code sidecar/read-only watcher work exists.

Relevant docs:

- `contextclaw/PRD-CONTROL-PLANE.md`
- `contextclaw/docs/MISSION_LEDGER_MVP.md`
- `contextclaw/docs/PRD-SPEND-ATTRIBUTION-LEDGER.md`
- `contextclaw/docs/PREDICTABLE_SPEND_MODEL.md`
- `contextclaw/docs/PRD-PREMIUM-PREFLIGHT-SEATBELT.md`

### 3.3 OpenClaw/Hermes runtime concepts

Paths:

- `openclaw-fork/`
- `workspace/concepts/meta-intel-console/TERMINAL-MANAGER-UIUX.md`
- `workspace/main/NEXT_TICKET.md`
- `workspace/main/CONTEXTCLAW_PRODUCT_PLAN.md`

Current state:

- OpenClaw has usage tracking and web dashboard surfaces.
- OpenClaw has `/btw` side-result behavior for ephemeral side questions.
- OpenClaw has session/subagent/usage plumbing.
- Terminal manager concept exists for proceed loops, active agents, costs, artifacts, approvals.

## 4. The Product

Working name: Kairos Control Plane

Internal system name: AI Coworking Context Control Plane

Public positioning options:

- "Async coworking for humans and AI agents."
- "Structured handoffs for agentic work."
- "The ticket layer for AI coworkers."
- "A local-first control plane for agent collaboration."

Enterprise positioning:

- "Context, spend, and decision governance for AI agent teams."

Developer positioning:

- "GitHub Issues plus agent handoffs, receipts, and context manifests."

## 5. Users

### 5.1 Primary user: AI-native solo builder

Examples:

- Ryan.
- Independent security researcher.
- Solo founder with multiple projects.
- Developer running Claude Code, Codex, OpenClaw, Cursor, or local models.

Needs:

- Keep several projects moving.
- Resume work after context switches.
- Let agents continue bounded work.
- Avoid losing decisions in chat.
- Avoid runaway token spend.
- Approve risky actions.
- Review agent outputs asynchronously.

### 5.2 Second user: two-person async coworking pair

Examples:

- Ryan and Rylan.
- Ryan and Colin.
- Founder and contractor.
- Security researcher and verifier.

Needs:

- Share work without meetings.
- Preserve each person's intent.
- Let agents draft but not impersonate.
- Decide asynchronously.
- Keep context concise.
- See what changed and why.

### 5.3 Third user: small AI-native team

Examples:

- 2-10 person startup.
- Security research pod.
- AI engineering team.
- Internal model-platform team.

Needs:

- Agent activity visibility.
- Budget and usage accountability.
- Decision provenance.
- Review queues.
- Integration with GitHub, Slack, Discord, Telegram, and local CLIs.

### 5.4 Future enterprise buyer

Examples:

- Frontier-model company internal teams.
- Enterprise AI platform teams.
- Developer productivity teams.
- AI governance / FinOps teams.

Needs:

- Audit trails.
- Spend controls.
- Model-routing policy.
- ZDR/local-first mode.
- Context manifests.
- Quality preservation evidence.

## 6. Non-Users

This should not initially target:

- Large enterprises that want a Jira replacement.
- Nontechnical teams that do not use agents.
- Generic social media users.
- People who only want a chatbot.
- Teams that want every message in real-time chat.

## 7. Core Jobs To Be Done

### 7.1 Human-to-human async handoff

"I need to hand my current thinking, evidence, and ask to another person so they can respond later without needing a meeting."

### 7.2 Agent-to-human review

"My agent found or changed something. I need a concise, trustworthy ticket with artifacts, risks, and approval options."

### 7.3 Human-to-agent tasking

"I want to give an agent a bounded task with the right context, budget, and acceptance criteria."

### 7.4 Agent-to-agent handoff

"One agent needs another agent to inspect, verify, critique, or continue work without dumping the whole transcript."

### 7.5 Context governance

"Before any model call, I want to know what context is being sent, why, what it costs, and whether it is worth it."

### 7.6 Decision memory

"Six weeks from now, I need to know why we chose this, who agreed, what evidence existed, and what changed later."

## 8. Product Principles

1. Tickets over chat.
2. Artifacts over prompt blobs.
3. Receipts over vague usage claims.
4. Human approval for external side effects.
5. Agent authorship is always labeled.
6. Context is selected, not dumped.
7. Delivery happens at the right moment, not the sender's moment.
8. Local-first is the default trust posture.
9. Hosted sync is optional, not mandatory.
10. The system should reduce coordination noise, not create another inbox.

## 9. System Architecture

```text
Human / Agent / Runtime
        |
        v
OpenClaw / Hermes / Codex / Claude Code adapters
        |
        v
ContextClaw control plane
  - mission ledger
  - artifact ledger
  - context assembler
  - budget gate
  - receipt ledger
  - quality/eval metadata
        |
        v
Kairos coworking app
  - projects
  - bridges
  - tickets
  - responses
  - agent actions
  - approvals
  - smart delivery
        |
        v
Web UI / CLI / API / cron jobs / webhooks
```

## 10. Layer Responsibilities

### 10.1 Kairos

Kairos owns:

- Users.
- Projects.
- Bridges.
- Tickets.
- Responses.
- Comments.
- Agent proxies.
- Agent action approval queue.
- Smart delivery.
- Public board.
- Voice handshake.
- Thinking profiles and matching.

Kairos does not own:

- Model execution.
- Terminal execution.
- Token estimation internals.
- Context reduction internals.
- Provider usage reconciliation.

### 10.2 ContextClaw

ContextClaw owns:

- Mission IDs.
- Artifact IDs.
- Pass IDs.
- Context manifests.
- Token estimates.
- Cost estimates.
- Price snapshots.
- Budget decisions.
- Actual usage receipts.
- Variance tracking.
- Context quality evaluation.
- Rehydration pointers.

ContextClaw does not own:

- Social graph.
- Public discovery.
- User profiles.
- Cofounder matching.
- Notification preferences.

### 10.3 OpenClaw/Hermes

OpenClaw/Hermes owns:

- Runtime sessions.
- Terminal manager.
- Proceed loops.
- Subagent sessions.
- Tool execution.
- Local dashboard and TUI.
- Short commands: proceed, pause, kill, inspect, approve, summarize.

OpenClaw/Hermes does not own:

- Long-term coworking tickets.
- Public profile/matching.
- Hosted bridge UX.

## 11. Core Entities

### 11.1 Project

A durable collaboration container.

Fields:

- id
- name
- slug
- description
- ownerId
- visibility
- repoUrl
- status
- createdAt
- updatedAt

Relationships:

- tickets
- artifacts
- members
- bridges
- missions
- external integrations

### 11.2 Bridge

A private coordination space between specific users and/or agent identities.

Examples:

- "Ryan + Rylan - Bridge"
- "Ryan + Codex security verifier"
- "Claude Code watcher + ContextClaw reviewer"

Fields:

- id
- name
- projectId
- members
- defaultDeliveryPolicy
- agentPolicy
- createdAt
- updatedAt

### 11.3 Ticket

The primary coworking object.

Types:

- DECISION: requires positions and resolution.
- INFO: one-way update.
- PROPOSAL: suggested action requiring approve/reject/revise.
- STATUS: current state of work.
- REVIEW: artifact, diff, or finding review.
- HANDOFF: agent/human handoff package.
- INCIDENT: urgent issue or blocker.
- PUBLIC: public build log / discovery post.

Required fields:

- id
- title
- content
- summary
- type
- status
- visibility
- projectId
- bridgeId
- authorId
- createdByAgent
- agentProxyId
- approvedBy
- approvedAt
- createdAt
- updatedAt

Context fields:

- missionId
- passId
- artifactIds
- contextManifestId
- receiptIds
- sourceSessionKey
- sourceRuntime
- sourceRepo
- sourceBranch
- sourceCommit

Risk/value fields:

- businessValue
- riskLevel
- urgency
- requiresHumanApproval
- externalSideEffect
- spendEstimateUsd
- maxSpendUsd
- qualityRisk

### 11.4 Response

A structured position, not a raw chat reply.

Positions:

- AGREE
- DISAGREE
- COUNTER_PROPOSAL
- APPROVE
- REJECT
- QUESTION
- NEEDS_EVIDENCE
- NEUTRAL

### 11.5 AgentProxy

A registered agent identity acting on behalf of a human.

Fields:

- id
- ownerId
- name
- description
- apiKeyHash
- allowedProjects
- allowedBridges
- canCreateTickets
- canRespond
- canComment
- canAttachArtifacts
- canRequestModelCalls
- requiresApproval
- maxSpendPerAction
- maxSpendPerDay
- createdAt
- revokedAt

### 11.6 AgentAction

A proposed agent side effect requiring approval or auto-execution.

Types:

- CREATE_TICKET
- CREATE_RESPONSE
- CREATE_COMMENT
- EDIT_TICKET
- ATTACH_ARTIFACT
- REQUEST_PASS
- POST_TO_EXTERNAL_CHANNEL
- CREATE_GITHUB_ISSUE
- COMMENT_ON_PR
- SEND_EMAIL

States:

- PENDING
- APPROVED
- REJECTED
- EXECUTED
- FAILED
- EXPIRED

### 11.7 Artifact

A durable context object.

Examples:

- file snapshot
- command output
- transcript excerpt
- git diff
- PR link
- receipt
- screenshot
- external article
- decision memo
- model output

Fields:

- id
- projectId
- missionId
- type
- contentHash
- uri
- summary
- tokenEstimate
- sensitivity
- freshness
- createdBy
- createdAt

### 11.8 Mission

ContextClaw-owned unit of agentic work.

Fields:

- id
- objective
- owner
- projectId
- budgetTotal
- budgetRemaining
- state
- acceptanceCriteria
- createdAt
- updatedAt

### 11.9 Pass

One bounded model/tool invocation.

Fields:

- id
- missionId
- ticketId
- role
- model
- provider
- inputArtifactIds
- promptHash
- assembledContextHash
- estimatedTokensIn
- estimatedTokensOut
- estimatedCost
- observedTokensIn
- observedTokensOut
- observedCost
- decision
- reason
- outputArtifactId

## 12. Primary Workflows

### 12.1 Human posts a coworking ticket

1. User creates ticket in Kairos.
2. Ticket is linked to project and bridge.
3. Optional artifacts are attached.
4. Kairos queues smart delivery for recipients.
5. Recipient sees ticket when active.
6. Recipient responds with structured position.
7. Ticket resolves or enters mediation.

### 12.2 Agent posts a ticket for approval

1. Agent creates AgentAction via API.
2. Kairos stores action as PENDING.
3. ContextClaw attaches manifest and spend metadata if model context was used.
4. User reviews diff/content/artifacts.
5. User approves, rejects, or revises.
6. Approved action executes and creates ticket/response/comment.

### 12.3 Agent-to-agent handoff

1. Agent A finishes a pass.
2. ContextClaw records output artifact and receipt.
3. Agent A creates HANDOFF ticket for Agent B.
4. Ticket includes objective, evidence, artifact IDs, and "do not redo" guidance.
5. Agent B consumes ticket through API.
6. ContextClaw assembles only needed artifacts for Agent B.
7. Agent B produces response or new artifact.
8. Human sees concise review card.

### 12.4 Proceed loop with ticket checkpoints

1. User starts mission: "proceed on security research."
2. Hermes/OpenClaw runs bounded passes.
3. Each pass writes artifacts and ContextClaw receipts.
4. Material events become Kairos tickets:
   - candidate found
   - blocker hit
   - evidence ready
   - approval needed
   - budget exceeded
   - final packet ready
5. User reviews when available.
6. Agent continues only within policy.

### 12.5 GitHub branch handoff

1. User or agent pushes branch.
2. GitHub webhook creates STATUS or REVIEW ticket.
3. Agent summarizes diff and CI.
4. ContextClaw attaches cost/context receipt if a model generated the summary.
5. Collaborator reviews when active.
6. Collaborator approves merge, asks question, or requests revision.

### 12.6 "Check this out" side perspective

1. User or active agent invokes side check.
2. Runtime sends a minimal context snapshot and ticket/artifact links to a second agent.
3. Second agent produces ephemeral or durable side result.
4. If high-signal, result is promoted to ticket/comment.
5. If low-signal, result is discarded and not added to future context.

This is the durable version of OpenClaw `/btw`: optional promotion from ephemeral side result to coworking ticket.

## 13. API Requirements

### 13.1 Public/local API

Required endpoints:

```text
GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
PATCH  /api/projects/:id

GET    /api/bridges
POST   /api/bridges
GET    /api/bridges/:id

GET    /api/tickets
POST   /api/tickets
GET    /api/tickets/:id
PATCH  /api/tickets/:id
POST   /api/tickets/:id/responses
POST   /api/tickets/:id/artifacts

GET    /api/agent/queue
POST   /api/agent/register
POST   /api/agent/actions
POST   /api/agent/actions/:id/approve
POST   /api/agent/actions/:id/reject
POST   /api/agent/actions/:id/revise

POST   /api/contextclaw/receipts
POST   /api/contextclaw/manifests
GET    /api/contextclaw/missions/:id
GET    /api/contextclaw/passes/:id

POST   /api/webhooks/github
POST   /api/webhooks/telegram
POST   /api/webhooks/openclaw
POST   /api/webhooks/contextclaw
```

### 13.2 Agent API contract

Agents need a minimal, stable contract:

```json
{
  "agentApiKey": "secret",
  "actionType": "CREATE_TICKET",
  "idempotencyKey": "runtime-session:pass-id:ticket-kind",
  "projectId": "project-id",
  "bridgeId": "bridge-id",
  "payload": {
    "title": "Review candidate finding",
    "content": "Summary...",
    "type": "REVIEW",
    "artifactIds": ["art_1", "art_2"],
    "missionId": "mis_1",
    "passId": "pass_1",
    "riskLevel": "HIGH",
    "requiresHumanApproval": true
  }
}
```

Requirements:

- idempotency keys are mandatory for agent writes.
- agent API keys must be hashed at rest.
- every agent action must be attributable to owner and agent.
- default behavior is approval-required.
- external side effects always require approval in MVP.

## 14. Cron / At-Job Requirements

The system needs scheduled workers, but each worker must be bounded and auditable.

### 14.1 Delivery worker

Runs every 5 minutes.

Responsibilities:

- process SmartDelivery rows due now,
- send Telegram/email/browser notifications,
- mark deliveredAt,
- never generate new substantive content.

### 14.2 Agent queue worker

Runs every 1-5 minutes or on demand.

Responsibilities:

- execute approved actions,
- retry transient failures,
- mark failed with reason,
- never bypass approval policy.

### 14.3 Context receipt worker

Runs after model calls or transcript updates.

Responsibilities:

- ingest usage receipts,
- reconcile estimates vs actuals,
- update ticket/pass review cards,
- flag over-budget or high-variance calls.

### 14.4 GitHub watcher

Runs via webhook first, cron fallback second.

Responsibilities:

- create tickets for branches, PRs, CI failures, review requests,
- attach diff summaries as artifacts,
- avoid duplicate tickets through idempotency keys.

### 14.5 Dream/review worker

Runs on schedule only for opted-in projects.

Responsibilities:

- synthesize workflow lessons,
- detect repeated failures,
- propose skill/rule updates,
- create PROPOSAL tickets requiring approval.

This worker must not silently update skills, policies, or public docs.

## 15. UX Requirements

### 15.1 Dashboard

Dashboard must show:

- tickets needing user attention,
- pending agent actions,
- active projects,
- active missions,
- blocked passes,
- spend today/week/month,
- recent artifacts,
- recent decisions,
- collaborator updates.

### 15.2 Ticket detail

Ticket detail must show:

- title and type,
- current status,
- concise AI summary,
- original content,
- author and agent attribution,
- project/bridge context,
- linked artifacts,
- context manifest,
- spend/receipt data,
- responses by position,
- decision history,
- approval buttons.

### 15.3 Agent approval queue

Each pending action must show:

- what the agent wants to do,
- why,
- exact content to post/send/change,
- artifacts used,
- estimated/actual cost,
- external side effects,
- approve/reject/revise controls.

### 15.4 Project page

Project page must show:

- open tickets,
- decisions,
- status updates,
- artifacts,
- linked repo/branches/PRs,
- agent activity,
- budget and spend,
- collaborator list.

### 15.5 Terminal manager

Terminal manager must show:

- active loops,
- active agents,
- last action,
- next action,
- cost/context status,
- blocked approvals,
- artifact links,
- short commands.

Command examples:

```text
/tickets
/needs-me
/approve 7
/reject 7
/revise 7 smaller
/pause project contextclaw
/proceed security 3
/inspect last
/costs today
/handoff codex "verify this finding"
```

## 16. ContextClaw Integration Requirements

Every model call related to a Kairos ticket should be able to produce:

- missionId
- passId
- contextManifestId
- estimated input/output tokens
- estimated cost
- price snapshot
- actual receipt if available
- included artifact IDs
- excluded artifact IDs if relevant
- budget decision
- quality-risk note

Kairos should never need raw prompt blobs for normal display. It should display manifests, summaries, and artifact links.

## 17. Data Governance

### 17.1 Local-first mode

MVP must support local-only operation:

- SQLite or local Postgres.
- Local file artifact store.
- Local API keys.
- No mandatory cloud sync.
- No telemetry by default.

### 17.2 Hosted mode

Hosted mode can add:

- multi-user auth,
- cloud Postgres,
- object storage,
- push notifications,
- collaboration invites,
- managed cron workers.

Hosted mode must preserve:

- exportability,
- deletion,
- agent attribution,
- approval logs,
- content provenance.

### 17.3 Privacy

Prompt dumps, transcripts, and private artifacts are high-sensitivity data.

Rules:

- Raw prompt dumps are opt-in only.
- Raw prompt dumps should be processed into derived profiles and discarded when possible.
- Agents should not receive raw collaborator context unless explicitly permitted.
- Public tickets cannot include private artifact contents by default.
- External webhooks must redact secrets and credentials.

## 18. Security Requirements

Required:

- hashed agent API keys,
- project/bridge-scoped agent permissions,
- idempotency keys for agent writes,
- audit log for all agent actions,
- approval required for external side effects,
- soft delete for tickets/responses,
- role checks on bridges/projects,
- prompt-injection-aware artifact ingestion,
- secret redaction on command outputs and logs,
- rate limits for agent endpoints,
- no public exposure of admin dashboard without auth.

## 19. MVP Scope

The MVP should prove one thing:

Two agents or two people can cowork asynchronously through tickets while ContextClaw keeps context and spend accountable.

### 19.1 MVP features

Build/finish:

- local Kairos app runs cleanly,
- GitHub auth or local dev auth,
- create project,
- create bridge,
- create ticket,
- response positions,
- agent registration,
- agent action queue,
- approve/reject/revise,
- artifact attachment,
- ContextClaw manifest attachment,
- basic spend/receipt display on ticket,
- smart delivery queue,
- local cron script,
- OpenClaw/Hermes webhook for creating tickets.

### 19.2 MVP demo

Demo scenario:

1. Ryan starts a ContextClaw mission.
2. Agent A runs a bounded pass.
3. ContextClaw records manifest and receipt.
4. Agent A creates a HANDOFF ticket in Kairos.
5. Agent B reviews artifact links and posts a QUESTION or COUNTER_PROPOSAL.
6. Ryan sees the queue when active.
7. Ryan approves the next pass.
8. OpenClaw/Hermes continues the loop.
9. Dashboard shows total context saved, spend, tickets, and decisions.

## 20. Non-Goals For MVP

Do not build in MVP:

- public social network,
- cofounder matching marketplace,
- paid SaaS billing,
- mobile app,
- full Slack replacement,
- arbitrary unapproved agent-to-agent posting,
- enterprise admin console,
- complex vector memory system,
- automatic skill self-modification,
- broad multi-tenant hosted sync.

These are valid later. They are not needed to prove the core.

## 21. Competitive Landscape

### 21.1 Linear/Jira/GitHub Issues

They manage tasks and issues, but they do not natively model agent context, model spend, context manifests, AI handoffs, or human-approved agent actions.

### 21.2 Slack/Discord

They are real-time streams. They are bad at durable decision memory and agent-readable handoff state.

### 21.3 Langfuse/Helicone/Portkey/LangSmith

They observe LLM calls and costs. They do not own coworking tickets or pre-call context selection as a collaboration primitive.

### 21.4 CodeBurn

CodeBurn is a strong local dashboard for token/cost visibility. It is complementary. Kairos/ContextClaw should learn from its dashboards, but ContextClaw must govern calls before spend happens.

### 21.5 Caveman

Caveman is a compression layer. It is complementary. Its lesson is that reducers matter, but enterprise value requires receipts, policy, and quality gates.

### 21.6 Claude Code/Cursor/Codex/Devin

These are agent runtimes or IDE experiences. They need durable context/coworking governance around them, especially across multiple agents and asynchronous humans.

## 22. Business Positioning

### 22.1 Wedge

Start with AI-native builders and security researchers who already feel context loss and model spend pain.

### 22.2 Expansion

Move from local-first tool to small-team coworking product.

### 22.3 Enterprise path

Sell the control-plane story:

- "Your agents are doing more work. Do you know what context they are sending, why, what it costs, and which human approved it?"

### 22.4 Pricing hypothesis

Local/open-source:

- free core,
- paid hosted sync,
- paid team bridges,
- paid enterprise governance,
- paid model-spend analytics,
- paid private deployment support.

## 23. Success Metrics

### 23.1 Product metrics

- tickets created per active project,
- agent actions approved/rejected/revised,
- average response delay without work loss,
- decisions resolved,
- handoffs completed,
- reopened decisions due to missing context.

### 23.2 Context metrics

- estimated tokens avoided,
- actual cost avoided where receipts exist,
- duplicate context blocked,
- budget gates triggered,
- rehydration success rate,
- quality eval pass rate.

### 23.3 Trust metrics

- agent draft approval rate,
- rejected due to wrong context,
- rejected due to tone,
- rejected due to unsafe action,
- receipt variance,
- number of unexplained model calls.

## 24. Roadmap

### Phase 0: Stabilize local truth

- verify Kairos app builds,
- verify schema,
- document current gaps,
- fix local dev auth,
- seed realistic demo data.

### Phase 1: Coworking MVP

- finish ticket detail route,
- finish project/bridge workflows,
- finish response flow,
- finish agent queue UX,
- add local cron worker,
- add API docs.

### Phase 2: ContextClaw integration

- add artifact/manifest/receipt fields to Kairos schema,
- add `/api/contextclaw/*` ingestion endpoints,
- add receipt cards to tickets,
- add mission/pass linking,
- add OpenClaw webhook sender.

### Phase 3: Runtime command center

- connect OpenClaw/Hermes terminal manager,
- show active loops and approvals,
- support ticket creation from terminal,
- support approve/reject from terminal,
- support side-result promotion to ticket.

### Phase 4: GitHub coworking loop

- GitHub webhook integration,
- branch/PR/CI tickets,
- diff artifact summaries,
- PR review approval flow.

### Phase 5: Agent-to-agent protocol

- scoped agent identities,
- A2A/MCP-compatible handoff endpoint,
- agent reputation/accuracy stats,
- richer permission policies.

### Phase 6: Hosted alpha

- hosted Postgres,
- invitation flow,
- project sharing,
- Telegram/email delivery,
- export/delete controls,
- billing experiments.

## 25. Immediate Implementation Tickets

### Ticket 1: Verify Kairos local app

Acceptance:

- install/build command documented,
- schema migrates or pushes cleanly,
- app starts locally,
- dashboard loads,
- tickets page loads.

### Ticket 2: Complete ticket detail and response flow

Acceptance:

- `/tickets/:id` works,
- responses can be created,
- positions are visible,
- status can be resolved/archived,
- agent-created content is labeled.

### Ticket 3: Harden agent action queue

Acceptance:

- API keys hashed,
- idempotency keys added,
- project/bridge scope enforced,
- approve/reject/revise works,
- external side effects blocked by default.

### Ticket 4: Add ContextClaw linkage

Acceptance:

- Ticket can link missionId/passId/artifactIds/contextManifestId/receiptIds,
- API accepts ContextClaw receipt payload,
- ticket UI renders receipt card,
- blocked pass can create PROPOSAL ticket.

### Ticket 5: Local cron worker

Acceptance:

- delivery worker processes due SmartDelivery rows,
- agent worker executes approved actions,
- GitHub/webhook polling optional,
- logs are bounded and auditable.

### Ticket 6: OpenClaw/Hermes adapter

Acceptance:

- command creates Kairos ticket from current session,
- pass result can create handoff ticket,
- side-result can be promoted to ticket,
- approve/reject can be issued from terminal.

## 26. Final Product Boundary

This system should not be described as one monolithic AI wrapper.

The clean boundary is:

- Kairos: async coworking tickets.
- ContextClaw: context and spend governance.
- OpenClaw/Hermes: runtime and terminal control.

The combined product is a control plane for AI coworking.

The first proof is local.
The second proof is two agents handing off real work through tickets.
The third proof is a human approving only high-value, well-contexted agent actions.
The enterprise proof comes later, after receipts and quality evidence compound.


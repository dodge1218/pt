# Roadmap to a Serious Open Source Project

The path to meaningful GitHub adoption is not more UI polish. The path is making Kairos a useful primitive that serious developers can run, understand, and adapt in minutes.

## North Star Demo

The demo that can travel:

1. Start Kairos locally.
2. Register two agents.
3. Agent A files a ticket with evidence.
4. Agent B reads the ticket and proposes a fix.
5. A human approves the action.
6. Kairos stores the decision, receipt, and artifact links.

If that takes under five minutes and the README explains it clearly, developers will understand the product.

## Phase 1: Make It Runnable

Goal: remove setup friction.

Tasks:

- Add Docker Compose with Postgres.
- Add a single `npm run setup:local` command.
- Add seed data that demonstrates human-agent-human handoff.
- Add a screenshot/GIF demo.
- Add health endpoint.
- Add CI for build, Prisma validate, and audit.

Acceptance:

- Fresh clone to running demo in under five minutes.
- No real GitHub OAuth required for local demo mode.
- `npm audit --omit=dev` stays clean.

## Phase 2: Make Agents Useful

Goal: prove Kairos is an agent work surface, not a CRUD app.

Tasks:

- Add CLI:
  - `kairos agent register`
  - `kairos ticket create`
  - `kairos queue`
  - `kairos approve`
- Add signed webhook endpoint.
- Add scoped bridge tokens.
- Add first-class artifact references.
- Add agent action receipts.
- Add policy-based auto-approval for low-risk actions.

Acceptance:

- A shell agent can create a ticket without browser interaction.
- Replayed requests are idempotent.
- Every agent action has provenance and scope.

## Phase 3: GitHub Native Workflow

Goal: sit next to existing developer work instead of asking teams to change everything.

Tasks:

- GitHub App or OAuth repo linking.
- Issue import/export.
- PR/branch links on tickets.
- Webhook ingestion for PR opened, review requested, check failed, branch pushed.
- Create Kairos ticket from failing CI.
- Resolve Kairos ticket from merged PR.

Acceptance:

- Kairos can be used as an agent review queue for a real GitHub repo.
- A PR can point to the Kairos decision that authorized it.

## Phase 4: Protocol Adapters

Goal: become compatible with the agent ecosystem without becoming another protocol.

Tasks:

- MCP tool server:
  - create ticket
  - list queue
  - approve/reject action
  - attach artifact
- A2A adapter:
  - agent card
  - task submission
  - status retrieval
- OpenAPI spec for direct integration.
- Example integrations:
  - Claude Code
  - Codex CLI
  - Cursor
  - GitHub Actions

Acceptance:

- Existing agent tools can use Kairos without custom glue.
- The protocol adapters are thin wrappers over the same core API.

## Phase 5: Trust and Governance

Goal: make this credible for professional teams.

Tasks:

- Org/team model.
- Role-based access control.
- Audit log.
- Secret redaction in tickets/artifacts.
- Human-gate policy.
- ContextClaw receipt attachment.
- Budget approval before expensive agent passes.
- Exportable evidence bundle.

Acceptance:

- A platform/devtools team can review what agents did, why, who approved it, and what it cost.

## Phase 6: Distribution

Goal: make the project easy to talk about.

Tasks:

- Landing screenshot/GIF in README.
- `examples/` directory with complete flows.
- HN-ready technical writeup.
- Comparison page:
  - GitHub Issues
  - Linear
  - Slack
  - MCP
  - A2A
- Public roadmap with issues.
- Good first issues.
- Architecture diagrams.

Acceptance:

- A skeptical developer can understand why this exists in 30 seconds.
- A serious developer can run it and find the useful API in five minutes.

## What Not To Do

- Do not build a generic chatbot.
- Do not make the UI the main differentiator.
- Do not overfit to one local Ryan workflow.
- Do not claim protocol ownership.
- Do not bury the useful API under marketing copy.
- Do not add autonomous posting without human-gate defaults.

## Positioning

Use:

> Structured handoffs for human and AI coworkers.

Alternative:

> The ticket layer for agentic work.

Avoid:

- "AI project manager"
- "Jira for AI"
- "agent swarm"
- "vibe coding tool"

Kairos is strongest when it sounds boring and operational: queues, tickets, approvals, scopes, receipts, artifacts, delivery.

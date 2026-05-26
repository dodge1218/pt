# ProofTicket PRD

Status: active private build
Updated: 2026-05-25

## Product

ProofTicket is a local-first AI coworking ticket system. It gives humans and agents a shared work surface where tickets carry intent, context, evidence, decisions, approvals, artifacts, and spend receipts across time.

It is not a chatbot, a Jira clone, or a generic project manager. The core primitive is a durable ticket that can be read by a person, a local agent, a remote agent, or a future MCP/A2A adapter without replaying an entire chat transcript.

## Thesis

AI-native work needs a coordination layer that is structured enough for agents, readable enough for humans, and auditable enough to trust. Chat loses state. Terminal sessions hide context. Raw transcripts are expensive to replay. Generic task boards cannot explain what an agent did, what it cost, what evidence it used, or whether the output deserved acceptance.

ProofTicket solves this with coworking tickets plus receipts:

- ProofTicket owns tickets, bridges, responses, approvals, artifacts, and delivery.
- Receipt providers own context selection, token/spend visibility, manifests, and receipts.
- Agent runtimes own execution, terminal control, and model/tool calls.
- Agentic efficiency metrics turn raw sessions into cost, waste, and quality signals.

Together they create a ticket layer for provable AI coworking.

## Current Baseline

Implemented:

- Next.js 15 app with Prisma and local SQLite workflow.
- GitHub OAuth through NextAuth.
- Tickets, responses, comments, public board, private bridge tickets, projects, friends, matches, profile, settings, inbox, and audit surfaces.
- Agent proxies with API-keyed action submission.
- Human approval queue for agent-created tickets, responses, and comments.
- Agent attribution on durable content.
- Smart delivery queue and local queue processor.
- Ticket artifacts.
- receipt and manifest ingestion.
- signed external-runtime ticket webhook.
- Terminal commands for agent action creation/list/approve/reject.
- Local health check, setup command, seed data, and verification report.

Key local files:

- `README.md`
- `docs/DOCTRINE.md`
- `docs/AGENT-HANDOFF-PROOFTICKET.md`
- `NEXT_TICKETS.md`
- `prisma/schema.prisma`
- `outputs/TEST_REPORT.md`

## Users

Primary:

- AI-native solo builders who run multiple projects and agent sessions.
- Two-person async coworking pairs working with AI agents.
- Small developer teams that want agent-visible handoffs and human approval.

Future:

- Security research pods.
- Contractor/client workflows.
- Open-source maintainers receiving agent-generated work.
- Enterprise AI platform teams that need spend, context, and decision auditability.

## Jobs To Be Done

1. Human-to-human handoff: share intent, evidence, and an ask without needing a meeting.
2. Human-to-agent tasking: give an agent bounded work with acceptance criteria, context, budget, and approval rules.
3. Agent-to-human review: let agents submit structured work without directly mutating shared state.
4. Agent-to-agent handoff: pass scoped context and artifacts between runtimes without giant prompt blobs.
5. Decision memory: preserve why a choice was made, who agreed, and what evidence existed.
6. Spend accountability: show what model/context spend was used for a ticket and whether it produced accepted value.
7. Contributor fairness: allocate refunds or payouts based on accepted contribution and efficient work, not raw time or noisy activity.

## Core Concepts

### Tickets

Tickets are durable work objects. They include title, content, type, status, visibility, tags, author, project, bridge, responses, comments, artifacts, and audit history.

Ticket types:

- `DECISION`: requires positions from collaborators.
- `INFO`: one-way update.
- `PROPOSAL`: proposed action requiring approval.
- `STATUS`: progress update.
- `PUBLIC`: public collaboration/discovery post.

### Bridges

Bridges are private coworking spaces for specific collaborators and their agents. Bridge tickets are the first serious workflow because they map cleanly to real projects without requiring public launch behavior.

### Agent Actions

Agents submit actions into a queue. Humans approve, reject, or revise before the action becomes durable shared state unless a trusted policy explicitly allows auto-approval.

### Artifacts

Artifacts attach evidence to tickets: links, files, notes, context manifests, spend receipts, and future evidence bundles.

### Receipts

Receipts are the proof layer. A receipt can describe:

- actor or agent,
- ticket and mission,
- model/provider/runtime,
- input/output/context-saved tokens,
- cost,
- artifacts produced,
- acceptance outcome,
- timestamps,
- hashes or manifest IDs.

V1 uses normal JSON receipts and audit rows. V2 can add hash chains, signed bundles, and zero-knowledge proofs where privacy matters.

## ProofTicket Direction

The strongest next product direction is the ProofTicket layer: work tickets with receipt-backed proof of work.

Use case:

1. A project owner posts a ticket with a budget, constraints, and acceptance criteria.
2. Multiple humans or agents contribute work sessions.
3. Each session attaches artifacts and spend/context receipts.
4. A reviewer accepts, partially accepts, or rejects outputs.
5. A payout/refund allocation engine scores contribution value from accepted work, efficiency, duplication, and declared budget adherence.
6. The project owner can export an evidence bundle showing why each contributor received their share.

Do not build ZK first. Build transparent receipts, deterministic exports, and review outcomes first. ZK is a future privacy layer for proving claims such as "this contributor stayed under budget and produced an accepted artifact" without exposing the whole transcript.

## Fairness Rules

The system should not reward silence, speed theater, or token burn. It should reward accepted contribution.

Scoring inputs:

- accepted artifact value,
- reviewer outcome,
- task difficulty,
- non-duplication,
- budget adherence,
- elapsed time where available,
- token/cost efficiency,
- useful questions versus repeated avoidable questions,
- risk reduction or verification value.

Important constraint: asking many questions is not automatically bad. Questions are waste only when they are repeated, avoidable from provided context, or fail to advance the ticket. Clarifying questions that prevent wrong work should be scored positively.

## MVP Completion Target

For the Devpost/GitHub Copilot finish-an-old-project challenge, the target should be a coherent local demo, not a full hosted marketplace.

Finish this slice:

1. Public-safe five-minute demo.
2. Agent registration from CLI or a documented seed path.
3. Agent action receipt inspector.
4. Exportable ticket evidence bundle.
5. GitHub event ingestion or MCP adapter, whichever is smaller after inspection.
6. README and screenshots/video script showing the workflow.

Demo story:

> An agent finds a risky change, creates a ProofTicket ticket with evidence, the human reviews and approves it, a spend/context receipt is attached, and ProofTicket exports an evidence bundle showing who did what, what it cost, and what was accepted.

## Acceptance Criteria

- `npm run preflight` passes.
- `npx prisma validate` passes.
- `npm run build` passes.
- `npm audit --audit-level=moderate --omit=dev` passes or a known unavoidable advisory is documented.
- Fresh local setup path is documented.
- Five-minute demo works from seed/demo data.
- README describes ProofTicket as AI coworking tickets, not scheduling.
- No private names, secrets, local paths, or private framework concepts in public-facing demo docs.
- Agent-created content is visibly attributed.
- Receipts never display raw secrets.
- Exported evidence bundle is deterministic and redacted.

## Non-Goals

- No public multi-tenant SaaS launch in this phase.
- No payment processing in this phase.
- No automatic payout movement in this phase.
- No ZK implementation in this phase.
- No Jira replacement positioning.
- No raw transcript dumping as the core workflow.
- No unapproved external side effects by agents.

## Commands

```bash
npm install
npm run setup:local
npm run dev
npm run preflight
npx prisma validate
npm run build
npm audit --audit-level=moderate --omit=dev
```

## Next Work

Use `NEXT_TICKETS.md` for the active build queue and `docs/AGENT-HANDOFF-PROOFTICKET.md` for a bounded worker handoff.

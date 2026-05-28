# ProofTicket Doctrine

Status: active
Updated: 2026-05-25

## North Star

ProofTicket is the ticket layer for AI coworking. It turns chaotic human/agent work into durable, reviewable, auditable project context.

The product wins when a collaborator can answer these questions without opening the original chat or terminal:

- What was the ask?
- Who or what worked on it?
- What evidence was produced?
- What context was used?
- What did it cost?
- What was accepted?
- Why did the reviewer decide that?
- What should happen next?

## Product Rules

1. Tickets over chat.
2. Artifacts over prompt blobs.
3. Receipts over vague usage claims.
4. Human approval before durable shared state unless a trusted policy explicitly says otherwise.
5. Agent authorship is always labeled.
6. Context is selected, not dumped.
7. Cost is visible, not buried.
8. Reviewer outcome matters more than activity volume.
9. Public demos must be clean of private strategy, secrets, local paths, and private framework material.
10. Local-first proof comes before hosted scale.

## System Boundaries

ProofTicket owns:

- tickets,
- responses,
- comments,
- bridges,
- projects,
- agent action queues,
- approvals,
- artifacts,
- delivery,
- audit logs,
- evidence bundle export.

Receipt providers own:

- context manifests,
- spend receipts,
- token/cost summaries,
- context saved estimates,
- budget and waste signals,
- future signed or ZK proof inputs.

Agent runtimes own:

- execution runtimes,
- terminal workflows,
- agent sessions,
- local operator control,
- session imports,
- budget/routing ledgers.

ProofTicket should integrate with those systems through explicit APIs, webhooks, manifests, and artifacts. It should not scrape private terminal state or depend on a hidden transcript to make core flows understandable.

## Proof Doctrine

The proof layer should be incremental.

V1: practical auditability.

- JSON receipts.
- Ticket artifacts.
- Audit rows.
- Deterministic evidence bundle export.
- Hashes where cheap and useful.
- Human-readable markdown summaries.

V2: stronger integrity.

- Hash-chained receipts.
- Signed agent/session receipts.
- GitHub commit/PR/check artifacts.
- Replayable acceptance decisions.

V3: privacy-preserving proofs.

- ZK or selective disclosure proofs for claims such as budget adherence, accepted contribution, and non-duplication.
- Do not block the product on this.

## Fair Contribution Doctrine

ProofTicket can support refunds or payouts, but money movement is not the first implementation. The first implementation is defensible allocation logic over receipts and review outcomes.

Contributor credit should be based on:

- accepted output,
- artifact quality,
- reviewer outcome,
- non-duplicative progress,
- budget adherence,
- efficient context use,
- useful clarification,
- risk reduction,
- reproducibility.

Contributor credit should not be based on:

- raw hours alone,
- token spend alone,
- number of messages,
- number of questions,
- agent confidence,
- unreviewed claims.

Clarifying questions are not inherently waste. A good question that prevents wrong work is valuable. Repeated or avoidable questions that ignore the ticket context should reduce efficiency score.

## Demo Doctrine

The public demo should show one serious workflow end to end:

1. A project ticket is created with acceptance criteria.
2. An agent submits a proposed action with evidence.
3. The human reviews the pending action.
4. Approval creates durable ticket state.
5. A spend/context receipt is attached.
6. The audit page shows control-plane events.
7. An evidence bundle exports the ticket, responses, artifacts, receipts, and audit history.

Avoid abstract dashboards with fake metrics. Show actual objects moving through the system.

## Devpost Doctrine

For the GitHub Copilot finish-an-old-project challenge, ProofTicket should be framed as:

> Structured handoffs and proof-of-work receipts for human and AI coworkers.

The finish should emphasize that the old project already had real bones and was brought to a coherent demo:

- old stale PRD corrected,
- local setup made reliable,
- agent tickets and approvals demonstrated,
- spend/context receipts wired into tickets,
- evidence export added,
- README and demo path made public-safe.

Do not overclaim:

- no live payout automation,
- no hosted enterprise governance,
- no production ZK,
- no guaranteed fraud prevention.

Claim the real thing: local-first, auditable AI coworking tickets with receipts.

## Naming

Public product name: ProofTicket.

Feature or demo name: ProofTicket.

Avoid making ProofTicket a separate product unless the implementation grows beyond ProofTicket. For now, ProofTicket is the proof/receipts/fair allocation layer inside ProofTicket.

## Build Discipline

Ship one ticket at a time:

1. Read existing schema/routes before adding abstractions.
2. Prefer existing app patterns.
3. Keep local demo runnable.
4. Add or update docs with every workflow change.
5. Run `npm run preflight`, `npx prisma validate`, `npm run build`, and audit.
6. Run `npm run demo:readiness` before any public demo or submission.
7. Update `outputs/TEST_REPORT.md`.
8. Do not introduce private names, secrets, or local-only strategy into public demo artifacts.

# Interoperability Roadmap

Status: private architecture doc.

## Principle

ProofTicket and ContextClaw should be built, tested, and positioned as separate products first.

Reason:

> Developers install tools for one immediate job. Selling ticketing, context management, spend governance, runtime control, and benchmarking as one bundle makes the product harder to trust and harder to adopt.

The architecture should still preserve clean integration points so the products can compose later.

## Independent Product Contracts

### ProofTicket

ProofTicket is independently useful when:

- a user can run it locally,
- an agent can create a ticket through CLI/API,
- a second agent or human can read the queue,
- a human can approve or reject an action,
- the final decision and evidence stay durable.

ProofTicket should not require ContextClaw, CodeBurn, Caveman, Hermes, or an agent console.

### ContextClaw

ContextClaw is independently useful when:

- a user can record context manifests,
- a model pass has estimated token and cost metadata,
- actual usage can be attached when available,
- budget gates can warn, block, or require approval,
- reports summarize spend by project/model/session/subagent.

ContextClaw should not require ProofTicket.

## Integration Phases

### Phase 0: Separate Proof

Goal: each product has a clean reason to exist.

ProofTicket proof:

- local ticket workflow,
- agent action approval,
- webhook or CLI sender,
- durable audit trail.

ContextClaw proof:

- pre-call estimate,
- post-call receipt when available,
- spend attribution ledger,
- local report/dashboard,
- budget gate demo.

### Phase 1: Loose Artifact Linkage

Goal: ProofTicket can reference ContextClaw output without knowing ContextClaw internals.

Contract:

```json
{
  "kind": "CONTEXT_RECEIPT",
  "title": "ContextClaw receipt",
  "summary": "Premium pass estimated at 21820 input tokens and blocked by policy.",
  "ref": "file:///local/path/or/sha256/or/url",
  "metadata": {
    "source": "contextclaw",
    "receiptId": "optional",
    "missionId": "optional",
    "passId": "optional"
  }
}
```

ProofTicket stores this as a ticket artifact. ContextClaw continues to own receipt schema and validation.

### Phase 2: Approval Bridge

Goal: ContextClaw can ask ProofTicket for human approval when a model call exceeds policy.

Flow:

1. ContextClaw prepares a blocked or approval-required pass.
2. ContextClaw creates a ProofTicket ticket through API/webhook.
3. Human approves, rejects, or asks for a smaller context plan.
4. ProofTicket stores the decision.
5. ContextClaw polls or receives webhook callback and proceeds accordingly.

ProofTicket does not execute the model call. It only stores and delivers the decision.

### Phase 3: Shared Dashboard View

Goal: a professional team can inspect agent work and associated spend from one surface.

ProofTicket shows:

- ticket status,
- approval state,
- action provenance,
- linked receipt summaries,
- cost/context badges derived from receipt metadata.

ContextClaw remains the source of truth for:

- token calculations,
- pricing snapshots,
- context manifests,
- budget policy,
- receipt correction history.

### Phase 4: Policy Composition

Goal: teams can express policy across both systems.

Examples:

- "Agent can file tickets automatically, but expensive model passes require approval."
- "Security-sensitive artifacts require human review before cross-agent handoff."
- "Low-risk documentation tickets can auto-approve during working hours."
- "No public ticket may include raw prompt blobs or secrets."

This requires org/RBAC, redaction, audit export, and stronger threat modeling. It is not MVP.

## API Boundary

ProofTicket should accept stable, generic artifact references:

- `kind`,
- `title`,
- `summary`,
- `ref`,
- `metadata`.

ProofTicket should avoid importing ContextClaw-specific database models into its core schema until there is real usage proof.

ContextClaw should emit receipts as portable JSON files/events that any system can store.

## What Not To Do

- Do not make ContextClaw a required dependency for ProofTicket setup.
- Do not make ProofTicket a required dependency for ContextClaw reports.
- Do not merge repos before both products are independently useful.
- Do not make a shared README that tries to sell both products at once.
- Do not claim enterprise savings from ProofTicket alone.
- Do not let ProofTicket become a model proxy.
- Do not let ContextClaw become a ticketing app.

## Near-Term Decision

Keep ProofTicket private and focused on agent ticketing.

Keep ContextClaw focused on context/spend governance, but do not touch its dirty worktree until the active local changes are reviewed.

Once both have clean demos, add a single optional integration demo:

> ContextClaw blocks an expensive pass, opens a ProofTicket approval ticket, and continues only after approval.

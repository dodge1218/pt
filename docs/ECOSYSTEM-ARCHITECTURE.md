# Ecosystem Architecture

Kairos is one layer in a broader agent-work operating system. It should stay focused: durable handoffs, approvals, delivery, and shared work state.

## Layer Map

| Layer | Product | Job | Belongs In Kairos? |
| --- | --- | --- | --- |
| Durable coworking ledger | Kairos | Tickets, responses, bridges, approval queue, delivery queue | Yes |
| Live runtime control | Agent Console / Terminal Manager | Show active loops, pause/proceed/kill/escalate, cost/status dashboard | No, integrate through API |
| Context/cost governance | ContextClaw | Context manifests, pass receipts, budget gates, artifact ledger | No, attach receipts to Kairos tickets |
| Background execution | Hermes | Scheduled jobs, compounding loops, memory/skill promotion proposals | No, Hermes files Kairos tickets |
| Benchmark/proof layer | SwarmArena | Evaluate agent configs, trace exports, ContextClaw-vs-vanilla proof | No, later evidence source |
| Legacy prototype | The Bridge | Original human-first async ticketing and review queue lessons | Source material only |

## Kairos

Kairos is the shared work ledger for humans and agents.

Core responsibilities:

- Store typed tickets.
- Store positioned responses.
- Store bridge membership.
- Queue agent actions for approval.
- Deliver updates at the right time.
- Preserve durable decision state.
- Expose APIs agents can safely write to.

Non-responsibilities:

- Do not run every terminal.
- Do not become a model router.
- Do not own context compaction.
- Do not benchmark agent swarms.
- Do not silently mutate memory or skills.

## Agent Console / Terminal Manager

The agent console is the live operating panel for active loops.

It should answer:

- What is running?
- What is blocked?
- What needs Ryan?
- What changed?
- What costs money?
- What can be paused, killed, proceeded, or escalated?

Relationship to Kairos:

- The console creates or updates Kairos tickets when a loop needs durable review.
- Kairos can link back to console loop IDs.
- Kairos should not embed terminal sessions directly.

## ContextClaw

ContextClaw is the context and spend governor.

It should answer:

- What context is being sent?
- Why is each artifact included?
- What is the estimated cost?
- What was the observed cost?
- What was saved or avoided?
- Did a pass exceed policy?

Relationship to Kairos:

- ContextClaw emits receipts and manifests.
- Kairos stores those receipts as ticket artifacts or references.
- A Kairos ticket can require a ContextClaw budget approval before an agent action executes.

## Hermes

Hermes is the scheduled/background worker layer.

It should:

- Run periodic compounding jobs.
- Review stale queues.
- Propose memory updates.
- Propose skill updates.
- File tickets when human review is needed.
- Never silently publish, submit, spend, or mutate trusted state.

Relationship to Kairos:

- Hermes is a producer of Kairos tickets and agent actions.
- Kairos is Hermes' durable review surface.

## SwarmArena

SwarmArena is the evidence layer.

It should:

- Run the same task across different agent configurations.
- Export traces, cost, latency, retries, and quality metrics.
- Compare ContextClaw vs vanilla context handling.
- Produce benchmark cards for skill packs and agent topologies.

Relationship to Kairos:

- SwarmArena results can become public proof tickets.
- It is not part of Kairos MVP.

## The Bridge Lessons

The Bridge proved the human workflow:

- AI should refine or draft, not impersonate.
- Human intent must be visible.
- Disagreement and decision rationale matter.
- Review queues beat auto-posting.
- Kairos delivery matters for async collaborators.

Kairos should preserve these lessons while becoming API-first and agent-native.

## Integration Contract

Every adjacent system should be able to create a Kairos ticket using the same minimal shape:

```json
{
  "title": "Short durable work item",
  "content": "Human-readable context, evidence, ask, and acceptance criteria.",
  "type": "INFO | DECISION | PROPOSAL | STATUS | PUBLIC",
  "visibility": "PRIVATE | FRIENDS | PUBLIC",
  "bridgeId": "optional",
  "projectId": "optional",
  "tags": ["agent", "contextclaw", "needs-review"],
  "artifacts": [
    {
      "kind": "file | url | receipt | commit | screenshot | trace",
      "ref": "path-or-url-or-hash",
      "summary": "why it matters"
    }
  ]
}
```

The current app does not yet have a first-class `artifacts` table. Until then, artifacts should be referenced in ticket content or tags. Adding first-class artifacts is a near-term backend milestone.

## Product Boundary Decision

Kairos should be the work ledger, not the entire AI operating system.

The correct architecture is:

```text
Hermes / Agents / Console / GitHub / ContextClaw
                 |
                 v
              Kairos
       tickets, approvals, delivery
                 |
                 v
        humans and downstream agents
```

This makes the project understandable, shippable, and useful without collapsing every idea into one sprawling app.

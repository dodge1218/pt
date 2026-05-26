# Market and Portfolio Note

Date: 2026-05-06

## Short Thesis

ProofTicket is best framed as an A2A ticketing and context-control layer for agentic software work.

The wedge is not "AI task app." The wedge is:

> Developers are already running multiple agents, but there is no boring, auditable work queue where humans and agents can hand off intent, evidence, decisions, approvals, and receipts without pasting giant context blobs.

## TAM Estimate

Conservative framing:

- DevOps tooling is roughly a $10B 2025 market in one public market-research estimate, with a forecast above $57B by 2034.
- Enterprise AI agents and copilots are already estimated by CB Insights as a $5B+ market, with coding agents and enterprise workflow agents each already above $1B annual revenue.
- Gartner projects task-specific agents in 40% of enterprise applications by 2026 and frames agentic AI as a potential $450B+ enterprise software revenue driver by 2035.
- Atlassian reports $6B+ trailing twelve-month revenue, 350K+ customers, and 85%+ of the Fortune 500 as paying customers, which validates durable team-workflow software as a very large market.

Practical TAM/SAM/SOM:

- TAM: agentic enterprise software plus DevOps/work-management tooling, plausibly tens of billions of dollars over the next decade.
- SAM: AI-native developer teams, platform engineering teams, security research teams, and internal AI tooling groups that need human/agent approval queues and context handoffs.
- Initial SOM: open-source developer adoption, consultative pilots, and small-team hosted usage. A realistic first commercial target is not "replace Jira"; it is "be the agent handoff layer next to GitHub, Slack, Linear, and Jira."

## Portfolio Benefit

If executed cleanly, ProofTicket is a strong public demo because it shows:

- product judgment in a real emerging infrastructure category
- full-stack implementation across auth, database, APIs, queues, and UI
- agent-safety thinking without hand-wavy agent hype
- DevOps sensibility: idempotency, scoped permissions, auditability, delivery queues, local-first operation
- ability to turn messy personal workflow pain into a coherent system

This is stronger than another chatbot demo because it shows operational taste.

## Job Application Benefit

Best target roles:

- AI infrastructure engineer
- developer tools engineer
- platform engineer
- agent product engineer
- security automation engineer
- founding engineer at AI/devtools startups

Best claim:

> I built a local-first A2A ticketing system for human/agent handoffs: scoped agent actions, human approval queues, delivery windows, and durable context tickets.

Avoid claiming billion-dollar savings as fact. Claim the mechanism:

> The system reduces context replay, approval ambiguity, and untracked agent work. That is the part enterprises actually need before agent fleets become safe to run.

## What It Needs To Reach 50K GitHub Stars

The bar is not more UI. The bar is becoming a useful developer primitive.

Minimum:

- one-command local install
- Docker Compose with Postgres
- excellent README with a real 5-minute demo
- CLI for `proofticket ticket create`, `proofticket agent register`, `proofticket queue`
- GitHub issue/PR sync
- signed webhook endpoint for agents
- MCP/A2A adapter
- examples for Claude Code, Codex CLI, Cursor, and GitHub Actions
- clean screenshots or terminal GIFs
- hosted demo with seeded data
- permissive license
- no secret leakage
- test suite and CI

The likely viral demo:

1. Run two agents in different terminals.
2. Agent A finds a problem and files a ProofTicket ticket with evidence.
3. Agent B sees the ticket, reviews, and proposes a fix.
4. Human approves.
5. ProofTicket writes the durable decision and links the artifact.

That is understandable in 30 seconds and serious enough for Hacker News.

## Sources

- Gartner press release, August 26, 2025: task-specific agents in 40% of enterprise apps by 2026; agentic AI revenue projection over $450B by 2035.
- CB Insights, April 29, 2025: enterprise AI agents and copilots estimated at $5B+ and on track to more than double.
- Market Reports World, April 2026: DevOps Tool market estimated at $9.88B in 2025 and $57.05B by 2034.
- Atlassian investor relations page, viewed 2026-05-06: $6.2B trailing twelve-month revenue, 350K+ customers, 85%+ Fortune 500 paying customers.

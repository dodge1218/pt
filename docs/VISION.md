# VISION.md — Kairos

## What Is Kairos

A dev-first social coordination platform. Part DMs, part public board, part cofounder matching. Not a chat app. Not a project manager. The place where builders post what they're working on, what they care about, and find people who think like them.

## The Core Insight

Every communication tool forces you into one box:
- Slack/Discord = real-time chat (information overload, everything drowns)
- Linear/Jira = task tracking (no opinions, no discovery, no serendipity)
- Twitter/X = public broadcast (too noisy, no depth, no collaboration path)
- The Bridge = co-founder mediation (great for 2 people, can't scale)

None of them solve: **"I'm building 6 things, I need to find people who think the way I do, coordinate through agents, and not drown in noise."**

Kairos is the system that does.

## How It Works

### Tickets (not messages)
Everything is a ticket. Tickets have structure:
- **Decision tickets**: "Should we do X?" — requires a position from each party
- **Info tickets**: "[INFO] Here's what I built this week" — one-way, no response required
- **Public tickets**: visible to your network. People comment like tweets. Tips, ideas, collabs.
- **Private tickets**: between you and specific people. Agent-assisted, human-approved.

### Agents Are First-Class
- Your agent reads your tickets, drafts responses, but never posts without your approval
- Agents summarize incoming tickets so you can scan at tweet-length
- Agent-to-agent: your agent talks to their agent about scheduling, context exchange, logistics
- Human decisions stay human. Agent coordination handles everything else.

### Kairos Delivery
Named after the Greek concept of "the right moment." The platform learns when you're active, what you care about, and delivers at your rhythm — not at the sender's rhythm. No notification spam. No FOMO. Signal arrives when you're ready for it.

### Public Profile = What You Build
Not a resume. Not a LinkedIn profile. A living board of:
- What you're working on right now
- What you care about (interests, domains, obsessions)
- Your thinking style (how you approach problems — mapped by cognitive pattern analysis)
- Open collabs (things you'd build with someone else)

People discover you by what you build, not who you know.

### Cofounder Matching
Not "skills + industry + location" like every other platform.
Kairos matches on:
- **Thinking patterns**: cross-discipline synthesis, depth vs breadth, strategic timing orientation
- **Build style**: how fast, how many projects, solo vs team preference
- **Domain bridges**: someone who connects healthcare + ML differently than you connect retail + ML
- **Complementary gaps**: not "you both like the same thing" but "you think differently about the same problem"

## Who It's For

**Primary**: Solo founders and small dev teams (2-5 people) who:
- Run multiple projects simultaneously
- Use AI agents as core workflow (not just copilot)
- Need coordination that scales beyond group chat
- Want to find collaborators by how they think, not where they went to school

**Secondary**: Dev teams at startups (5-20) who need structured decision-making with agent assistance.

**Not for**: Enterprise. Large orgs. People who want Slack with AI bolted on.

## Revenue Model

### Free Tier
- 5 private tickets/month
- Unlimited public tickets
- Basic profile
- Agent read access (can view, can't post)

### Pro ($19/mo)
- Unlimited private tickets
- Agent post access (draft → approve → post)
- Kairos delivery (smart timing)
- Cofounder matching
- Thinking pattern analysis (cognitive insights)

### Team ($49/mo per team)
- Everything in Pro
- Team bridges (multiple members)
- Agent-to-agent coordination
- Decision provenance (full audit trail)
- Webhook integrations (GitHub, Slack, Discord, Telegram)

### API ($99/mo)
- Full API access
- MCP/A2A compatible endpoints
- Custom agent integrations
- Bulk operations

## The Name

Kairos (καιρός) — the ancient Greek word for "the right or opportune moment." The platform delivers signal at the right moment, matches people at the right time, and treats attention as the scarce resource it is.

---

## Ideal Additions (PRD Appendix)

### A. Project Board + Kickstarter Model
- **Project entity**: Every collaboration centers around a Project (not just floating tickets)
- **Contribution types**: Comments ("2 cents"), code (branches/PRs), design review, expertise
- **Contribution tracking**: Who contributed what, when, how much
- **Project timeline**: Visual history of all activity (like a git log but for collaboration)
- **Project sharing links**: One URL to see all tickets, all contributors, full context
- **Milestone tracking**: Set goals, track progress without Jira-level overhead

### B. Agent-to-Agent Protocol (A2A Integration)
- **Agent discovery**: Your agent can discover collaborators' agents via A2A protocol
- **Automated handshake**: Agents exchange communication preferences, active hours, and project context
- **Delegation chains**: "My agent told your agent about the new branch, your agent summarized it for you"
- **Cross-platform agents**: Support MCP + A2A so any agent framework can participate
- **Agent reputation**: Track agent accuracy (approved vs rejected actions) to build trust over time

### C. Decision Provenance
- **Full audit trail**: Every decision has a traceable path (who proposed, who responded, what positions, final outcome)
- **Decision replay**: "Why did we choose Next.js over Remix?" → links to the DECISION ticket with all positions
- **Decision templates**: Common decision types (tech stack, feature priority, hiring) with pre-built structures
- **Revisit alerts**: "This decision was made 6 months ago. Context has changed. Review?" (smart delivery trigger)

### D. Thinking Profile Evolution
- **Temporal tracking**: How your thinking patterns change over time (not just a snapshot)
- **Skill trajectory**: "You've been going deeper in ML for 3 months — you're entering expert territory"
- **Blind spot detection**: "You never think about ops/deployment — here's someone who does"
- **Team composition analysis**: "Your team of 3 is heavy on frontend synthesis, light on backend depth"
- **Passion decay alerts**: "You haven't touched crypto in 2 months — still interested?"

### E. Notification Channels
- **Telegram integration**: Deliver smart notifications via Telegram bot
- **Discord webhooks**: Post tickets to Discord channels
- **Email digest**: Configurable daily/weekly digest
- **Slack integration**: For teams already in Slack (bridge, not replace)
- **Push notifications**: Browser push for urgent/time-sensitive tickets
- **RSS feed**: Your public tickets as an RSS feed (discoverability)

### F. Content Moderation
- **AI-powered moderation**: Flag toxic/spam content before it hits the public board
- **Community reports**: Users can flag inappropriate tickets/responses
- **Escalation path**: Flagged content → agent review → human review if needed
- **Reputation scoring**: Active, helpful contributors get more visibility

### G. Onboarding Flow
- **Progressive profiling**: Don't ask for everything upfront. Start with GitHub login → 1 public ticket → interests → voice handshake → thinking profile (optional)
- **Demo project**: New users see a pre-built demo project with sample tickets to understand the system
- **"What are you working on?" wizard**: 3 questions → first ticket + first project created
- **Invite flow**: Share a project link → collaborator signs up and lands directly in the project context

### H. Data Export + Deletion
- **Full data export**: Download all your data (tickets, responses, profile, matches) as JSON
- **Account deletion**: Full GDPR-compliant deletion with 30-day grace period
- **Selective deletion**: Delete specific tickets, responses, or thinking profile data
- **Portability**: Export to other platforms (Linear, GitHub Issues) via adapters

### I. Advanced Matching
- **Team matching**: Not just 1:1 cofounders — "Here's a 3-person team that covers all gaps"
- **Project-based matching**: "Your project needs someone with X thinking pattern — here are 5 candidates"
- **Reverse matching**: "Here's what YOU could contribute to these 3 projects"
- **Match explanations**: Natural language rationale for every match ("You both obsess over ML pipelines at 2am, but they think about deployment and you think about model architecture")
- **Warm intros**: Mutual connections can introduce matches (reduces cold-start friction)

### J. GitHub Deep Integration
- **Auto-ticket from issues**: GitHub issue created → Kairos ticket generated with summary
- **Branch notifications**: Push to branch → INFO ticket with diff summary for collaborators
- **PR review tickets**: PR opened → DECISION ticket ("Should we merge this?")
- **CI status tickets**: Failed CI → STATUS ticket with error context
- **Repo activity feed**: Per-project GitHub activity stream

### K. Mobile Experience
- **PWA**: Progressive web app for mobile access
- **Quick actions**: Swipe to approve agent actions, tap to respond to tickets
- **Offline queue**: Draft responses offline, sync when connected
- **Widget**: Home screen widget showing pending items count

### L. Analytics Dashboard (Team/Pro)
- **Collaboration velocity**: How fast decisions get made
- **Communication health**: Are all team members engaged?
- **Agent efficiency**: What % of agent drafts get approved?
- **Decision backlog**: How many open decisions are aging?
- **Passion pulse**: Team's collective interest areas over time

### Priority Order
1. **A (Project Board)** — core feature, table stakes for collaboration
2. **G (Onboarding)** — retention-critical, first impressions
3. **J (GitHub Integration)** — the dev hook, differentiation from chat apps
4. **E (Notification Channels)** — reach users where they are
5. **C (Decision Provenance)** — unique value prop, nobody else does this
6. **B (A2A Integration)** — future-proof, protocol-native
7. **I (Advanced Matching)** — the moat, compounds with data
8. **D (Thinking Profile Evolution)** — retention + engagement
9. **H (Data Export)** — trust + compliance
10. **F, K, L** — growth tier

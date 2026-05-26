# COMPETITORS.md — Competitive Landscape

## Direct Competitors (None exact — adjacent players)

### Communication/Coordination
| Product | What It Does | Strength | Gap ProofTicket Fills |
|---------|-------------|----------|-----------------|
| **Slack** | Team chat | Ubiquitous, integrations | Information overload. No structure. No agents. Everything drowns. |
| **Discord** | Community chat | Free, dev-friendly | Same overload problem. Channels fragment context. |
| **Linear** | Issue tracking | Beautiful UX, dev-loved | No opinions. No social. No discovery. No agents. |
| **Notion** | Docs + databases | Flexible, team knowledge | Not a communication tool. No real-time. No matching. |
| **Twist (Doist)** | Async team communication | Thread-first, calm | Dead product energy. No agent support. Small team. |

### Social/Discovery
| Product | What It Does | Strength | Gap ProofTicket Fills |
|---------|-------------|----------|-----------------|
| **Twitter/X** | Public broadcast | Reach, real-time | Too noisy. No depth. No collaboration path from post → project. |
| **Hacker News** | Dev community | High signal | Read-only culture. No profiles. No matching. No ongoing coordination. |
| **Dev.to** | Dev blogging | Nice community | Articles, not coordination. No agent layer. |
| **Indie Hackers** | Builder community | Revenue-focused | Forum format. No structured decisions. Dying activity. |
| **Polywork** | Professional profiles | "What you do" not "where you work" | Never got traction. No agent layer. No matching beyond skills. |

### Cofounder Matching
| Product | What It Does | Strength | Gap ProofTicket Fills |
|---------|-------------|----------|-----------------|
| **YC Cofounder Matching** | Match founders | YC's dataset + reputation | Only for YC-track founders. Skills/industry matching only. |
| **CoFoundersLab** | Match cofounders | Large database | Surface-level matching. No thinking-pattern analysis. |
| **CoffeeSpace** | Daily cofounder recs | Mobile UX | Tinder-style swipe. No depth. No cognitive matching. |
| **Entrepreneurs First** | Cohort-based matching | In-person, curated | Geography-locked. Expensive. Not async/remote. |

### Agent Protocols (Infrastructure, not products)
| Protocol | Owner | Focus | Why Not a Competitor |
|----------|-------|-------|--------------------|
| **MCP** | Anthropic/Linux Foundation | Agent ↔ Tool | Plumbing. No UX. We build ON this. |
| **A2A** | Google/Linux Foundation | Agent ↔ Agent | Discovery protocol. No product layer. We're the product layer. |
| **ACP** | IBM → merged into A2A | REST messaging | Dead. Merged. |
| **AGUI/A2UI** | CopilotKit/Google | Agent ↔ Frontend | UI protocol. Complementary, not competitive. |

## Why Nobody's Built This Yet

1. **Agent coordination is too new.** MCP launched Nov 2024, A2A April 2025. Product layers take 12-18 months after protocols stabilize. We're in the window.

2. **"Dev social" has failed before.** Polywork, dev.to, Indie Hackers — all tried "profile for devs" or "Facebook for builders." They failed because they copied consumer social patterns. ProofTicket is different because the social layer is a BYPRODUCT of coordination, not the primary feature.

3. **Cofounder matching = hard without data.** Everyone matches on declared preferences (skills, industry). ProofTicket matches on revealed behavior (what you actually build, how you think, what patterns recur). This requires cognitive pattern analysis — which we've already built.

4. **Incumbents can't pivot.** Slack won't add agent-first features because their enterprise customers don't want agents posting in channels. Linear won't add social because they're a PM tool. Twitter won't add structure because they're optimizing for engagement, not signal.

## ProofTicket Positioning Matrix

```
                    Structured ←————————→ Unstructured
                         |                    |
     Agent-Native  [  PROOFTICKET  ]          [  nothing  ]
                         |                    |
     Human-Only    [ The Bridge ]     [ Slack/Discord ]
                   [ Linear     ]     [ Twitter/X     ]
```

We own the top-left quadrant. Nobody else is there.

## Defensibility Over Time

| Timeframe | Moat |
|-----------|------|
| Month 1-6 | First mover in "agent-native social coordination" |
| Month 6-12 | Network effects (more builders = better matching) |
| Month 12-24 | Thinking profiles (proprietary data asset) |
| Month 24+ | Community + open-source ecosystem + matching dataset |

## What If Google/Microsoft/Anthropic Build This?

They won't. Here's why:
- Google is building A2A (protocol) not products on top of it
- Microsoft is building Copilot (assistant) not coordination (social)
- Anthropic is building Claude (model) and MCP (protocol) not end-user apps
- All three are platform companies. They want US to build on THEIR platforms.
- We're a product company building on their platforms. Aligned incentives.

If they do build something: it'll be enterprise-focused, expensive, and locked into their ecosystem. We're indie, cheap, open-source, and cross-platform. Different markets.

# BUSINESS-PLAN.md — Kairos

## Market Size

### TAM (Total Addressable Market)
- 31.7M software developers worldwide (Evans Data 2025)
- ~4.3M solo devs/small teams actively building side projects or startups
- Developer tools market: $45.4B in 2025, growing 22% CAGR

### SAM (Serviceable Addressable Market)
- Devs who use AI agents in their workflow: ~800K (growing fast)
- Devs who run 2+ projects simultaneously: ~1.2M
- Overlap (agent-using multi-project devs): ~300K

### SOM (Serviceable Obtainable Market)
- Year 1 target: 1,000 users (500 free, 300 Pro, 150 Team, 50 API)
- Year 1 revenue target: $115K ARR
  - 300 Pro × $19/mo = $68.4K
  - 150 Team × $49/mo (avg 2 seats) = ~$35K (effectively ~$12/seat/mo accounting)
  - 50 API × $99/mo = ~$11.9K

## Unit Economics

| Metric | Value |
|--------|-------|
| CAC (target) | $0 (organic, community, open-source) |
| LTV Pro user | $228/yr (12 × $19) |
| LTV Team | $588/yr (12 × $49) |
| Infrastructure cost/user | ~$0.50/mo (Vercel, Supabase, AI inference) |
| Gross margin | ~92% |
| Payback period | Day 1 (no paid acquisition) |

## Go-To-Market Strategy

### Phase 1: Dogfood (Month 1-2)
- Ryan + Colin use it for resume agency coordination
- Ryan uses it for DSB/SiteBldr project coordination
- Prove the agent-assisted ticket flow works
- Build 10 public tickets showing the format

### Phase 2: Dev Community (Month 3-4)
- Open beta. Free tier available.
- Post on HN "Show HN: Kairos — DMs for devs, but your agents read them first"
- Write 3 blog posts:
  1. "Why Slack fails for async builders"
  2. "Agent-to-agent coordination is the next protocol war — and nobody's built the product layer"
  3. "How I coordinate 6 projects with one agent"
- Open source the core (ticket engine + API). Pro features paid.

### Phase 3: Cofounder Matching (Month 5-6)
- Analyze public ticket patterns to build thinking profiles
- Launch matching: "Find builders who think like you"
- This is the viral loop — people join to find collaborators, stay for the coordination

### Phase 4: Ecosystem (Month 7-12)
- MCP/A2A plugin marketplace
- Team tier grows
- API customers build custom integrations
- Content: weekly "Builder Signal" newsletter — patterns from public tickets (anonymized)

## Distribution Channels

| Channel | Why | Cost |
|---------|-----|------|
| Hacker News | Our exact audience. Agents + coordination + dev tools. | $0 |
| Dev Twitter/X | Show, don't tell. Public tickets = content. | $0 |
| Reddit (r/programming, r/SideProject, r/startups) | Long-form discussion audience | $0 |
| GitHub | Transparent dev → stars → awareness | $0 |
| Product Hunt | Launch event | $0 |
| YouTube | "How I coordinate 6 projects" tutorial | $0 |
| DSB email list | 9,500+ contacts (existing asset) | $0 |
| OpenClaw community | Agent-native audience, perfect fit | $0 |

Total paid marketing budget: $0. All organic.

## Competitive Moat

1. **Thinking-pattern matching is novel.** Cognitive analysis → cognitive profiles. Nobody else does this.
2. **Agent-native from day 1.** Not "AI bolted onto chat." Agents are first-class citizens.
3. **Kairos delivery.** Smart timing based on user rhythm. Not just "do not disturb."
4. **Network effects compound.** More builders → better matching → more builders.
5. **Community-first development.** Community builds integrations we can't. Pro features justify paying.

## Financial Projections

| Month | Users | MRR | Cumulative |
|-------|-------|-----|------------|
| 3 | 50 | $380 | $760 |
| 6 | 200 | $2,100 | $7,800 |
| 9 | 500 | $5,500 | $24,000 |
| 12 | 1,000 | $9,600 | $58,000 |
| 18 | 3,000 | $32,000 | $200,000 |
| 24 | 10,000 | $95,000 | $800,000 |

Conservative. Assumes 30% Pro conversion, 15% Team, 5% API. No paid acquisition.

## Risks

| Risk | Mitigation |
|------|------------|
| Nobody wants "structured tickets" when they have Slack | Lead with public board / social discovery, not ticket management |
| Agent coordination too early for mass market | Target agent-native devs specifically (growing 100%+ YoY) |
| Cofounder matching doesn't work | Start simple — manual introductions based on public ticket overlap |
| Can't compete with Google A2A ecosystem | We're a product, not a protocol. Build ON their protocols. |
| Ryan spreads too thin | Colin is co-builder. Dogfood forces focus. |

# SCALING.md — How Kairos Scales

## Technical Scaling

### Phase 1: MVP (0-1K users)
- **Stack**: Next.js 15 + Prisma + PostgreSQL (Supabase) + NextAuth
- **Hosting**: Vercel (free tier handles this easily)
- **AI Inference**: Groq free tier for summaries, Gemini for analysis
- **Cost**: ~$0/mo (all free tiers)
- **Bottleneck**: None. This is hobby-scale.

### Phase 2: Growth (1K-10K users)
- **Database**: Supabase Pro ($25/mo) or self-hosted Postgres on Droplet
- **Hosting**: Vercel Pro ($20/mo) or self-hosted on existing Droplet ($6/mo)
- **AI**: Groq paid + Gemini free. ~$50/mo for inference.
- **Search**: Meilisearch (self-hosted, $0) for ticket/profile search
- **Cost**: ~$75-100/mo
- **Bottleneck**: Agent API rate limits. Solution: queue + batch.

### Phase 3: Scale (10K-100K users)
- **Database**: Managed Postgres (Supabase Pro or PlanetScale)
- **Hosting**: Vercel or Railway
- **AI**: Dedicated inference (Groq, Together, or self-hosted vLLM on GPU)
- **Search**: Typesense cluster or Algolia
- **Realtime**: Supabase Realtime or Ably for live ticket updates
- **Cost**: ~$500-2K/mo (covered by $9.6K MRR at 1K paid users)
- **Bottleneck**: Matching algorithm compute. Solution: pre-compute profiles nightly.

### Phase 4: Platform (100K+)
- Kubernetes on GCP/AWS
- Dedicated ML pipeline for pattern analysis
- CDN for static assets
- Multi-region for latency
- Cost: $5-15K/mo (covered by $95K+ MRR)

## Product Scaling

### Feature Roadmap by Scale

| Users | Feature Focus |
|-------|--------------|
| 0-100 | Core tickets, agent API, kairos delivery, profiles |
| 100-1K | Public board, comments, friend system, basic matching |
| 1K-5K | Thinking profiles, advanced matching, team bridges |
| 5K-20K | Plugin marketplace, MCP/A2A integrations, enterprise team tier |
| 20K-100K | Builder Signal newsletter (automated from public tickets), community events |
| 100K+ | API marketplace, white-label for companies, international expansion |

## Team Scaling

| Stage | Team |
|-------|------|
| MVP | Ryan + agents (Colin as first user/tester) |
| Growth | Ryan + 1 designer (contract) + community contributors (open source) |
| Scale | Ryan + 2 engineers + 1 designer + 1 community manager |
| Platform | 5-10 person team (or stay small + agents handle the rest) |

The "no more staff" principle applies: agents handle everything possible. Humans only for judgment, design, and community.

## Network Effect Flywheel

```
More builders join
  → More public tickets (content)
    → Better matching (more data)
      → More cofounders found (value)
        → More builders join (word of mouth)
```

Each loop strengthens the next. This is the Instagram/Twitter growth pattern but for a niche (builders) that hasn't been served yet.

## Geographic Expansion

1. **English-first** (US, UK, Canada, Australia, India-English-speaking devs)
2. **No localization needed for MVP** — devs code in English
3. **Natural international spread** via GitHub + HN (global dev audiences)
4. **Future**: localized matching for non-English dev communities (Japan, Brazil, Germany)

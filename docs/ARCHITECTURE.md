# ARCHITECTURE.md — Technical Architecture

## Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | Next.js 15 (App Router) | SSR, API routes, React Server Components. DSB approved. |
| Database | PostgreSQL via Supabase | Free tier, realtime, auth integration |
| ORM | Prisma | Type-safe, migrations, DSB approved |
| Auth | NextAuth.js v5 | GitHub OAuth primary, email magic link secondary |
| UI | shadcn/ui + Tailwind CSS 4 | DSB approved, accessible, customizable |
| AI Inference | Groq (summaries) + Gemini (analysis) | Free/cheap, fast |
| Realtime | Supabase Realtime | Live ticket updates, notifications |
| Search | Meilisearch (self-hosted) | Fast, typo-tolerant, free |
| Deployment | Vercel | Zero-config, edge functions, free tier |

## Database Schema (Prisma)

### Core Models
- **User**: profile, auth, preferences, thinking profile
- **Ticket**: structured communication unit (decision, info, public, private)
- **Response**: positioned reply to a ticket
- **Comment**: thread on a response
- **Friendship**: bidirectional connections between users
- **AgentProxy**: agent-to-user mapping with approval rules
- **ThinkingProfile**: Pattern-derived cognitive style data
- **Match**: cofounder match suggestions with rationale

### Key Design Decisions
1. **Tickets over messages.** Every communication has a type, a structure, and a lifecycle.
2. **Responses are positioned.** Not just "reply" — you take a position (agree, disagree, propose alternative).
3. **Agent actions are always attributed.** Every agent-created ticket/response has a `createdByAgent` flag and links to the approving human.
4. **Public by default, private by choice.** Public tickets are the social layer. Private tickets are the coordination layer.
5. **Kairos delivery is per-user.** Each user has active windows. System queues delivery for optimal timing.

## API Design

### REST Endpoints
```
# Auth
POST   /api/auth/[...nextauth]    — NextAuth handlers

# Tickets
GET    /api/tickets                — list (filterable: type, status, author, public/private)
POST   /api/tickets                — create
GET    /api/tickets/:id            — detail with responses, comments
PATCH  /api/tickets/:id            — edit (title, content, status, type)
DELETE /api/tickets/:id            — soft delete (author only)

# Responses
POST   /api/tickets/:id/responses  — respond to ticket
PATCH  /api/responses/:id          — edit response
DELETE /api/responses/:id          — soft delete

# Comments
POST   /api/responses/:id/comments — comment on response
GET    /api/responses/:id/comments — list comments

# Users / Profiles
GET    /api/users/:id              — public profile
PATCH  /api/users/me               — update own profile
GET    /api/users/:id/tickets      — user's public tickets
GET    /api/users/me/feed          — personalized feed

# Social
POST   /api/friends/request        — send friend request
POST   /api/friends/accept         — accept request
GET    /api/friends                 — list friends
DELETE /api/friends/:id            — remove friend

# Agent API
POST   /api/agent/tickets          — agent creates ticket (requires approval)
POST   /api/agent/responses        — agent drafts response (queued)
GET    /api/agent/queue             — pending agent actions for approval
POST   /api/agent/approve/:id      — human approves agent action
POST   /api/agent/reject/:id       — human rejects agent action

# Matching
GET    /api/matches                 — get match suggestions
POST   /api/matches/:id/connect    — initiate connection from match
GET    /api/matches/profile         — your thinking profile
POST   /api/matches/profile/refresh — re-analyze thinking patterns

# Kairos
GET    /api/kairos/queue            — your pending deliveries
PATCH  /api/kairos/preferences      — update delivery windows
```

### Webhook Endpoints (incoming)
```
POST   /api/webhooks/github        — GitHub events → auto-create info tickets
POST   /api/webhooks/telegram      — Telegram messages → ticket creation
POST   /api/webhooks/mcp           — MCP tool calls
POST   /api/webhooks/a2a           — A2A agent discovery
```

## Directory Structure
```
kairos/
├── docs/                     # Business + technical docs
│   ├── VISION.md
│   ├── BUSINESS-PLAN.md
│   ├── GTM.md
│   ├── COMPETITORS.md
│   ├── SCALING.md
│   └── ARCHITECTURE.md
├── prisma/
│   └── schema.prisma         # Database schema
├── src/
│   ├── app/
│   │   ├── layout.tsx        # Root layout
│   │   ├── page.tsx          # Landing page
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (app)/
│   │   │   ├── layout.tsx    # App shell (sidebar, nav)
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── tickets/
│   │   │   │   ├── page.tsx          # Ticket list
│   │   │   │   ├── new/page.tsx      # Create ticket
│   │   │   │   └── [id]/page.tsx     # Ticket detail
│   │   │   ├── public/page.tsx       # Public board
│   │   │   ├── profile/
│   │   │   │   ├── page.tsx          # Own profile
│   │   │   │   └── [id]/page.tsx     # Other's profile
│   │   │   ├── friends/page.tsx
│   │   │   ├── matches/page.tsx      # Cofounder matching
│   │   │   ├── agent/
│   │   │   │   ├── queue/page.tsx    # Agent approval queue
│   │   │   │   └── settings/page.tsx
│   │   │   └── settings/page.tsx
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── tickets/route.ts
│   │       ├── tickets/[id]/route.ts
│   │       ├── tickets/[id]/responses/route.ts
│   │       ├── responses/[id]/comments/route.ts
│   │       ├── users/route.ts
│   │       ├── friends/route.ts
│   │       ├── agent/route.ts
│   │       ├── matches/route.ts
│   │       ├── kairos/route.ts
│   │       └── webhooks/route.ts
│   ├── components/
│   │   ├── ui/               # shadcn components
│   │   ├── ticket-card.tsx
│   │   ├── ticket-form.tsx
│   │   ├── response-form.tsx
│   │   ├── profile-card.tsx
│   │   ├── match-card.tsx
│   │   ├── agent-queue.tsx
│   │   ├── kairos-indicator.tsx
│   │   └── public-board.tsx
│   ├── lib/
│   │   ├── prisma.ts         # Prisma client singleton
│   │   ├── auth.ts           # NextAuth config
│   │   ├── kairos.ts         # Delivery timing engine
│   │   ├── agent.ts          # Agent proxy logic
│   │   ├── matching.ts       # Cognitive pattern matching engine
│   │   └── ai.ts             # AI inference (Groq/Gemini)
│   └── types/
│       └── index.ts          # Shared TypeScript types
├── public/
│   └── ...
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
└── .env.example
```

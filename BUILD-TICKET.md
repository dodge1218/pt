# ProofTicket MVP — Codex Build Ticket

## What You're Building
A dev-first async coordination platform. Part DMs, part public board, part cofounder matching. Not a chat app. Not a project manager.

## Stack (already scaffolded)
- Next.js 15 (App Router) + TypeScript
- PostgreSQL via Supabase + Prisma ORM  
- NextAuth.js v5 (GitHub OAuth)
- shadcn/ui + Tailwind CSS 4
- Groq SDK for AI summaries
- Vercel deploy target

## Existing Files
- `proofticket/prisma/schema.prisma` — FULL database schema (Users, Tickets, Responses, Comments, Bridges, Agents, Matching, Voice, Delivery)
- `proofticket/src/app/page.tsx` — Landing page (done)
- `proofticket/src/app/layout.tsx` — Root layout (done)
- `proofticket/src/lib/` — auth.ts, prisma.ts, ai.ts, agent.ts, proofticket.ts, matching.ts, voice.ts, prompts.ts (stubs)
- `proofticket/src/app/api/` — Route stubs for tickets, agent, friends, matches
- `proofticket/docs/ARCHITECTURE.md` — Full API design + directory structure

## MVP Scope (build these)

### 1. Auth System
- GitHub OAuth via NextAuth v5
- Session management
- Protected routes (middleware)
- Login/register pages with GitHub button

### 2. Ticket CRUD
- Create ticket (DECISION, INFO, PROPOSAL, STATUS, PUBLIC types)
- List tickets (filterable by type, status, visibility)
- Ticket detail with responses and comments
- Edit/soft-delete tickets
- Public board (PUBLIC visibility tickets)

### 3. Response System  
- Respond to tickets with position (AGREE, DISAGREE, COUNTER_PROPOSAL, NEUTRAL, QUESTION)
- Comment threads on responses
- Agent attribution flags (createdByAgent, approvedBy)

### 4. Bridge System
- Create private coordination spaces between users
- Add/remove bridge members
- Bridge-scoped tickets

### 5. Agent Proxy System
- Register agents (name, permissions, API key)
- Agent creates ticket/response → queued for approval
- Human approval queue page
- Approve/reject actions
- Agent-created content clearly labeled in UI

### 6. ProofTicket Delivery (v1 — manual windows)
- User sets active hours (activeStart, activeEnd, timezone)
- Delivery queue model stores pending items
- Basic scheduling: deliver during active window only
- No ML yet — just manual time windows

### 7. Seed Data
- Professional demo tickets in Bridge tone:
  - "[INFO] Resume agency — weekly job matches found"
  - "Should we use Next.js or Remix for the dashboard?"
  - "[INFO] Free API credits you can use right now"
  - "New branch: colin/resume-parser — review when you have 4 mins"
  - "[PUBLIC] Building a platform that matches cofounders by thinking patterns, not resumes"

### 8. UI Components (shadcn)
- Ticket card (shows type badge, status, author, summary, engagement)
- Ticket form (create/edit with type selector)
- Response form (with position selector)
- Profile card
- Agent approval queue
- Public board grid/list

## NOT in MVP
- Cofounder matching engine (schema exists, skip the algorithm)
- Prompt dump upload + analysis
- Voice handshake engine
- Meilisearch integration
- Payment/billing/Stripe
- MCP/A2A webhook handlers
- Email magic link auth (GitHub only for v1)

## Key Rules
1. All code comments can reference ICE/PIE and framework terms — these are INTERNAL docs. We censor at publish time only.
2. Human vs AI content ALWAYS clearly attributed in UI.
3. Agent system prompt must include USER_CONTENT delimiter for prompt injection protection.
4. Professional, structured demo tone for seed data.
5. Landing page already exists and is clean — don't modify it.

## .env.example (already exists)
```
DATABASE_URL=""
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
GROQ_API_KEY=""
GEMINI_API_KEY=""
```

## Start Commands
```bash
cd proofticket
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

## Deliverable
Working Next.js app with:
- GitHub login
- Create/view/respond to tickets
- Public board
- Agent approval queue
- Professional seed data
- Ready for `vercel deploy`

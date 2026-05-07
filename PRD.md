# Kairos — PRD

## What
Dev-first social coordination platform. Next.js app with Prisma, designed for scheduling and group coordination without the friction of existing tools.

## Why
Social coordination is broken. Every group chat becomes a scheduling nightmare. Kairos makes "when can everyone meet?" a solved problem with zero friction.

## Acceptance Criteria
- [ ] `npm run build` passes
- [ ] Prisma schema migrates cleanly
- [ ] Auth flow works (sign up → sign in → dashboard)
- [ ] Create event → invite participants → collect availability
- [ ] Mobile responsive at 375px
- [ ] Deploy to Vercel

## Commands
- Install: `npm install`
- Dev: `npm run dev`
- Build: `npm run build`
- DB: `npx prisma migrate dev`

## Current Status
- [x] Next.js scaffold with Prisma
- [x] DNP protocol defined
- [ ] Core event creation flow
- [ ] Availability collection UI
- [ ] Auth integration
- [ ] Deploy

## Open Questions
- Three-silo architecture: ChatPort (extension) / Corpus Tool / Kairos (platform) — build order defined as Corpus → ChatPort → Kairos

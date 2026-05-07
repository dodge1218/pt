# Public Release Checklist

Status: private repo guardrail.

Kairos can remain private while the implementation matures. Before making it public again, run this checklist so the repository reads like a professional developer-tools project instead of a workspace brain dump.

## Must Be Clean Before Public

- README describes Kairos only, not the whole local OpenClaw workspace.
- No personal names in seed data, docs, screenshots, examples, or app copy.
- No private emails, partner names, internal project names, or active business strategy.
- No "50k stars", job application, portfolio, or hiring-positioning language in public docs.
- No inflated market-size claims in README.
- No unpublished competitor/outreach strategy.
- No local paths like `/home/yin/...`.
- No `.env`, SQLite DB, `.next`, screenshots with private data, or generated logs.
- `npm audit --omit=dev` reports zero vulnerabilities or documented exceptions.
- `npm run build` passes.
- `npx prisma validate` passes.

## Docs To Review Before Public

These are useful private planning docs, but should be reviewed, rewritten, moved, or omitted before a public launch:

- `docs/PRD-AI-COWORKING-CONTEXT-CONTROL-PLANE.md`
- `docs/MARKET-AND-PORTFOLIO-NOTE.md`
- `docs/ROADMAP-50K-STARS.md`
- `docs/MARKET-WEDGE.md`
- `docs/INTEROPERABILITY-ROADMAP.md`
- `docs/ECOSYSTEM-ARCHITECTURE.md`
- `docs/BUSINESS-PLAN.md`
- `docs/GTM.md`
- `docs/FEATURES-V2.md`
- `docs/SILOS.md`
- `docs/IDEAS-0414-3AM.md`
- `prisma/seed.ts`

## Public-Ready Positioning

Use:

> Structured handoffs for human and AI coworkers.

Keep the repo focused on:

- durable tickets
- agent action approvals
- scoped agent APIs
- delivery queues
- GitHub/devtools integrations
- local-first operation

Avoid:

- claiming every adjacent project is part of Kairos
- framing the repo as personal productivity archaeology
- attacking "AI slop" in project copy
- promising enterprise-scale savings before proof
- making market-size claims in the README

## Public Demo Requirements

Before public release, add:

- Docker Compose with Postgres.
- Local demo auth mode that does not require GitHub OAuth.
- Generic seed users and projects.
- A short terminal demo or GIF.
- A minimal CLI or curl-first walkthrough.
- CI for build, Prisma validate, and audit.

## Current Decision

Keep the GitHub repository private until the public-facing surface is intentionally cleaned.

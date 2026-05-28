# Public Release Checklist

Status: private repo guardrail.

ProofTicket can remain private while the implementation matures. Before making it public again, run this checklist so the repository reads like a professional developer-tools project instead of a workspace brain dump.

## Must Be Clean Before Public

- README describes ProofTicket only, not the whole local workspace.
- No personal names in seed data, docs, screenshots, examples, or app copy.
- No private emails, partner names, internal project names, or active business strategy.
- No "50k stars", career-positioning, or public-clout language in public docs.
- No inflated market-size claims in README.
- No unpublished competitor/outreach strategy.
- No absolute local workstation paths.
- No `.env`, SQLite DB, `.next`, screenshots with private data, or generated logs.
- `npm audit --omit=dev` reports zero vulnerabilities or documented exceptions.
- `npm run build` passes.
- `npx prisma validate` passes.
- `npm run demo:readiness` passes.

## Docs To Review Before Public

These are useful private planning surfaces, but should be reviewed, rewritten, moved, or omitted before a public launch:

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

- claiming every adjacent project is part of ProofTicket
- framing the repo as personal productivity archaeology
- attacking "AI slop" in project copy
- promising enterprise-scale savings before proof
- making market-size claims in the README

## Public Demo Requirements

Before public release, add:

- Docker Compose with Postgres. Done for local development; verify on target machine before public release.
- Local demo auth mode that does not require GitHub OAuth.
- Generic seed users and projects.
- A short terminal demo or GIF.
- A minimal CLI or curl-first walkthrough.
- CI for build, Prisma validate, and audit.

## Hosted Alpha Requirements

Before inviting testers:

- Set `PROOFTICKET_ALLOWED_EMAILS` to named tester emails.
- Run production preflight with hosted URLs and Postgres `DATABASE_URL`.
- Disable `ENABLE_DEMO_AUTH`.
- Use separate secrets for cron, agent action review, ContextClaw, machine webhooks, and GitHub webhooks.
- Run one manual ticket -> agent action -> approval -> evidence export flow on hosted data.
- Document how deletion requests will be handled manually until self-serve deletion exists.

## Current Decision

Keep the GitHub repository private until the public-facing surface is intentionally cleaned.

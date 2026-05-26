# ProofTicket Test Report

Updated: 2026-05-26

## ProofTicket Finish Slice

- Reframed the project around public-safe ProofTicket naming.
- Removed remaining public references to the previous project name and private demo identities.
- Removed old private strategy docs from the tracked public package.
- Added `docs/DOCTRINE.md` and `docs/AGENT-HANDOFF-PROOFTICKET.md`.
- Added local receipt/evidence scripts:
  - `scripts/inspect-agent-action.mjs`
  - `scripts/export-ticket-evidence.mjs`
  - `scripts/lib/env.mjs`
  - `scripts/lib/redact.mjs`
- Added package scripts:
  - `npm run proofticket:agent`
  - `npm run proofticket:actions`
  - `npm run proofticket:action`
  - `npm run proofticket:receipt`
  - `npm run proofticket:evidence`
  - `npm run github:webhook:demo`
- Added signed GitHub webhook ingestion at `POST /api/webhooks/github`.
  - Supports `pull_request`, `push`, and `check_run`.
  - Requires `PROOFTICKET_GITHUB_WEBHOOK_SECRET`.
  - Creates private ProofTicket tickets with GitHub artifacts and idempotency.
  - Performs no GitHub write operations.
- Added GitHub webhook fixture and sender under `examples/github-webhook/`.
- Updated the five-minute demo to include:
  - spend/context receipt artifact in the sample payload,
  - action receipt inspection,
  - evidence bundle export,
  - optional signed GitHub PR event ingestion.
- Updated README positioning and command references around proof-of-work receipts and evidence bundles.
- Ran `npm audit fix`, which updated Next.js from `15.5.16` to `15.5.18` and cleared the high Next.js advisory.

## Verification

- `npm run proofticket:receipt -- --help` passed.
- `npm run proofticket:evidence -- --help` passed.
- `npm run setup:local` passed with approved permissions for `tsx` IPC.
- `npm run health` passed against the local dev server.
- `npm run proofticket:agent` created a pending ticket action from the five-minute demo fixture.
- `npm run proofticket:receipt` inspected the pending action receipt.
- `npm run proofticket:action` approved the pending action and created ticket `cmpmuirju0006twnpvuzztnpm`.
- `npm run proofticket:evidence` exported JSON and Markdown evidence for ticket `cmpmuirju0006twnpvuzztnpm`.
- `npm run github:webhook:demo` created GitHub PR ticket `cmpmukfke000btwnp3x8pfrua`.
- `npx prisma validate` passed.
- `npm run preflight` passed with expected local placeholder warnings for GitHub OAuth/auth/API secrets.
- `npm run build` passed with Next.js `15.5.18`.
- `npm audit --audit-level=moderate --omit=dev` passed with `0 vulnerabilities`.
- `git diff --check` passed.

## Note

The default sandbox blocked the Next/PostCSS build worker from binding a local helper port. Running `npm run build` with approved escalated permissions completed successfully.

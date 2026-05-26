# Agent Handoff: ProofTicket Finish

## Mission

Finish and verify ProofTicket as a public-safe demo for auditable human and AI coworking tickets.

ProofTicket lets agents submit structured work with evidence, humans approve or reject it, receipts attach spend/context metadata, and tickets export as deterministic evidence bundles.

## Read First

- `README.md`
- `PRD.md`
- `docs/DOCTRINE.md`
- `NEXT_TICKETS.md`
- `prisma/schema.prisma`
- `outputs/TEST_REPORT.md`

## Work Rules

- Keep the public name as ProofTicket.
- Do not add payments or zero-knowledge proofs in this slice.
- Do not expose secrets, private names, local paths, raw transcripts, or private framework language.
- Prefer existing Prisma models and API patterns.
- Keep the local demo runnable.

## Core Demo

1. Start the app locally.
2. Submit an agent-created ticket with evidence.
3. List the pending action.
4. Inspect the action receipt.
5. Approve the action.
6. Export the ticket evidence bundle.
7. Optionally ingest the signed GitHub pull request fixture.

## Verification

Run:

```bash
npm run preflight
npx prisma validate
npm run build
npm audit --audit-level=moderate --omit=dev
```

Update `outputs/TEST_REPORT.md` with commands run, results, and remaining risks.

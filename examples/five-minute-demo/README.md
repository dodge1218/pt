# ProofTicket Five-Minute Demo

This demo shows the core ProofTicket workflow:

1. start ProofTicket locally,
2. submit an agent-created ticket with evidence,
3. list pending agent actions,
4. inspect the pending action as a receipt,
5. approve the action,
6. export the resulting ticket as an evidence bundle.

It uses generic demo values. Replace secrets, emails, and keys with your own local values.

## 1. Prepare Local App

From the repo root:

```bash
npm install
npm run setup:local
export PROOFTICKET_AGENT_ACTION_SECRET="local-agent-action-secret"
npm run dev
```

In another terminal:

```bash
npm run health
```

Expected result:

```text
ProofTicket health ok: database=ok
```

## 2. Configure Demo Env

Register a local-only agent and configure the terminal approval secret.

```bash
export PROOFTICKET_BASE_URL="http://localhost:3000"
export PROOFTICKET_AGENT_API_KEY="$(
  npm run --silent proofticket:agent-register -- \
    --owner-email builder@example.com \
    --name "Five-Minute Demo Agent" \
    --json \
  | node -e 'let input=""; process.stdin.on("data", d => input += d); process.stdin.on("end", () => console.log(JSON.parse(input).apiKey));'
)"
export PROOFTICKET_AGENT_ACTION_SECRET="local-agent-action-secret"
export PROOFTICKET_ACTOR_EMAIL="builder@example.com"
```

`proofticket:agent-register` prints the raw API key once and stores only its SHA-256 digest.

If the server is already running without `PROOFTICKET_AGENT_ACTION_SECRET`, stop it and restart it with that environment variable set.

To print the complete command sequence without reading this walkthrough:

```bash
bash examples/five-minute-demo/print-demo-commands.sh
```

## 3. Agent Files Ticket With Evidence

```bash
cat examples/five-minute-demo/agent-ticket-with-evidence.json \
  | npm run proofticket:agent -- \
    --type CREATE_TICKET \
    --idempotency-key demo:agent:evidence:001
```

Expected result:

```json
{
  "ok": true,
  "body": {
    "status": "PENDING"
  }
}
```

## 4. Human Lists Pending Actions

```bash
npm run proofticket:actions -- \
  --actor-email "$PROOFTICKET_ACTOR_EMAIL" \
  --status PENDING
```

Copy the action id from the output.

## 5. Human Inspects The Action Receipt

```bash
npm run proofticket:receipt -- \
  --action-id "<agent-action-id>"
```

The receipt shows the action status, agent attribution, payload, result id if resolved, and any audit events already attached to the action.

## 6. Human Approves Action

```bash
npm run proofticket:action -- \
  --decision approve \
  --action-id "<agent-action-id>" \
  --actor-email "$PROOFTICKET_ACTOR_EMAIL"
```

Expected result:

```json
{
  "ok": true,
  "body": {
    "status": "approved",
    "resultId": "<ticket-id>"
  }
}
```

Open the ticket:

```text
http://localhost:3000/tickets/<ticket-id>
```

The ticket should show agent attribution and the attached evidence artifact.

## 7. Export The Evidence Bundle

```bash
npm run proofticket:evidence -- \
  --ticket-id "<ticket-id>"
```

Expected result:

```text
wrote /path/to/proofticket/outputs/evidence/<ticket-id>-evidence.json
wrote /path/to/proofticket/outputs/evidence/<ticket-id>-evidence.md
```

The bundle includes the ticket, artifacts, related agent actions, responses, comments, and audit events in deterministic order.

## Optional: GitHub PR Event To Ticket

With the app still running:

```bash
export PROOFTICKET_GITHUB_WEBHOOK_SECRET="local-github-webhook-secret"
export PROOFTICKET_ACTOR_EMAIL="$PROOFTICKET_ACTOR_EMAIL"
npm run github:webhook:demo
```

This sends a signed local fixture for a GitHub pull request event. ProofTicket creates a private review ticket with repository and PR artifacts. It does not write back to GitHub.

## What This Proves

- Agents can submit structured work without browser access.
- Agent work can stay pending until a human approves it.
- Evidence can travel with the ticket.
- The final ticket becomes durable shared context.
- Agent work can be inspected as a receipt.
- Tickets can be exported as proof-oriented evidence bundles.
- GitHub events can create review tickets through a signed webhook.

## What This Does Not Prove Yet

- hosted multi-tenant deployment,
- GitHub write-back or full PR/CI sync,
- MCP/A2A protocol adapters,
- org-level RBAC,
- production billing or compliance.

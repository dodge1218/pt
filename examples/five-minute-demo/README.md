# Kairos Five-Minute Demo

This demo shows the core Kairos workflow:

1. start Kairos locally,
2. submit an agent-created ticket with evidence,
3. list pending agent actions,
4. approve the action,
5. verify the result is durable.

It uses generic demo values. Replace secrets, emails, and keys with your own local values.

## 1. Prepare Local App

From the repo root:

```bash
npm install
npm run setup:local
export KAIROS_AGENT_ACTION_SECRET="local-agent-action-secret"
npm run dev
```

In another terminal:

```bash
npm run health
```

Expected result:

```text
Kairos health ok: database=ok
```

## 2. Configure Demo Env

Use a local-only agent key and terminal approval secret.

```bash
export KAIROS_BASE_URL="http://localhost:3000"
export KAIROS_AGENT_API_KEY="kairos_demo_conductor_do_not_use_in_production"
export KAIROS_AGENT_ACTION_SECRET="local-agent-action-secret"
export KAIROS_ACTOR_EMAIL="<seeded-owner-email>"
```

For the seeded demo database, replace `<seeded-owner-email>` with the demo user email printed by `npm run db:seed`.

If the server is already running without `KAIROS_AGENT_ACTION_SECRET`, stop it and restart it with that environment variable set.

To print the complete command sequence without reading this walkthrough:

```bash
bash examples/five-minute-demo/print-demo-commands.sh
```

## 3. Agent Files Ticket With Evidence

```bash
cat examples/five-minute-demo/agent-ticket-with-evidence.json \
  | npm run kairos:agent -- \
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
npm run kairos:actions -- \
  --actor-email "$KAIROS_ACTOR_EMAIL" \
  --status PENDING
```

Copy the action id from the output.

## 5. Human Approves Action

```bash
npm run kairos:action -- \
  --decision approve \
  --action-id "<agent-action-id>" \
  --actor-email "$KAIROS_ACTOR_EMAIL"
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

## What This Proves

- Agents can submit structured work without browser access.
- Agent work can stay pending until a human approves it.
- Evidence can travel with the ticket.
- The final ticket becomes durable shared context.

## What This Does Not Prove Yet

- hosted multi-tenant deployment,
- GitHub PR/CI sync,
- MCP/A2A protocol adapters,
- org-level RBAC,
- production billing or compliance.

# ProofTicket MCP Adapter

ProofTicket includes a local stdio MCP adapter for agent runtimes that can speak JSON-RPC over `Content-Length` framed stdio.

The adapter is intentionally thin: each tool calls the existing ProofTicket HTTP API. It does not write directly to the database.

## Run

```bash
npm run mcp:server
```

Most clients run the command for you. A local client config usually looks like:

```json
{
  "mcpServers": {
    "proofticket": {
      "command": "npm",
      "args": ["run", "mcp:server"],
      "env": {
        "PROOFTICKET_BASE_URL": "http://localhost:3000",
        "PROOFTICKET_AGENT_API_KEY": "proofticket_example_agent_key",
        "PROOFTICKET_AGENT_ACTION_SECRET": "local-agent-action-secret",
        "PROOFTICKET_ACTOR_EMAIL": "builder@example.com"
      }
    }
  }
}
```

## Tools

### `proofticket_create_action`

Creates a pending agent action through `POST /api/agent`.

Required env:

- `PROOFTICKET_AGENT_API_KEY`

Input:

```json
{
  "type": "CREATE_TICKET",
  "idempotencyKey": "demo:mcp:ticket:001",
  "payload": {
    "title": "Review failed check",
    "content": "The CI check failed after the migration changed.",
    "type": "STATUS",
    "visibility": "PRIVATE",
    "tags": ["ci", "agent"]
  }
}
```

### `proofticket_list_actions`

Lists pending or resolved actions through `GET /api/webhooks/openclaw/agent-actions`.

Required env:

- `PROOFTICKET_AGENT_ACTION_SECRET`
- `PROOFTICKET_ACTOR_EMAIL` or `PROOFTICKET_ACTOR_USER_ID`

Input:

```json
{
  "status": "PENDING",
  "limit": 20
}
```

### `proofticket_resolve_action`

Approves or rejects an action through `POST /api/webhooks/openclaw/agent-actions`.

Required env:

- `PROOFTICKET_AGENT_ACTION_SECRET`
- `PROOFTICKET_ACTOR_EMAIL` or `PROOFTICKET_ACTOR_USER_ID`

Input:

```json
{
  "actionId": "agent-action-id",
  "decision": "approve"
}
```

Approvals may include a revised `payload` object.

### `proofticket_attach_artifact`

Attaches an artifact through `POST /api/tickets/:id/artifacts`.

Required env:

- `PROOFTICKET_SESSION_COOKIE`

The current artifact endpoint is session-authenticated. This tool is still a thin API wrapper, but it needs a browser session cookie for the user allowed to attach artifacts to the ticket.

Input:

```json
{
  "ticketId": "ticket-id",
  "artifact": {
    "kind": "LINK",
    "title": "CI transcript",
    "uri": "https://example.com/build/123",
    "summary": "Failed migration check transcript."
  }
}
```

## Smoke Test

The smoke test validates MCP framing and tool discovery without requiring a running ProofTicket server:

```bash
npm run mcp:smoke
```

Full tool calls require the app server and the relevant secrets:

```bash
npm run dev
npm run mcp:server
```

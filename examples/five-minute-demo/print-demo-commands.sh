#!/usr/bin/env bash

cat <<'EOF'
# ProofTicket five-minute local demo
#
# Terminal 1: install, prepare the local database, and start the app.
npm install
npm run setup:local
export PROOFTICKET_AGENT_ACTION_SECRET="local-agent-action-secret"
npm run dev

# Terminal 2: configure demo environment after the app is running.
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

# Confirm the app and database are reachable.
npm run health

# Submit an agent-created ticket with attached evidence.
cat examples/five-minute-demo/agent-ticket-with-evidence.json \
  | npm run proofticket:agent -- \
    --type CREATE_TICKET \
    --idempotency-key demo:agent:evidence:001

# List pending agent actions for the owning human.
npm run proofticket:actions -- \
  --actor-email "$PROOFTICKET_ACTOR_EMAIL" \
  --status PENDING

# Approve the pending action after copying its id.
npm run proofticket:receipt -- \
  --action-id "<agent-action-id>"

npm run proofticket:action -- \
  --decision approve \
  --action-id "<agent-action-id>" \
  --actor-email "$PROOFTICKET_ACTOR_EMAIL"

# Export the approved ticket after copying its result id.
npm run proofticket:evidence -- \
  --ticket-id "<ticket-id>"

# Optional: create a ticket from a signed GitHub pull request fixture.
export PROOFTICKET_GITHUB_WEBHOOK_SECRET="local-github-webhook-secret"
npm run github:webhook:demo
EOF

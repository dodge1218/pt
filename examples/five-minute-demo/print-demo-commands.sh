#!/usr/bin/env bash

cat <<'EOF'
# Kairos five-minute local demo
#
# Terminal 1: install, prepare the local database, and start the app.
npm install
npm run setup:local
export KAIROS_AGENT_ACTION_SECRET="local-agent-action-secret"
npm run dev

# Terminal 2: configure demo environment after the app is running.
export KAIROS_BASE_URL="http://localhost:3000"
export KAIROS_AGENT_API_KEY="kairos_demo_conductor_do_not_use_in_production"
export KAIROS_AGENT_ACTION_SECRET="local-agent-action-secret"
export KAIROS_ACTOR_EMAIL="<seeded-owner-email>"

# Confirm the app and database are reachable.
npm run health

# Submit an agent-created ticket with attached evidence.
cat examples/five-minute-demo/agent-ticket-with-evidence.json \
  | npm run kairos:agent -- \
    --type CREATE_TICKET \
    --idempotency-key demo:agent:evidence:001

# List pending agent actions for the owning human.
npm run kairos:actions -- \
  --actor-email "$KAIROS_ACTOR_EMAIL" \
  --status PENDING

# Approve the pending action after copying its id.
npm run kairos:action -- \
  --decision approve \
  --action-id "<agent-action-id>" \
  --actor-email "$KAIROS_ACTOR_EMAIL"
EOF

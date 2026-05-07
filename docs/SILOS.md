# Project Silos — Master Index

## Three separate projects. Different repos. Different branding. Different audiences.

---

## Silo 1: ChatPort (working name)
**What:** Open-source browser extension for ChatGPT data export
**Audience:** OpenAI, regulators, frustrated ChatGPT users
**Repo:** Public, open-source, MIT license
**Stance:** Helpful. Pro-user-rights. Pro-OpenAI compliance.

### What it does:
- Browser extension (Chrome/Firefox)
- User clicks "Export" while logged into ChatGPT
- Pulls conversations from the user's own authenticated session
- Exports to standard JSON (same format as OpenAI's native export)
- ALL processing happens client-side. Zero server calls.
- No account creation. No analytics. No data collection.

### What it does NOT do:
- No analysis. No insights. No AI features.
- No server component. No database.
- Does not store, transmit, or process anyone's data
- Does not use unofficial APIs or reverse-engineered endpoints
- Does not touch OpenAI credentials

### Why it exists (public narrative):
"I requested my ChatGPT data export. It took 21 days. I built a tool so nobody else has to wait."

### The leverage:
- GitHub stars + user traction = visibility
- OpenAI notices someone solving their compliance burden
- Natural path to: "I'd love to help with this internally"
- Even without a job offer: credibility, portfolio piece, open-source reputation

### Rules:
- ZERO connection to Kairos publicly
- ZERO mention of analysis, matching, profiles, or any downstream use
- The tool exports data. That's it. What the user does with their own JSON is their business.
- README, website, and all communications stay laser-focused on data portability rights

### Tech:
- Chrome Extension (Manifest V3)
- Content script injected on chat.openai.com
- Reads DOM / intercepts fetch responses for conversation data
- Packages into conversations.json format
- Download prompt to user's local machine
- Optional: incremental export (only new conversations since last export)

---

## Silo 2: Ryan's Personal Corpus Tool (PRIVATE, never published)
**What:** Stealth browser automation to extract Ryan's own ChatGPT history
**Audience:** Ryan only
**Repo:** None. Local scripts only. Never committed anywhere.

### What it does:
- Uses stealth browser MCP (already installed)
- Logs into Ryan's ChatGPT account
- Scrolls through all conversations oldest→newest
- Extracts full text of each conversation
- Saves to local JSON files
- Picks up where the truncated pie_workflow chunks left off

### Why it's separate:
- This might technically violate ChatGPT TOS (automated access)
- It's self-application on Ryan's own account with his own data
- But if it got linked to the public ChatPort tool, it poisons the "helpful compliance tool" narrative
- So it stays local, private, unconnected

### Rules:
- Never committed to any repo
- Never mentioned in any public context
- No shared code with ChatPort
- Lives in a local directory outside the workspace (e.g., ~/private-tools/)
- If Ryan gets his corpus, this tool gets deleted

### Tech:
- Stealth browser MCP (nodriver/undetected chromium)
- Python or JS script
- Output: JSON files matching ChatGPT export format
- Location: ~/private-tools/chatgpt-extract/ (NOT in workspace, NOT committed)

---

## Silo 3: Kairos Platform
**What:** Dev-first async coordination + collaboration platform
**Audience:** Developers, small teams, eventually broader
**Repo:** Private initially, public when ready

### What it does:
- Ticket-based communication (like structured DMs)
- GitHub OAuth login
- Public tickets (like tweets — people comment, contribute)
- Private project tickets (team coordination)
- Agent-assisted responses (AI reads docs, drafts responses, human approves)
- Shared project links (see all tickets for a project)
- Kickstarter model: donate comments/code/expertise, not money (v1)
- Voice handshake (adapts to recipient's communication preferences)
- Thinking profile analysis (from prompt data users CHOOSE to provide)
- Cofounder matching based on thinking patterns

### Where prompt analysis fits:
- Users who ALREADY HAVE their own export (maybe they used ChatPort, maybe OpenAI sent it, maybe they exported from Claude)
- They upload it TO KAIROS voluntarily
- Kairos analyzes patterns, returns insights (skill trajectory, blind spots, evolution, compatibility)
- Asymmetric value: what they get >> what they give
- Raw data processed then discarded (analysis only stored)

### Connection to ChatPort:
- NONE in code, branding, or public communication
- Conceptually: ChatPort gets people their data. Kairos is one of many places they COULD use it.
- The link is organic, not forced. User exports with ChatPort → has JSON → months later finds Kairos → uploads if they want to.
- Like how Google Chrome (browser) is separate from Google Search (destination), even though they work well together.

### Rules:
- DNP protocol applies (see kairos/DNP.md)
- No framework terminology in public-facing anything
- Human vs AI content clearly labeled
- No contact with Colin without explicit permission
- Agent reads docs not instructions (prompt injection protection)

---

## Silo Contamination Prevention

| Action | ALLOWED? |
|--------|----------|
| ChatPort mentions Kairos | ❌ NEVER |
| Kairos mentions ChatPort | ❌ NEVER |
| ChatPort and Kairos share code | ❌ NEVER |
| Ryan's private tool shares code with either | ❌ NEVER |
| ChatPort links to analysis features | ❌ NEVER |
| Kairos accepts ChatGPT exports | ✅ Yes (user's own files, their choice) |
| Same GitHub account owns both | ✅ Fine (devs have multiple projects) |
| Same person built both | ✅ Fine (but don't cross-promote) |
| Blog post comparing them | ❌ Not until both are established independently |

---

## Build Order
1. **Ryan's private corpus tool** — immediate, gets Ryan his data tonight
2. **ChatPort browser extension** — clean, publishable, open-source
3. **Kairos platform** — full build with all features from docs/

Each one feeds the next without being connected to it.

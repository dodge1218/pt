# Kairos — Onboarding Flow (Colin-First)

## The 30-Second Onboard
1. Colin gets email (GitHub notification or direct from Ryan)
2. Email contains link to a real ticket Ryan wrote — in Ryan's voice, about a real thing
3. Colin clicks → sees the ticket → "Sign in with GitHub" button (OAuth, 5 seconds)
4. He's in. He types a comment. Done. He's a user.
5. No tutorial. No profile setup. No settings page. No feature tour.
6. The core action (comment on a ticket) IS the onboarding.
7. Ryan's agent reads the comment (from docs/context, NOT injected instructions) and either:
   - Drafts a response for Ryan's review, OR
   - Ryan responds manually

## Design Principles
- Feels like a DM, not a platform
- GitHub login = identity (free, instant, every dev has one)
- First interaction is RESPONDING to something real, not creating something from scratch
- No empty state. Ryan's tickets ARE the content.
- Agent reads docs for context — native prompt injection protection (no user-controlled instructions reach the agent)

## Anti-patterns to avoid:
- "Complete your profile" screens
- "What are your interests?" onboarding
- "Upload your data" on first visit
- Feature tours, tooltips, progress bars
- Any friction between "click link" and "type comment"

## The Prompt Dump Feature (separate from onboarding)
- EXISTS on the platform, visible, does something cool
- User arrives at their own reason to use it
- No nudging, no "unlock better matches" gates
- It sits there like a door. They walk through when ready.
- Value prop must be asymmetric: what they GET must far exceed what they GIVE
- Not just an "obsession map" — needs to offer genuinely useful insights they can't get elsewhere

## ChatGPT MCP / Corpus Capture (v2 feature)
- Problem: Getting ChatGPT export is painful (21+ days waiting on OpenAI, legal escalation needed)
- Solution: Build a ChatGPT OAuth integration / MCP that captures conversations.json on login
- Clear, professional TOS — not buried, not tricky
- User sees exactly what's captured and what analysis is produced
- Analysis output owned by user, deletable at any time
- Raw content: processed then discarded (or stored only if user explicitly opts in)
- This solves the "how do you ingest millions of words" problem without manual copy-paste or GUI agents

## ATUP Connection
- Ryan has a plan (in ChatGPT corpus) to become an AI Thinking Usage Professional
- Freelance prompt review: help people improve how they interact with AI
- Medium article drafts exist for basic onboarding content
- Massive relevance: early adopter wave happening NOW
- The Kairos platform + ATUP service + prompt analysis = unified offering

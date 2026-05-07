# Dependency Decisions

Date: 2026-05-06

## Approved Inputs

- `BUILD-TICKET.md` defines the Kairos MVP stack: Next.js 15, TypeScript, Prisma, NextAuth v5, shadcn/Radix, Tailwind CSS 4, Groq SDK.
- `DSB_APPROVED_LIBRARIES.md` was found in the workspace archive and BobLead project. It approves Next.js, TypeScript, React, Tailwind CSS, tailwind-merge, clsx, class-variance-authority, Radix/shadcn, Lucide, NextAuth, Prisma when already in use, Zod, Vitest, and Playwright.

## Decisions

- Keep the existing Next.js 15 + React 19 app. The ticket already scaffolded it and build passes.
- Keep Prisma. The approved catalog prefers Drizzle for new projects, but explicitly allows Prisma when the client/project already uses Prisma.
- Keep NextAuth v5 for GitHub OAuth. It is in the approved catalog and already wired.
- Keep Tailwind CSS 4. The CSS was broken because the Tailwind v4 PostCSS adapter was missing, so utilities were not being compiled correctly.
- Add `@tailwindcss/postcss@4.2.2` to match the installed `tailwindcss@4.2.2`.
- Use plain self-contained components for this pass. The existing app does not include copied shadcn components yet; adding a full shadcn set is deferred because the requested priority is guts over polish.

## Deferred

- shadcn component import/copy pass.
- Playwright test dependency installation if screenshots cannot be captured by an existing browser tool.
- Full visual polish and real media pass.

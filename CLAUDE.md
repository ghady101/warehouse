# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev       # Start dev server at http://localhost:3000
npm run build     # Production build
npm run lint      # Run ESLint
```

No test runner is configured yet.

## Stack

- **Next.js 16.2.3** (App Router) — see AGENTS.md: read `node_modules/next/dist/docs/` before writing Next.js code
- **React 19**, **TypeScript**, **Tailwind CSS v4**, **shadcn/ui** (Radix + CVA)
- **Auth**: next-auth v5 beta (`src/auth.ts`) — credentials provider + NeonAdapter
- **Database**: Neon (serverless Postgres) via `@neondatabase/serverless`

## Architecture

### Auth (`src/auth.ts`)
NextAuth is initialized with a factory function (not a plain config object) so a new `Pool` is created per request — this is required by `@auth/neon-adapter` which needs a fresh pool each invocation. The exported `{ handlers, auth, signIn, signOut }` are used throughout the app. The catch-all route at `src/app/api/auth/[...nextauth]/route.ts` re-exports the handlers.

### Database clients
Two separate Neon clients coexist:
- `src/lib/neon.ts` — exports `sql` (tagged-template query client via `neon()`) for use in Server Actions and Route Handlers
- `src/auth.ts` — creates a `Pool` inline for the NeonAdapter (must be per-request, not a module-level singleton)

### Server Actions (`src/actions/`)
Marked `'use server'`. Current: `user.ts` (`getUserFromDb` — stub, needs implementation).

### Environment variables required
- `DATABASE_URL` — Neon connection string
- `BETTER_AUTH_SECRET` — NextAuth secret

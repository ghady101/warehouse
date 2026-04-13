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

### Route structure

```
/                     — Landing page (redirects to /dashboard if logged in)
/login, /signup       — Auth pages (redirect to /dashboard if logged in)
/dashboard            — Logged-in home with nav cards
/stockmanagement      — Stock CRUD, CSV import/export, stock history
/salestracker         — Record sales, auto-price, balance tracking, CSV export
```

Route groups:
- `(auth)` — login/signup, guarded layout redirects logged-in users to `/dashboard`
- `(dashboard)` — all authenticated pages, guarded layout redirects guests to `/login`

### Auth (`src/auth.ts`)
NextAuth is initialized with a factory function (not a plain config object) so a new `Pool` is created per request — this is required by `@auth/neon-adapter` which needs a fresh pool each invocation. The exported `{ handlers, auth, signIn, signOut }` are used throughout the app. The catch-all route at `src/app/api/auth/[...nextauth]/route.ts` re-exports the handlers.

Sign-out uses `signOut()` from `next-auth/react` (not a plain form POST) to handle CSRF tokens correctly.

### Database clients
Two separate Neon clients coexist:
- `src/lib/neon.ts` — exports `sql` (tagged-template query client via `neon()`) for use in Server Actions and Route Handlers. **No `'use server'` directive** — it's a plain module import.
- `src/auth.ts` — creates a `Pool` inline for the NeonAdapter (must be per-request, not a module-level singleton)

**Important**: The `sql` client uses tagged template literals only. Do NOT call `sql(string, params)` — it will fail TypeScript. Use `sql\`...\`` with interpolated values.

### Database tables

- **stocks** — `id, user_id, name, price (sell), buy_price, quantity, date, created_at, updated_at`
- **sales** — `id, user_id, product_name, quantity, unit_price, total, date, created_at`
- **sales_balance** — `id, user_id (unique), initial_balance, updated_at`
- **stock_history** — `id, user_id, product_name, quantity, sell_price, buy_price, date, created_at`

### Server Actions (`src/actions/`)

Marked `'use server'`:
- **`stock.ts`** — `getStocks`, `addStock`, `updateStock`, `deleteStock`, `importStocks`, `getStockHistory`. Add/import uses **upsert**: if a product with the same name exists, quantity is added and prices are updated (not duplicated). Every add/import records an entry in `stock_history`.
- **`sales.ts`** — `addSale`, `getSales`, `deleteSale`, `searchProducts`, `getProductPrice`, `getBalance`, `setBalance`, `getTotalSalesRevenue`. Sales deduct stock using FIFO. Deleting a sale restores stock. The `unit_price` can be overridden by the user at sale time.
- **`auth.ts`** — `loginAction`, `signupAction` (redirect to `/dashboard`)
- **`user.ts`** — `getUserFromDb`, `createUser`

### Utilities

- **`src/lib/date.ts`** — `normalizeDate()` converts any date format (MM/DD/YYYY, DD/MM/YYYY, DD-MM-YYYY, etc.) to ISO `YYYY-MM-DD`. Used in stock import and add/update actions.

### API Routes (`src/app/api/`)

- `stocks/export` — CSV export of stocks with filter params
- `stocks/template` — downloadable CSV template for stock import
- `sales/export` — CSV export of sales with filter params

### Key behaviors

- **Stock upsert**: Adding a product that already exists (case-insensitive name match) adds to quantity and updates prices rather than creating a duplicate row.
- **Stock history**: Every stock addition (manual or import) is logged in `stock_history`. Clicking a product name in the stock table shows its full restock history.
- **Sales auto-price**: Selecting a product in the sales form auto-fills the price from the database, but the price input remains editable so it can be overridden.
- **Sales quantity validation**: Cannot sell more than available stock. Out-of-stock products appear in the dropdown but are disabled.
- **CSV date parsing**: Import accepts dates in any common format — they are normalized to ISO before insertion.
- **Date serialization**: Database returns `Date` objects for date/timestamp columns. All `getStocks`/`getSales` functions serialize these to strings before passing to client components.

### Environment variables required
- `DATABASE_URL` — Neon connection string
- `BETTER_AUTH_SECRET` — NextAuth secret

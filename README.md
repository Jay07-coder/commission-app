# Commission App — Top Agent Realty

The web‑app version of the commission tool. This is the real codebase (Next.js + Supabase), not a prototype. The calculation engine is ported from the validated prototype and **passes 16/16 tests against your real closed deals**.

## What's built (complete & verified)

- ✅ **Commission engine** (`lib/commission.ts`) — typed, pure, **16/16 tests pass** against your real deals.
- ✅ **Your roster + source rules** (`lib/seed-data.ts`) — 38 agents with their splits.
- ✅ **Database schema** (`supabase/schema.sql`) — multi‑tenant with Row‑Level Security.
- ✅ **Public preview** (`/`) — the calculator, no login, runs on your roster.
- ✅ **Login / sign‑up** (`/login`) — email + password (Supabase Auth).
- ✅ **Calculator** (`/app/calculator`) — loads agents from the cloud, saves statements.
- ✅ **Agents page** (`/app/agents`) — add / edit / remove agents and their plans, saved to the cloud.
- ✅ **History page** (`/app/history`) — every saved statement, per brokerage.
- ✅ **Multi‑tenant security** — a new sign‑up automatically gets its own brokerage, seeded with the default roster; one brokerage can never see another's data.
- ✅ **Builds clean** — `npm run build` succeeds, types valid.

## What's next

- Go live (deploy to a real URL) — see **GO-LIVE-GUIDE** (15 minutes of clicking; Jay's accounts).
- Server‑side email + e‑signature approval flow
- Reporting dashboards, cap automation, CSV import

## Run it on your computer (5 minutes)

You need **Node.js 18+** installed ([nodejs.org](https://nodejs.org)). Then, in a terminal:

```bash
cd commission-app
npm install        # one-time: downloads dependencies
npm run dev        # starts the app
```

Open **http://localhost:3000** — the calculator runs with your full roster. No accounts needed at this stage; it works entirely on your machine.

To run the engine tests:

```bash
npm test
```

## Project structure

```
commission-app/
├── app/
│   ├── page.tsx         # Calculator + statement UI
│   ├── layout.tsx       # App shell
│   └── globals.css      # Styling
├── lib/
│   ├── commission.ts    # The calculation engine (the core)
│   ├── seed-data.ts     # Default agents + source rules
│   └── commission.test.ts
├── supabase/
│   └── schema.sql       # Database tables + security (run when we go live)
└── package.json
```

## Going live later (when you're ready)

1. Create free accounts: **GitHub, Supabase, Vercel** (and later Resend for email).
2. In Supabase, run `supabase/schema.sql` to create the database.
3. Copy `.env.local.example` → `.env.local` and paste your Supabase URL + key.
4. Push to GitHub → connect to Vercel → it deploys to a real URL automatically.

I'll walk you through each of these steps when we add the login/database layer. Nothing here locks you in — you own the code and every account.

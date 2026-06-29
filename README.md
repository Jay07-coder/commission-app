# SplitKey — Commission management for brokerages

SplitKey is the all-in-one commission platform for real-estate brokerages, built for **Top Agent Realty** and designed to be offered to other brokerages. It calculates commission splits, runs the deal-approval workflow, gives agents a self-serve portal, surfaces reporting and AI insights, and prepares year-end 1099s.

**Live:** https://app.topagentmi.com

---

## Stack

- **Next.js 15** (App Router, TypeScript, server components + server actions)
- **Supabase** (Postgres, Auth, Row-Level Security)
- **Vercel** hosting (auto-deploys from `main`)
- **Three.js** (cosmic particle landing visuals)
- **Anthropic Messages API** (in-app AI copilot)
- **Resend** (transactional email)

---

## What it does

**Commission engine**
- 3-way split (agent / brokerage / partner), per-agent and per-lead-source rules, annual caps, royalties, referral fees, E&O and compliance deductions.
- Instant, printable commission statements. Engine passes its unit tests against real closed deals.

**Deal board & approvals**
- Pipeline with stages (draft → approved → completed), notes, broker sign-off, automated approval emails.

**Reports & AI**
- Live KPI dashboard (gross, net to brokerage, net to partner, paid to agents), monthly trend, top agents, by-lead-source, by-zip.
- AI copilot grounded in live data ("show me KPIs for this agent").
- Zillow zip-code extraction + interactive map of target areas.

**Agent experience**
- Agent portal (own deals, earnings, cap progress).
- Admin "view as agent" impersonation.
- Roles: Super Admin (owner), Broker, Transaction Coordinator, Accountant, Agent — with a signup-approval flow.

**Tax / 1099**
- Year-end 1099-NEC summary per agent ($600 threshold, includes departed agents).
- Agent W-9 self-onboarding at signup.
- Printable 1099-NEC form per agent.
- **TIN/SSN encrypted at rest** (pgcrypto); decryptable only by the agent themselves or their brokerage's owner/broker via authorization-checked DB functions.

**Marketing site**
- Immersive morphing-particle landing (orb → wave → galaxy → vortex), product screens, outcomes, FAQ, trust strip, testimonials, contact/demo CTA.
- Privacy Policy and Terms pages, Open Graph share image, sitemap + robots.

---

## Project structure

```
app/
  page.tsx            Landing (marketing)
  privacy/ terms/     Legal pages
  robots.ts sitemap.ts opengraph-image.png
  login/              Auth
  app/                The product (gated)
    transactions/     Deal board
    calculator/       Commission calculator
    agents/ team/     Roster + roles
    reports/ map/     Reporting + geo map
    tax/              1099s, W-9, print form
    me/               Agent portal + view-as-agent
components/            UI (Logo, ChatWidget, Scene3D, ScrollFX, TaxSummary, Form1099, W9Form, …)
lib/                  commission engine, Supabase clients, data access, AI, email
supabase/             schema.sql + migrations (roles, transactions, zipcode, agent portal, W-9, TIN encryption)
```

---

## Database migrations

Run in the Supabase SQL editor in order (already applied to production):

1. `schema.sql` — base tables + RLS
2. `migration_roles.sql` — roles + approval flow
3. `migration_transactions.sql` — deal board
4. `migration_zipcode.sql` — city/zip
5. import columns (imported / external_status / import_data)
6. `migration_agent_portal.sql` — agent-scoped RLS
7. `migration_w9.sql` — W-9 / tax profiles
8. `migration_tin_encryption.sql` — TIN/SSN encryption

---

## Local development

```bash
npm install
npm run dev
```

Required environment variables (set in Vercel for production):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (publishable key)
- `ANTHROPIC_API_KEY` (AI copilot)
- `RESEND_API_KEY` (email)

Deploys are triggered automatically when changes land on `main`.

---

## Outstanding / roadmap

- Wire the Calendly link into "Book a demo".
- Add brokerage payer details (EIN/address) so 1099s auto-fill the payer block.
- Activate agent logins (add agent emails) and onboard the team.
- Stripe billing for selling to other brokerages.
- Self-serve onboarding wizard for new brokerages.
- Verify the Resend sending domain.
- Analytics, error monitoring, and the splitkey.app domain.

# Go‑Live Guide (non‑technical)

Getting the app onto a real web address. **~15 minutes, mostly clicking.** Do this with me — I'll tell you exactly what to click and handle anything technical. You create the accounts (they're free and you own them); I do the rest.

You'll set up three free accounts: **Supabase** (the database + logins), **GitHub** (stores the code), **Vercel** (puts it on the web).

---

## Step 1 — Supabase (database + logins)

1. Go to **supabase.com** → "Start your project" → sign up (Google login is fine).
2. Click **New project**. Name it `commission-app`, pick a region near Michigan (e.g. *East US*), set a database password (save it somewhere), create.
3. Wait ~2 minutes for it to finish setting up.
4. In the left menu, open **SQL Editor** → **New query**. Paste the entire contents of `supabase/schema.sql` (from the project) → click **Run**. You should see "Success."
5. Left menu → **Project Settings → API**. Copy two values and send them to me:
   - **Project URL**
   - **anon public** key
6. (For easy first testing) Left menu → **Authentication → Providers → Email** → turn **OFF** "Confirm email," Save. This lets you log in immediately without email confirmation. We'll turn it back on before real customers.

## Step 2 — GitHub (stores the code)

1. Go to **github.com** → sign up / log in.
2. Click **New repository** → name it `commission-app` → **Private** → Create.
3. Tell me when it's created — I'll give you the exact commands (copy‑paste) to upload the code, or we do it together. (If you'd rather not touch a terminal, GitHub also lets you **upload files** through the website — I'll walk you through it.)

## Step 3 — Vercel (puts it on the web)

1. Go to **vercel.com** → "Sign up" → **Continue with GitHub** (connects the two).
2. Click **Add New → Project** → import your `commission-app` repo.
3. Before clicking Deploy, open **Environment Variables** and add the two from Step 1:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your anon public key
4. Click **Deploy**. ~2 minutes later you get a live link like `commission-app.vercel.app`.

## Step 4 — First login

1. Open your live link → click **Log in / Sign up** → **Create one** → use your email + a password.
2. You're in. The app auto‑creates your brokerage and loads your full agent roster. Try a deal, save it, check History.

---

## After it's live (optional polish)

- **Custom domain** (e.g. `app.topagentmi.com`): buy a domain, add it in Vercel → Domains. I'll guide DNS.
- **Real confirmation emails / approval emails:** we add Resend (5‑min setup) so the app sends statements and approvals server‑side.
- **Invite your staff:** we add a simple "invite teammate" so admins/agents get their own logins.

Whenever you're ready, just say "let's deploy" and we'll go step by step. You never have to figure out anything technical alone.

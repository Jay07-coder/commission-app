-- ============================================================
-- Commission App — database schema (Supabase / Postgres)
-- Multi-tenant: every row belongs to a brokerage; Row-Level
-- Security guarantees a user only ever sees their brokerage.
-- Run this in the Supabase SQL editor.
-- ============================================================

-- ---------- Brokerages (tenants) ----------
create table if not exists brokerages (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_at  timestamptz not null default now()
);

-- ---------- Memberships (which user belongs to which brokerage + role) ----------
-- auth.users is managed by Supabase Auth.
create type member_role as enum ('owner', 'admin', 'agent');

create table if not exists memberships (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  brokerage_id  uuid not null references brokerages(id) on delete cascade,
  role          member_role not null default 'owner',
  created_at    timestamptz not null default now(),
  unique (user_id, brokerage_id)
);

-- ---------- Agents (commission plan config) ----------
create table if not exists agents (
  id            uuid primary key default gen_random_uuid(),
  brokerage_id  uuid not null references brokerages(id) on delete cascade,
  name          text not null,
  email         text,
  tier          text not null default 'team',       -- team | independent | owner
  base_split    numeric not null default 50,         -- % to agent on own deals
  zillow_split  numeric,                             -- % to agent on company leads (null = none)
  office        text,
  cap           numeric not null default 0,          -- annual cap $, 0 = none
  cap_paid      numeric not null default 0,
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);
create index on agents (brokerage_id);

-- ---------- Sources (lead source → split rule) ----------
create table if not exists sources (
  id            uuid primary key default gen_random_uuid(),
  brokerage_id  uuid not null references brokerages(id) on delete cascade,
  name          text not null,
  category      text not null default 'self',        -- company | self | referral
  created_at    timestamptz not null default now()
);
create index on sources (brokerage_id);

-- ---------- Deals + Statements ----------
-- A statement stores the inputs AND the computed result (immutable record of what was paid).
create table if not exists statements (
  id              uuid primary key default gen_random_uuid(),
  brokerage_id    uuid not null references brokerages(id) on delete cascade,
  number          text,                              -- e.g. TAR-1001
  agent_id        uuid references agents(id) on delete set null,
  agent_name      text,                              -- denormalized snapshot
  property        text,
  client          text,
  side            text,
  source_name     text,
  close_date      date,
  -- inputs
  price           numeric,
  commission_pct  numeric,
  gross_override  numeric,
  referral_pct    numeric default 0,
  concessions     numeric default 0,
  bonus           numeric default 0,
  split_pct       numeric,
  royalty_pct     numeric default 0,
  eo_fee          numeric default 0,
  compliance_fee  numeric default 0,
  -- computed snapshot (jsonb of the full Statement object)
  result          jsonb not null,
  net_to_agent    numeric not null,
  status          text not null default 'draft',     -- draft | sent | approved | paid
  created_by      uuid references auth.users(id),
  created_at      timestamptz not null default now()
);
create index on statements (brokerage_id);
create index on statements (agent_id);

-- ---------- Audit log ----------
create table if not exists audit_log (
  id            uuid primary key default gen_random_uuid(),
  brokerage_id  uuid not null references brokerages(id) on delete cascade,
  user_id       uuid references auth.users(id),
  action        text not null,
  detail        jsonb,
  created_at    timestamptz not null default now()
);
create index on audit_log (brokerage_id);

-- ============================================================
-- Row-Level Security — the multi-tenant guarantee
-- ============================================================
-- Helper: brokerage ids the current user belongs to.
create or replace function my_brokerage_ids()
returns setof uuid language sql security definer stable as $$
  select brokerage_id from memberships where user_id = auth.uid()
$$;

alter table brokerages  enable row level security;
alter table memberships enable row level security;
alter table agents      enable row level security;
alter table sources     enable row level security;
alter table statements  enable row level security;
alter table audit_log   enable row level security;

-- Brokerages: members can read their own brokerage.
create policy brokerage_read on brokerages for select
  using (id in (select my_brokerage_ids()));

-- Memberships: a user can read their own memberships.
create policy membership_read on memberships for select
  using (user_id = auth.uid());

-- Generic tenant policies for the data tables.
create policy agents_rw on agents for all
  using (brokerage_id in (select my_brokerage_ids()))
  with check (brokerage_id in (select my_brokerage_ids()));

create policy sources_rw on sources for all
  using (brokerage_id in (select my_brokerage_ids()))
  with check (brokerage_id in (select my_brokerage_ids()));

create policy statements_rw on statements for all
  using (brokerage_id in (select my_brokerage_ids()))
  with check (brokerage_id in (select my_brokerage_ids()));

create policy audit_read on audit_log for select
  using (brokerage_id in (select my_brokerage_ids()));
create policy audit_insert on audit_log for insert
  with check (brokerage_id in (select my_brokerage_ids()));

-- ============================================================
-- Onboarding helper: create a brokerage + owner membership in one call.
-- ============================================================
create or replace function create_brokerage(p_name text)
returns uuid language plpgsql security definer as $$
declare new_id uuid;
begin
  insert into brokerages (name) values (p_name) returning id into new_id;
  insert into memberships (user_id, brokerage_id, role) values (auth.uid(), new_id, 'owner');
  return new_id;
end;
$$;

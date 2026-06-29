import { createClient } from "@/lib/supabase/server";
import { DEFAULT_AGENTS, DEFAULT_SOURCES } from "@/lib/seed-data";
import type { Agent, Source } from "@/lib/commission";

export interface Context {
  userId: string;
  email: string;
  brokerageId: string;
  brokerageName: string;
  role: string;     // owner | broker | transaction_coordinator | accountant | agent
  status: string;   // active | pending
}

interface AgentRow {
  id: string; name: string; email: string | null; tier: string;
  base_split: number; zillow_split: number | null; office: string | null;
  cap: number; cap_paid: number;
}

const rowToAgent = (r: AgentRow): Agent => ({
  id: r.id, name: r.name, email: r.email ?? "", tier: r.tier as Agent["tier"],
  baseSplit: Number(r.base_split), zillowSplit: r.zillow_split == null ? null : Number(r.zillow_split),
  office: r.office ?? "", cap: Number(r.cap), capPaid: Number(r.cap_paid),
});

/** Resolve the signed-in user's brokerage + role, bootstrapping or joining as needed. */
export async function getContext(): Promise<Context | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const defaultName = (user.email?.split("@")[1]?.split(".")[0] || "My") + " Brokerage";
  const { data, error } = await supabase.rpc("ensure_membership", { p_default_name: defaultName });
  if (error) return null;
  const m = (Array.isArray(data) ? data[0] : data) as { brokerage_id: string; role: string; status: string } | undefined;
  if (!m) return null;

  let brokerageName = defaultName;
  const { data: b } = await supabase.from("brokerages").select("name").eq("id", m.brokerage_id).single();
  if (b?.name) brokerageName = b.name;

  // Seed defaults for a brand-new owner brokerage (only when it has no agents yet).
  if (m.role === "owner" && m.status === "active") {
    const { count } = await supabase.from("agents").select("id", { count: "exact", head: true }).eq("brokerage_id", m.brokerage_id);
    if ((count ?? 0) === 0) await seedDefaults(m.brokerage_id);
  }

  return {
    userId: user.id, email: user.email ?? "",
    brokerageId: m.brokerage_id, brokerageName, role: m.role, status: m.status,
  };
}

export const isOwner = (ctx: Context | null) => ctx?.role === "owner" && ctx?.status === "active";

/** Owner (Super Admin) or Broker — both may manage the team. */
export const canManageTeam = (ctx: Context | null) =>
  (ctx?.role === "owner" || ctx?.role === "broker") && ctx?.status === "active";

async function seedDefaults(brokerageId: string) {
  const supabase = await createClient();
  await supabase.from("agents").insert(
    DEFAULT_AGENTS.map((a) => ({
      brokerage_id: brokerageId, name: a.name, email: a.email || null, tier: a.tier,
      base_split: a.baseSplit, zillow_split: a.zillowSplit, office: a.office || null,
      cap: a.cap || 0, cap_paid: a.capPaid || 0,
    }))
  );
  await supabase.from("sources").insert(
    DEFAULT_SOURCES.map((s) => ({ brokerage_id: brokerageId, name: s.name, category: s.category }))
  );
}

export interface Member { id: string; email: string; role: string; status: string; created_at: string; isSelf: boolean; }

export async function getMembers(): Promise<Member[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data } = await supabase
    .from("memberships")
    .select("id, email, role, status, created_at, user_id")
    .order("created_at");
  type Row = { id: string; email: string | null; role: string; status: string; created_at: string; user_id: string };
  return ((data as Row[] | null) ?? []).map((r) => ({
    id: r.id, email: r.email ?? "—", role: r.role, status: r.status, created_at: r.created_at, isSelf: r.user_id === user?.id,
  }));
}

export async function getAgents(): Promise<Agent[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("agents").select("*").eq("active", true).order("name");
  return (data as AgentRow[] | null)?.map(rowToAgent) ?? [];
}

export async function getSources(): Promise<Source[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("sources").select("name, category").order("name");
  const rows = (data as { name: string; category: string }[] | null) ?? [];
  return rows.length
    ? rows.map((r) => ({ name: r.name, category: r.category as Source["category"] }))
    : DEFAULT_SOURCES;
}

export interface StatementRow {
  id: string; number: string | null; agent_name: string | null; property: string | null;
  client: string | null; source_name: string | null; close_date: string | null;
  net_to_agent: number; status: string; created_at: string; result: unknown;
}

export async function getStatements(): Promise<StatementRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("statements")
    .select("id, number, agent_name, property, client, source_name, close_date, net_to_agent, status, created_at, result")
    .order("created_at", { ascending: false })
    .limit(500);
  return (data as StatementRow[] | null) ?? [];
}

export interface MyAgent {
  name: string;
  tier: string;
  baseSplit: number;
  zillowSplit: number | null;
  cap: number;
  capPaid: number;
}

/** The agent record linked to the signed-in user, matched by email (case-insensitive). Null if not linked. */
export async function getMyAgent(): Promise<MyAgent | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return null;
  const { data } = await supabase
    .from("agents")
    .select("name, tier, base_split, zillow_split, cap, cap_paid")
    .ilike("email", user.email)
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  const r = data as { name: string; tier: string; base_split: number; zillow_split: number | null; cap: number; cap_paid: number };
  return {
    name: r.name,
    tier: r.tier,
    baseSplit: Number(r.base_split),
    zillowSplit: r.zillow_split == null ? null : Number(r.zillow_split),
    cap: Number(r.cap),
    capPaid: Number(r.cap_paid),
  };
}

export interface TaxProfile {
  legal_name: string; business_name: string; classification: string;
  tin_type: string; tin: string;
  address1: string; address2: string; city: string; state: string; zip: string;
  signed_name: string; signed_at: string | null;
}

/** The signed-in user's own W-9 / tax profile, or null if not started. Works even while pending. */
export async function getMyTaxProfile(): Promise<TaxProfile | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("agent_tax_profiles")
    .select("legal_name, business_name, classification, tin_type, tin, address1, address2, city, state, zip, signed_name, signed_at")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!data) return null;
  const r = data as Partial<TaxProfile>;
  const { data: tinPlain } = await supabase.rpc("my_tin"); // decrypt own TIN
  return {
    legal_name: r.legal_name ?? "", business_name: r.business_name ?? "", classification: r.classification ?? "",
    tin_type: r.tin_type ?? "", tin: (tinPlain as string | null) ?? "",
    address1: r.address1 ?? "", address2: r.address2 ?? "", city: r.city ?? "", state: r.state ?? "", zip: r.zip ?? "",
    signed_name: r.signed_name ?? "", signed_at: r.signed_at ?? null,
  };
}

/** An agent's W-9 profile by email — admins (owner/broker) can read their brokerage's. */
export async function getTaxProfileByEmail(email: string): Promise<TaxProfile | null> {
  if (!email) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("agent_tax_profiles")
    .select("legal_name, business_name, classification, tin_type, tin, address1, address2, city, state, zip, signed_name, signed_at")
    .ilike("email", email)
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  const r = data as Partial<TaxProfile>;
  const { data: tinPlain } = await supabase.rpc("tin_for_email", { p_email: email }); // admin-decrypt
  return {
    legal_name: r.legal_name ?? "", business_name: r.business_name ?? "", classification: r.classification ?? "",
    tin_type: r.tin_type ?? "", tin: (tinPlain as string | null) ?? "",
    address1: r.address1 ?? "", address2: r.address2 ?? "", city: r.city ?? "", state: r.state ?? "", zip: r.zip ?? "",
    signed_name: r.signed_name ?? "", signed_at: r.signed_at ?? null,
  };
}

/** Lowercased emails that have a completed W-9 — admin use, to flag who's on file. */
export async function getTaxProfileEmails(): Promise<Set<string>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("agent_tax_profiles")
    .select("email, signed_at");
  const rows = (data as { email: string | null; signed_at: string | null }[] | null) ?? [];
  return new Set(rows.filter((r) => r.signed_at && r.email).map((r) => r.email!.toLowerCase()));
}

/** Look up an agent by name — used by admins to view any agent's portal. */
export async function getAgentByName(name: string): Promise<MyAgent | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("agents")
    .select("name, tier, base_split, zillow_split, cap, cap_paid")
    .eq("name", name)
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  const r = data as { name: string; tier: string; base_split: number; zillow_split: number | null; cap: number; cap_paid: number };
  return {
    name: r.name,
    tier: r.tier,
    baseSplit: Number(r.base_split),
    zillowSplit: r.zillow_split == null ? null : Number(r.zillow_split),
    cap: Number(r.cap),
    capPaid: Number(r.cap_paid),
  };
}

import { createClient } from "@/lib/supabase/server";
import { DEFAULT_AGENTS, DEFAULT_SOURCES } from "@/lib/seed-data";
import type { Agent, Source } from "@/lib/commission";

export interface Context {
  userId: string;
  email: string;
  brokerageId: string;
  brokerageName: string;
  role: string;     // owner | transaction_coordinator | accountant | agent
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

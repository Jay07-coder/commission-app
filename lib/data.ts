import { createClient } from "@/lib/supabase/server";
import { DEFAULT_AGENTS, DEFAULT_SOURCES } from "@/lib/seed-data";
import type { Agent, Source } from "@/lib/commission";

export interface Context {
  userId: string;
  email: string;
  brokerageId: string;
  brokerageName: string;
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

/** Get the signed-in user's brokerage, creating + seeding one on first login. */
export async function getContext(): Promise<Context | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: memberships } = await supabase
    .from("memberships").select("brokerage_id, brokerages(name)").limit(1);

  let brokerageId: string | undefined = memberships?.[0]?.brokerage_id;
  let brokerageName = "My Brokerage";

  if (!brokerageId) {
    const defaultName = (user.email?.split("@")[1]?.split(".")[0] || "My") + " Brokerage";
    const { data: newId, error } = await supabase.rpc("create_brokerage", { p_name: defaultName });
    if (error || !newId) return null;
    brokerageId = newId as string;
    brokerageName = defaultName;
    await seedDefaults(brokerageId);
  } else {
    const rel = memberships?.[0]?.brokerages as { name?: string } | { name?: string }[] | null;
    brokerageName = (Array.isArray(rel) ? rel[0]?.name : rel?.name) || brokerageName;
  }

  return { userId: user.id, email: user.email ?? "", brokerageId, brokerageName };
}

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

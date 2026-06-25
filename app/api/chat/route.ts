import { NextResponse } from "next/server";
import { getContext, getAgents, getSources } from "@/lib/data";
import { listAllForReports } from "@/lib/transactions-server";
import { askAssistant, type ChatMessage } from "@/lib/ai";
import { money } from "@/lib/commission";
import { STAGE_LABEL, type Txn } from "@/lib/transactions";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  owner: "Super Admin (owner)",
  broker: "Broker",
  transaction_coordinator: "Transaction Coordinator",
  accountant: "Accountant",
  agent: "Agent",
};

function buildDataSnapshot(brokerage: string, agents: { name: string; tier: string; baseSplit: number; zillowSplit: number | null }[],
  sources: { name: string; category: string }[], txns: Txn[]): string {
  const settled = txns.filter((t) => t.stage === "approved" || t.stage === "completed");
  const totals = settled.reduce(
    (a, t) => {
      a.gross += t.result?.gross ?? 0;
      a.brokerage += t.net_to_brokerage ?? 0;
      a.charles += t.net_to_charles ?? 0;
      a.agent += t.net_to_agent ?? 0;
      return a;
    },
    { gross: 0, brokerage: 0, charles: 0, agent: 0 }
  );

  const stageCounts: Record<string, number> = {};
  for (const t of txns) stageCounts[t.stage] = (stageCounts[t.stage] ?? 0) + 1;

  const byAgent = new Map<string, { count: number; agent: number; gross: number }>();
  for (const t of settled) {
    const k = t.agent_name || "Unassigned";
    const c = byAgent.get(k) || { count: 0, agent: 0, gross: 0 };
    c.count += 1; c.agent += t.net_to_agent ?? 0; c.gross += t.result?.gross ?? 0;
    byAgent.set(k, c);
  }
  const topAgents = [...byAgent.entries()].sort((a, b) => b[1].gross - a[1].gross).slice(0, 10);

  const bySource = new Map<string, { count: number; gross: number; brokerage: number }>();
  for (const t of settled) {
    const k = t.source_name || "Unknown";
    const c = bySource.get(k) || { count: 0, gross: 0, brokerage: 0 };
    c.count += 1; c.gross += t.result?.gross ?? 0; c.brokerage += t.net_to_brokerage ?? 0;
    bySource.set(k, c);
  }

  const byZip = new Map<string, { count: number; gross: number; brokerage: number; city: string }>();
  for (const t of settled) {
    const k = t.zipcode?.trim() || "(no zip)";
    const c = byZip.get(k) || { count: 0, gross: 0, brokerage: 0, city: t.city || "" };
    c.count += 1; c.gross += t.result?.gross ?? 0; c.brokerage += t.net_to_brokerage ?? 0;
    if (!c.city && t.city) c.city = t.city;
    byZip.set(k, c);
  }

  const lines: string[] = [];
  lines.push(`Today's date: ${new Date().toISOString().slice(0, 10)}.`);
  lines.push(`Brokerage: ${brokerage}`);
  lines.push(`Settled (approved+completed) deals: ${settled.length}. Totals — gross commission ${money(totals.gross)}, net to brokerage ${money(totals.brokerage)}, net to Charles ${money(totals.charles)}, paid to agents ${money(totals.agent)}.`);
  lines.push(`Deals by stage: ${Object.entries(stageCounts).map(([s, n]) => `${STAGE_LABEL[s as keyof typeof STAGE_LABEL] ?? s}: ${n}`).join(", ") || "none yet"}.`);
  if (topAgents.length) {
    lines.push(`Top agents by gross (settled): ${topAgents.map(([n, v]) => `${n} — ${v.count} deal(s), gross ${money(v.gross)}, agent net ${money(v.agent)}`).join("; ")}.`);
  }
  if (bySource.size) {
    lines.push(`By lead source (settled): ${[...bySource.entries()].map(([n, v]) => `${n} — ${v.count} deal(s), gross ${money(v.gross)}, net to brokerage ${money(v.brokerage)}`).join("; ")}.`);
  }
  lines.push(`Agent roster (${agents.length}): ${agents.map((a) => `${a.name} [${a.tier}, base ${a.baseSplit}%${a.zillowSplit != null ? `, company-lead ${a.zillowSplit}%` : ""}]`).join("; ")}.`);
  if (byZip.size) {
    lines.push(`By area/zip (settled): ${[...byZip.entries()].sort((a, b) => b[1].gross - a[1].gross).map(([z, v]) => `${z}${v.city ? ` (${v.city})` : ""} — ${v.count} deal(s), gross ${money(v.gross)}, net to brokerage ${money(v.brokerage)}`).join("; ")}.`);
  }
  lines.push(`Lead sources: ${sources.map((s) => `${s.name} (${s.category})`).join(", ")}.`);

  const dt = (t: Txn) => (t.close_date || t.created_at || "").slice(0, 10);
  const rows = [...settled]
    .sort((a, b) => dt(b).localeCompare(dt(a)))
    .slice(0, 80)
    .map((t) => `${dt(t) || "—"} | ${t.agent_name || "—"} | ${t.source_name || "—"} | ${[t.city, t.zipcode].filter(Boolean).join(" ") || "—"} | gross ${money(t.result?.gross ?? 0)} | agentNet ${money(t.net_to_agent ?? 0)} | brokerageNet ${money(t.net_to_brokerage ?? 0)}`);
  if (rows.length) {
    lines.push(`\nSETTLED DEAL ROWS (date | agent | source | area | gross | agent net | brokerage net) — newest first, up to 80:\n${rows.join("\n")}`);
  }
  return lines.join("\n");
}

const APP_GUIDE = `SplitKey is a commission management app for real-estate brokerages. Key areas:
- Board: a Kanban of transactions moving through stages — Draft → Commission → Pending approval → Approved → Completed. Drag a card or open it to act.
- Calculator: computes a 3-way commission split. Gross = sale price × commission rate. Off the top come any Zillow/referral fee and concessions, leaving the commissionable amount, which splits between the Agent and Charles (the broker). Each side's deductions (caps, royalty, E&O, compliance fees, monthly dues, other) flow into the brokerage's net. Net to Agent, Net to Charles, and Net to Brokerage are the three results.
- Agents: manage the roster, each agent's tier and split %.
- Reports: dashboards of commission by agent, by lead source, and monthly trends, with period and deal-status filters (owner/broker only).
- Team: invite and approve teammates and set roles (owner/broker only).
Roles: Super Admin (owner, full access), Broker (admin-level, approves deals), Transaction Coordinator (creates deals), Accountant (fills in commission and finalizes), Agent.
Workflow: a Coordinator creates the deal → Accountant completes the commission → Broker approves (or requests changes) → Accountant sends the statement to the agent and marks it completed. Approval requests email the broker automatically.`;

export async function POST(req: Request) {
  const ctx = await getContext();
  if (!ctx || ctx.status !== "active") {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as { messages?: ChatMessage[] } | null;
  const messages = (body?.messages ?? [])
    .filter((m): m is ChatMessage => !!m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim().length > 0)
    .slice(-12);
  if (messages.length === 0) {
    return NextResponse.json({ error: "No message provided" }, { status: 400 });
  }

  let snapshot = "(data unavailable)";
  try {
    const [agents, sources, txns] = await Promise.all([getAgents(), getSources(), listAllForReports()]);
    snapshot = buildDataSnapshot(ctx.brokerageName, agents, sources, txns);
  } catch {
    // If data fetch fails, the assistant can still help with how-to questions.
  }

  const system = `You are the SplitKey Assistant — a warm, sharp in-app copilot for a real-estate brokerage's commission platform. You are talking with ${ctx.email}, whose role is ${ROLE_LABEL[ctx.role] ?? ctx.role}.

${APP_GUIDE}

LIVE DATA SNAPSHOT for this brokerage (use ONLY this for data questions; if a figure isn't here, say you don't have it rather than guessing):
${snapshot}

STYLE & CAPABILITIES: Be concise and friendly. You CAN compute KPIs on demand from the SETTLED DEAL ROWS above — filter rows by agent, lead source, area/zip, and/or date range (use today's date for relative periods like "this month", "this quarter", "last 90 days") and sum gross, agent net, and net to brokerage yourself, then show the figures. Use a short bulleted breakdown when listing several numbers. Use $ amounts. Never invent numbers, agents, or policies beyond the data; if a requested slice has no matching rows, say so plainly. For "how do I…" questions point to the exact app area. If asked to make a change you can't perform, say where in the app to do it. If a question is outside SplitKey/commissions, gently steer back.`;

  const result = await askAssistant(system, messages);
  return NextResponse.json({ reply: result.text, ok: result.ok, notConfigured: result.notConfigured ?? false });
}

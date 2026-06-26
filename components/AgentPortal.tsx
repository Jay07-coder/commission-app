import { money } from "@/lib/commission";
import { STAGE_LABEL, type Txn, type Stage } from "@/lib/transactions";
import type { MyAgent } from "@/lib/data";

const TIER_LABEL: Record<string, string> = { team: "Team", independent: "Independent", owner: "Owner" };

const STAGE_TINT: Record<Stage, { bg: string; fg: string }> = {
  draft: { bg: "#f1f5f9", fg: "#475569" },
  commission: { bg: "#eff4ff", fg: "#1d4ed8" },
  changes_requested: { bg: "#fff7ed", fg: "#c2410c" },
  pending_approval: { bg: "#fffbeb", fg: "#b45309" },
  approved: { bg: "#ecfdf5", fg: "#047857" },
  completed: { bg: "#f0fdfa", fg: "#0f766e" },
};

export default function AgentPortal({ agent, email, deals }: { agent: MyAgent | null; email: string; deals: Txn[] }) {
  if (!agent) {
    return (
      <div className="card" style={{ maxWidth: 580, margin: "48px auto", textAlign: "center" }}>
        <h2 style={{ textTransform: "none", letterSpacing: 0 }}>Your portal is almost ready</h2>
        <p className="muted" style={{ lineHeight: 1.6 }}>
          We couldn&apos;t find an agent profile linked to <b>{email}</b> yet. Ask your brokerage admin to add this
          email to your profile on the <b>Agents</b> page — your deals and earnings will then appear here automatically.
        </p>
      </div>
    );
  }

  const isSettled = (t: Txn) => t.stage === "approved" || t.stage === "completed";
  const year = new Date().getFullYear();
  let ytd = 0, allTime = 0, closed = 0, inProgress = 0;
  for (const t of deals) {
    if (isSettled(t)) {
      allTime += t.net_to_agent ?? 0;
      closed += 1;
      if ((t.close_date || t.created_at || "").slice(0, 4) === String(year)) ytd += t.net_to_agent ?? 0;
    } else {
      inProgress += 1;
    }
  }
  const capPct = agent.cap > 0 ? Math.min(100, Math.round((agent.capPaid / agent.cap) * 100)) : null;

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0, fontSize: 20, color: "var(--ink)", textTransform: "none", letterSpacing: 0 }}>
          Welcome back, {agent.name.split(" ")[0]}
        </h2>
        <span className="pill" style={{ background: "#eef2ff", color: "#4338ca" }}>{TIER_LABEL[agent.tier] || agent.tier}</span>
        <span className="pill" style={{ background: "#f0fdf4", color: "#15803d" }}>Base split {agent.baseSplit}%</span>
        {agent.zillowSplit != null && (
          <span className="pill" style={{ background: "#fef9c3", color: "#a16207" }}>Company-lead {agent.zillowSplit}%</span>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 20 }}>
        <Kpi label={`${year} earnings`} value={money(ytd)} accent="#16a34a" sub="your net, year to date" />
        <Kpi label="All-time earnings" value={money(allTime)} accent="#2563eb" sub={`${closed} closed deal${closed === 1 ? "" : "s"}`} />
        <Kpi label="Closed deals" value={String(closed)} accent="#0d9488" sub="approved or completed" />
        <Kpi label="In progress" value={String(inProgress)} accent="#b45309" sub="working through approval" />
      </div>

      {capPct != null && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 8 }}>
            <span style={{ fontWeight: 600, color: "var(--ink)" }}>Annual cap progress</span>
            <span className="muted">{money(agent.capPaid)} of {money(agent.cap)} · {capPct}%</span>
          </div>
          <div style={{ height: 10, background: "var(--panel2)", borderRadius: 999, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${capPct}%`, background: "#16a34a", borderRadius: 999 }} />
          </div>
        </div>
      )}

      <div className="card">
        <h3 style={{ margin: "0 0 14px", fontSize: 15, color: "var(--ink)" }}>My deals</h3>
        {deals.length === 0 ? (
          <p className="muted" style={{ margin: 0, fontSize: 13 }}>No deals on file yet. They&apos;ll appear here as your transactions are entered.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ color: "var(--muted)", textAlign: "left" }}>
                  <th style={th}>Closed</th><th style={th}>Property</th><th style={th}>Source</th>
                  <th style={th}>Status</th><th style={{ ...th, textAlign: "right" }}>Your net</th>
                </tr>
              </thead>
              <tbody>
                {deals.map((t) => {
                  const tint = STAGE_TINT[t.stage] || STAGE_TINT.draft;
                  return (
                    <tr key={t.id} style={{ borderTop: "1px solid var(--line)" }}>
                      <td style={td}>{(t.close_date || "").slice(0, 10) || "—"}</td>
                      <td style={{ ...td, color: "var(--ink)", fontWeight: 500 }}>{t.property_address || "—"}</td>
                      <td style={td}>{t.source_name || "—"}</td>
                      <td style={td}><span className="pill" style={{ background: tint.bg, color: tint.fg }}>{STAGE_LABEL[t.stage]}</span></td>
                      <td style={{ ...td, textAlign: "right", color: "var(--good)", fontWeight: 600 }}>{t.net_to_agent != null ? money(t.net_to_agent) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="hint" style={{ marginTop: 14 }}>This is your private view — only you and your brokerage admins can see your deals and earnings.</p>
    </>
  );
}

const th: React.CSSProperties = { padding: "0 8px 8px", fontWeight: 500, fontSize: 11, textTransform: "uppercase", letterSpacing: ".4px" };
const td: React.CSSProperties = { padding: "9px 8px", color: "var(--muted)" };

function Kpi({ label, value, accent, sub }: { label: string; value: string; accent: string; sub: string }) {
  return (
    <div className="card" style={{ padding: 18, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, width: 4, height: "100%", background: accent }} />
      <div style={{ fontSize: 12, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".4px", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.5px" }}>{value}</div>
      <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>{sub}</div>
    </div>
  );
}

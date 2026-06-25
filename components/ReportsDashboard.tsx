"use client";

import { useMemo, useState } from "react";
import { money } from "@/lib/commission";
import type { Txn, Stage } from "@/lib/transactions";

type Period = "mtd" | "ytd" | "12mo" | "all";
type StatusFilter = "completed" | "approved_plus" | "all";

const PERIODS: { key: Period; label: string }[] = [
  { key: "mtd", label: "This month" },
  { key: "ytd", label: "Year to date" },
  { key: "12mo", label: "Last 12 months" },
  { key: "all", label: "All time" },
];

const STATUSES: { key: StatusFilter; label: string }[] = [
  { key: "completed", label: "Completed" },
  { key: "approved_plus", label: "Approved + Completed" },
  { key: "all", label: "All deals" },
];

const STATUS_STAGES: Record<StatusFilter, Stage[] | null> = {
  completed: ["completed"],
  approved_plus: ["approved", "completed"],
  all: null,
};

function txnDate(t: Txn): Date | null {
  const s = t.close_date || t.created_at;
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function gross(t: Txn): number {
  return t.result?.gross ?? 0;
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString("en-US", { month: "short" }) + (m === 1 ? ` '${String(y).slice(2)}` : "");
}

export default function ReportsDashboard({ transactions }: { transactions: Txn[] }) {
  const [period, setPeriod] = useState<Period>("ytd");
  const [status, setStatus] = useState<StatusFilter>("approved_plus");
  const [chartMetric, setChartMetric] = useState<"gross" | "brokerage">("gross");
  const [source, setSource] = useState("");

  const sources = useMemo(
    () => (Array.from(new Set(transactions.map((t) => t.source_name).filter(Boolean))) as string[]).sort(),
    [transactions]
  );

  const filtered = useMemo(() => {
    const now = new Date();
    const stages = STATUS_STAGES[status];
    const startMtd = new Date(now.getFullYear(), now.getMonth(), 1);
    const startYtd = new Date(now.getFullYear(), 0, 1);
    const start12 = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    return transactions.filter((t) => {
      if (stages && !stages.includes(t.stage)) return false;
      if (source && t.source_name !== source) return false;
      const d = txnDate(t);
      if (!d && period !== "all") return false;
      if (period === "mtd" && d! < startMtd) return false;
      if (period === "ytd" && d! < startYtd) return false;
      if (period === "12mo" && d! < start12) return false;
      return true;
    });
  }, [transactions, period, status, source]);

  const totals = useMemo(() => {
    let g = 0, brokerage = 0, charles = 0, agent = 0;
    for (const t of filtered) {
      g += gross(t);
      brokerage += t.net_to_brokerage ?? 0;
      charles += t.net_to_charles ?? 0;
      agent += t.net_to_agent ?? 0;
    }
    return { g, brokerage, charles, agent, count: filtered.length };
  }, [filtered]);

  const byAgent = useMemo(() => {
    const map = new Map<string, { name: string; count: number; agent: number; gross: number; brokerage: number }>();
    for (const t of filtered) {
      const name = t.agent_name || "Unassigned";
      const cur = map.get(name) || { name, count: 0, agent: 0, gross: 0, brokerage: 0 };
      cur.count += 1;
      cur.agent += t.net_to_agent ?? 0;
      cur.gross += gross(t);
      cur.brokerage += t.net_to_brokerage ?? 0;
      map.set(name, cur);
    }
    return [...map.values()].sort((a, b) => b.gross - a.gross);
  }, [filtered]);

  const bySource = useMemo(() => {
    const map = new Map<string, { name: string; count: number; gross: number; brokerage: number }>();
    for (const t of filtered) {
      const name = t.source_name || "Unknown";
      const cur = map.get(name) || { name, count: 0, gross: 0, brokerage: 0 };
      cur.count += 1;
      cur.gross += gross(t);
      cur.brokerage += t.net_to_brokerage ?? 0;
      map.set(name, cur);
    }
    return [...map.values()].sort((a, b) => b.gross - a.gross);
  }, [filtered]);

  const byZip = useMemo(() => {
    const map = new Map<string, { zip: string; city: string; count: number; gross: number; brokerage: number }>();
    for (const t of filtered) {
      const zip = t.zipcode?.trim() || "—";
      const cur = map.get(zip) || { zip, city: t.city || "", count: 0, gross: 0, brokerage: 0 };
      cur.count += 1; cur.gross += gross(t); cur.brokerage += t.net_to_brokerage ?? 0;
      if (!cur.city && t.city) cur.city = t.city;
      map.set(zip, cur);
    }
    return [...map.values()].sort((a, b) => b.gross - a.gross);
  }, [filtered]);

  const months = useMemo(() => {
    // last 12 month buckets (or fewer for narrower periods), always show a rolling 12 for context unless mtd
    const now = new Date();
    const n = period === "mtd" ? 1 : 12;
    const keys: string[] = [];
    for (let i = n - 1; i >= 0; i--) keys.push(monthKey(new Date(now.getFullYear(), now.getMonth() - i, 1)));
    const map = new Map<string, { gross: number; brokerage: number }>();
    keys.forEach((k) => map.set(k, { gross: 0, brokerage: 0 }));
    const stages = STATUS_STAGES[status];
    for (const t of transactions) {
      if (stages && !stages.includes(t.stage)) continue;
      const d = txnDate(t);
      if (!d) continue;
      const k = monthKey(d);
      const slot = map.get(k);
      if (slot) { slot.gross += gross(t); slot.brokerage += t.net_to_brokerage ?? 0; }
    }
    return keys.map((k) => ({ key: k, ...map.get(k)! }));
  }, [transactions, status, period]);

  const chartMax = Math.max(1, ...months.map((m) => (chartMetric === "gross" ? m.gross : m.brokerage)));

  const RANK_COLORS = ["#b45309", "#64748b", "#92400e"];

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0, fontSize: 18, color: "var(--ink)" }}>Reports</h2>
        <div style={{ display: "flex", gap: 8, marginLeft: "auto", flexWrap: "wrap" }}>
          <Segmented options={PERIODS} value={period} onChange={(v) => setPeriod(v as Period)} />
          <Segmented options={STATUSES} value={status} onChange={(v) => setStatus(v as StatusFilter)} />
          <select value={source} onChange={(e) => setSource(e.target.value)} style={{ width: "auto" }}>
            <option value="">All sources</option>
            {sources.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 22 }}>
        <Kpi label="Gross commission" value={money(totals.g)} accent="#2563eb" sub={`${totals.count} deal${totals.count === 1 ? "" : "s"}`} />
        <Kpi label="Net to brokerage" value={money(totals.brokerage)} accent="#16a34a" sub="kept by the firm" />
        <Kpi label="Net to Charles" value={money(totals.charles)} accent="#7c3aed" sub="broker share" />
        <Kpi label="Paid to agents" value={money(totals.agent)} accent="#b45309" sub="agent net" />
      </div>

      {/* Monthly trend */}
      <div className="card" style={{ marginBottom: 22 }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 15, color: "var(--ink)" }}>Monthly trend</h3>
          <div style={{ marginLeft: "auto" }}>
            <Segmented
              options={[{ key: "gross", label: "Gross" }, { key: "brokerage", label: "Net to brokerage" }]}
              value={chartMetric}
              onChange={(v) => setChartMetric(v as "gross" | "brokerage")}
            />
          </div>
        </div>
        <BarChart months={months} metric={chartMetric} max={chartMax} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 18 }}>
        {/* Agent leaderboard */}
        <div className="card">
          <h3 style={{ margin: "0 0 14px", fontSize: 15, color: "var(--ink)" }}>Top agents</h3>
          {byAgent.length === 0 ? (
            <p className="muted" style={{ margin: 0, fontSize: 13 }}>No deals in this period yet.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ color: "var(--muted)", textAlign: "left" }}>
                  <th style={thStyle}>#</th><th style={thStyle}>Agent</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>Deals</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>Gross</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>Agent net</th>
                </tr>
              </thead>
              <tbody>
                {byAgent.map((a, i) => (
                  <tr key={a.name} style={{ borderTop: "1px solid var(--line)" }}>
                    <td style={tdStyle}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        width: 22, height: 22, borderRadius: 999, fontSize: 11, fontWeight: 700, color: "#fff",
                        background: RANK_COLORS[i] || "#cbd5e1",
                      }}>{i + 1}</span>
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 600, color: "var(--ink)" }}>{a.name}</td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>{a.count}</td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>{money(a.gross)}</td>
                    <td style={{ ...tdStyle, textAlign: "right", color: "var(--good)", fontWeight: 600 }}>{money(a.agent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Source breakdown */}
        <div className="card">
          <h3 style={{ margin: "0 0 14px", fontSize: 15, color: "var(--ink)" }}>By lead source</h3>
          {bySource.length === 0 ? (
            <p className="muted" style={{ margin: 0, fontSize: 13 }}>No deals in this period yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {bySource.map((s) => {
                const pct = totals.g > 0 ? Math.round((s.gross / totals.g) * 100) : 0;
                return (
                  <div key={s.name}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
                      <span style={{ fontWeight: 600, color: "var(--ink)" }}>{s.name}</span>
                      <span className="muted">{money(s.gross)} · {pct}%</span>
                    </div>
                    <div style={{ height: 8, background: "var(--panel2)", borderRadius: 999, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: "#2563eb", borderRadius: 999 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Geographic breakdown by zip code */}
        <div className="card">
          <h3 style={{ margin: "0 0 4px", fontSize: 15, color: "var(--ink)" }}>By area (zip code)</h3>
          <p className="muted" style={{ margin: "0 0 14px", fontSize: 12 }}>
            Where deals come from{source ? ` for ${source}` : ""} — use the source filter above to isolate Zillow and see which zips to target.
          </p>
          {byZip.length === 0 ? (
            <p className="muted" style={{ margin: 0, fontSize: 13 }}>No deals in this period yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {byZip.map((z) => {
                const pct = totals.g > 0 ? Math.round((z.gross / totals.g) * 100) : 0;
                return (
                  <div key={z.zip}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
                      <span style={{ fontWeight: 600, color: "var(--ink)" }}>
                        {z.zip === "—" ? "No zip set" : z.zip}{z.city ? ` · ${z.city}` : ""}
                      </span>
                      <span className="muted">{money(z.gross)} · {z.count} deal{z.count === 1 ? "" : "s"}</span>
                    </div>
                    <div style={{ height: 8, background: "var(--panel2)", borderRadius: 999, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: "#0d9488", borderRadius: 999 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <p className="hint" style={{ marginTop: 16 }}>
        Showing {STATUSES.find((s) => s.key === status)!.label.toLowerCase()} deals · {PERIODS.find((p) => p.key === period)!.label.toLowerCase()}.
        Dates use each deal&apos;s closing date (falling back to when it was created).
      </p>
    </>
  );
}

const thStyle: React.CSSProperties = { padding: "0 8px 8px", fontWeight: 500, fontSize: 11, textTransform: "uppercase", letterSpacing: ".4px" };
const tdStyle: React.CSSProperties = { padding: "9px 8px", color: "var(--muted)" };

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

function Segmented({ options, value, onChange }: { options: { key: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "inline-flex", background: "var(--panel2)", border: "1px solid var(--line)", borderRadius: 9, padding: 3, gap: 2 }}>
      {options.map((o) => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          style={{
            border: "none", cursor: "pointer", fontSize: 12.5, fontWeight: 500, padding: "6px 11px", borderRadius: 6,
            background: value === o.key ? "var(--panel)" : "transparent",
            color: value === o.key ? "var(--ink)" : "var(--muted)",
            boxShadow: value === o.key ? "0 1px 2px rgba(16,24,40,.08)" : "none",
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function BarChart({ months, metric, max }: { months: { key: string; gross: number; brokerage: number }[]; metric: "gross" | "brokerage"; max: number }) {
  const W = 720, H = 200, pad = 28, n = months.length;
  const bw = (W - pad * 2) / n;
  const color = metric === "gross" ? "#2563eb" : "#16a34a";
  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", minWidth: n > 6 ? 560 : 320, height: "auto", display: "block" }}>
        {[0.25, 0.5, 0.75, 1].map((g) => (
          <line key={g} x1={pad} x2={W - pad} y1={H - pad - (H - pad * 2) * g} y2={H - pad - (H - pad * 2) * g} stroke="var(--line)" strokeWidth={1} />
        ))}
        {months.map((m, i) => {
          const val = metric === "gross" ? m.gross : m.brokerage;
          const h = (H - pad * 2) * (val / max);
          const x = pad + i * bw + bw * 0.18;
          const w = bw * 0.64;
          const y = H - pad - h;
          return (
            <g key={m.key}>
              {val > 0 && <rect x={x} y={y} width={w} height={h} rx={3} fill={color} />}
              <text x={pad + i * bw + bw / 2} y={H - pad + 14} textAnchor="middle" fontSize={10} fill="var(--muted)">
                {monthLabel(m.key)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

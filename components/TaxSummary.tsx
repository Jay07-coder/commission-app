"use client";

import { useMemo, useState } from "react";
import { money } from "@/lib/commission";
import type { Txn } from "@/lib/transactions";

const THRESHOLD = 600;

export default function TaxSummary({ deals, w9Names = [] }: { deals: Txn[]; w9Names?: string[] }) {
  const w9Set = useMemo(() => new Set(w9Names), [w9Names]);
  const yearOf = (t: Txn) => (t.close_date || t.created_at || "").slice(0, 4);

  const years = useMemo(() => {
    const s = new Set<string>();
    for (const t of deals) { const y = yearOf(t); if (/^\d{4}$/.test(y)) s.add(y); }
    const arr = [...s].sort().reverse();
    return arr.length ? arr : [String(new Date().getFullYear())];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deals]);

  const [year, setYear] = useState<string>(years[0]);

  const rows = useMemo(() => {
    const m = new Map<string, { agent: string; count: number; total: number }>();
    for (const t of deals) {
      if (yearOf(t) !== year) continue;
      const name = t.agent_name || "Unassigned";
      const c = m.get(name) || { agent: name, count: 0, total: 0 };
      c.count += 1; c.total += t.net_to_agent ?? 0;
      m.set(name, c);
    }
    return [...m.values()].sort((a, b) => b.total - a.total);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deals, year]);

  const required = rows.filter((r) => r.total >= THRESHOLD);
  const totalPaid = rows.reduce((s, r) => s + r.total, 0);
  const missingW9 = required.filter((r) => !w9Set.has(r.agent)).length;

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0, fontSize: 18, color: "var(--ink)" }}>1099-NEC — year-end summary</h2>
        <select value={year} onChange={(e) => setYear(e.target.value)} style={{ width: "auto", marginLeft: "auto" }}>
          {years.map((y) => <option key={y} value={y}>Tax year {y}</option>)}
        </select>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 20 }}>
        <Kpi label="Agents needing a 1099" value={String(required.length)} accent="#2563eb" sub={`paid $${THRESHOLD}+ in ${year}`} />
        <Kpi label="Total nonemployee comp" value={money(totalPaid)} accent="#16a34a" sub={`paid to ${rows.length} agent${rows.length === 1 ? "" : "s"}`} />
        <Kpi label="Missing W-9" value={String(missingW9)} accent={missingW9 ? "#dc2626" : "#16a34a"} sub="of those needing a 1099" />
      </div>

      <div className="card">
        <h3 style={{ margin: "0 0 6px", fontSize: 15, color: "var(--ink)" }}>Per-agent payments — {year}</h3>
        <p className="muted" style={{ margin: "0 0 14px", fontSize: 12 }}>
          Box 1 (nonemployee compensation) = each agent&apos;s net paid on completed deals that closed in {year}. Includes anyone paid this year, even if they&apos;ve since left the brokerage.
        </p>
        {rows.length === 0 ? (
          <p className="muted" style={{ margin: 0, fontSize: 13 }}>No completed deals closed in {year}.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ color: "var(--muted)", textAlign: "left" }}>
                <th style={th}>Agent</th>
                <th style={{ ...th, textAlign: "right" }}>Deals</th>
                <th style={{ ...th, textAlign: "right" }}>Box 1 — paid</th>
                <th style={{ ...th, textAlign: "center" }}>1099 required?</th>
                <th style={{ ...th, textAlign: "center" }}>W-9 on file?</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.agent} style={{ borderTop: "1px solid var(--line)" }}>
                  <td style={{ ...td, color: "var(--ink)", fontWeight: 500 }}>{r.agent}</td>
                  <td style={{ ...td, textAlign: "right" }}>{r.count}</td>
                  <td style={{ ...td, textAlign: "right", fontWeight: 600, color: "var(--ink)" }}>{money(r.total)}</td>
                  <td style={{ ...td, textAlign: "center" }}>
                    {r.total >= THRESHOLD
                      ? <span className="pill" style={{ background: "#ecfdf5", color: "#047857" }}>Yes</span>
                      : <span className="pill" style={{ background: "#f1f5f9", color: "#64748b" }}>No</span>}
                  </td>
                  <td style={{ ...td, textAlign: "center" }}>
                    {w9Set.has(r.agent)
                      ? <span className="pill" style={{ background: "#ecfdf5", color: "#047857" }}>✓ On file</span>
                      : r.total >= THRESHOLD
                        ? <span className="pill" style={{ background: "#fef2f2", color: "#b91c1c" }}>Missing</span>
                        : <span className="muted">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="hint" style={{ marginTop: 14 }}>
        Next step for full filing: collect each agent&apos;s W-9 (legal name, address, TIN/SSN) so SplitKey can generate a printable 1099-NEC per agent. Tip: capture W-9 details before an agent leaves. This summary is informational, not tax advice — have your CPA confirm before filing.
      </p>
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

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { money } from "@/lib/commission";
import { STAGE_LABEL, type Txn, type Stage } from "@/lib/transactions";

const STAGE_COLOR: Record<Stage, { bg: string; fg: string }> = {
  draft: { bg: "rgba(159,176,195,.16)", fg: "#cbd5e1" },
  commission: { bg: "rgba(59,130,246,.18)", fg: "#93c5fd" },
  pending_approval: { bg: "rgba(245,196,81,.18)", fg: "#f5c451" },
  changes_requested: { bg: "rgba(180,69,58,.22)", fg: "#fca5a5" },
  approved: { bg: "rgba(52,211,153,.18)", fg: "#6ee7b7" },
  completed: { bg: "rgba(45,212,191,.16)", fg: "#5eead4" },
};

function Badge({ stage }: { stage: Stage }) {
  const c = STAGE_COLOR[stage];
  return (
    <span className="pill" style={{ background: c.bg, color: c.fg }}>
      {STAGE_LABEL[stage]}
    </span>
  );
}

export default function TransactionsList({ transactions, canCreate }: { transactions: Txn[]; canCreate: boolean }) {
  const router = useRouter();
  const [agent, setAgent] = useState("");
  const [source, setSource] = useState("");
  const [stage, setStage] = useState("");

  const agents = useMemo(() => Array.from(new Set(transactions.map((t) => t.agent_name).filter(Boolean))) as string[], [transactions]);
  const sources = useMemo(() => Array.from(new Set(transactions.map((t) => t.source_name).filter(Boolean))) as string[], [transactions]);

  const rows = transactions.filter(
    (t) => (!agent || t.agent_name === agent) && (!source || t.source_name === source) && (!stage || t.stage === stage)
  );

  return (
    <div className="card">
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0 }}>Transactions</h2>
        {canCreate && (
          <Link href="/app/transactions/new" className="btn" style={{ marginLeft: "auto" }}>
            + New transaction
          </Link>
        )}
      </div>

      <div className="row" style={{ marginBottom: 14, flexWrap: "wrap" }}>
        <div>
          <label>Agent</label>
          <select value={agent} onChange={(e) => setAgent(e.target.value)}>
            <option value="">All agents</option>
            {agents.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <label>Lead source</label>
          <select value={source} onChange={(e) => setSource(e.target.value)}>
            <option value="">All sources</option>
            {sources.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label>Stage</label>
          <select value={stage} onChange={(e) => setStage(e.target.value)}>
            <option value="">All stages</option>
            {Object.entries(STAGE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="hint">No transactions yet. {canCreate ? "Click “New transaction” to start one." : "They’ll appear here as your team creates them."}</p>
      ) : (
        <table className="stmt" style={{ width: "100%", background: "transparent", color: "var(--ink)", padding: 0 }}>
          <thead>
            <tr style={{ color: "var(--muted)", fontSize: 11, textTransform: "uppercase" }}>
              <td>Stage</td><td>Agent</td><td>Property</td><td>Source</td><td className="r">Net to agent</td>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id} style={{ cursor: "pointer" }} onClick={() => router.push(`/app/transactions/${t.id}`)}>
                <td><Badge stage={t.stage} /></td>
                <td><b>{t.agent_name || "—"}</b></td>
                <td>{t.property_address || "—"}</td>
                <td>{t.source_name || "—"}</td>
                <td className="r">{t.net_to_agent != null ? money(t.net_to_agent) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

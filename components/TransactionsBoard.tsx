"use client";

import { useEffect, useMemo, useState, type DragEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { money } from "@/lib/commission";
import { STAGE_LABEL, type Txn, type Stage } from "@/lib/transactions";
import { moveStage } from "@/app/app/transactions/actions";

const COLUMNS: Stage[] = ["draft", "commission", "changes_requested", "pending_approval", "approved", "completed"];

const STAGE_ACCENT: Record<Stage, string> = {
  draft: "#9fb0c3",
  commission: "#3b82f6",
  changes_requested: "#f0997b",
  pending_approval: "#f5c451",
  approved: "#34d399",
  completed: "#2dd4bf",
};

export default function TransactionsBoard({ transactions, canCreate }: { transactions: Txn[]; canCreate: boolean }) {
  const router = useRouter();
  const [items, setItems] = useState<Txn[]>(transactions);
  const [over, setOver] = useState<Stage | "">("");
  const [agent, setAgent] = useState("");
  const [source, setSource] = useState("");

  useEffect(() => { setItems(transactions); }, [transactions]);

  const agents = useMemo(() => Array.from(new Set(transactions.map((t) => t.agent_name).filter(Boolean))) as string[], [transactions]);
  const sources = useMemo(() => Array.from(new Set(transactions.map((t) => t.source_name).filter(Boolean))) as string[], [transactions]);

  const visible = items.filter((t) => (!agent || t.agent_name === agent) && (!source || t.source_name === source));

  async function drop(toStage: Stage, e: DragEvent) {
    e.preventDefault();
    setOver("");
    const id = e.dataTransfer.getData("text/plain");
    const card = items.find((t) => t.id === id);
    if (!card || card.stage === toStage) return;
    const prev = card.stage;
    setItems((arr) => arr.map((t) => (t.id === id ? { ...t, stage: toStage } : t)));
    const res = await moveStage(id, toStage);
    if (!res.ok) {
      setItems((arr) => arr.map((t) => (t.id === id ? { ...t, stage: prev } : t)));
      alert(res.message);
    } else {
      router.refresh();
    }
  }

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0, fontSize: 18, textTransform: "none", letterSpacing: 0, color: "var(--ink)" }}>Transactions board</h2>
        <div style={{ display: "flex", gap: 8, marginLeft: "auto", flexWrap: "wrap", alignItems: "center" }}>
          <select value={agent} onChange={(e) => setAgent(e.target.value)} style={{ width: "auto" }}>
            <option value="">All agents</option>
            {agents.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={source} onChange={(e) => setSource(e.target.value)} style={{ width: "auto" }}>
            <option value="">All sources</option>
            {sources.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          {canCreate && <Link href="/app/transactions/new" className="btn">+ New</Link>}
        </div>
      </div>

      <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 12, alignItems: "flex-start" }}>
        {COLUMNS.map((stage) => {
          const cards = visible.filter((t) => t.stage === stage);
          return (
            <div
              key={stage}
              onDragOver={(e) => { e.preventDefault(); setOver(stage); }}
              onDragLeave={() => setOver((o) => (o === stage ? "" : o))}
              onDrop={(e) => drop(stage, e)}
              style={{
                minWidth: 240, maxWidth: 240, flex: "0 0 240px",
                background: over === stage ? "var(--panel2)" : "var(--panel)",
                border: "1px solid var(--line)", borderRadius: 12, padding: 10,
                transition: "background .12s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "2px 4px 10px" }}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: STAGE_ACCENT[stage] }} />
                <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".4px", color: "var(--muted)" }}>
                  {STAGE_LABEL[stage]}
                </span>
                <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--muted)" }}>{cards.length}</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8, minHeight: 40 }}>
                {cards.map((t) => (
                  <div
                    key={t.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("text/plain", t.id)}
                    onClick={() => router.push(`/app/transactions/${t.id}`)}
                    style={{
                      background: "var(--panel2)", border: "1px solid var(--line)",
                      borderLeft: `3px solid ${STAGE_ACCENT[stage]}`, borderRadius: 8,
                      padding: "10px 12px", cursor: "pointer",
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)", marginBottom: 4 }}>
                      {t.property_address || "Untitled property"}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>{t.agent_name || "—"}{t.source_name ? ` · ${t.source_name}` : ""}</div>
                    {t.net_to_agent != null && (
                      <div style={{ fontSize: 12, color: "var(--good)", marginTop: 4 }}>Agent {money(t.net_to_agent)}</div>
                    )}
                  </div>
                ))}
                {cards.length === 0 && <div style={{ fontSize: 12, color: "var(--muted)", padding: "8px 4px" }}>—</div>}
              </div>
            </div>
          );
        })}
      </div>
      <p className="hint" style={{ marginTop: 12 }}>Drag a card to a new column to move its stage. Click a card to open it for commission, approval, notes, and printing.</p>
    </>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { money } from "@/lib/commission";
import { STAGE_LABEL, type Txn, type Stage } from "@/lib/transactions";
import { moveStage } from "@/app/app/transactions/actions";

const COLUMNS: Stage[] = ["draft", "commission", "changes_requested", "pending_approval", "approved", "completed"];

const STAGE_ACCENT: Record<Stage, string> = {
  draft: "#94a3b8",
  commission: "#2563eb",
  changes_requested: "#f97316",
  pending_approval: "#f59e0b",
  approved: "#16a34a",
  completed: "#0d9488",
};

export default function TransactionsBoard({ transactions, canCreate }: { transactions: Txn[]; canCreate: boolean }) {
  const router = useRouter();
  const [items, setItems] = useState<Txn[]>(transactions);
  const [over, setOver] = useState<Stage | "">("");
  const [agent, setAgent] = useState("");
  const [source, setSource] = useState("");

  const itemsRef = useRef<Txn[]>(transactions);
  itemsRef.current = items;

  const dragRef = useRef<{ id: string; startX: number; startY: number; moved: boolean } | null>(null);
  const [dragId, setDragId] = useState("");
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });

  useEffect(() => { setItems(transactions); }, [transactions]);

  const agents = useMemo(() => Array.from(new Set(transactions.map((t) => t.agent_name).filter(Boolean))) as string[], [transactions]);
  const sources = useMemo(() => Array.from(new Set(transactions.map((t) => t.source_name).filter(Boolean))) as string[], [transactions]);
  const visible = items.filter((t) => (!agent || t.agent_name === agent) && (!source || t.source_name === source));

  async function commitMove(id: string, toStage: Stage) {
    const card = itemsRef.current.find((t) => t.id === id);
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

  useEffect(() => {
    if (!dragId) return;
    const colAt = (x: number, y: number): Stage | "" => {
      const el = document.elementFromPoint(x, y) as HTMLElement | null;
      const col = el?.closest("[data-stage]");
      return col ? (col.getAttribute("data-stage") as Stage) : "";
    };
    function onMove(e: PointerEvent) {
      const d = dragRef.current;
      if (d && (Math.abs(e.clientX - d.startX) > 4 || Math.abs(e.clientY - d.startY) > 4)) d.moved = true;
      setDragPos({ x: e.clientX, y: e.clientY });
      setOver(colAt(e.clientX, e.clientY));
    }
    function onUp(e: PointerEvent) {
      const d = dragRef.current;
      const toStage = colAt(e.clientX, e.clientY);
      dragRef.current = null;
      setDragId("");
      setOver("");
      if (!d) return;
      if (!d.moved) router.push(`/app/transactions/${d.id}`);
      else if (toStage) commitMove(d.id, toStage);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragId]);

  function onCardDown(e: ReactPointerEvent, id: string) {
    e.preventDefault();
    dragRef.current = { id, startX: e.clientX, startY: e.clientY, moved: false };
    setDragId(id);
    setDragPos({ x: e.clientX, y: e.clientY });
  }

  const dragged = items.find((t) => t.id === dragId);

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
              data-stage={stage}
              style={{
                minWidth: 240, maxWidth: 240, flex: "0 0 240px",
                background: over === stage ? "#eaeef6" : "var(--panel2)",
                border: "1px solid var(--line)", borderRadius: 12, padding: 10,
                transition: "background .12s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "2px 4px 11px" }}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: STAGE_ACCENT[stage] }} />
                <span style={{ fontSize: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: ".4px", color: "#475569" }}>
                  {STAGE_LABEL[stage]}
                </span>
                <span style={{ marginLeft: "auto", fontSize: 11, color: "#94a3b8" }}>{cards.length}</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8, minHeight: 40 }}>
                {cards.map((t) => (
                  <div
                    key={t.id}
                    onPointerDown={(e) => onCardDown(e, t.id)}
                    style={{
                      background: "var(--panel)", border: "1px solid var(--line)",
                      borderLeft: `3px solid ${STAGE_ACCENT[stage]}`, borderRadius: 8,
                      padding: "10px 12px", cursor: "grab", touchAction: "none", userSelect: "none",
                      opacity: dragId === t.id && dragRef.current?.moved ? 0.4 : 1,
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 14, color: "var(--ink)", marginBottom: 4 }}>
                      {t.property_address || "Untitled property"}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>{t.agent_name || "—"}{t.source_name ? ` · ${t.source_name}` : ""}</div>
                    {t.net_to_agent != null && (
                      <div style={{ fontSize: 12, color: "var(--good)", marginTop: 4, fontWeight: 500 }}>Agent {money(t.net_to_agent)}</div>
                    )}
                  </div>
                ))}
                {cards.length === 0 && <div style={{ fontSize: 12, color: "#aab2bd", padding: "8px 4px" }}>—</div>}
              </div>
            </div>
          );
        })}
      </div>

      {dragged && dragRef.current?.moved && (
        <div
          style={{
            position: "fixed", left: dragPos.x - 90, top: dragPos.y - 22, width: 180, pointerEvents: "none", zIndex: 1000,
            background: "var(--panel)", border: "1px solid var(--line)", borderLeft: `3px solid ${STAGE_ACCENT[dragged.stage]}`,
            borderRadius: 8, padding: "10px 12px", boxShadow: "0 8px 24px rgba(16,24,40,.18)",
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 14, color: "var(--ink)", marginBottom: 4 }}>{dragged.property_address || "Untitled property"}</div>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>{dragged.agent_name || "—"}</div>
        </div>
      )}

      <p className="hint" style={{ marginTop: 12 }}>Drag a card to a new column to move its stage. Tap or click a card to open it for commission, approval, notes, and printing.</p>
    </>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { money, type Agent, type Source } from "@/lib/commission";
import {
  STAGE_LABEL, CREATE_ROLES, COMMISSION_ROLES, APPROVE_ROLES, FINALIZE_ROLES,
  type Txn, type TxnNote, type Stage,
} from "@/lib/transactions";
import StatementView from "@/components/StatementView";
import CommissionEditor from "@/components/CommissionEditor";
import {
  saveDeal, submitToAccountant, approveTransaction, requestChanges, finalizeTransaction, addComment, deleteTransaction,
} from "@/app/app/transactions/actions";

const STAGE_COLOR: Record<Stage, { bg: string; fg: string }> = {
  draft: { bg: "#f1f5f9", fg: "#475569" },
  commission: { bg: "#eff4ff", fg: "#1d4ed8" },
  pending_approval: { bg: "#fffaeb", fg: "#b45309" },
  changes_requested: { bg: "#fff4ed", fg: "#c2410c" },
  approved: { bg: "#ecfdf3", fg: "#15803d" },
  completed: { bg: "#effbf8", fg: "#0f766e" },
};

const ACTION_LABEL: Record<string, string> = {
  submit: "submitted", request_changes: "requested changes", approve: "approved",
  finalize: "completed", comment: "noted",
};

export default function TransactionDetail({
  txn, notes, role, agent, source, agentNames, sourceNames,
}: {
  txn: Txn; notes: TxnNote[]; role: string;
  agent: Agent | null; source: Source | null;
  agentNames: string[]; sourceNames: string[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [note, setNote] = useState("");
  const [comment, setComment] = useState("");

  const canCreate = CREATE_ROLES.includes(role);
  const canCommission = COMMISSION_ROLES.includes(role);
  const canApprove = APPROVE_ROLES.includes(role);
  const canFinalize = FINALIZE_ROLES.includes(role);
  const canDelete = role === "owner" || role === "broker";
  const c = STAGE_COLOR[txn.stage];

  async function del() {
    if (!confirm("Delete this transaction permanently? This can't be undone.")) return;
    setBusy("delete");
    const res = await deleteTransaction(txn.id);
    setBusy("");
    if (res.ok) router.push("/app/transactions");
    else alert(res.message);
  }

  async function run(name: string, fn: () => Promise<{ ok: boolean; message?: string }>) {
    setBusy(name);
    const res = await fn();
    setBusy("");
    if (res.ok) router.refresh();
    else alert(res.message);
  }

  const lastChangeNote = [...notes].reverse().find((nn) => nn.action === "request_changes");

  return (
    <div style={{ maxWidth: 880, margin: "0 auto" }}>
      <div style={{ marginBottom: 14 }}>
        <Link href="/app/transactions" className="hint">← All transactions</Link>
      </div>

      {/* Header */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span className="pill" style={{ background: c.bg, color: c.fg }}>{STAGE_LABEL[txn.stage]}</span>
          <h2 style={{ margin: 0, textTransform: "none", letterSpacing: 0, fontSize: 18, color: "var(--ink)" }}>
            {txn.property_address || "Untitled property"}
          </h2>
          {canDelete && (
            <button className="btn ghost sm" onClick={del} disabled={!!busy} style={{ marginLeft: "auto", color: "#b91c1c", borderColor: "#fecaca" }}>
              {busy === "delete" ? "Deleting…" : "Delete"}
            </button>
          )}
        </div>
        <div className="meta" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px", marginTop: 12, fontSize: 13 }}>
          <div><span className="muted">Agent:</span> <b>{txn.agent_name || "—"}</b></div>
          <div><span className="muted">Lead source:</span> {txn.source_name || "—"}</div>
          <div><span className="muted">Side:</span> {txn.side || "—"}</div>
          <div><span className="muted">Closing:</span> {txn.close_date || "—"}</div>
          <div><span className="muted">Valuation:</span> {txn.valuation != null ? money(txn.valuation) : "—"}</div>
          <div><span className="muted">Client:</span> {txn.client || "—"}</div>
          <div><span className="muted">Area:</span> {[txn.city, txn.zipcode].filter(Boolean).join(" · ") || "—"}</div>
          <div><span className="muted">Created by:</span> {txn.created_by_email || "—"}</div>
          {txn.approved_by_email && <div><span className="muted">Approved by:</span> {txn.approved_by_email}</div>}
        </div>
      </div>

      {/* Changes requested banner */}
      {txn.stage === "changes_requested" && lastChangeNote && (
        <div className="banner" style={{ maxWidth: "none", background: "#fef2f2", borderColor: "#fecaca", color: "#b91c1c" }}>
          <b>Changes requested:</b> {lastChangeNote.body}
        </div>
      )}

      {/* Stage 1 — draft editing */}
      {txn.stage === "draft" && (
        canCreate
          ? <DraftEditor txn={txn} agentNames={agentNames} sourceNames={sourceNames} busy={busy} run={run} />
          : <div className="card" style={{ marginBottom: 16 }}><p className="hint" style={{ margin: 0 }}>This transaction is a draft with the coordinator.</p></div>
      )}

      {/* Stage 2 — commission */}
      {(txn.stage === "commission" || txn.stage === "changes_requested") && (
        canCommission && agent && source
          ? <div style={{ marginBottom: 16 }}><CommissionEditor txn={txn} agent={agent} source={source} /></div>
          : <div className="card" style={{ marginBottom: 16 }}>
              <p className="hint" style={{ margin: 0 }}>
                {agent && source ? "Awaiting the accountant to complete the commission." : "The agent or lead source on this deal isn’t in your roster, so commission can’t be auto-calculated. Update the roster or the deal."}
              </p>
            </div>
      )}

      {/* Statement (once computed) */}
      {txn.result && (txn.stage === "pending_approval" || txn.stage === "approved" || txn.stage === "completed") && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
            <h2 style={{ margin: 0 }}>Commission statement</h2>
            {(txn.stage === "approved" || txn.stage === "completed") && (
              <Link href={`/app/transactions/${txn.id}/print`} target="_blank" className="btn ghost" style={{ marginLeft: "auto" }}>
                🖨️ Print / Save PDF
              </Link>
            )}
          </div>
          <div className="kpis">
            <div className="kpi net"><div className="l">Net to Agent</div><div className="v">{money(txn.result.netToAgent)}</div></div>
            <div className="kpi house"><div className="l">Net to Charles</div><div className="v">{money(txn.result.netToCharles)}</div></div>
            <div className="kpi"><div className="l">Net to Brokerage</div><div className="v" style={{ color: "var(--gold)" }}>{money(txn.result.netToBrokerage)}</div></div>
          </div>
          <StatementView txn={txn} s={txn.result} />
        </div>
      )}

      {/* Stage 3 — approval */}
      {txn.stage === "pending_approval" && (
        <div className="card" style={{ marginBottom: 16 }}>
          {canApprove ? (
            <>
              <h2>Broker decision</h2>
              <div className="btns">
                <button className="btn" onClick={() => run("approve", () => approveTransaction(txn.id))} disabled={!!busy}>
                  {busy === "approve" ? "Approving…" : "✓ Approve"}
                </button>
              </div>
              <label style={{ marginTop: 14 }}>Or request changes — add a note for the accountant</label>
              <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="What needs to change?" />
              <div className="btns" style={{ marginTop: 8 }}>
                <button className="btn ghost" onClick={() => run("reject", () => requestChanges(txn.id, note))} disabled={!!busy || !note.trim()}>
                  {busy === "reject" ? "Sending…" : "↩ Request changes"}
                </button>
              </div>
            </>
          ) : (
            <p className="hint" style={{ margin: 0 }}>Awaiting broker approval.</p>
          )}
        </div>
      )}

      {/* Approved — finalize */}
      {txn.stage === "approved" && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h2>Approved ✓</h2>
          <p className="hint">Print the statement above and send it to the agent. Then mark the transaction complete.</p>
          {canFinalize && (
            <div className="btns">
              <button className="btn" onClick={() => run("finalize", () => finalizeTransaction(txn.id))} disabled={!!busy}>
                {busy === "finalize" ? "Finishing…" : "Mark sent & complete"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Approval thread */}
      <div className="card">
        <h2>Activity</h2>
        {notes.length === 0 ? (
          <p className="hint">No activity yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {notes.map((nn) => (
              <div key={nn.id} style={{ borderLeft: "2px solid var(--line)", paddingLeft: 12 }}>
                <div style={{ fontSize: 13 }}>
                  <b>{nn.author_email || "Someone"}</b>{" "}
                  <span className="muted">{ACTION_LABEL[nn.action] || nn.action}</span>{" "}
                  <span className="muted" style={{ fontSize: 11 }}>· {new Date(nn.created_at).toLocaleString()}</span>
                </div>
                {nn.body && <div style={{ fontSize: 14, marginTop: 3 }}>{nn.body}</div>}
              </div>
            ))}
          </div>
        )}
        <div style={{ marginTop: 14 }}>
          <textarea rows={2} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a note…" />
          <div className="btns" style={{ marginTop: 8 }}>
            <button className="btn ghost" onClick={() => run("comment", async () => { const r = await addComment(txn.id, comment); if (r.ok) setComment(""); return r; })} disabled={!!busy || !comment.trim()}>
              Add note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DraftEditor({
  txn, agentNames, sourceNames, busy, run,
}: {
  txn: Txn; agentNames: string[]; sourceNames: string[]; busy: string;
  run: (name: string, fn: () => Promise<{ ok: boolean; message?: string }>) => Promise<void>;
}) {
  const [agent, setAgent] = useState(txn.agent_name || agentNames[0] || "");
  const [source, setSource] = useState(txn.source_name || sourceNames[0] || "");
  const [address, setAddress] = useState(txn.property_address || "");
  const [client, setClient] = useState(txn.client || "");
  const [side, setSide] = useState(txn.side || "Buyer");
  const [closeDate, setCloseDate] = useState(txn.close_date || "");
  const [valuation, setValuation] = useState(txn.valuation != null ? String(txn.valuation) : "");
  const [pct, setPct] = useState(txn.commission_pct != null ? String(txn.commission_pct) : "3");
  const [city, setCity] = useState(txn.city || "");
  const [zipcode, setZipcode] = useState(txn.zipcode || "");

  const payload = () => ({
    property_address: address, valuation: valuation === "" ? null : parseFloat(valuation),
    agent_name: agent, source_name: source, side, client, close_date: closeDate,
    commission_pct: pct === "" ? null : parseFloat(pct), city, zipcode,
  });

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <h2>Deal details</h2>
      <div className="row">
        <div><label>Agent</label><select value={agent} onChange={(e) => setAgent(e.target.value)}>{agentNames.map((a) => <option key={a} value={a}>{a}</option>)}</select></div>
        <div><label>Lead source</label><select value={source} onChange={(e) => setSource(e.target.value)}>{sourceNames.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
      </div>
      <div className="row">
        <div><label>Property address</label><input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St" /></div>
        <div><label>Client</label><input value={client} onChange={(e) => setClient(e.target.value)} placeholder="Client name" /></div>
      </div>
      <div className="row">
        <div><label>City</label><input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Troy" /></div>
        <div><label>Zip code</label><input value={zipcode} onChange={(e) => setZipcode(e.target.value)} placeholder="48084" /></div>
      </div>
      <div className="row">
        <div><label>Side</label><select value={side} onChange={(e) => setSide(e.target.value)}><option>Buyer</option><option>Listing</option><option>Both</option><option>Lease</option></select></div>
        <div><label>Closing date</label><input type="date" value={closeDate} onChange={(e) => setCloseDate(e.target.value)} /></div>
      </div>
      <div className="row">
        <div><label>Valuation / sale price ($)</label><input type="number" step="1000" value={valuation} onChange={(e) => setValuation(e.target.value)} /></div>
        <div><label>Commission rate (%)</label><input type="number" step="0.05" value={pct} onChange={(e) => setPct(e.target.value)} /></div>
      </div>
      <div className="btns" style={{ marginTop: 16 }}>
        <button className="btn ghost" onClick={() => run("savedeal", () => saveDeal(txn.id, payload()))} disabled={!!busy}>{busy === "savedeal" ? "Saving…" : "Save details"}</button>
        <button className="btn" onClick={() => run("tosub", async () => { const sv = await saveDeal(txn.id, payload()); if (!sv.ok) return sv; return submitToAccountant(txn.id); })} disabled={!!busy || !agent}>
          {busy === "tosub" ? "Sending…" : "Submit to accountant →"}
        </button>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createDraft } from "@/app/app/transactions/actions";

export default function NewTransactionForm({ agents, sources }: { agents: string[]; sources: string[] }) {
  const router = useRouter();
  const [agent, setAgent] = useState(agents[0] || "");
  const [source, setSource] = useState(sources[0] || "");
  const [address, setAddress] = useState("");
  const [client, setClient] = useState("");
  const [side, setSide] = useState("Buyer");
  const [closeDate, setCloseDate] = useState(new Date().toISOString().slice(0, 10));
  const [valuation, setValuation] = useState<string>("");
  const [pct, setPct] = useState<string>("3");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit() {
    setBusy(true);
    setErr("");
    const res = await createDraft({
      property_address: address,
      valuation: valuation === "" ? null : parseFloat(valuation),
      agent_name: agent,
      source_name: source,
      side,
      client,
      close_date: closeDate,
      commission_pct: pct === "" ? null : parseFloat(pct),
    });
    setBusy(false);
    if (res.ok && res.id) router.push(`/app/transactions/${res.id}`);
    else setErr(res.message || "Could not create transaction");
  }

  return (
    <div className="card" style={{ maxWidth: 680, margin: "0 auto" }}>
      <h2>New transaction — deal details</h2>
      <p className="hint" style={{ marginBottom: 14 }}>
        Enter the deal information. After you submit, it goes to the accountant to complete the commission.
      </p>
      <div className="row">
        <div>
          <label>Agent</label>
          <select value={agent} onChange={(e) => setAgent(e.target.value)}>
            {agents.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <label>Lead source</label>
          <select value={source} onChange={(e) => setSource(e.target.value)}>
            {sources.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div className="row">
        <div><label>Property address</label><input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St" /></div>
        <div><label>Client</label><input value={client} onChange={(e) => setClient(e.target.value)} placeholder="Client name" /></div>
      </div>
      <div className="row">
        <div>
          <label>Side</label>
          <select value={side} onChange={(e) => setSide(e.target.value)}>
            <option>Buyer</option><option>Listing</option><option>Both</option><option>Lease</option>
          </select>
        </div>
        <div><label>Closing date</label><input type="date" value={closeDate} onChange={(e) => setCloseDate(e.target.value)} /></div>
      </div>
      <div className="row">
        <div><label>Valuation / sale price ($)</label><input type="number" step="1000" value={valuation} onChange={(e) => setValuation(e.target.value)} placeholder="300000" /></div>
        <div><label>Commission rate (%)</label><input type="number" step="0.05" value={pct} onChange={(e) => setPct(e.target.value)} /></div>
      </div>
      {err && <p className="hint" style={{ color: "#fca5a5" }}>{err}</p>}
      <div className="btns" style={{ marginTop: 16 }}>
        <button className="btn" onClick={submit} disabled={busy || !agent}>{busy ? "Creating…" : "Save & continue"}</button>
        <button className="btn ghost" onClick={() => router.push("/app/transactions")} disabled={busy}>Cancel</button>
      </div>
    </div>
  );
}

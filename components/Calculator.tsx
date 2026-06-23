"use client";

import { useMemo, useState } from "react";
import { calculate, autoSplit, money, type Agent, type Source, type DealInput, type Statement } from "@/lib/commission";

export interface SavePayload {
  agentName: string;
  property: string;
  client: string;
  side: string;
  sourceName: string;
  closeDate: string;
  input: Omit<DealInput, "agent" | "source">;
  result: Statement;
}

export default function Calculator({
  agents,
  sources,
  brokerageName = "Top Agent Realty",
  onSave,
}: {
  agents: Agent[];
  sources: Source[];
  brokerageName?: string;
  onSave?: (p: SavePayload) => Promise<{ ok: boolean; message?: string }>;
}) {
  const [agentIdx, setAgentIdx] = useState(0);
  const [sourceIdx, setSourceIdx] = useState(0);
  const [address, setAddress] = useState("");
  const [client, setClient] = useState("");
  const [side, setSide] = useState("Buyer");
  const [closeDate, setCloseDate] = useState(new Date().toISOString().slice(0, 10));
  const [price, setPrice] = useState(300000);
  const [commissionPct, setCommissionPct] = useState(3);
  const [grossOverride, setGrossOverride] = useState("");
  const [splitAuto, setSplitAuto] = useState(true);
  const [splitManual, setSplitManual] = useState(50);
  const [referralPct, setReferralPct] = useState(0);
  const [concessions, setConcessions] = useState(0);
  const [bonus, setBonus] = useState(0);
  const [royaltyPct, setRoyaltyPct] = useState(0);
  const [eoFee, setEoFee] = useState(75);
  const [complianceFee, setComplianceFee] = useState(0);
  const [capMode, setCapMode] = useState<"auto" | "capped" | "none">("auto");
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState("");

  const agent = agents[Math.min(agentIdx, agents.length - 1)] ?? agents[0];
  const source = sources[Math.min(sourceIdx, sources.length - 1)] ?? sources[0];
  const computedAutoSplit = agent && source ? autoSplit(agent, source) : 100;

  const dealCore = useMemo(
    () => ({
      price,
      commissionPct,
      grossOverride: grossOverride === "" ? null : parseFloat(grossOverride),
      referralPct,
      concessions,
      bonus,
      splitOverride: splitAuto ? null : splitManual,
      royaltyPct,
      eoFee,
      complianceFee,
      capMode,
    }),
    [price, commissionPct, grossOverride, referralPct, concessions, bonus, splitAuto, splitManual, royaltyPct, eoFee, complianceFee, capMode]
  );

  const s = useMemo(
    () => calculate({ agent, source, ...dealCore }),
    [agent, source, dealCore]
  );

  const statementText = () =>
    [
      `${brokerageName} — Commission Statement`,
      `Date: ${closeDate}`,
      `Agent: ${agent?.name}`,
      `Property: ${address || "—"} (${side})`,
      `Source: ${source?.name}`,
      ``,
      `Sale price:        ${money(price)}`,
      `Gross @ ${commissionPct}%:     ${money(s.gross)}`,
      s.referral > 0 ? `Less referral:     -${money(s.referral)}` : "",
      s.concessions > 0 ? `Less concessions:  -${money(s.concessions)}` : "",
      `Commissionable:    ${money(s.commissionable)}`,
      `Agent split (${s.splitPct}%): ${money(s.agentShare)}`,
      s.royalty > 0 ? `Less royalty:      -${money(s.royalty)}` : "",
      s.eoFee > 0 ? `Less E&O:          -${money(s.eoFee)}` : "",
      s.complianceFee > 0 ? `Less compliance:   -${money(s.complianceFee)}` : "",
      s.bonus > 0 ? `Plus bonus:        +${money(s.bonus)}` : "",
      `----------------------------------`,
      `NET TO AGENT:      ${money(s.netToAgent)}`,
      `To brokerage:      ${money(s.toBrokerage)}`,
    ].filter(Boolean).join("\n");

  const copy = () => { navigator.clipboard.writeText(statementText()); setFlash("Copied"); setTimeout(() => setFlash(""), 1500); };
  const email = () => {
    const subj = `Commission Statement — ${address || agent?.name}`;
    window.location.href = `mailto:${agent?.email || ""}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(statementText() + "\n\nPlease review and reply to confirm.")}`;
  };
  const doSave = async () => {
    if (!onSave) return;
    setSaving(true);
    const res = await onSave({
      agentName: agent.name, property: address, client, side, sourceName: source.name, closeDate,
      input: dealCore, result: s,
    });
    setSaving(false);
    setFlash(res.ok ? "Saved to history" : (res.message || "Save failed"));
    setTimeout(() => setFlash(""), 2000);
  };

  return (
    <div className="grid">
      {/* INPUTS */}
      <div className="card">
        <h2>Deal details</h2>
        <div className="row">
          <div>
            <label>Agent</label>
            <select value={agentIdx} onChange={(e) => setAgentIdx(+e.target.value)}>
              {agents.map((a, i) => (
                <option key={i} value={i}>{a.name}{a.tier === "independent" ? " (Indep)" : a.tier === "owner" ? " (Owner)" : ""}</option>
              ))}
            </select>
          </div>
          <div>
            <label>Lead source</label>
            <select value={sourceIdx} onChange={(e) => setSourceIdx(+e.target.value)}>
              {sources.map((src, i) => <option key={i} value={i}>{src.name}</option>)}
            </select>
          </div>
        </div>
        {agent && (
          <div className="hint">
            <span className={`pill ${agent.tier}`}>{agent.tier}</span>{" "}
            Base split <b>{agent.baseSplit}%</b> · Zillow split <b>{agent.zillowSplit == null ? "—" : agent.zillowSplit + "%"}</b>
            {agent.office ? ` · ${agent.office}` : ""}
          </div>
        )}
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
          <div><label>Sale price ($)</label><input type="number" value={price} onChange={(e) => setPrice(+e.target.value)} /></div>
          <div><label>Commission rate (%)</label><input type="number" step="0.05" value={commissionPct} onChange={(e) => setCommissionPct(+e.target.value)} /></div>
        </div>
        <label>Gross commission override ($) <span className="muted">— optional</span></label>
        <input type="number" value={grossOverride} onChange={(e) => setGrossOverride(e.target.value)} placeholder="leave blank to use price × rate" />
        <div className="row">
          <div>
            <label>Agent split (%)</label>
            <input type="number" value={splitAuto ? computedAutoSplit : splitManual} disabled={splitAuto} onChange={(e) => setSplitManual(+e.target.value)} />
            <div className="hint">
              <label style={{ display: "inline-flex", alignItems: "center", gap: 6, margin: 0 }}>
                <input type="checkbox" style={{ width: "auto" }} checked={splitAuto} onChange={(e) => setSplitAuto(e.target.checked)} /> Auto from agent + source
              </label>
            </div>
          </div>
          <div><label>Referral out (%)</label><input type="number" value={referralPct} onChange={(e) => setReferralPct(+e.target.value)} /></div>
        </div>
        <div className="row">
          <div><label>Concessions ($)</label><input type="number" value={concessions} onChange={(e) => setConcessions(+e.target.value)} /></div>
          <div><label>Bonus to agent ($)</label><input type="number" value={bonus} onChange={(e) => setBonus(+e.target.value)} /></div>
        </div>
        <div className="row">
          <div><label>Royalty (%)</label><input type="number" step="0.1" value={royaltyPct} onChange={(e) => setRoyaltyPct(+e.target.value)} /></div>
          <div><label>E&amp;O fee ($)</label><input type="number" value={eoFee} onChange={(e) => setEoFee(+e.target.value)} /></div>
        </div>
        <div className="row">
          <div><label>Compliance fee ($)</label><input type="number" value={complianceFee} onChange={(e) => setComplianceFee(+e.target.value)} /></div>
          <div>
            <label>Cap status</label>
            <select value={capMode} onChange={(e) => setCapMode(e.target.value as typeof capMode)}>
              <option value="auto">Auto (agent cap balance)</option>
              <option value="capped">Capped — keeps 100%</option>
              <option value="none">No cap this deal</option>
            </select>
          </div>
        </div>
        {s.note ? <div className="hint">{s.note}</div> : null}
      </div>

      {/* STATEMENT */}
      <div className="card">
        <h2>Commission statement</h2>
        <div className="kpis">
          <div className="kpi net"><div className="l">Net to agent</div><div className="v">{money(s.netToAgent)}</div></div>
          <div className="kpi house"><div className="l">To brokerage</div><div className="v">{money(s.toBrokerage)}</div></div>
          <div className="kpi"><div className="l">Gross</div><div className="v">{money(s.gross)}</div></div>
        </div>
        <div className="stmt">
          <div className="sh">
            <div><div className="b">{brokerageName}</div><div className="s">Commission Statement</div></div>
            <div style={{ textAlign: "right" }}><div className="s">{closeDate}</div><div className="s">{source?.name}</div></div>
          </div>
          <div className="meta">
            <div><span>Agent:</span> <b>{agent?.name}</b></div>
            <div><span>Side:</span> {side}</div>
            <div><span>Property:</span> {address || "—"}</div>
            <div><span>Client:</span> {client || "—"}</div>
          </div>
          <table>
            <tbody>
              <tr className="section"><td colSpan={2}>Commission</td></tr>
              <tr><td>Sale price</td><td className="r">{money(price)}</td></tr>
              <tr className="sub"><td>Commission rate</td><td className="r">{commissionPct}%</td></tr>
              <tr><td><b>Gross commission</b></td><td className="r"><b>{money(s.gross)}</b></td></tr>
              {s.referral > 0 && <tr className="minus"><td>Referral out ({referralPct}%)</td><td className="r">– {money(s.referral)}</td></tr>}
              {s.concessions > 0 && <tr className="minus"><td>Concessions</td><td className="r">– {money(s.concessions)}</td></tr>}
              <tr><td>Commissionable amount</td><td className="r">{money(s.commissionable)}</td></tr>
              <tr className="section"><td colSpan={2}>Split{s.capped ? " — capped (100%)" : ""}</td></tr>
              <tr><td>Agent share ({s.splitPct}%)</td><td className="r">{money(s.agentShare)}</td></tr>
              <tr className="sub"><td>Brokerage share</td><td className="r">{money(s.brokerageShare)}</td></tr>
              <tr className="section"><td colSpan={2}>Agent deductions</td></tr>
              {s.royalty > 0 && <tr className="minus"><td>Royalty ({royaltyPct}%)</td><td className="r">– {money(s.royalty)}</td></tr>}
              {s.eoFee > 0 && <tr className="minus"><td>E&amp;O fee</td><td className="r">– {money(s.eoFee)}</td></tr>}
              {s.complianceFee > 0 && <tr className="minus"><td>Compliance fee</td><td className="r">– {money(s.complianceFee)}</td></tr>}
              {s.bonus > 0 && <tr><td>Bonus to agent</td><td className="r">+ {money(s.bonus)}</td></tr>}
              {s.agentDeductions === 0 && s.bonus === 0 && <tr className="sub"><td>No deductions</td><td className="r">$0.00</td></tr>}
              <tr className="tot"><td>Net to agent</td><td className="r">{money(s.netToAgent)}</td></tr>
            </tbody>
          </table>
        </div>
        <div className="btns">
          <button className="btn" onClick={copy}>📋 Copy for agent</button>
          <button className="btn ghost" onClick={email}>✉️ Email agent</button>
          <button className="btn ghost" onClick={() => window.print()}>🖨️ Print / PDF</button>
          {onSave && <button className="btn ghost" onClick={doSave} disabled={saving}>{saving ? "Saving…" : "💾 Save to history"}</button>}
          {flash && <span className="hint" style={{ alignSelf: "center", margin: 0, color: "var(--good)" }}>{flash}</span>}
        </div>
      </div>
    </div>
  );
}

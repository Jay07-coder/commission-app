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
  agents, sources, brokerageName = "Top Agent Realty", onSave,
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
  // agent deductions
  const [agentCap, setAgentCap] = useState(0);
  const [agentRoyalty, setAgentRoyalty] = useState(0);
  const [agentEO, setAgentEO] = useState(75);
  const [complianceFee, setComplianceFee] = useState(0);
  const [monthlyDues, setMonthlyDues] = useState(0);
  const [agentDeductions, setAgentDeductions] = useState(0);
  // charles deductions
  const [charlesCap, setCharlesCap] = useState(0);
  const [charlesRoyalty, setCharlesRoyalty] = useState(0);
  const [charlesDeductions, setCharlesDeductions] = useState(0);

  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState("");

  const agent = agents[Math.min(agentIdx, agents.length - 1)] ?? agents[0];
  const source = sources[Math.min(sourceIdx, sources.length - 1)] ?? sources[0];
  const computedAutoSplit = agent && source ? autoSplit(agent, source) : 100;

  const core = useMemo(() => ({
    price, commissionPct,
    grossOverride: grossOverride === "" ? null : parseFloat(grossOverride),
    referralPct, concessions, bonus,
    splitOverride: splitAuto ? null : splitManual,
    agentCap, agentRoyalty, agentEO, complianceFee, monthlyDues, agentDeductions,
    charlesCap, charlesRoyalty, charlesDeductions,
  }), [price, commissionPct, grossOverride, referralPct, concessions, bonus, splitAuto, splitManual,
    agentCap, agentRoyalty, agentEO, complianceFee, monthlyDues, agentDeductions, charlesCap, charlesRoyalty, charlesDeductions]);

  const s = useMemo(() => calculate({ agent, source, ...core }), [agent, source, core]);

  const statementText = () => {
    const L = [
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
      ``,
      `Agent split (${s.agentSplitPct}%): ${money(s.agentShare)}`,
      `Charles share:     ${money(s.charlesShare)}`,
      ``,
      `NET TO AGENT:      ${money(s.netToAgent)}`,
      `NET TO CHARLES:    ${money(s.netToCharles)}`,
      `NET TO BROKERAGE:  ${money(s.netToBrokerage)}`,
    ].filter(Boolean);
    return L.join("\n");
  };

  const copy = () => { navigator.clipboard.writeText(statementText()); setFlash("Copied"); setTimeout(() => setFlash(""), 1500); };
  const email = () => {
    const subj = `Commission Statement — ${address || agent?.name}`;
    window.location.href = `mailto:${agent?.email || ""}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(statementText() + "\n\nPlease review and reply to confirm.")}`;
  };
  const doSave = async () => {
    if (!onSave) return;
    setSaving(true);
    const res = await onSave({ agentName: agent.name, property: address, client, side, sourceName: source.name, closeDate, input: core, result: s });
    setSaving(false);
    setFlash(res.ok ? "Saved to history" : (res.message || "Save failed"));
    setTimeout(() => setFlash(""), 2000);
  };

  const numIn = (val: number, set: (n: number) => void, step = "1") => (
    <input type="number" step={step} value={val} onChange={(e) => set(+e.target.value)} />
  );

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
          <div><label>Sale price ($)</label>{numIn(price, setPrice, "1000")}</div>
          <div><label>Commission rate (%)</label>{numIn(commissionPct, setCommissionPct, "0.05")}</div>
        </div>
        <label>Gross commission override ($) <span className="muted">— optional</span></label>
        <input type="number" value={grossOverride} onChange={(e) => setGrossOverride(e.target.value)} placeholder="leave blank to use price × rate" />
        <div className="row">
          <div>
            <label>Agent split (%) <span className="muted">— Charles gets the rest</span></label>
            <input type="number" value={splitAuto ? computedAutoSplit : splitManual} disabled={splitAuto} onChange={(e) => setSplitManual(+e.target.value)} />
            <div className="hint">
              <label style={{ display: "inline-flex", alignItems: "center", gap: 6, margin: 0 }}>
                <input type="checkbox" style={{ width: "auto" }} checked={splitAuto} onChange={(e) => setSplitAuto(e.target.checked)} /> Auto from agent + source
              </label>
            </div>
          </div>
          <div><label>Zillow / referral off top (%)</label>{numIn(referralPct, setReferralPct, "1")}</div>
        </div>
        <div className="row">
          <div><label>Concessions ($)</label>{numIn(concessions, setConcessions, "50")}</div>
          <div><label>Bonus to agent ($)</label>{numIn(bonus, setBonus, "50")}</div>
        </div>

        <h2 style={{ marginTop: 18 }}>Agent deductions <span className="muted" style={{ fontWeight: 400, textTransform: "none" }}>→ to brokerage</span></h2>
        <div className="row">
          <div><label>Agent cap ($)</label>{numIn(agentCap, setAgentCap, "50")}</div>
          <div><label>Agent royalty ($)</label>{numIn(agentRoyalty, setAgentRoyalty, "10")}</div>
        </div>
        <div className="row">
          <div><label>E&amp;O fee ($)</label>{numIn(agentEO, setAgentEO, "5")}</div>
          <div><label>Compliance fee ($)</label>{numIn(complianceFee, setComplianceFee, "5")}</div>
        </div>
        <div className="row">
          <div><label>Monthly dues ($)</label>{numIn(monthlyDues, setMonthlyDues, "5")}</div>
          <div><label>Other deductions ($)</label>{numIn(agentDeductions, setAgentDeductions, "10")}</div>
        </div>

        <h2 style={{ marginTop: 18 }}>Charles deductions <span className="muted" style={{ fontWeight: 400, textTransform: "none" }}>→ to brokerage</span></h2>
        <div className="row">
          <div><label>Charles cap ($)</label>{numIn(charlesCap, setCharlesCap, "50")}</div>
          <div><label>Charles royalty ($)</label>{numIn(charlesRoyalty, setCharlesRoyalty, "10")}</div>
        </div>
        <label>Charles other deductions ($)</label>{numIn(charlesDeductions, setCharlesDeductions, "10")}
      </div>

      {/* STATEMENT */}
      <div className="card">
        <h2>Commission statement</h2>
        <div className="kpis">
          <div className="kpi net"><div className="l">Net to Agent</div><div className="v">{money(s.netToAgent)}</div></div>
          <div className="kpi house"><div className="l">Net to Charles</div><div className="v">{money(s.netToCharles)}</div></div>
          <div className="kpi"><div className="l">Net to Brokerage</div><div className="v" style={{ color: "var(--gold)" }}>{money(s.netToBrokerage)}</div></div>
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
              {s.referral > 0 && <tr className="minus"><td>Zillow / referral ({referralPct}%)</td><td className="r">– {money(s.referral)}</td></tr>}
              {s.concessions > 0 && <tr className="minus"><td>Concessions</td><td className="r">– {money(s.concessions)}</td></tr>}
              <tr><td>Commissionable amount</td><td className="r">{money(s.commissionable)}</td></tr>

              <tr className="section"><td colSpan={2}>Split</td></tr>
              <tr><td>Agent share ({s.agentSplitPct}%)</td><td className="r">{money(s.agentShare)}</td></tr>
              <tr className="sub"><td>Charles share</td><td className="r">{money(s.charlesShare)}</td></tr>

              <tr className="section"><td colSpan={2}>Agent deductions → brokerage</td></tr>
              {s.agentCap > 0 && <tr className="minus"><td>Agent cap</td><td className="r">– {money(s.agentCap)}</td></tr>}
              {s.agentRoyalty > 0 && <tr className="minus"><td>Agent royalty</td><td className="r">– {money(s.agentRoyalty)}</td></tr>}
              {s.agentEO > 0 && <tr className="minus"><td>E&amp;O fee</td><td className="r">– {money(s.agentEO)}</td></tr>}
              {s.complianceFee > 0 && <tr className="minus"><td>Compliance fee</td><td className="r">– {money(s.complianceFee)}</td></tr>}
              {s.monthlyDues > 0 && <tr className="minus"><td>Monthly dues</td><td className="r">– {money(s.monthlyDues)}</td></tr>}
              {s.agentDeductions > 0 && <tr className="minus"><td>Other deductions</td><td className="r">– {money(s.agentDeductions)}</td></tr>}
              {s.bonus > 0 && <tr><td>Bonus to agent</td><td className="r">+ {money(s.bonus)}</td></tr>}
              {s.agentDeductTotal === 0 && s.bonus === 0 && <tr className="sub"><td>None</td><td className="r">$0.00</td></tr>}

              {(s.charlesDeductTotal > 0) && <tr className="section"><td colSpan={2}>Charles deductions → brokerage</td></tr>}
              {s.charlesCap > 0 && <tr className="minus"><td>Charles cap</td><td className="r">– {money(s.charlesCap)}</td></tr>}
              {s.charlesRoyalty > 0 && <tr className="minus"><td>Charles royalty</td><td className="r">– {money(s.charlesRoyalty)}</td></tr>}
              {s.charlesDeductions > 0 && <tr className="minus"><td>Charles other</td><td className="r">– {money(s.charlesDeductions)}</td></tr>}

              <tr className="section"><td colSpan={2}>Net payouts</td></tr>
              <tr className="tot"><td>Net to Agent</td><td className="r">{money(s.netToAgent)}</td></tr>
              <tr className="tot"><td>Net to Charles</td><td className="r">{money(s.netToCharles)}</td></tr>
              <tr className="tot"><td>Net to Brokerage</td><td className="r">{money(s.netToBrokerage)}</td></tr>
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

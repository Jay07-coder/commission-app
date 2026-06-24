"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { calculate, autoSplit, money, type Agent, type Source } from "@/lib/commission";
import type { Txn } from "@/lib/transactions";
import { saveCommission, submitForApproval } from "@/app/app/transactions/actions";

type Num = number;
const n = (v: unknown, d = 0): Num => (typeof v === "number" && !Number.isNaN(v) ? v : d);

export default function CommissionEditor({ txn, agent, source }: { txn: Txn; agent: Agent; source: Source }) {
  const router = useRouter();
  const inp = (txn.input ?? {}) as Record<string, unknown>;
  const price = n(txn.valuation, 0);
  const commissionPct = n(txn.commission_pct, 3);

  const [grossOverride, setGrossOverride] = useState(inp.grossOverride != null ? String(inp.grossOverride) : "");
  const [referralPct, setReferralPct] = useState(n(inp.referralPct));
  const [concessions, setConcessions] = useState(n(inp.concessions));
  const [bonus, setBonus] = useState(n(inp.bonus));
  const [splitAuto, setSplitAuto] = useState(inp.splitOverride == null);
  const [splitManual, setSplitManual] = useState(n(inp.splitOverride, autoSplit(agent, source)));
  const [agentCap, setAgentCap] = useState(n(inp.agentCap));
  const [agentRoyalty, setAgentRoyalty] = useState(n(inp.agentRoyalty));
  const [agentEO, setAgentEO] = useState(n(inp.agentEO, 75));
  const [complianceFee, setComplianceFee] = useState(n(inp.complianceFee));
  const [monthlyDues, setMonthlyDues] = useState(n(inp.monthlyDues));
  const [agentDeductions, setAgentDeductions] = useState(n(inp.agentDeductions));
  const [charlesCap, setCharlesCap] = useState(n(inp.charlesCap));
  const [charlesRoyalty, setCharlesRoyalty] = useState(n(inp.charlesRoyalty));
  const [charlesDeductions, setCharlesDeductions] = useState(n(inp.charlesDeductions));

  const [busy, setBusy] = useState("");
  const [flash, setFlash] = useState("");
  const computedAutoSplit = autoSplit(agent, source);

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

  async function save() {
    setBusy("save");
    const res = await saveCommission(txn.id, { input: core, result: s });
    setBusy("");
    if (res.ok) { setFlash("Saved"); router.refresh(); setTimeout(() => setFlash(""), 1500); }
    else alert(res.message);
  }
  async function submit() {
    setBusy("submit");
    const saved = await saveCommission(txn.id, { input: core, result: s });
    if (!saved.ok) { setBusy(""); alert(saved.message); return; }
    const res = await submitForApproval(txn.id);
    setBusy("");
    if (res.ok) router.refresh();
    else alert(res.message);
  }

  const numIn = (val: number, set: (x: number) => void, step = "1") => (
    <input type="number" step={step} value={val} onChange={(e) => set(+e.target.value)} />
  );

  return (
    <div className="card">
      <h2>Commission details</h2>
      <div className="kpis">
        <div className="kpi net"><div className="l">Net to Agent</div><div className="v">{money(s.netToAgent)}</div></div>
        <div className="kpi house"><div className="l">Net to Charles</div><div className="v">{money(s.netToCharles)}</div></div>
        <div className="kpi"><div className="l">Net to Brokerage</div><div className="v" style={{ color: "var(--gold)" }}>{money(s.netToBrokerage)}</div></div>
      </div>

      <div className="hint" style={{ marginBottom: 6 }}>
        Sale price <b>{money(price)}</b> · rate <b>{commissionPct}%</b> · gross <b>{money(s.gross)}</b>
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

      <div className="btns" style={{ marginTop: 16 }}>
        <button className="btn ghost" onClick={save} disabled={!!busy}>{busy === "save" ? "Saving…" : "Save"}</button>
        <button className="btn" onClick={submit} disabled={!!busy}>{busy === "submit" ? "Submitting…" : "Submit for approval →"}</button>
        {flash && <span className="hint" style={{ alignSelf: "center", margin: 0, color: "var(--good)" }}>{flash}</span>}
      </div>
    </div>
  );
}

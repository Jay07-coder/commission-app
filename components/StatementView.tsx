import { money, type Statement } from "@/lib/commission";
import type { Txn } from "@/lib/transactions";

export default function StatementView({
  txn,
  s,
  brokerageName = "Top Agent Realty",
}: {
  txn: Txn;
  s: Statement;
  brokerageName?: string;
}) {
  const pct = txn.commission_pct ?? 0;
  return (
    <div className="stmt">
      <div className="sh">
        <div>
          <div className="b">{brokerageName}</div>
          <div className="s">Commission Statement</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="s">{txn.close_date || "—"}</div>
          <div className="s">{txn.source_name || "—"}</div>
        </div>
      </div>
      <div className="meta">
        <div><span>Agent:</span> <b>{txn.agent_name || "—"}</b></div>
        <div><span>Side:</span> {txn.side || "—"}</div>
        <div><span>Property:</span> {txn.property_address || "—"}</div>
        <div><span>Client:</span> {txn.client || "—"}</div>
      </div>
      <table>
        <tbody>
          <tr className="section"><td colSpan={2}>Commission</td></tr>
          <tr><td>Sale price / valuation</td><td className="r">{money(txn.valuation ?? 0)}</td></tr>
          <tr className="sub"><td>Commission rate</td><td className="r">{pct}%</td></tr>
          <tr><td><b>Gross commission</b></td><td className="r"><b>{money(s.gross)}</b></td></tr>
          {s.referral > 0 && <tr className="minus"><td>Zillow / referral</td><td className="r">– {money(s.referral)}</td></tr>}
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

          {s.charlesDeductTotal > 0 && <tr className="section"><td colSpan={2}>Charles deductions → brokerage</td></tr>}
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
  );
}

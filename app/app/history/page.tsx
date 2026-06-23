import { getStatements } from "@/lib/data";
import { money } from "@/lib/commission";

export default async function HistoryPage() {
  const rows = await getStatements();
  return (
    <div className="card">
      <h2>Saved statements</h2>
      {rows.length === 0 ? (
        <p className="hint">No saved statements yet. Create one on the Calculator and click “Save to history.”</p>
      ) : (
        <table className="stmt" style={{ width: "100%", background: "transparent", color: "var(--ink)", padding: 0 }}>
          <thead>
            <tr style={{ color: "var(--muted)", fontSize: 11, textTransform: "uppercase" }}>
              <td>#</td><td>Date</td><td>Agent</td><td>Property</td><td>Source</td><td className="r">Net to agent</td><td>Status</td>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="hint" style={{ margin: 0 }}>{r.number}</td>
                <td>{r.close_date || new Date(r.created_at).toLocaleDateString()}</td>
                <td>{r.agent_name}</td>
                <td>{r.property || "—"}</td>
                <td>{r.source_name}</td>
                <td className="r" style={{ color: "var(--good)", fontWeight: 700 }}>{money(Number(r.net_to_agent))}</td>
                <td><span className="pill team">{r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Agent } from "@/lib/commission";
import { saveAgent, deleteAgent } from "@/app/app/agents/actions";

const blank: Agent = { name: "", email: "", tier: "team", baseSplit: 50, zillowSplit: 50, office: "", cap: 0, capPaid: 0 };

export default function AgentsManager({ agents }: { agents: Agent[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Agent | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!editing) return;
    setBusy(true);
    const res = await saveAgent(editing);
    setBusy(false);
    if (res.ok) { setEditing(null); router.refresh(); }
    else alert(res.message);
  }
  async function remove(id?: string) {
    if (!id || !confirm("Remove this agent?")) return;
    const res = await deleteAgent(id);
    if (res.ok) router.refresh(); else alert(res.message);
  }

  const set = (patch: Partial<Agent>) => setEditing((e) => ({ ...(e as Agent), ...patch }));

  return (
    <>
      <div className="card">
        <h2>Agents &amp; plans</h2>
        <div className="btns" style={{ marginBottom: 12 }}>
          <button className="btn" onClick={() => setEditing({ ...blank })}>+ Add agent</button>
          <span className="hint" style={{ alignSelf: "center", margin: 0 }}>{agents.length} agents</span>
        </div>
        <table className="stmt" style={{ width: "100%", background: "transparent", color: "var(--ink)", padding: 0 }}>
          <thead>
            <tr style={{ color: "var(--muted)", fontSize: 11, textTransform: "uppercase" }}>
              <td>Agent</td><td>Tier</td><td>Office</td><td className="r">Base</td><td className="r">Zillow</td><td className="r">Cap left</td><td></td>
            </tr>
          </thead>
          <tbody>
            {agents.map((a) => (
              <tr key={a.id}>
                <td><b>{a.name}</b>{a.email ? <div className="hint" style={{ margin: 0 }}>{a.email}</div> : null}</td>
                <td><span className={`pill ${a.tier}`}>{a.tier}</span></td>
                <td>{a.office}</td>
                <td className="r">{a.baseSplit}%</td>
                <td className="r">{a.zillowSplit == null ? "—" : a.zillowSplit + "%"}</td>
                <td className="r">{(a.cap || 0) > 0 ? "$" + Math.max((a.cap || 0) - (a.capPaid || 0), 0).toLocaleString() : "—"}</td>
                <td className="r">
                  <button className="btn ghost" onClick={() => setEditing(a)}>Edit</button>{" "}
                  <button className="btn ghost" onClick={() => remove(a.id)}>✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="card" style={{ marginTop: 20 }}>
          <h2>{editing.id ? "Edit agent" : "Add agent"}</h2>
          <div className="row">
            <div><label>Name</label><input value={editing.name} onChange={(e) => set({ name: e.target.value })} /></div>
            <div><label>Email</label><input value={editing.email} onChange={(e) => set({ email: e.target.value })} placeholder="agent@email.com" /></div>
          </div>
          <div className="row">
            <div>
              <label>Tier</label>
              <select value={editing.tier} onChange={(e) => set({ tier: e.target.value as Agent["tier"] })}>
                <option value="team">Team (splits to house)</option>
                <option value="independent">Independent (keeps 100%)</option>
                <option value="owner">Owner / house</option>
              </select>
            </div>
            <div><label>Office</label><input value={editing.office} onChange={(e) => set({ office: e.target.value })} /></div>
          </div>
          <div className="row">
            <div><label>Base / SOI split (%)</label><input type="number" value={editing.baseSplit} onChange={(e) => set({ baseSplit: +e.target.value })} /></div>
            <div>
              <label>Zillow / company split (%)</label>
              <input type="number" value={editing.zillowSplit ?? ""} placeholder="blank = none"
                onChange={(e) => set({ zillowSplit: e.target.value === "" ? null : +e.target.value })} />
            </div>
          </div>
          <div className="row">
            <div><label>Annual cap ($)</label><input type="number" value={editing.cap} onChange={(e) => set({ cap: +e.target.value })} /></div>
            <div><label>Cap paid to date ($)</label><input type="number" value={editing.capPaid} onChange={(e) => set({ capPaid: +e.target.value })} /></div>
          </div>
          <div className="btns">
            <button className="btn" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save agent"}</button>
            <button className="btn ghost" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </div>
      )}
    </>
  );
}

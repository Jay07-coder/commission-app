"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Member } from "@/lib/data";
import { setMemberRole, removeMember } from "@/app/app/team/actions";

const ROLE_LABEL: Record<string, string> = {
  owner: "Super Admin",
  transaction_coordinator: "Transaction Coordinator",
  accountant: "Accountant",
  agent: "Agent",
};
const ASSIGNABLE = ["transaction_coordinator", "accountant", "agent"];

export default function TeamManager({ members }: { members: Member[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const pending = members.filter((m) => m.status === "pending");
  const active = members.filter((m) => m.status === "active");

  async function assign(id: string, role: string) {
    setBusy(id);
    const res = await setMemberRole(id, role);
    setBusy("");
    if (res.ok) router.refresh(); else alert(res.message);
  }
  async function remove(id: string) {
    if (!confirm("Remove this person from your brokerage?")) return;
    setBusy(id);
    const res = await removeMember(id);
    setBusy("");
    if (res.ok) router.refresh(); else alert(res.message);
  }

  return (
    <>
      <div className="card">
        <h2>Pending requests {pending.length > 0 && <span className="pill capped">{pending.length}</span>}</h2>
        {pending.length === 0 ? (
          <p className="hint">No one is waiting. When a teammate signs up at your app, they'll appear here for you to approve and assign a role.</p>
        ) : (
          <table className="stmt" style={{ width: "100%", background: "transparent", color: "var(--ink)", padding: 0 }}>
            <tbody>
              {pending.map((m) => (
                <tr key={m.id}>
                  <td><b>{m.email}</b></td>
                  <td className="r" style={{ whiteSpace: "nowrap" }}>
                    <span className="hint" style={{ margin: "0 8px 0 0" }}>Approve as:</span>
                    <button className="btn sm" disabled={busy === m.id} onClick={() => assign(m.id, "transaction_coordinator")}>Coordinator</button>{" "}
                    <button className="btn sm" disabled={busy === m.id} onClick={() => assign(m.id, "accountant")}>Accountant</button>{" "}
                    <button className="btn ghost sm" disabled={busy === m.id} onClick={() => assign(m.id, "agent")}>Agent</button>{" "}
                    <button className="btn ghost sm" disabled={busy === m.id} onClick={() => remove(m.id)}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h2>Team members</h2>
        <table className="stmt" style={{ width: "100%", background: "transparent", color: "var(--ink)", padding: 0 }}>
          <thead>
            <tr style={{ color: "var(--muted)", fontSize: 11, textTransform: "uppercase" }}>
              <td>Member</td><td>Role</td><td></td>
            </tr>
          </thead>
          <tbody>
            {active.map((m) => (
              <tr key={m.id}>
                <td><b>{m.email}</b>{m.isSelf && <span className="hint" style={{ margin: 0 }}> (you)</span>}</td>
                <td>
                  {m.role === "owner" ? (
                    <span className="pill owner">Super Admin</span>
                  ) : (
                    <select value={m.role} disabled={busy === m.id} onChange={(e) => assign(m.id, e.target.value)} style={{ width: "auto" }}>
                      {ASSIGNABLE.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                    </select>
                  )}
                </td>
                <td className="r">
                  {!m.isSelf && m.role !== "owner" && (
                    <button className="btn ghost sm" disabled={busy === m.id} onClick={() => remove(m.id)}>Remove</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="hint">Transaction Coordinators and Accountants have full access to the calculator, agents, and history. Only you (Super Admin) can manage the team.</p>
      </div>
    </>
  );
}

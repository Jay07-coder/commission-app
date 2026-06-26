"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { viewAsAgent, clearViewAs } from "@/app/app/me/actions";

export default function ViewAsBar({ agentNames, viewingName }: { agentNames: string[]; viewingName: string | null }) {
  const [pending, start] = useTransition();
  const router = useRouter();

  function pick(name: string) {
    start(async () => {
      if (name) await viewAsAgent(name);
      else await clearViewAs();
      router.refresh();
    });
  }

  return (
    <div
      className="card"
      style={{
        display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap",
        background: viewingName ? "#fffbeb" : "var(--panel)",
        borderColor: viewingName ? "#fde68a" : "var(--line)",
        padding: "12px 16px",
      }}
    >
      {viewingName ? (
        <span style={{ fontSize: 14, color: "#92400e" }}>👁 Viewing as <b>{viewingName}</b> — this is their portal.</span>
      ) : (
        <span style={{ fontSize: 14, color: "var(--muted)" }}>Admin view — preview any agent&apos;s portal, then switch back to yours.</span>
      )}
      <div style={{ display: "flex", gap: 8, marginLeft: "auto", alignItems: "center" }}>
        <select value={viewingName || ""} onChange={(e) => pick(e.target.value)} disabled={pending} style={{ width: "auto" }}>
          <option value="">— View as agent —</option>
          {agentNames.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        {viewingName && (
          <button className="btn ghost sm" onClick={() => pick("")} disabled={pending}>
            ← Back to my account
          </button>
        )}
      </div>
    </div>
  );
}

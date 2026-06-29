import { redirect } from "next/navigation";
import { getContext, canManageTeam, getAgents, getTaxProfileByEmail } from "@/lib/data";
import { listAllForReports } from "@/lib/transactions-server";
import Form1099 from "@/components/Form1099";

export const dynamic = "force-dynamic";

export default async function Print1099Page({ searchParams }: { searchParams: Promise<{ year?: string; agent?: string }> }) {
  const ctx = await getContext();
  if (!ctx || ctx.status !== "active") redirect("/login");
  if (!canManageTeam(ctx)) redirect("/app/transactions");

  const sp = await searchParams;
  const year = (sp.year || String(new Date().getFullYear())).slice(0, 4);
  const agent = (sp.agent || "").trim();
  if (!agent) redirect("/app/tax");

  const [txns, agents] = await Promise.all([listAllForReports(), getAgents()]);
  const box1 = txns
    .filter((t) => t.stage === "completed" && t.agent_name === agent && (t.close_date || t.created_at || "").slice(0, 4) === year)
    .reduce((s, t) => s + (t.net_to_agent ?? 0), 0);

  const email = agents.find((a) => a.name === agent)?.email || "";
  const profile = email ? await getTaxProfileByEmail(email) : null;

  if (!profile) {
    return (
      <main style={{ maxWidth: 640, margin: "40px auto" }}>
        <div className="card">
          <h2 style={{ marginTop: 0 }}>W-9 not on file</h2>
          <p className="muted" style={{ lineHeight: 1.6 }}>
            <b>{agent}</b> hasn&apos;t completed their W-9 yet, so a 1099-NEC can&apos;t be generated. Ask them to add their tax info from their portal, then come back.
          </p>
          <a className="btn ghost" href="/app/tax" style={{ textDecoration: "none" }}>← Back to 1099s</a>
        </div>
      </main>
    );
  }

  return (
    <Form1099
      year={year}
      payerName={ctx.brokerageName}
      recipient={{
        legalName: profile.legal_name, businessName: profile.business_name, tin: profile.tin, tinType: profile.tin_type,
        address1: profile.address1, address2: profile.address2, city: profile.city, state: profile.state, zip: profile.zip,
      }}
      box1={box1}
    />
  );
}

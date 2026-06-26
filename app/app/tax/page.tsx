import { redirect } from "next/navigation";
import { getContext, getAgents, getTaxProfileEmails, canManageTeam } from "@/lib/data";
import { listAllForReports } from "@/lib/transactions-server";
import TaxSummary from "@/components/TaxSummary";

export const dynamic = "force-dynamic";

export default async function TaxPage() {
  const ctx = await getContext();
  if (!ctx || ctx.status !== "active") redirect("/login");
  if (!canManageTeam(ctx)) redirect("/app/transactions");

  // 1099 amounts reflect what was actually paid out — completed deals only.
  const [txns, agents, w9Emails] = await Promise.all([
    listAllForReports(),
    getAgents(),
    getTaxProfileEmails(),
  ]);
  const deals = txns.filter((t) => t.stage === "completed");
  // Agent names whose email has a completed W-9 on file.
  const w9Names = agents
    .filter((a) => a.email && w9Emails.has(a.email.toLowerCase()))
    .map((a) => a.name);

  return <TaxSummary deals={deals} w9Names={w9Names} />;
}

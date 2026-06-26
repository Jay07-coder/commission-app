import { redirect } from "next/navigation";
import { getContext, canManageTeam } from "@/lib/data";
import { listAllForReports } from "@/lib/transactions-server";
import TaxSummary from "@/components/TaxSummary";

export const dynamic = "force-dynamic";

export default async function TaxPage() {
  const ctx = await getContext();
  if (!ctx || ctx.status !== "active") redirect("/login");
  if (!canManageTeam(ctx)) redirect("/app/transactions");

  const txns = await listAllForReports();
  const deals = txns.filter((t) => t.stage === "completed");

  return <TaxSummary deals={deals} />;
}

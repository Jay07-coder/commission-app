import { redirect } from "next/navigation";
import { getContext, canManageTeam } from "@/lib/data";
import { listAllForReports } from "@/lib/transactions-server";
import ReportsDashboard from "@/components/ReportsDashboard";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const ctx = await getContext();
  if (!ctx || ctx.status !== "active") redirect("/login");
  if (!canManageTeam(ctx)) redirect("/app/transactions");

  const transactions = await listAllForReports();
  return <ReportsDashboard transactions={transactions} />;
}

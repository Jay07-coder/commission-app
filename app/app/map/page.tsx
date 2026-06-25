import { redirect } from "next/navigation";
import { getContext, canManageTeam } from "@/lib/data";
import { listAllForReports } from "@/lib/transactions-server";
import MapView from "@/components/MapView";

export const dynamic = "force-dynamic";

export default async function MapPage() {
  const ctx = await getContext();
  if (!ctx || ctx.status !== "active") redirect("/login");
  if (!canManageTeam(ctx)) redirect("/app/transactions");

  const txns = await listAllForReports();
  const deals = txns
    .filter((t) => (t.stage === "approved" || t.stage === "completed") && !!t.zipcode)
    .map((t) => ({
      zip: String(t.zipcode),
      source: t.source_name || "Unknown",
      gross: t.result?.gross ?? 0,
      brokerage: t.net_to_brokerage ?? 0,
    }));

  return <MapView deals={deals} />;
}


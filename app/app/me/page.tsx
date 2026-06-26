import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getContext, getMyAgent, getAgentByName, getAgents, getMyTaxProfile, canManageTeam } from "@/lib/data";
import { listMyDeals } from "@/lib/transactions-server";
import AgentPortal from "@/components/AgentPortal";
import ViewAsBar from "@/components/ViewAsBar";
import W9Form from "@/components/W9Form";

export const dynamic = "force-dynamic";

export default async function MyPortalPage() {
  const ctx = await getContext();
  if (!ctx || ctx.status !== "active") redirect("/login");

  const isAdmin = canManageTeam(ctx);
  let viewingName: string | null = null;
  if (isAdmin) {
    const c = await cookies();
    viewingName = c.get("viewAs")?.value || null;
  }

  const agent = viewingName ? await getAgentByName(viewingName) : await getMyAgent();
  const deals = agent ? await listMyDeals(agent.name) : [];
  const agentNames = isAdmin ? (await getAgents()).map((a) => a.name) : [];
  // Only the user's OWN tax profile — not shown while impersonating another agent.
  const taxProfile = viewingName ? null : await getMyTaxProfile();

  return (
    <>
      {isAdmin && <ViewAsBar agentNames={agentNames} viewingName={viewingName} />}
      {!viewingName && (
        <div style={{ marginBottom: 16 }}>
          <W9Form profile={taxProfile} />
        </div>
      )}
      <AgentPortal agent={agent} email={viewingName || ctx.email} deals={deals} />
    </>
  );
}

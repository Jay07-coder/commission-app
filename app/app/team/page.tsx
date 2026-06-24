import { redirect } from "next/navigation";
import { getContext, getMembers, canManageTeam } from "@/lib/data";
import TeamManager from "@/components/TeamManager";

export default async function TeamPage() {
  const ctx = await getContext();
  if (!canManageTeam(ctx)) redirect("/app/calculator");
  const members = await getMembers();
  return <TeamManager members={members} viewerRole={ctx!.role} />;
}

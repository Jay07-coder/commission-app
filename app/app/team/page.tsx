import { redirect } from "next/navigation";
import { getContext, getMembers, isOwner } from "@/lib/data";
import TeamManager from "@/components/TeamManager";

export default async function TeamPage() {
  const ctx = await getContext();
  if (!isOwner(ctx)) redirect("/app/calculator");
  const members = await getMembers();
  return <TeamManager members={members} />;
}

import { redirect } from "next/navigation";
import { getContext } from "@/lib/data";

export default async function AppIndex() {
  const ctx = await getContext();
  if (ctx?.role === "agent") redirect("/app/me");
  redirect("/app/transactions");
}

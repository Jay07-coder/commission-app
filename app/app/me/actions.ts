"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getContext, canManageTeam } from "@/lib/data";

/** Admin-only: view a given agent's portal by setting a cookie. Empty name clears it. */
export async function viewAsAgent(name: string) {
  const ctx = await getContext();
  if (!canManageTeam(ctx)) return;
  const c = await cookies();
  if (name) c.set("viewAs", name, { path: "/", httpOnly: true, sameSite: "lax" });
  else c.delete("viewAs");
  revalidatePath("/app/me");
}

export async function clearViewAs() {
  const c = await cookies();
  c.delete("viewAs");
  revalidatePath("/app/me");
}

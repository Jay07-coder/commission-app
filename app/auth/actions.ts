"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type AuthResult = { error?: string; message?: string };

export async function signIn(_prev: unknown, formData: FormData): Promise<AuthResult> {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  redirect("/app/calculator");
}

export async function signUp(_prev: unknown, formData: FormData): Promise<AuthResult> {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) return { error: error.message };
  // If email confirmation is OFF, the user is signed in immediately.
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/app/calculator");
  return { error: "", message: "Check your email to confirm your account, then log in." };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

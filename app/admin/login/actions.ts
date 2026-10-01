"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// The sign-in link must point at our own origin, never one derived from the request.
async function callbackUrl() {
  const configured = process.env.ADMIN_ORIGIN;
  if (configured) return `${configured.replace(/\/$/, "")}/admin/auth/callback`;
  if (process.env.NODE_ENV === "production") throw new Error("ADMIN_ORIGIN is not set");
  const h = await headers();
  return `http://${h.get("host")}/admin/auth/callback`;
}

// Email sign-in link. Never creates arbitrary accounts: a new auth user is only
// allowed when the address has a pending invitation. The answer shown is the same
// either way, so the form doesn't reveal who is invited.
export async function signInWithEmail(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) redirect("/admin/login?error=correo");

  let invited = false;
  const admin = createAdminClient();
  if (admin) {
    const { data } = await admin
      .from("invitations")
      .select("id")
      .eq("email", email)
      .is("accepted_at", null)
      .is("revoked_at", null)
      .maybeSingle();
    invited = Boolean(data);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: invited, emailRedirectTo: await callbackUrl() },
  });

  // 422 = unknown email with sign-ups not allowed: expected, answer as if sent.
  if (error && error.status !== 422) {
    if (error.status === 429) redirect("/admin/login?error=espera");
    console.error("[admin] signInWithOtp failed", error.code, error.status);
    redirect("/admin/login?error=envio");
  }
  redirect("/admin/login?enviado=1");
}

export async function signInWithGoogle() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: await callbackUrl() },
  });
  if (error || !data.url) {
    console.error("[admin] signInWithOAuth failed", error?.code, error?.status);
    redirect("/admin/login?error=google");
  }
  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  // Local scope: leaving the panel must not sign the user out of other apps sharing this auth.
  await supabase.auth.signOut({ scope: "local" });
  redirect("/admin/login");
}

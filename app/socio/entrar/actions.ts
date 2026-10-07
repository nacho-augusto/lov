"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { portalCallbackUrl } from "@/lib/portal/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// Email sign-in link for members. A new auth user is only created when the address
// belongs to an active member; the answer shown is the same either way, so the form
// doesn't reveal who is a member.
export async function requestPortalLink(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) redirect("/socio/entrar?error=correo");

  let isMember = false;
  const admin = createAdminClient();
  if (admin) {
    // Member emails are stored lowercased by the panel.
    const { data } = await admin.from("members").select("id").eq("email", email).is("left_on", null).limit(1);
    isMember = Boolean(data?.length);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: isMember, emailRedirectTo: await portalCallbackUrl((await headers()).get("host")) },
  });

  // 422 = unknown email with sign-ups not allowed: expected, answer as if sent.
  if (error && error.status !== 422) {
    if (error.status === 429) redirect("/socio/entrar?error=espera");
    console.error("[portal] signInWithOtp failed", error.code, error.status);
    redirect("/socio/entrar?error=envio");
  }
  redirect("/socio/entrar?enviado=1");
}

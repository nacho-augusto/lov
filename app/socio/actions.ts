"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireMember } from "@/lib/portal/session";
import { createClient } from "@/lib/supabase/server";

const isUuid = (v: unknown): v is string => typeof v === "string" && /^[0-9a-f-]{36}$/i.test(v);

function back(memberId: string | null, param: "ok" | "error", code: string): never {
  revalidatePath("/socio");
  redirect(`/socio?${memberId ? `m=${memberId}&` : ""}${param}=${code}`);
}

// Sign up for an activity, or drop out. The database re-checks that the member is
// linked to this session, the deadline and the places left.
export async function portalSignup(formData: FormData) {
  const members = await requireMember();
  const eventId = formData.get("event_id");
  const memberId = formData.get("member_id");
  if (!isUuid(eventId) || !isUuid(memberId) || !members.some((m) => m.id === memberId)) back(null, "error", "guardar");
  const join = formData.get("join") === "true";

  const supabase = await createClient();
  const { error } = await supabase.rpc("portal_signup", { p_event: eventId, p_member: memberId, p_join: join });
  if (error) back(memberId, "error", error.code === "23514" ? "sin-plazas" : "guardar");
  back(memberId, "ok", join ? "apuntado" : "desapuntado");
}

export async function portalSignOut() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect("/socio/entrar");
}

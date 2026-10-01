"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { text } from "@/lib/admin/format";
import { requireAdmin } from "@/lib/admin/session";
import { createClient } from "@/lib/supabase/server";

const PAGE = "/admin/comunicaciones";
const AUDIENCES = ["active", "overdue", "no_licence", "single"];
const isUuid = (v: unknown): v is string => typeof v === "string" && /^[0-9a-f-]{36}$/i.test(v);

export async function saveTemplate(formData: FormData) {
  await requireAdmin("comms.send");
  const id = formData.get("id");
  const name = text(formData, "name");
  const subject = text(formData, "subject");
  const body = String(formData.get("body") ?? "").trim();
  const audience = String(formData.get("audience"));
  if (!name || !subject || !body || !AUDIENCES.includes(audience)) redirect(`${PAGE}?error=plantilla`);

  const supabase = await createClient();
  const fields = { name, subject, body, audience };
  const { data, error } = isUuid(id)
    ? await supabase.from("email_templates").update(fields).eq("id", id).select("id").single()
    : await supabase.from("email_templates").insert(fields).select("id").single();
  if (error || !data) redirect(`${PAGE}?error=guardar`);
  revalidatePath(PAGE);
  redirect(`${PAGE}?plantilla=${data.id}&ok=plantilla`);
}

// Called from the browser right before opening the mail app, so the log reflects
// what was actually prepared. Recipients are re-checked against the members table.
export async function logMessage(input: { templateId: string | null; subject: string; memberIds: string[] }) {
  const me = await requireAdmin("comms.send");
  const ids = input.memberIds.filter(isUuid).slice(0, 500);
  if (!ids.length || !input.subject) return { error: "vacío" };

  const supabase = await createClient();
  const { data: members } = await supabase.from("members").select("id, first_name, last_name, email").in("id", ids);
  const recipients = (members ?? [])
    .filter((m) => m.email)
    .map((m) => ({ member_id: m.id, email: m.email, name: [m.first_name, m.last_name].filter(Boolean).join(" ") }));
  if (!recipients.length) return { error: "sin-correo" };

  const { error } = await supabase.from("email_messages").insert({
    template_id: isUuid(input.templateId) ? input.templateId : null,
    subject: input.subject.slice(0, 300),
    recipients,
    sent_by: me.id,
  });
  if (error) return { error: "guardar" };
  revalidatePath(PAGE);
  return { ok: true };
}

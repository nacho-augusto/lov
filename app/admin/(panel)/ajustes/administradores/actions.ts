"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, roleOrder, type Role } from "@/lib/admin/session";
import { createClient } from "@/lib/supabase/server";

const PAGE = "/admin/ajustes/administradores";

function back(param: "ok" | "error", code: string): never {
  revalidatePath(PAGE);
  redirect(`${PAGE}?${param}=${code}`);
}

function readRoles(formData: FormData): Role[] {
  const picked = formData.getAll("roles").map(String);
  return roleOrder.filter((r) => picked.includes(r));
}

export async function inviteAdmin(formData: FormData) {
  const me = await requireAdmin("admins.manage");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const fullName = String(formData.get("full_name") ?? "").trim() || null;
  const roles = readRoles(formData);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) back("error", "correo");
  if (roles.length === 0) back("error", "sin-roles");

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("admin_users")
    .select("active")
    .eq("email", email)
    .maybeSingle();
  if (existing?.active) back("error", "ya-admin");

  const { error } = await supabase
    .from("invitations")
    .insert({ email, full_name: fullName, roles, invited_by: me.id });
  if (error) back("error", error.code === "23505" ? "ya-invitado" : "guardar");
  back("ok", "invitado");
}

export async function revokeInvitation(formData: FormData) {
  await requireAdmin("admins.manage");
  const supabase = await createClient();
  const { error } = await supabase
    .from("invitations")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", String(formData.get("id")))
    .is("accepted_at", null);
  if (error) back("error", "guardar");
  back("ok", "invitacion-anulada");
}

export async function setAdminActive(formData: FormData) {
  const me = await requireAdmin("admins.manage");
  const id = String(formData.get("id"));
  const active = formData.get("active") === "true";
  if (id === me.id && !active) back("error", "a-ti-mismo");

  const supabase = await createClient();
  const { error } = await supabase.from("admin_users").update({ active }).eq("id", id);
  if (error) back("error", error.code === "23514" ? "ultimo-propietario" : "guardar");
  back("ok", active ? "reactivado" : "desactivado");
}

export async function setAdminRoles(formData: FormData) {
  await requireAdmin("admins.manage");
  const id = String(formData.get("id"));
  const roles = readRoles(formData);
  if (roles.length === 0) back("error", "sin-roles");

  const supabase = await createClient();
  // Add first, then remove: never leaves the club without an owner mid-change.
  const { error: addError } = await supabase
    .from("admin_user_roles")
    .upsert(roles.map((role) => ({ admin_user_id: id, role })), { ignoreDuplicates: true });
  if (addError) back("error", "guardar");

  const removed = roleOrder.filter((r) => !roles.includes(r));
  if (removed.length) {
    const { error } = await supabase
      .from("admin_user_roles")
      .delete()
      .eq("admin_user_id", id)
      .in("role", removed);
    if (error) back("error", error.code === "23514" ? "ultimo-propietario" : "guardar");
  }
  back("ok", "roles");
}

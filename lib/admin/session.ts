import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Role = "owner" | "treasurer" | "secretary" | "league" | "viewer";

export const roleLabels: Record<Role, string> = {
  owner: "Propietario",
  treasurer: "Tesorero",
  secretary: "Secretario",
  league: "Liga",
  viewer: "Solo lectura",
};

export const roleOrder: Role[] = ["owner", "treasurer", "secretary", "league", "viewer"];

export interface AdminSession {
  id: string;
  email: string;
  fullName: string | null;
  roles: Role[];
  permissions: Set<string>;
}

// The authorization source of truth for pages and actions: a verified JWT
// (getClaims) plus the caller's admin row and permissions, read through RLS.
// Cached per request.
export const getAdmin = cache(async (): Promise<AdminSession | null> => {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) return null;

  const [{ data: me }, { data: perms }] = await Promise.all([
    supabase
      .from("admin_users")
      .select("id, email, full_name, active, admin_user_roles(role)")
      .eq("id", userId)
      .maybeSingle(),
    supabase.rpc("my_permissions"),
  ]);
  if (!me?.active) return null;

  const roles = ((me.admin_user_roles ?? []) as { role: Role }[]).map((r) => r.role);
  return {
    id: me.id,
    email: me.email,
    fullName: me.full_name,
    roles: roleOrder.filter((r) => roles.includes(r)),
    permissions: new Set((perms ?? []) as string[]),
  };
});

// Use at the top of every admin page and Server Action.
export async function requireAdmin(permission = "panel.read"): Promise<AdminSession> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/sin-acceso");
  if (!admin.permissions.has(permission)) redirect("/admin?error=permiso");
  return admin;
}

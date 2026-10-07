import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface PortalMember {
  id: string;
  first_name: string;
  last_name: string;
  joined_on: string;
}

// The members linked to the signed-in user (one, or several sharing a family email).
// The database decides the link (club.portal_member_ids); an empty list means the
// session doesn't belong to any active member.
export const getPortalMembers = cache(async (): Promise<PortalMember[] | null> => {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims?.sub) return null;
  const { data } = await supabase.rpc("portal_me");
  return (data ?? []) as PortalMember[];
});

export async function requireMember(): Promise<PortalMember[]> {
  const members = await getPortalMembers();
  if (!members?.length) redirect("/socio/entrar");
  return members;
}

// Sign-in links must point at our own origin, never one derived from the request.
export async function portalCallbackUrl(host: string | null) {
  const configured = process.env.PORTAL_ORIGIN ?? process.env.ADMIN_ORIGIN;
  if (configured) return `${configured.replace(/\/$/, "")}/socio/auth/callback`;
  if (process.env.NODE_ENV === "production") throw new Error("PORTAL_ORIGIN is not set");
  return `http://${host}/socio/auth/callback`;
}

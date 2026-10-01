import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Landing point for the email link and Google. Exchanges the code for a session,
// claims a pending invitation, and lets in only active admins.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const supabase = await createClient();
  let ok = false;
  if (code) {
    ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  } else if (tokenHash && type) {
    ok = !(await supabase.auth.verifyOtp({ token_hash: tokenHash, type })).error;
  }
  if (!ok) return NextResponse.redirect(`${origin}/admin/login?error=enlace`);

  const { data: isAdmin, error } = await supabase.rpc("claim_invitation");
  if (error) console.error("[admin] claim_invitation failed", error.code);
  if (!isAdmin) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/admin/sin-acceso`);
  }
  return NextResponse.redirect(`${origin}/admin`);
}

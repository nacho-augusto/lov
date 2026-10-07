import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Landing point for the members' email link. Lets in only sessions linked to an
// active member (the database checks email, link proof and no password).
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
  if (!ok) return NextResponse.redirect(`${origin}/socio/entrar?error=enlace`);

  const { data, error } = await supabase.rpc("portal_me");
  if (error) console.error("[portal] portal_me failed", error.code);
  if (!data?.length) {
    await supabase.auth.signOut({ scope: "local" });
    return NextResponse.redirect(`${origin}/socio/entrar?error=sin-ficha`);
  }
  return NextResponse.redirect(`${origin}/socio`);
}

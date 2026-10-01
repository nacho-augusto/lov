import { NextResponse, type NextRequest } from "next/server";
import { getAdmin } from "@/lib/admin/session";
import { createClient } from "@/lib/supabase/server";

// Opens a grant file through a short-lived signed URL (private bucket).
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdmin();
  if (!admin?.permissions.has("grants.read")) return new NextResponse("Sin acceso", { status: 403 });

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse("No encontrado", { status: 404 });

  const supabase = await createClient();
  const { data } = await supabase.from("grant_documents").select("path, file_name").eq("id", id).maybeSingle();
  if (!data) return new NextResponse("No encontrado", { status: 404 });

  const { data: signed } = await supabase.storage.from("club-grants").createSignedUrl(data.path, 60, { download: data.file_name });
  if (!signed?.signedUrl) return new NextResponse("No encontrado", { status: 404 });
  return NextResponse.redirect(signed.signedUrl);
}

import { NextResponse, type NextRequest } from "next/server";
import { getAdmin } from "@/lib/admin/session";
import { createClient } from "@/lib/supabase/server";

// Opens a movement's receipt through a short-lived signed URL (the bucket is private).
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdmin();
  if (!admin?.permissions.has("accounts.read")) return new NextResponse("Sin acceso", { status: 403 });

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse("No encontrado", { status: 404 });

  const supabase = await createClient();
  const { data } = await supabase.from("transactions").select("receipt_path").eq("id", id).maybeSingle();
  if (!data?.receipt_path) return new NextResponse("No encontrado", { status: 404 });

  const { data: signed } = await supabase.storage.from("club-receipts").createSignedUrl(data.receipt_path, 60);
  if (!signed?.signedUrl) return new NextResponse("No encontrado", { status: 404 });
  return NextResponse.redirect(signed.signedUrl);
}

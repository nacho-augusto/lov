"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { date, text } from "@/lib/admin/format";
import { documentKindLabels, isUuid, safeFileName } from "@/lib/admin/extras";
import { requireAdmin } from "@/lib/admin/session";
import { createClient } from "@/lib/supabase/server";

const PATH = "/admin/documentos";
const BUCKET = "club-documents";

function back(param: "ok" | "error", code: string): never {
  revalidatePath("/admin", "layout");
  redirect(`${PATH}?${param}=${code}`);
}

export async function saveDocument(formData: FormData) {
  await requireAdmin("documents.write");
  const id = formData.get("id");
  const name = text(formData, "name");
  const kind = String(formData.get("kind"));
  if (!name) back("error", "nombre");
  const fields = {
    name,
    kind: kind in documentKindLabels ? kind : "other",
    issued_on: date(formData, "issued_on"),
    expires_on: date(formData, "expires_on"),
    notes: text(formData, "notes"),
  };
  const supabase = await createClient();
  const { error } = isUuid(id)
    ? await supabase.from("club_documents").update(fields).eq("id", id)
    : await supabase.from("club_documents").insert(fields);
  if (error) back("error", error.code === "23514" ? "fecha" : "guardar");
  back("ok", "documento");
}

export async function deleteDocument(formData: FormData) {
  await requireAdmin("documents.write");
  const id = formData.get("id");
  if (!isUuid(id)) back("error", "guardar");
  const supabase = await createClient();
  const { data, error } = await supabase.from("club_documents").delete().eq("id", id).select("path");
  if (error || !data?.length) back("error", "guardar");
  if (data[0].path) await supabase.storage.from(BUCKET).remove([data[0].path]);
  back("ok", "documento-borrado");
}

export async function prepareDocumentUpload(documentId: string, fileName: string) {
  await requireAdmin("documents.write");
  if (!isUuid(documentId)) return { error: "guardar" };
  const path = `${documentId}/${crypto.randomUUID()}-${safeFileName(fileName)}`;
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error || !data) return { error: "guardar" };
  return { path, token: data.token };
}

// Sets (or replaces) the file of a document. The old file is removed after the row
// points at the new one.
export async function registerDocumentFile(documentId: string, file: { path: string; fileName: string; size: number }) {
  await requireAdmin("documents.write");
  if (!isUuid(documentId)) return { error: "guardar" };
  // Only paths shaped like the ones prepareDocumentUpload hands out.
  if (!new RegExp(`^${documentId}/[0-9a-f-]{36}-[\\w.-]{1,100}$`, "i").test(file.path)) return { error: "guardar" };

  const supabase = await createClient();
  const { data: current } = await supabase.from("club_documents").select("path").eq("id", documentId).maybeSingle();
  if (!current) return { error: "guardar" };
  const { error } = await supabase
    .from("club_documents")
    .update({
      path: file.path,
      file_name: file.fileName.slice(0, 200),
      size_bytes: Number.isFinite(file.size) ? Math.max(0, Math.round(file.size)) : null,
    })
    .eq("id", documentId);
  if (error) return { error: "guardar" };
  if (current.path && current.path !== file.path) await supabase.storage.from(BUCKET).remove([current.path]);
  revalidatePath(PATH);
  return { ok: true as const };
}

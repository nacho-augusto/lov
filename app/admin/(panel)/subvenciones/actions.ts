"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentSeason, date, text } from "@/lib/admin/format";
import { parseEuros } from "@/lib/admin/money";
import { requireAdmin } from "@/lib/admin/session";
import { createClient } from "@/lib/supabase/server";

const LIST = "/admin/subvenciones";
const STATUSES = ["preparing", "submitted", "awarded", "rejected", "justified"];
const TASK_STATUSES = ["pending", "in_progress", "done", "not_applicable"];
const isUuid = (v: unknown): v is string => typeof v === "string" && /^[0-9a-f-]{36}$/i.test(v);

function back(path: string, param: "ok" | "error", code: string): never {
  revalidatePath(LIST);
  revalidatePath(path);
  redirect(`${path}?${param}=${code}`);
}

function grantFields(formData: FormData) {
  const year = Number(formData.get("year"));
  const url = text(formData, "call_url");
  // Empty → null; anything typed must parse, or the form errors instead of dropping it.
  const optionalEuros = (name: string) => (String(formData.get(name) ?? "").trim() ? parseEuros(formData.get(name)) ?? NaN : null);
  return {
    year: Number.isInteger(year) && year >= 2000 && year <= 2100 ? year : currentSeason(),
    name: text(formData, "name") ?? "",
    awarding_body: text(formData, "awarding_body"),
    call_url: url && /^https?:\/\//i.test(url) ? url : null,
    requested_cents: optionalEuros("requested"),
    awarded_cents: optionalEuros("awarded"),
    application_deadline: date(formData, "application_deadline"),
    justification_deadline: date(formData, "justification_deadline"),
    notes: text(formData, "notes"),
  };
}

// One requirement per non-empty line; leading bullets/numbers are stripped.
function lines(formData: FormData, name: string) {
  return String(formData.get(name) ?? "")
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*(?:[-*•·]|\d+[.)])\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 100);
}

export async function createGrant(formData: FormData) {
  await requireAdmin("grants.write");
  const fields = grantFields(formData);
  if (!fields.name) back(`${LIST}/nueva`, "error", "nombre");
  if (Number.isNaN(fields.requested_cents) || Number.isNaN(fields.awarded_cents)) back(`${LIST}/nueva`, "error", "importe");

  const supabase = await createClient();
  const { data, error } = await supabase.from("grants").insert(fields).select("id").single();
  if (error || !data) back(`${LIST}/nueva`, "error", "guardar");

  const reqs = lines(formData, "requirements");
  if (reqs.length) {
    await supabase.from("grant_requirements").insert(reqs.map((description, i) => ({ grant_id: data.id, description, sort: i })));
  }
  back(`${LIST}/${data.id}`, "ok", "creada");
}

export async function updateGrant(formData: FormData) {
  await requireAdmin("grants.write");
  const id = formData.get("id");
  if (!isUuid(id)) back(LIST, "error", "guardar");
  const fields = grantFields(formData);
  if (!fields.name) back(`${LIST}/${id}`, "error", "nombre");
  if (Number.isNaN(fields.requested_cents) || Number.isNaN(fields.awarded_cents)) back(`${LIST}/${id}`, "error", "importe");
  const status = String(formData.get("status"));

  const supabase = await createClient();
  const { error } = await supabase
    .from("grants")
    .update({ ...fields, status: STATUSES.includes(status) ? status : "preparing" })
    .eq("id", id);
  if (error) back(`${LIST}/${id}`, "error", "guardar");
  back(`${LIST}/${id}`, "ok", "guardada");
}

export async function addRequirements(formData: FormData) {
  await requireAdmin("grants.write");
  const grantId = formData.get("grant_id");
  if (!isUuid(grantId)) back(LIST, "error", "guardar");
  const reqs = lines(formData, "requirements");
  if (!reqs.length) back(`${LIST}/${grantId}`, "error", "sin-documentos");

  const supabase = await createClient();
  const { data: last } = await supabase.from("grant_requirements").select("sort").eq("grant_id", grantId).order("sort", { ascending: false }).limit(1).maybeSingle();
  const start = (last?.sort ?? -1) + 1;
  const { error } = await supabase
    .from("grant_requirements")
    .insert(reqs.map((description, i) => ({ grant_id: grantId, description, sort: start + i })));
  if (error) back(`${LIST}/${grantId}`, "error", "guardar");
  back(`${LIST}/${grantId}`, "ok", "documentos");
}

export async function setGrantRequirementStatus(formData: FormData) {
  await requireAdmin("grants.write");
  const grantId = formData.get("grant_id");
  const id = formData.get("id");
  const status = String(formData.get("status"));
  if (!isUuid(grantId) || !isUuid(id) || !TASK_STATUSES.includes(status)) back(LIST, "error", "guardar");

  const supabase = await createClient();
  const { error } = await supabase.from("grant_requirements").update({ status }).eq("id", id).eq("grant_id", grantId);
  if (error) back(`${LIST}/${grantId}`, "error", "guardar");
  back(`${LIST}/${grantId}`, "ok", "estado");
}

export async function deleteGrantRequirement(formData: FormData) {
  await requireAdmin("grants.write");
  const grantId = formData.get("grant_id");
  const id = formData.get("id");
  if (!isUuid(grantId) || !isUuid(id)) back(LIST, "error", "guardar");
  const supabase = await createClient();
  const { error } = await supabase.from("grant_requirements").delete().eq("id", id).eq("grant_id", grantId);
  if (error) back(`${LIST}/${grantId}`, "error", "guardar");
  back(`${LIST}/${grantId}`, "ok", "documento-quitado");
}

// ---- Files: the browser uploads straight to Storage with a signed URL ----------

export async function prepareGrantUpload(grantId: string, fileName: string) {
  await requireAdmin("grants.write");
  if (!isUuid(grantId)) return { error: "guardar" as const };
  const safeName = fileName.normalize("NFKD").replace(/[^\w.-]+/g, "_").slice(-100) || "archivo";
  const path = `${grantId}/${crypto.randomUUID()}-${safeName}`;
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from("club-grants").createSignedUploadUrl(path);
  if (error || !data) return { error: "guardar" as const };
  return { path, token: data.token };
}

export async function registerGrantDocument(input: { grantId: string; requirementId: string | null; path: string; fileName: string; size: number }) {
  await requireAdmin("grants.write");
  const { grantId, requirementId, path, fileName, size } = input;
  // Only paths shaped like the ones prepareGrantUpload hands out.
  if (!isUuid(grantId) || (requirementId !== null && !isUuid(requirementId))) return { error: "guardar" };
  const pathOk = new RegExp(`^${grantId}/[0-9a-f-]{36}-[\\w.-]{1,100}$`, "i").test(path);
  if (!pathOk) {
    return { error: "guardar" };
  }
  const supabase = await createClient();
  if (requirementId) {
    const { data: req } = await supabase.from("grant_requirements").select("id").eq("id", requirementId).eq("grant_id", grantId).maybeSingle();
    if (!req) return { error: "guardar" };
  }
  const { error } = await supabase.from("grant_documents").insert({
    grant_id: grantId,
    requirement_id: requirementId,
    path,
    file_name: fileName.slice(0, 200),
    size_bytes: Number.isFinite(size) ? Math.max(0, Math.round(size)) : null,
  });
  // On failure nothing is deleted: the path may belong to another document.
  if (error) return { error: "guardar" };
  revalidatePath(`${LIST}/${grantId}`);
  return { ok: true };
}

export async function deleteGrantDocument(formData: FormData) {
  await requireAdmin("grants.write");
  const grantId = formData.get("grant_id");
  const id = formData.get("id");
  if (!isUuid(grantId) || !isUuid(id)) back(LIST, "error", "guardar");
  const supabase = await createClient();
  const { data, error } = await supabase.from("grant_documents").delete().eq("id", id).eq("grant_id", grantId).select("path");
  if (error || !data?.length) back(`${LIST}/${grantId}`, "error", "guardar");
  await supabase.storage.from("club-grants").remove([data[0].path]);
  back(`${LIST}/${grantId}`, "ok", "archivo-borrado");
}

// ---- Justification: expenses linked to the grant -----------------------------

export async function linkExpense(formData: FormData) {
  await requireAdmin("grants.write");
  const grantId = formData.get("grant_id");
  const txId = formData.get("transaction_id");
  const unlink = formData.get("unlink") === "true";
  if (!isUuid(grantId) || !isUuid(txId)) back(LIST, "error", "guardar");
  const supabase = await createClient();
  const { error } = await supabase.rpc("link_expense_to_grant", { p_transaction: txId, p_grant: unlink ? null : grantId });
  if (error) back(`${LIST}/${grantId}`, "error", "guardar");
  back(`${LIST}/${grantId}`, "ok", unlink ? "gasto-desvinculado" : "gasto-vinculado");
}

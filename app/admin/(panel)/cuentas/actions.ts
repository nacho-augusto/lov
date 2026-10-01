"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { date, text, todayISO } from "@/lib/admin/format";
import { parseEuros } from "@/lib/admin/money";
import { requireAdmin } from "@/lib/admin/session";
import { createClient } from "@/lib/supabase/server";

const PAGE = "/admin/cuentas";
const RECEIPT_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic"];
const MAX_RECEIPT = 4 * 1024 * 1024; // keep under the platform request body limit

function back(formData: FormData, param: "ok" | "error", code: string): never {
  const year = String(formData.get("year") ?? "");
  revalidatePath(PAGE);
  redirect(`${PAGE}?${/^\d{4}$/.test(year) ? `ano=${year}&` : ""}${param}=${code}`);
}

const isUuid = (v: unknown) => typeof v === "string" && /^[0-9a-f-]{36}$/i.test(v);

export async function addTransaction(formData: FormData) {
  await requireAdmin("accounts.write");
  const kind = String(formData.get("kind"));
  const amount = parseEuros(formData.get("amount"));
  const categoryId = formData.get("category_id");
  const description = text(formData, "description");
  if (kind !== "income" && kind !== "expense") back(formData, "error", "guardar");
  if (!amount) back(formData, "error", "importe");
  if (!isUuid(categoryId)) back(formData, "error", "categoria");
  if (!description) back(formData, "error", "descripcion");

  const supabase = await createClient();
  const occurredOn = date(formData, "occurred_on") ?? todayISO();

  let receiptPath: string | null = null;
  const file = formData.get("receipt");
  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_RECEIPT || !RECEIPT_TYPES.includes(file.type)) back(formData, "error", "archivo");
    const safeName = file.name.normalize("NFKD").replace(/[^\w.-]+/g, "_").slice(-80);
    receiptPath = `${occurredOn.slice(0, 4)}/${crypto.randomUUID()}-${safeName}`;
    const { error: upError } = await supabase.storage.from("club-receipts").upload(receiptPath, file, { contentType: file.type });
    if (upError) back(formData, "error", "archivo");
  }

  const { error } = await supabase.from("transactions").insert({
    kind,
    amount_cents: amount,
    category_id: categoryId,
    description,
    counterparty: text(formData, "counterparty"),
    occurred_on: occurredOn,
    receipt_path: receiptPath,
  });
  if (error) {
    if (receiptPath) await supabase.storage.from("club-receipts").remove([receiptPath]);
    back(formData, "error", error.code === "23514" ? "categoria" : "guardar");
  }
  back(formData, "ok", "movimiento");
}

// Only manual movements; RLS refuses the ones booked from member payments.
export async function deleteTransaction(formData: FormData) {
  await requireAdmin("accounts.write");
  const id = formData.get("id");
  if (!isUuid(id)) back(formData, "error", "guardar");
  const supabase = await createClient();
  const { data, error } = await supabase.from("transactions").delete().eq("id", id).is("payment_id", null).select("receipt_path");
  if (error || !data?.length) back(formData, "error", "guardar");
  const path = data[0].receipt_path;
  if (path) await supabase.storage.from("club-receipts").remove([path]);
  back(formData, "ok", "movimiento-borrado");
}

export async function saveBudget(formData: FormData) {
  await requireAdmin("accounts.write");
  const year = Number(formData.get("year"));
  if (!Number.isInteger(year) || year < 2000 || year > 2100) back(formData, "error", "guardar");

  const supabase = await createClient();
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("budget_")) continue;
    const categoryId = key.slice("budget_".length);
    if (!isUuid(categoryId)) continue;
    const raw = String(value).trim();
    if (raw === "") {
      await supabase.from("budgets").delete().eq("year", year).eq("category_id", categoryId);
      continue;
    }
    const cents = raw === "0" ? 0 : parseEuros(raw);
    if (cents === null) back(formData, "error", "importe");
    const { data: existing } = await supabase.from("budgets").select("year").eq("year", year).eq("category_id", categoryId).maybeSingle();
    const { error } = existing
      ? await supabase.from("budgets").update({ amount_cents: cents }).eq("year", year).eq("category_id", categoryId)
      : await supabase.from("budgets").insert({ year, category_id: categoryId, amount_cents: cents });
    if (error) back(formData, "error", "guardar");
  }
  back(formData, "ok", "presupuesto");
}

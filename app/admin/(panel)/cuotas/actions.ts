"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { date, text, todayISO } from "@/lib/admin/format";
import { methodLabels, parseEuros, periodicityLabels } from "@/lib/admin/money";
import { requireAdmin } from "@/lib/admin/session";
import { createClient } from "@/lib/supabase/server";

// Every action returns to the page it came from (a same-site path only).
function back(formData: FormData, param: "ok" | "error", code: string): never {
  const raw = String(formData.get("return_to") ?? "/admin/cuotas");
  const path = raw.startsWith("/admin/") && !raw.startsWith("//") ? raw.split("?")[0] : "/admin/cuotas";
  revalidatePath("/admin", "layout");
  redirect(`${path}?${param}=${code}`);
}

const isUuid = (v: unknown) => typeof v === "string" && /^[0-9a-f-]{36}$/i.test(v);

// ---- Fee types ------------------------------------------------------------

export async function saveFeeType(formData: FormData) {
  await requireAdmin("fees.write");
  const id = formData.get("id");
  const name = text(formData, "name");
  const amount = parseEuros(formData.get("amount"));
  const periodicity = String(formData.get("periodicity"));
  const categoryId = formData.get("category_id");
  if (!name) back(formData, "error", "nombre");
  if (!amount) back(formData, "error", "importe");
  if (!(periodicity in periodicityLabels)) back(formData, "error", "periodicidad");

  const fields = {
    name,
    default_amount_cents: amount,
    periodicity,
    category_id: isUuid(categoryId) ? categoryId : null,
  };
  const supabase = await createClient();
  const { error } = isUuid(id)
    ? await supabase.from("fee_types").update({ ...fields, active: formData.get("active") !== "false" }).eq("id", id)
    : await supabase.from("fee_types").insert(fields);
  if (error) back(formData, "error", error.code === "23505" ? "nombre-repetido" : "guardar");
  back(formData, "ok", "tipo");
}

// Assigns a fee type to every active member who doesn't have it yet.
export async function assignFeeToAll(formData: FormData) {
  await requireAdmin("fees.write");
  const feeTypeId = formData.get("fee_type_id");
  if (!isUuid(feeTypeId)) back(formData, "error", "guardar");
  const startsOn = date(formData, "starts_on") ?? todayISO();

  const supabase = await createClient();
  const [{ data: members }, { data: existing }] = await Promise.all([
    supabase.from("members").select("id").eq("active", true),
    supabase.from("member_fees").select("member_id").eq("fee_type_id", feeTypeId),
  ]);
  const have = new Set((existing ?? []).map((r) => r.member_id));
  const rows = (members ?? []).filter((m) => !have.has(m.id)).map((m) => ({ member_id: m.id, fee_type_id: feeTypeId, starts_on: startsOn }));
  if (rows.length) {
    const { error } = await supabase.from("member_fees").insert(rows);
    if (error) back(formData, "error", "guardar");
  }
  back(formData, "ok", `asignados-${rows.length}`);
}

// ---- Member assignments ---------------------------------------------------

export async function addMemberFee(formData: FormData) {
  await requireAdmin("fees.write");
  const memberId = formData.get("member_id");
  const feeTypeId = formData.get("fee_type_id");
  if (!isUuid(memberId) || !isUuid(feeTypeId)) back(formData, "error", "guardar");
  const override = String(formData.get("amount") ?? "").trim() ? parseEuros(formData.get("amount")) : null;
  if (String(formData.get("amount") ?? "").trim() && !override) back(formData, "error", "importe");

  const supabase = await createClient();
  const { error } = await supabase.from("member_fees").insert({
    member_id: memberId,
    fee_type_id: feeTypeId,
    starts_on: date(formData, "starts_on") ?? todayISO(),
    amount_cents_override: override,
  });
  if (error) back(formData, "error", error.code === "23505" ? "ya-asignada" : "guardar");
  back(formData, "ok", "asignada");
}

export async function endMemberFee(formData: FormData) {
  await requireAdmin("fees.write");
  const id = formData.get("id");
  if (!isUuid(id)) back(formData, "error", "guardar");
  const supabase = await createClient();
  const { error } = await supabase.from("member_fees").update({ ends_on: todayISO() }).eq("id", id);
  if (error) back(formData, "error", error.code === "23514" ? "fecha" : "guardar");
  back(formData, "ok", "finalizada");
}

// ---- Charges --------------------------------------------------------------

export async function generateCharges(formData: FormData) {
  await requireAdmin("fees.write");
  const feeTypeId = formData.get("fee_type_id");
  const start = date(formData, "period_start");
  const due = date(formData, "due_on");
  if (!isUuid(feeTypeId) || !start || !due) back(formData, "error", "generar-datos");

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("generate_charges", {
    p_fee_type: feeTypeId,
    p_period_start: start,
    p_due_on: due,
  });
  if (error) back(formData, "error", "guardar");
  back(formData, "ok", `generados-${data ?? 0}`);
}

export async function createCharge(formData: FormData) {
  await requireAdmin("fees.write");
  const memberId = formData.get("member_id");
  const concept = text(formData, "concept");
  const amount = parseEuros(formData.get("amount"));
  const due = date(formData, "due_on") ?? todayISO();
  if (!isUuid(memberId)) back(formData, "error", "miembro");
  if (!concept) back(formData, "error", "concepto");
  if (!amount) back(formData, "error", "importe");

  const supabase = await createClient();
  const { error } = await supabase.from("charges").insert({ member_id: memberId, concept, amount_cents: amount, due_on: due });
  if (error) back(formData, "error", "guardar");
  back(formData, "ok", "cargo");
}

export async function recordPayment(formData: FormData) {
  await requireAdmin("fees.write");
  const chargeId = formData.get("charge_id");
  const amount = parseEuros(formData.get("amount"));
  const method = String(formData.get("method"));
  if (!isUuid(chargeId)) back(formData, "error", "guardar");
  if (!amount) back(formData, "error", "importe");
  if (!(method in methodLabels)) back(formData, "error", "guardar");

  const supabase = await createClient();
  const { error } = await supabase.from("payments").insert({
    charge_id: chargeId,
    amount_cents: amount,
    paid_on: date(formData, "paid_on") ?? todayISO(),
    method,
    notes: text(formData, "notes"),
  });
  if (error) back(formData, "error", error.code === "23514" ? "pago-excede" : "guardar");
  back(formData, "ok", "pago");
}

export async function deletePayment(formData: FormData) {
  await requireAdmin("fees.write");
  const id = formData.get("id");
  if (!isUuid(id)) back(formData, "error", "guardar");
  const supabase = await createClient();
  const { error } = await supabase.from("payments").delete().eq("id", id);
  if (error) back(formData, "error", "guardar");
  back(formData, "ok", "pago-borrado");
}

export async function setChargeWaived(formData: FormData) {
  await requireAdmin("fees.write");
  const id = formData.get("id");
  if (!isUuid(id)) back(formData, "error", "guardar");
  const waived = formData.get("waived") === "true";
  const supabase = await createClient();
  const { error } = await supabase.from("charges").update({ waived }).eq("id", id);
  if (error) back(formData, "error", "guardar");
  back(formData, "ok", waived ? "condonado" : "restaurado");
}

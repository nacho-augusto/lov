"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { date, text, todayISO } from "@/lib/admin/format";
import { isUuid } from "@/lib/admin/extras";
import { requireAdmin } from "@/lib/admin/session";
import { createClient } from "@/lib/supabase/server";

const PATH = "/admin/material";

function back(param: "ok" | "error", code: string): never {
  revalidatePath(PATH);
  redirect(`${PATH}?${param}=${code}`);
}

export async function saveGearItem(formData: FormData) {
  await requireAdmin("gear.write");
  const id = formData.get("id");
  const name = text(formData, "name");
  if (!name) back("error", "nombre");
  const fields = { name, code: text(formData, "code")?.toUpperCase() ?? null, notes: text(formData, "notes") };
  const supabase = await createClient();
  const { error } = isUuid(id)
    ? await supabase.from("gear_items").update({ ...fields, active: formData.get("active") !== "false" }).eq("id", id)
    : await supabase.from("gear_items").insert(fields);
  if (error) back("error", error.code === "23505" ? "codigo-repetido" : "guardar");
  back("ok", "material");
}

export async function lendGear(formData: FormData) {
  await requireAdmin("gear.write");
  const itemId = formData.get("item_id");
  const memberId = formData.get("member_id");
  if (!isUuid(itemId)) back("error", "guardar");
  if (!isUuid(memberId)) back("error", "miembro");
  const supabase = await createClient();
  const { error } = await supabase.from("gear_loans").insert({
    item_id: itemId,
    member_id: memberId,
    out_on: date(formData, "out_on") ?? todayISO(),
    notes: text(formData, "notes"),
  });
  if (error) back("error", error.code === "23505" ? "ya-prestado" : "guardar");
  back("ok", "prestado");
}

export async function returnGear(formData: FormData) {
  await requireAdmin("gear.write");
  const id = formData.get("id");
  if (!isUuid(id)) back("error", "guardar");
  const supabase = await createClient();
  const { error } = await supabase.from("gear_loans").update({ returned_on: todayISO() }).eq("id", id).is("returned_on", null);
  if (error) back("error", error.code === "23514" ? "fecha" : "guardar");
  back("ok", "devuelto");
}

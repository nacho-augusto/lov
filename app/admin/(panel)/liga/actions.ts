"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isMonthKey, monthDate } from "@/lib/admin/league";
import { requireAdmin } from "@/lib/admin/session";
import { createClient } from "@/lib/supabase/server";

// km with an optional decimal (comma or dot) → metres; "" → null; invalid → NaN.
function km(v: FormDataEntryValue | null) {
  const s = String(v ?? "").trim().replace(",", ".");
  if (!s) return null;
  return /^\d{1,4}(\.\d{1,2})?$/.test(s) ? Math.round(Number(s) * 1000) : NaN;
}
function metres(v: FormDataEntryValue | null) {
  const s = String(v ?? "").trim().replace(/\./g, "");
  if (!s) return null;
  return /^\d{1,6}$/.test(s) ? Number(s) : NaN;
}

// Saves the whole month grid: one row per member; both fields empty removes the entry.
export async function saveMonth(formData: FormData) {
  await requireAdmin("league.write");
  const mes = String(formData.get("month"));
  if (!isMonthKey(mes)) redirect("/admin/liga/apuntar?error=mes");
  const page = `/admin/liga/apuntar?mes=${mes}`;

  const memberIds = formData.getAll("member_id").map(String).filter((id) => /^[0-9a-f-]{36}$/i.test(id));
  const rows = memberIds.map((id) => ({ id, distance: km(formData.get(`km_${id}`)), gain: metres(formData.get(`gain_${id}`)) }));
  if (rows.some((r) => Number.isNaN(r.distance) || Number.isNaN(r.gain))) redirect(`${page}&error=valores`);

  const supabase = await createClient();
  const month = monthDate(mes);
  const { data: existing } = await supabase.from("league_entries").select("id, member_id").eq("month", month).in("member_id", memberIds);
  const byMember = new Map((existing ?? []).map((e) => [e.member_id, e.id]));

  const toInsert = [];
  for (const r of rows) {
    const entryId = byMember.get(r.id);
    if (r.distance === null && r.gain === null) {
      if (entryId) await supabase.from("league_entries").delete().eq("id", entryId);
      continue;
    }
    const values = { distance_m: r.distance ?? 0, elevation_gain_m: r.gain ?? 0 };
    if (entryId) {
      const { error } = await supabase.from("league_entries").update(values).eq("id", entryId);
      if (error) redirect(`${page}&error=guardar`);
    } else {
      toInsert.push({ member_id: r.id, month, ...values });
    }
  }
  if (toInsert.length) {
    const { error } = await supabase.from("league_entries").insert(toInsert);
    if (error) redirect(`${page}&error=guardar`);
  }
  revalidatePath("/admin/liga");
  redirect(`/admin/liga?hasta=${mes}&ok=guardado`);
}

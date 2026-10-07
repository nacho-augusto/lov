"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentSeason, date, text, todayISO } from "@/lib/admin/format";
import { requireAdmin } from "@/lib/admin/session";
import { createClient } from "@/lib/supabase/server";

const LIST = "/admin/miembros";

function done(path: string, param: "ok" | "error", code: string): never {
  revalidatePath(LIST);
  revalidatePath(path);
  redirect(`${path}?${param}=${code}`);
}

function memberFields(formData: FormData) {
  return {
    first_name: text(formData, "first_name") ?? "",
    last_name: text(formData, "last_name") ?? "",
    email: text(formData, "email")?.toLowerCase() ?? null,
    phone: text(formData, "phone"),
    birth_date: date(formData, "birth_date"),
    emergency_name: text(formData, "emergency_name"),
    emergency_phone: text(formData, "emergency_phone"),
    joined_on: date(formData, "joined_on") ?? todayISO(),
    data_consent_on: date(formData, "data_consent_on"),
    image_consent: formData.get("image_consent") === "on",
    no_auto_reminders: formData.get("no_auto_reminders") === "on",
    notes: text(formData, "notes"),
  };
}

function privateFields(formData: FormData) {
  return {
    national_id: text(formData, "national_id")?.toUpperCase() ?? null,
    health_notes: text(formData, "health_notes"),
  };
}

export async function createMember(formData: FormData) {
  const me = await requireAdmin("members.write");
  const fields = memberFields(formData);
  if (!fields.first_name) done("/admin/miembros/nuevo", "error", "nombre");

  const supabase = await createClient();
  const { data, error } = await supabase.from("members").insert(fields).select("id").single();
  if (error || !data) done("/admin/miembros/nuevo", "error", error?.code === "23514" ? "datos" : "guardar");

  if (me.permissions.has("members.sensitive")) {
    const priv = privateFields(formData);
    if (priv.national_id || priv.health_notes) {
      await supabase.from("member_private").insert({ member_id: data.id, ...priv });
    }
  }
  done(`/admin/miembros/${data.id}`, "ok", "alta");
}

export async function updateMember(formData: FormData) {
  const me = await requireAdmin("members.write");
  const id = String(formData.get("id"));
  const path = `/admin/miembros/${id}`;
  const fields = memberFields(formData);
  if (!fields.first_name) done(path, "error", "nombre");

  const supabase = await createClient();
  const { error } = await supabase.from("members").update(fields).eq("id", id);
  if (error) done(path, "error", error.code === "23514" ? "datos" : "guardar");

  if (me.permissions.has("members.sensitive")) {
    // Insert or update by hand: member_id is not updatable (no upsert).
    const priv = privateFields(formData);
    const { data: existing } = await supabase.from("member_private").select("member_id").eq("member_id", id).maybeSingle();
    const { error: privError } = existing
      ? await supabase.from("member_private").update(priv).eq("member_id", id)
      : priv.national_id || priv.health_notes
        ? await supabase.from("member_private").insert({ member_id: id, ...priv })
        : { error: null };
    if (privError) done(path, "error", "guardar");
  }
  done(path, "ok", "guardado");
}

// Baja / reactivación. Leaving never deletes: history stays.
export async function setMemberLeft(formData: FormData) {
  await requireAdmin("members.write");
  const id = String(formData.get("id"));
  const path = `/admin/miembros/${id}`;
  const leaving = formData.get("leave") === "true";
  const leftOn = leaving ? date(formData, "left_on") ?? todayISO() : null;

  const supabase = await createClient();
  const { error } = await supabase.from("members").update({ left_on: leftOn }).eq("id", id);
  if (error) done(path, "error", error.code === "23514" ? "fecha-baja" : "guardar");
  // Back in: make sure this season's yearly items exist (idempotent).
  if (!leaving) await supabase.rpc("open_season", { p_season: currentSeason() });
  done(path, "ok", leaving ? "baja" : "reactivado");
}

export async function setRequirementStatus(formData: FormData) {
  await requireAdmin("members.write");
  const memberId = String(formData.get("member_id"));
  const status = String(formData.get("status"));
  if (!["pending", "done", "not_applicable"].includes(status)) done(`/admin/miembros/${memberId}`, "error", "guardar");

  const supabase = await createClient();
  const { error } = await supabase
    .from("member_requirements")
    .update({ status, done_on: status === "done" ? todayISO() : null })
    .eq("id", String(formData.get("id")))
    .eq("member_id", memberId);
  if (error) done(`/admin/miembros/${memberId}`, "error", "guardar");
  done(`/admin/miembros/${memberId}`, "ok", "tramite");
}

export async function saveLicence(formData: FormData) {
  await requireAdmin("members.write");
  const memberId = String(formData.get("member_id"));
  const path = `/admin/miembros/${memberId}`;
  const season = Number(formData.get("season"));
  if (!Number.isInteger(season) || season < 2000 || season > 2100) done(path, "error", "temporada");

  const details = {
    federation: text(formData, "federation") ?? "FAM",
    modality: text(formData, "modality"),
    licence_number: text(formData, "licence_number"),
    valid_until: date(formData, "valid_until"),
  };
  const supabase = await createClient();
  // Insert or update by hand: member and season are immutable once recorded.
  const { data: existing } = await supabase
    .from("federation_licences")
    .select("id")
    .eq("member_id", memberId)
    .eq("season", season)
    .maybeSingle();
  const { error } = existing
    ? await supabase.from("federation_licences").update(details).eq("id", existing.id)
    : await supabase.from("federation_licences").insert({ member_id: memberId, season, ...details });
  if (error) done(path, "error", "guardar");
  done(path, "ok", "licencia");
}

export async function openSeason(formData: FormData) {
  await requireAdmin("members.write");
  const season = Number(formData.get("season"));
  if (!Number.isInteger(season) || season < 2000 || season > 2100) done(LIST, "error", "temporada");

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("open_season", { p_season: season });
  if (error) done(LIST, "error", "guardar");
  done(LIST, "ok", `temporada-${season}-${data ?? 0}`);
}

// GDPR erasure for a former member: personal data goes, accounting stays.
export async function anonymiseMember(formData: FormData) {
  await requireAdmin("members.sensitive");
  const id = String(formData.get("id"));
  if (!/^[0-9a-f-]{36}$/i.test(id)) done(LIST, "error", "guardar");
  const path = `/admin/miembros/${id}`;
  if (formData.get("confirm") !== "on") done(path, "error", "confirmar");

  const supabase = await createClient();
  const { error } = await supabase.rpc("anonymise_member", { p_member: id });
  if (error) done(path, "error", error.code === "23514" ? (error.message.includes("pendientes") ? "anonimizar-deuda" : "anonimizar-activo") : "guardar");
  done(path, "ok", "anonimizado");
}

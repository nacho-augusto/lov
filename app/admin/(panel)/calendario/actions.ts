"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { date, text } from "@/lib/admin/format";
import { eventKindLabels, isUuid } from "@/lib/admin/extras";
import { requireAdmin } from "@/lib/admin/session";
import { createClient } from "@/lib/supabase/server";

const LIST = "/admin/calendario";

function back(path: string, param: "ok" | "error", code: string): never {
  revalidatePath("/admin", "layout");
  redirect(`${path}?${param}=${code}`);
}

function eventFields(formData: FormData, path: string) {
  const title = text(formData, "title");
  const startsOn = date(formData, "starts_on");
  if (!title) back(path, "error", "titulo");
  if (!startsOn) back(path, "error", "fecha");
  const time = text(formData, "start_time");
  const capacityRaw = text(formData, "capacity");
  const capacity = capacityRaw ? Number(capacityRaw) : null;
  if (capacity !== null && (!Number.isInteger(capacity) || capacity < 1 || capacity > 10000)) back(path, "error", "plazas");
  const kind = String(formData.get("kind"));
  return {
    title,
    kind: kind in eventKindLabels ? kind : "outing",
    starts_on: startsOn,
    start_time: time && /^\d{2}:\d{2}$/.test(time) ? time : null,
    ends_on: date(formData, "ends_on"),
    location: text(formData, "location"),
    description: text(formData, "description"),
    capacity,
    signup_deadline: date(formData, "signup_deadline"),
  };
}

export async function saveEvent(formData: FormData) {
  await requireAdmin("events.write");
  const id = formData.get("id");
  const path = isUuid(id) ? `${LIST}/${id}` : LIST;
  const fields = eventFields(formData, path);
  const supabase = await createClient();
  if (isUuid(id)) {
    const { error } = await supabase.from("events").update(fields).eq("id", id);
    if (error) back(path, "error", error.code === "23514" ? "fecha" : "guardar");
    back(path, "ok", "actividad");
  }
  const { data, error } = await supabase.from("events").insert(fields).select("id").single();
  if (error || !data) back(LIST, "error", error?.code === "23514" ? "fecha" : "guardar");
  back(`${LIST}/${data.id}`, "ok", "actividad");
}

export async function setEventCancelled(formData: FormData) {
  await requireAdmin("events.write");
  const id = formData.get("id");
  if (!isUuid(id)) back(LIST, "error", "guardar");
  const cancelled = formData.get("cancelled") === "true";
  const supabase = await createClient();
  const { error } = await supabase.from("events").update({ cancelled }).eq("id", id);
  if (error) back(`${LIST}/${id}`, "error", "guardar");
  back(`${LIST}/${id}`, "ok", cancelled ? "cancelada" : "reactivada");
}

export async function addSignup(formData: FormData) {
  await requireAdmin("events.write");
  const eventId = formData.get("event_id");
  const memberId = formData.get("member_id");
  if (!isUuid(eventId)) back(LIST, "error", "guardar");
  const path = `${LIST}/${eventId}`;
  if (!isUuid(memberId)) back(path, "error", "miembro");
  const supabase = await createClient();
  const { error } = await supabase.from("event_signups").insert({ event_id: eventId, member_id: memberId, notes: text(formData, "notes") });
  if (error) back(path, "error", error.code === "23505" ? "ya-apuntado" : error.code === "23514" ? "sin-plazas" : "guardar");
  back(path, "ok", "apuntado");
}

export async function removeSignup(formData: FormData) {
  await requireAdmin("events.write");
  const eventId = formData.get("event_id");
  const id = formData.get("id");
  if (!isUuid(eventId) || !isUuid(id)) back(LIST, "error", "guardar");
  const supabase = await createClient();
  const { error } = await supabase.from("event_signups").delete().eq("id", id).eq("event_id", eventId);
  if (error) back(`${LIST}/${eventId}`, "error", "guardar");
  back(`${LIST}/${eventId}`, "ok", "desapuntado");
}

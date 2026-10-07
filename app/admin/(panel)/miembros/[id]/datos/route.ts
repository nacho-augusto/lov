import { NextResponse, type NextRequest } from "next/server";
import { getAdmin } from "@/lib/admin/session";
import { createClient } from "@/lib/supabase/server";

// GDPR access request: everything the club holds about one member, as JSON.
// Needs members.sensitive (it includes ID and health notes) and reads through RLS.
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdmin();
  if (!admin?.permissions.has("members.sensitive")) return new NextResponse("Sin acceso", { status: 403 });

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse("No encontrado", { status: 404 });

  const supabase = await createClient();
  const canFees = admin.permissions.has("fees.read");
  const empty = Promise.resolve({ data: [] });
  const [member, priv, requirements, licences, fees, charges, league, emails, signups, loans] = await Promise.all([
    supabase
      .from("members")
      .select("first_name, last_name, email, phone, birth_date, emergency_name, emergency_phone, joined_on, left_on, data_consent_on, image_consent, no_auto_reminders, notes, created_at")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("member_private").select("national_id, health_notes").eq("member_id", id).maybeSingle(),
    supabase.from("member_requirements").select("season, status, done_on, notes, requirement_templates(name)").eq("member_id", id),
    supabase.from("federation_licences").select("season, federation, modality, licence_number, valid_until, notes").eq("member_id", id),
    canFees ? supabase.from("member_fees").select("starts_on, ends_on, amount_cents_override, fee_types(name)").eq("member_id", id) : empty,
    canFees
      ? supabase.from("charges").select("concept, amount_cents, due_on, waived, payments(amount_cents, paid_on, method, notes)").eq("member_id", id)
      : empty,
    admin.permissions.has("league.read")
      ? supabase.from("league_entries").select("month, distance_m, elevation_gain_m").eq("member_id", id).order("month")
      : empty,
    admin.permissions.has("comms.read")
      ? // jsonb containment: postgrest-js serialises arrays as Postgres arrays, so pass JSON text.
        supabase.from("email_messages").select("subject, sent_at").contains("recipients", JSON.stringify([{ member_id: id }])).order("sent_at")
      : empty,
    admin.permissions.has("events.read")
      ? supabase.from("event_signups").select("notes, created_at, events(title, starts_on)").eq("member_id", id)
      : empty,
    admin.permissions.has("gear.read")
      ? supabase.from("gear_loans").select("out_on, returned_on, notes, gear_items(name, code)").eq("member_id", id)
      : empty,
  ]);
  if (member.error) return new NextResponse("Error", { status: 500 });
  if (!member.data) return new NextResponse("No encontrado", { status: 404 });
  // A partial export would look complete: fail instead.
  if ([priv, requirements, licences, fees, charges, league, emails, signups, loans].some((r) => "error" in r && r.error)) {
    return new NextResponse("Error", { status: 500 });
  }

  const body = {
    generado: new Date().toISOString(),
    club: "C.D. La Otra Vertiente",
    ficha: member.data,
    datos_sensibles: priv.data ?? null,
    tramites: requirements.data ?? [],
    licencias: licences.data ?? [],
    cuotas_asignadas: fees.data ?? [],
    cargos_y_pagos: charges.data ?? [],
    liga: league.data ?? [],
    correos_recibidos: emails.data ?? [],
    actividades: signups.data ?? [],
    material_prestado: loans.data ?? [],
  };
  const slug = `${member.data.first_name}-${member.data.last_name}`
    .normalize("NFD")
    .replace(/[^\w-]+/g, "")
    .toLowerCase();

  return new NextResponse(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="datos-${slug || "miembro"}.json"`,
      "Cache-Control": "private, no-store",
    },
  });
}

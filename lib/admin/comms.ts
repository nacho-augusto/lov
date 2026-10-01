import "server-only";
import { currentSeason, fullName, todayISO } from "@/lib/admin/format";
import { eur } from "@/lib/admin/money";
import type { createClient } from "@/lib/supabase/server";

export type Audience = "active" | "overdue" | "no_licence" | "single";

export const audienceLabels: Record<Audience, string> = {
  active: "Todos los miembros en activo",
  overdue: "Quien tiene cuotas vencidas",
  no_licence: "Quien no tiene licencia de la temporada",
  single: "Un miembro concreto",
};

export interface Recipient {
  memberId: string;
  name: string;
  email: string | null;
  vars: Record<string, string>;
}

// Licences renew in November–December for the next calendar year.
export function licenceSeason() {
  const month = Number(todayISO().slice(5, 7));
  return month >= 11 ? currentSeason() + 1 : currentSeason();
}

type Client = Awaited<ReturnType<typeof createClient>>;

// Resolves who receives a template and the variables of each person.
export async function resolveRecipients(supabase: Client, audience: Audience, memberId?: string): Promise<Recipient[]> {
  const season = licenceSeason();
  let query = supabase.from("members").select("id, first_name, last_name, email").order("first_name");
  query = audience === "single" && memberId ? query.eq("id", memberId) : query.eq("active", true);
  const [{ data: members }, { data: open }, { data: licences }] = await Promise.all([
    query,
    supabase.from("charge_status").select("member_id, concept, outstanding_cents, status").in("status", ["pending", "partial", "overdue"]),
    supabase.from("federation_licences").select("member_id").eq("season", season),
  ]);

  const licensed = new Set((licences ?? []).map((l) => l.member_id));
  const recipients = (members ?? []).map((m) => {
    const mine = (open ?? []).filter((c) => c.member_id === m.id);
    const overdue = mine.filter((c) => c.status === "overdue");
    // Reminders mention what's overdue; for a single member, everything open.
    const relevant = audience === "single" ? mine : overdue;
    const total = relevant.reduce((a, c) => a + Number(c.outstanding_cents), 0);
    return {
      memberId: m.id,
      name: fullName(m),
      email: m.email,
      hasOverdue: overdue.length > 0,
      licensed: licensed.has(m.id),
      vars: {
        nombre: m.first_name,
        pendiente: eur(total),
        conceptos: relevant.map((c) => c.concept).join(", ") || "—",
        temporada: String(season),
      },
    };
  });

  return recipients
    .filter((r) => (audience === "overdue" ? r.hasOverdue : audience === "no_licence" ? !r.licensed : true))
    .map(({ memberId, name, email, vars }) => ({ memberId, name, email, vars }));
}

export function render(text: string, vars: Record<string, string>) {
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (all, key: string) => vars[key] ?? all);
}

// Group messages go out once in BCC: the greeting becomes "equipo".
export const groupVars = (season: number) => ({ nombre: "equipo", temporada: String(season) });

// Templates that mention amounts or concepts must be personalised one by one.
export const needsPersonalSend = (subject: string, body: string) => /\{\{\s*(pendiente|conceptos)\s*\}\}/.test(subject + body);

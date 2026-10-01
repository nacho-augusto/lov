import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MemberFields } from "@/components/admin/MemberFields";
import { PageHead } from "@/components/admin/PageHead";
import s from "@/components/admin/admin.module.css";
import { currentSeason, formatDate, fullName, todayISO } from "@/lib/admin/format";
import { requireAdmin } from "@/lib/admin/session";
import { createClient } from "@/lib/supabase/server";
import { saveLicence, setMemberLeft, setRequirementStatus, updateMember } from "../actions";

export const metadata: Metadata = { title: "Ficha de miembro" };

const messages: Record<string, string> = {
  alta: "Alta hecha. Ya tiene su lista de trámites.",
  guardado: "Ficha guardada.",
  baja: "Baja registrada. Su historial se conserva.",
  reactivado: "Vuelve a estar en activo.",
  tramite: "Trámite actualizado.",
  licencia: "Licencia guardada.",
  nombre: "Falta el nombre.",
  datos: "Revisa las fechas y el correo.",
  "fecha-baja": "La fecha de baja no puede ser anterior al alta.",
  temporada: "Esa temporada no es válida.",
  guardar: "No se ha podido guardar. Inténtalo de nuevo.",
};

const statusLabel: Record<string, string> = {
  pending: "Pendiente",
  done: "Hecho",
  not_applicable: "No aplica",
};

interface Requirement {
  id: string;
  season: number | null;
  status: "pending" | "done" | "not_applicable";
  done_on: string | null;
  requirement_templates: { name: string; sort: number } | null;
}

interface Licence {
  id: string;
  season: number;
  federation: string;
  modality: string | null;
  licence_number: string | null;
  valid_until: string | null;
}

export default async function MemberPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const me = await requireAdmin("members.read");
  const { id } = await params;
  const { ok, error } = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const canWrite = me.permissions.has("members.write");
  const canSeePrivate = me.permissions.has("members.sensitive");
  const season = currentSeason();
  const supabase = await createClient();

  const [{ data: member }, { data: priv }, { data: reqs }, { data: licences }] = await Promise.all([
    supabase.from("members").select("*").eq("id", id).maybeSingle(),
    canSeePrivate
      ? supabase.from("member_private").select("national_id, health_notes").eq("member_id", id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("member_requirements")
      .select("id, season, status, done_on, requirement_templates(name, sort)")
      .eq("member_id", id)
      .order("season", { ascending: false, nullsFirst: true }),
    supabase.from("federation_licences").select("*").eq("member_id", id).order("season", { ascending: false }),
  ]);
  if (!member) notFound();

  const requirements = ((reqs ?? []) as unknown as Requirement[]).sort(
    (a, b) => (b.season ?? 9999) - (a.season ?? 9999) || (a.requirement_templates?.sort ?? 0) - (b.requirement_templates?.sort ?? 0),
  );
  const licenceList = (licences ?? []) as Licence[];
  const thisSeasonLicence = licenceList.find((l) => l.season === season);
  const message = messages[ok ?? error ?? ""];

  return (
    <>
      <PageHead
        kicker={member.active ? `Miembro desde ${formatDate(member.joined_on)}` : `De baja desde ${formatDate(member.left_on)}`}
        title={fullName(member)}
        actions={<Link href="/admin/miembros" className={s.ghostButton}>Volver</Link>}
      />

      {message && (
        <p className={s.notice} data-tone={ok ? "ok" : "error"} role={ok ? "status" : "alert"}>
          {message}
        </p>
      )}

      <div className={s.columns}>
        <section className={s.block} aria-labelledby="ficha">
          <header className={s.blockHead}>
            <h2 id="ficha" className={s.blockTitle}>Ficha</h2>
          </header>
          {canWrite ? (
            <form action={updateMember} className={s.formStack}>
              <input type="hidden" name="id" value={member.id} />
              <MemberFields v={{ ...member, ...(priv ?? {}) }} showPrivate={canSeePrivate} />
              <div className={s.formActions}>
                <button type="submit" className={s.primaryButton}>Guardar ficha</button>
              </div>
            </form>
          ) : (
            <dl className={s.facts}>
              <dt>Correo</dt><dd>{member.email ?? "—"}</dd>
              <dt>Teléfono</dt><dd>{member.phone ?? "—"}</dd>
              <dt>Emergencia</dt><dd>{[member.emergency_name, member.emergency_phone].filter(Boolean).join(" · ") || "—"}</dd>
              <dt>Uso de imagen</dt><dd>{member.image_consent ? "Autorizado" : "No autorizado"}</dd>
            </dl>
          )}
        </section>

        <div className={s.stack}>
          <section className={s.block} aria-labelledby="tramites">
            <header className={s.blockHead}>
              <h2 id="tramites" className={s.blockTitle}>Trámites</h2>
            </header>
            {requirements.length ? (
              <ul className={s.checklist}>
                {requirements.map((r) => (
                  <li key={r.id} data-status={r.status}>
                    <span className={s.checkMark} aria-hidden="true" />
                    <span>
                      <span className={s.strong}>{r.requirement_templates?.name}</span>
                      <span className={s.adminMeta}>
                        {r.season ? ` · ${r.season}` : ""}
                        {r.status === "done" && r.done_on ? ` · ${formatDate(r.done_on)}` : ""}
                      </span>
                    </span>
                    {canWrite ? (
                      <form action={setRequirementStatus} className={s.statusForm}>
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="member_id" value={member.id} />
                        {(["done", "pending", "not_applicable"] as const)
                          .filter((st) => st !== r.status)
                          .map((st) => (
                            <button key={st} type="submit" name="status" value={st} className={s.linkButton}>
                              {st === "done" ? "Marcar hecho" : statusLabel[st]}
                            </button>
                          ))}
                      </form>
                    ) : (
                      <span className={s.adminMeta}>{statusLabel[r.status]}</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className={s.emptyText}>Sin trámites.</p>
            )}
          </section>

          <section className={s.block} aria-labelledby="licencias">
            <header className={s.blockHead}>
              <h2 id="licencias" className={s.blockTitle}>Licencias</h2>
            </header>
            {licenceList.length > 0 && (
              <ul className={s.ledger}>
                {licenceList.map((l) => (
                  <li key={l.id}>
                    <span className={s.deadlineDate}>{l.season}</span>
                    <span>
                      {l.federation}
                      {l.modality ? ` · ${l.modality}` : ""}
                      {l.licence_number ? ` · n.º ${l.licence_number}` : ""}
                    </span>
                    <span className={s.adminMeta}>{l.valid_until ? `hasta ${formatDate(l.valid_until)}` : ""}</span>
                  </li>
                ))}
              </ul>
            )}
            {canWrite && (
              <form action={saveLicence} className={s.formStack} style={{ marginTop: 14 }}>
                <input type="hidden" name="member_id" value={member.id} />
                <div className={s.fieldRow}>
                  <label className={s.field}>
                    <span>Temporada</span>
                    <input name="season" type="number" min={2000} max={2100} defaultValue={season} className={s.input} />
                  </label>
                  <label className={s.field}>
                    <span>Federación</span>
                    <input name="federation" defaultValue={thisSeasonLicence?.federation ?? "FAM"} className={s.input} />
                  </label>
                </div>
                <div className={s.fieldRow}>
                  <label className={s.field}>
                    <span>Modalidad</span>
                    <input name="modality" defaultValue={thisSeasonLicence?.modality ?? ""} className={s.input} placeholder="p. ej. B, A+…" />
                  </label>
                  <label className={s.field}>
                    <span>N.º de licencia</span>
                    <input name="licence_number" defaultValue={thisSeasonLicence?.licence_number ?? ""} className={s.input} />
                  </label>
                </div>
                <label className={s.field}>
                  <span>Válida hasta</span>
                  <input name="valid_until" type="date" defaultValue={thisSeasonLicence?.valid_until ?? `${season}-12-31`} className={s.input} />
                </label>
                <div>
                  <button type="submit" className={s.secondaryButton}>Guardar licencia</button>
                </div>
              </form>
            )}
          </section>

          {canWrite && (
            <section className={s.block} aria-labelledby="estado">
              <header className={s.blockHead}>
                <h2 id="estado" className={s.blockTitle}>{member.active ? "Dar de baja" : "Reactivar"}</h2>
              </header>
              <form action={setMemberLeft} className={s.inlineForm}>
                <input type="hidden" name="id" value={member.id} />
                <input type="hidden" name="leave" value={String(member.active)} />
                {member.active && (
                  <label className={s.field}>
                    <span>Fecha de baja</span>
                    <input name="left_on" type="date" defaultValue={todayISO()} className={s.input} />
                  </label>
                )}
                <button type="submit" className={s.secondaryButton}>
                  {member.active ? "Dar de baja" : "Volver a dar de alta"}
                </button>
              </form>
              {member.active && (
                <p className={s.blockMeta} style={{ marginTop: 8 }}>
                  No se borra nada: pagos, licencias y liga quedan en su historial.
                </p>
              )}
            </section>
          )}
        </div>
      </div>
    </>
  );
}

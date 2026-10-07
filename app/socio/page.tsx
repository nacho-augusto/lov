import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Notice } from "@/components/admin/Notice";
import { PageHead } from "@/components/admin/PageHead";
import { PeakSilhouette } from "@/components/admin/marks";
import s from "@/components/admin/admin.module.css";
import { eventKindLabels, type EventKind } from "@/lib/admin/extras";
import { currentSeason, formatDate, fullName, todayISO } from "@/lib/admin/format";
import { effortKm, MAROMA_M, monthLong } from "@/lib/admin/league";
import { eur } from "@/lib/admin/money";
import { requireMember } from "@/lib/portal/session";
import { createClient } from "@/lib/supabase/server";
import { portalSignOut, portalSignup } from "./actions";

export const metadata: Metadata = { title: "Tu zona" };

const messages: Record<string, string> = {
  apuntado: "¡Apuntado! Nos vemos allí.",
  desapuntado: "Te hemos quitado de la lista.",
  "sin-plazas": "No quedan plazas o la inscripción ya está cerrada.",
  guardar: "No se ha podido guardar. Inténtalo de nuevo.",
};

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  partial: "Pagado en parte",
  overdue: "Vencido",
  paid: "Pagado",
  waived: "Condonado",
};
const statusTone: Record<string, string> = { pending: "pending", partial: "pending", overdue: "overdue", paid: "done", waived: "done" };

interface Charge {
  id: string;
  member_id: string;
  concept: string;
  amount_cents: number;
  outstanding_cents: number;
  due_on: string;
  status: string;
}
interface LeagueRow {
  member_id: string;
  month: string;
  distance_m: number;
  elevation_gain_m: number;
}
interface PortalEvent {
  id: string;
  title: string;
  kind: EventKind;
  starts_on: string;
  start_time: string | null;
  ends_on: string | null;
  location: string | null;
  description: string | null;
  capacity: number | null;
  signup_deadline: string | null;
  signups: number;
  my_members: string[];
}

const km = (m: number) => new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 }).format(m / 1000);
const int = (n: number) => new Intl.NumberFormat("es-ES").format(Math.round(n));

export default async function PortalHome({
  searchParams,
}: {
  searchParams: Promise<{ m?: string; ok?: string; error?: string }>;
}) {
  const members = await requireMember();
  const { m, ok, error } = await searchParams;
  const me = members.find((x) => x.id === m) ?? members[0];
  const supabase = await createClient();
  const [{ data: charges }, { data: league }, { data: events }] = await Promise.all([
    supabase.rpc("portal_charges"),
    supabase.rpc("portal_league"),
    supabase.rpc("portal_events"),
  ]);

  const myCharges = ((charges ?? []) as Charge[]).filter((c) => c.member_id === me.id);
  const open = myCharges.filter((c) => ["pending", "partial", "overdue"].includes(c.status));
  const owed = open.reduce((a, c) => a + Number(c.outstanding_cents), 0);
  const season = currentSeason();
  const months = ((league ?? []) as LeagueRow[]).filter((r) => r.member_id === me.id);
  const seasonMonths = months.filter((r) => r.month.startsWith(String(season)));
  const seasonKm = seasonMonths.reduce((a, r) => a + r.distance_m, 0);
  const seasonGain = seasonMonths.reduce((a, r) => a + r.elevation_gain_m, 0);
  const upcoming = (events ?? []) as PortalEvent[];
  const todayIso = todayISO();

  return (
    <div className={s.portal}>
      <div className={s.portalTop}>
        <Link href="/socio" aria-label="Inicio">
          <Image src="/logo/logo-mark.png" alt="C.D. La Otra Vertiente" width={640} height={192} className={s.logoDay} priority />
          <Image src="/logo/logo-light.png" alt="" width={640} height={192} className={s.logoNight} priority />
        </Link>
        <form action={portalSignOut}>
          <button type="submit" className={s.ghostButton}>Salir</button>
        </form>
      </div>

      <PageHead kicker="Zona de socios" title={`¡Hola, ${me.first_name}!`} />
      <Notice ok={ok} error={error} messages={messages} />

      {members.length > 1 && (
        <nav className={s.chips} aria-label="Socios con este correo" style={{ marginBottom: 24 }}>
          {members.map((x) => (
            <Link key={x.id} href={`/socio?m=${x.id}`} className={s.chip} aria-pressed={x.id === me.id}>
              {fullName(x)}
            </Link>
          ))}
        </nav>
      )}

      <section className={s.figures} aria-label="Resumen">
        <div className={s.figure}>
          <span className={s.figureLabel}>Pendiente de pago</span>
          <span className={s.figureValue} data-accent={owed ? "" : undefined}>{eur(owed)}</span>
          <span className={s.figureNote}>{owed ? "Bizum o transferencia a la cuenta del club" : "Estás al día. ¡Gracias!"}</span>
        </div>
        <div className={s.figure}>
          <span className={s.figureLabel}>Liga {season}</span>
          <span className={s.figureValue}>{int(effortKm(seasonKm / 1000, seasonGain))}<small> km-esfuerzo</small></span>
          <span className={s.figureNote}>
            {km(seasonKm)} km · {int(seasonGain)} m+ ≈ {(seasonGain / MAROMA_M).toLocaleString("es-ES", { maximumFractionDigits: 1 })} Maromas
          </span>
        </div>
        <div className={s.figure}>
          <span className={s.figureLabel}>En el club desde</span>
          <span className={s.figureValue}>{formatDate(me.joined_on, { month: "short", year: "numeric" })}</span>
          <span className={s.figureNote}>C.D. La Otra Vertiente</span>
        </div>
      </section>

      <div className={s.columns}>
        <section className={s.block} aria-labelledby="actividades">
          <header className={s.blockHead}>
            <h2 id="actividades" className={s.blockTitle}>Próximas actividades</h2>
          </header>
          {upcoming.length ? (
            <ul className={s.ledger}>
              {upcoming.map((e) => {
                const going = e.my_members.includes(me.id);
                const closed = e.signup_deadline !== null && e.signup_deadline < todayIso;
                const full = e.capacity !== null && e.signups >= e.capacity;
                return (
                  <li key={e.id}>
                    <span className={s.deadlineDate}>{formatDate(e.starts_on, { day: "numeric", month: "short" })}</span>
                    <span>
                      <span className={s.strong}>{e.title}</span>
                      <span className={s.adminMeta}>
                        {" · "}
                        {eventKindLabels[e.kind]}
                        {e.start_time && ` · ${e.start_time.slice(0, 5)}`}
                        {e.location && ` · ${e.location}`}
                        {e.capacity && ` · ${Math.max(0, e.capacity - e.signups)} plazas libres`}
                        {e.signup_deadline && !closed && ` · inscripción hasta el ${formatDate(e.signup_deadline, { day: "numeric", month: "short" })}`}
                      </span>
                      {e.description && <span className={s.adminMeta} style={{ display: "block", whiteSpace: "pre-line" }}>{e.description}</span>}
                    </span>
                    {going ? (
                      <form action={portalSignup}>
                        <input type="hidden" name="event_id" value={e.id} />
                        <input type="hidden" name="member_id" value={me.id} />
                        <input type="hidden" name="join" value="false" />
                        <button type="submit" className={s.linkButton} disabled={closed}>
                          {closed ? "Apuntado" : "Ya no voy"}
                        </button>
                      </form>
                    ) : closed || full ? (
                      <span className={s.adminMeta}>{closed ? "Cerrada" : "Completa"}</span>
                    ) : (
                      <form action={portalSignup}>
                        <input type="hidden" name="event_id" value={e.id} />
                        <input type="hidden" name="member_id" value={me.id} />
                        <input type="hidden" name="join" value="true" />
                        <button type="submit" className={s.secondaryButton}>Me apunto</button>
                      </form>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className={s.empty}>
              <PeakSilhouette className={s.emptyPeak} />
              <p className={s.emptyTitle}>Nada a la vista</p>
              <p className={s.emptyText}>Cuando la junta apunte la próxima salida, aparecerá aquí.</p>
            </div>
          )}
        </section>

        <div className={s.stack}>
          <section className={s.block} aria-labelledby="cuotas">
            <header className={s.blockHead}>
              <h2 id="cuotas" className={s.blockTitle}>Tus cuotas</h2>
            </header>
            {myCharges.length ? (
              <ul className={s.ledger}>
                {myCharges.slice(0, 12).map((c) => (
                  <li key={c.id}>
                    <span className={s.deadlineDate}>{formatDate(c.due_on, { day: "numeric", month: "short", year: "2-digit" })}</span>
                    <span>
                      {c.concept}{" "}
                      <span className={s.status} data-tone={statusTone[c.status]}>{statusLabels[c.status] ?? c.status}</span>
                    </span>
                    <span className={s.num}>
                      {eur(Number(open.includes(c) ? c.outstanding_cents : c.amount_cents))}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={s.emptyText}>No tienes cuotas apuntadas.</p>
            )}
          </section>

          <section className={s.block} aria-labelledby="liga">
            <header className={s.blockHead}>
              <h2 id="liga" className={s.blockTitle}>Tu liga</h2>
            </header>
            {months.length ? (
              <ul className={s.ledger}>
                {[...months].reverse().slice(0, 12).map((r) => (
                  <li key={r.month}>
                    <span className={s.deadlineDate}>{monthLong(r.month.slice(0, 7))}</span>
                    <span className={s.adminMeta}>{km(r.distance_m)} km · {int(r.elevation_gain_m)} m+</span>
                    <span className={s.num}>{int(effortKm(r.distance_m / 1000, r.elevation_gain_m))}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={s.emptyText}>Aún no hay meses apuntados. La junta los actualiza cada mes.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

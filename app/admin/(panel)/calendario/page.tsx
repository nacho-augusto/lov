import type { Metadata } from "next";
import Link from "next/link";
import { EventFields } from "@/components/admin/EventFields";
import { Notice } from "@/components/admin/Notice";
import { PageHead } from "@/components/admin/PageHead";
import { PeakSilhouette } from "@/components/admin/marks";
import s from "@/components/admin/admin.module.css";
import { eventKindLabels, extrasMessages, type EventKind } from "@/lib/admin/extras";
import { formatDate, todayISO } from "@/lib/admin/format";
import { requireAdmin } from "@/lib/admin/session";
import { createClient } from "@/lib/supabase/server";
import { saveEvent } from "./actions";

export const metadata: Metadata = { title: "Calendario" };

interface EventRow {
  id: string;
  title: string;
  kind: EventKind;
  starts_on: string;
  start_time: string | null;
  location: string | null;
  capacity: number | null;
  cancelled: boolean;
  event_signups: { count: number }[];
}

function EventList({ events }: { events: EventRow[] }) {
  return (
    <ul className={s.ledger}>
      {events.map((e) => {
        const n = e.event_signups[0]?.count ?? 0;
        return (
          <li key={e.id} data-inactive={e.cancelled ? "" : undefined}>
            <span className={s.deadlineDate}>{formatDate(e.starts_on, { day: "numeric", month: "short" })}</span>
            <span>
              <Link href={`/admin/calendario/${e.id}`} className={`${s.rowLink} ${s.strong}`}>{e.title}</Link>
              <span className={s.adminMeta}>
                {" · "}
                {eventKindLabels[e.kind]}
                {e.start_time && ` · ${e.start_time.slice(0, 5)}`}
                {e.location && ` · ${e.location}`}
                {e.cancelled && " · cancelada"}
              </span>
            </span>
            <span className={s.num}>{e.capacity ? `${n}/${e.capacity}` : n} apuntados</span>
          </li>
        );
      })}
    </ul>
  );
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const me = await requireAdmin("events.read");
  const { ok, error } = await searchParams;
  const canWrite = me.permissions.has("events.write");
  const todayIso = todayISO();
  const supabase = await createClient();
  const fields = "id, title, kind, starts_on, start_time, location, capacity, cancelled, event_signups(count)";
  const [{ data: upcoming }, { data: past }] = await Promise.all([
    supabase.from("events").select(fields).gte("starts_on", todayIso).order("starts_on").order("start_time"),
    supabase.from("events").select(fields).lt("starts_on", todayIso).order("starts_on", { ascending: false }).limit(20),
  ]);
  const next = (upcoming ?? []) as unknown as EventRow[];
  const done = (past ?? []) as unknown as EventRow[];

  return (
    <>
      <PageHead kicker="Club" title="Calendario" />
      <Notice ok={ok} error={error} messages={extrasMessages} />

      <div className={s.columns}>
        <section className={s.block} aria-labelledby="proximas">
          <header className={s.blockHead}>
            <h2 id="proximas" className={s.blockTitle}>Próximas actividades</h2>
          </header>
          {next.length ? (
            <EventList events={next} />
          ) : (
            <div className={s.empty}>
              <PeakSilhouette className={s.emptyPeak} />
              <p className={s.emptyTitle}>Nada en el calendario</p>
              <p className={s.emptyText}>Apunta la próxima salida o carrera y lleva aquí la lista de quién va.</p>
            </div>
          )}
        </section>

        <div className={s.stack}>
          {canWrite && (
            <section className={s.block} aria-labelledby="nueva-actividad">
              <header className={s.blockHead}>
                <h2 id="nueva-actividad" className={s.blockTitle}>Nueva actividad</h2>
              </header>
              <form action={saveEvent} className={s.formStack}>
                <EventFields />
                <div>
                  <button type="submit" className={s.primaryButton}>Crear actividad</button>
                </div>
              </form>
            </section>
          )}
          {done.length > 0 && (
            <section className={s.block} aria-labelledby="pasadas">
              <header className={s.blockHead}>
                <h2 id="pasadas" className={s.blockTitle}>Ya pasadas</h2>
              </header>
              <EventList events={done} />
            </section>
          )}
        </div>
      </div>
    </>
  );
}

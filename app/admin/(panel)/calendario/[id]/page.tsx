import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EventFields } from "@/components/admin/EventFields";
import { Notice } from "@/components/admin/Notice";
import { PageHead } from "@/components/admin/PageHead";
import s from "@/components/admin/admin.module.css";
import { eventKindLabels, extrasMessages, type EventKind } from "@/lib/admin/extras";
import { formatDate, fullName } from "@/lib/admin/format";
import { requireAdmin } from "@/lib/admin/session";
import { createClient } from "@/lib/supabase/server";
import { addSignup, removeSignup, saveEvent, setEventCancelled } from "../actions";

export const metadata: Metadata = { title: "Actividad" };

interface Signup {
  id: string;
  notes: string | null;
  created_at: string;
  members: { id: string; first_name: string; last_name: string; phone: string | null } | null;
}

export default async function EventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const me = await requireAdmin("events.read");
  const { id } = await params;
  const { ok, error } = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const canWrite = me.permissions.has("events.write");
  const canSeeMembers = me.permissions.has("members.read");
  const supabase = await createClient();

  const [{ data: event }, { data: signups }, { data: members }] = await Promise.all([
    supabase.from("events").select("*").eq("id", id).maybeSingle(),
    canSeeMembers
      ? supabase.from("event_signups").select("id, notes, created_at, members(id, first_name, last_name, phone)").eq("event_id", id).order("created_at")
      : Promise.resolve({ data: [] }),
    canWrite && canSeeMembers
      ? supabase.from("members").select("id, first_name, last_name").eq("active", true).order("first_name").order("last_name")
      : Promise.resolve({ data: [] }),
  ]);
  if (!event) notFound();

  const list = (signups ?? []) as unknown as Signup[];
  const signedUp = new Set(list.map((x) => x.members?.id));
  const candidates = (members ?? []).filter((m) => !signedUp.has(m.id));
  const full = event.capacity !== null && list.length >= event.capacity;
  const when = [
    formatDate(event.starts_on, { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
    event.start_time?.slice(0, 5),
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <>
      <PageHead
        kicker={`${eventKindLabels[event.kind as EventKind]}${event.cancelled ? " · cancelada" : ""}`}
        title={event.title}
        actions={<Link href="/admin/calendario" className={s.ghostButton}>Volver</Link>}
      />
      <Notice ok={ok} error={error} messages={extrasMessages} />

      <div className={s.columns}>
        <section className={s.block} aria-labelledby="apuntados">
          <header className={s.blockHead}>
            <h2 id="apuntados" className={s.blockTitle}>
              Apuntados {event.capacity ? `(${list.length}/${event.capacity})` : `(${list.length})`}
            </h2>
            {event.signup_deadline && <p className={s.blockMeta}>Inscripción hasta el {formatDate(event.signup_deadline)}</p>}
          </header>
          {!canSeeMembers ? (
            <p className={s.emptyText}>Para ver la lista hace falta permiso de lectura de miembros.</p>
          ) : list.length ? (
            <ul className={s.ledger}>
              {list.map((x, i) => (
                <li key={x.id}>
                  <span className={s.deadlineDate}>{i + 1}</span>
                  <span>
                    {x.members ? (
                      <Link href={`/admin/miembros/${x.members.id}`} className={`${s.rowLink} ${s.strong}`}>{fullName(x.members)}</Link>
                    ) : (
                      "—"
                    )}
                    <span className={s.adminMeta}>
                      {x.members?.phone && ` · ${x.members.phone}`}
                      {x.notes && ` · ${x.notes}`}
                    </span>
                  </span>
                  {canWrite ? (
                    <form action={removeSignup}>
                      <input type="hidden" name="event_id" value={event.id} />
                      <input type="hidden" name="id" value={x.id} />
                      <button type="submit" className={s.linkButton}>Quitar</button>
                    </form>
                  ) : (
                    <span />
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className={s.emptyText}>Todavía no se ha apuntado nadie.</p>
          )}
          {canWrite && !event.cancelled && !full && candidates.length > 0 && (
            <form action={addSignup} className={s.formStack} style={{ marginTop: 14 }}>
              <input type="hidden" name="event_id" value={event.id} />
              <div className={s.fieldRow}>
                <label className={s.field}>
                  <span>Apuntar a</span>
                  <select name="member_id" className={s.input} required defaultValue="">
                    <option value="" disabled>Elige un miembro</option>
                    {candidates.map((m) => (
                      <option key={m.id} value={m.id}>{fullName(m)}</option>
                    ))}
                  </select>
                </label>
                <label className={s.field}>
                  <span>Nota (opcional)</span>
                  <input name="notes" className={s.input} placeholder="Lleva coche, 3 plazas…" />
                </label>
              </div>
              <div>
                <button type="submit" className={s.secondaryButton}>Apuntar</button>
              </div>
            </form>
          )}
          {full && <p className={s.blockMeta} style={{ marginTop: 10 }}>Completo.</p>}
        </section>

        <div className={s.stack}>
          <section className={s.block} aria-labelledby="detalles">
            <header className={s.blockHead}>
              <h2 id="detalles" className={s.blockTitle}>Detalles</h2>
            </header>
            <dl className={s.facts}>
              <dt>Cuándo</dt>
              <dd>
                {when}
                {event.ends_on && event.ends_on !== event.starts_on && ` → ${formatDate(event.ends_on)}`}
              </dd>
              <dt>Dónde</dt><dd>{event.location ?? "—"}</dd>
              <dt>Plazas</dt><dd>{event.capacity ?? "Sin límite"}</dd>
            </dl>
            {event.description && <p className={s.blockMeta} style={{ marginTop: 12, whiteSpace: "pre-line" }}>{event.description}</p>}
            {canWrite && (
              <details className={s.adminEdit} style={{ marginTop: 14 }}>
                <summary className={s.linkButton}>Editar</summary>
                <form action={saveEvent} className={s.formStack}>
                  <input type="hidden" name="id" value={event.id} />
                  <EventFields e={event} />
                  <div>
                    <button type="submit" className={s.secondaryButton}>Guardar</button>
                  </div>
                </form>
              </details>
            )}
          </section>
          {canWrite && (
            <form action={setEventCancelled}>
              <input type="hidden" name="id" value={event.id} />
              <input type="hidden" name="cancelled" value={String(!event.cancelled)} />
              <button type="submit" className={s.secondaryButton}>
                {event.cancelled ? "Recuperar actividad" : "Cancelar actividad"}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}

import Link from "next/link";
import { Notice } from "@/components/admin/Notice";
import { PageHead } from "@/components/admin/PageHead";
import { PeakSilhouette } from "@/components/admin/marks";
import s from "@/components/admin/admin.module.css";
import { currentSeason, formatDate, todayISO } from "@/lib/admin/format";
import { EXPIRY_WARNING_DAYS, expiryStatus } from "@/lib/admin/extras";
import { daysUntil, nextDeadline, type GrantStatus } from "@/lib/admin/grants";
import { eur } from "@/lib/admin/money";
import { requireAdmin } from "@/lib/admin/session";
import { createClient } from "@/lib/supabase/server";

const today = () =>
  new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Madrid" })
    .format(new Date())
    .replace(/^./, (c) => c.toUpperCase());

interface OpenCharge {
  id: string;
  member_id: string;
  concept: string;
  outstanding_cents: number;
  due_on: string;
  status: string;
  members: { first_name: string; last_name: string } | null;
}

// "Parte de la junta": what needs attention, limited to what each role may see.
export default async function AdminHome({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const admin = await requireAdmin();
  const { error } = await searchParams;
  const can = (p: string) => admin.permissions.has(p);
  const season = currentSeason();
  const supabase = await createClient();
  const none = Promise.resolve({ data: null });

  const todayIso = todayISO();
  const inDays = (n: number) => new Date(Date.parse(`${todayIso}T12:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);

  const [
    { data: money },
    { data: charges },
    { data: activeMembers },
    { data: licences },
    { data: lastMoves },
    { data: grants },
    { data: events },
    { data: docs },
  ] = await Promise.all([
    can("accounts.read") ? supabase.from("transactions").select("kind, amount_cents") : none,
    can("fees.read")
      ? supabase
          .from("charge_status")
          .select("id, member_id, concept, outstanding_cents, due_on, status, members(first_name, last_name)")
          .in("status", ["pending", "partial", "overdue"])
          .order("due_on")
      : none,
    can("members.read") ? supabase.from("members").select("id").eq("active", true) : none,
    can("members.read") ? supabase.from("federation_licences").select("member_id").eq("season", season) : none,
    can("accounts.read")
      ? supabase.from("transactions").select("id, kind, occurred_on, amount_cents, description").order("occurred_on", { ascending: false }).order("created_at", { ascending: false }).limit(5)
      : none,
    can("grants.read")
      ? supabase.from("grants").select("id, name, status, application_deadline, justification_deadline").in("status", ["preparing", "awarded"])
      : none,
    can("events.read")
      ? supabase.from("events").select("id, title, starts_on, start_time").eq("cancelled", false).gte("starts_on", todayIso).lte("starts_on", inDays(21)).order("starts_on").limit(5)
      : none,
    can("documents.read")
      ? supabase.from("club_documents").select("id, name, expires_on").lte("expires_on", inDays(EXPIRY_WARNING_DAYS)).order("expires_on").limit(5)
      : none,
  ]);
  const deadlines = (grants ?? [])
    .map((g) => {
      const next = nextDeadline(g as { status: GrantStatus; application_deadline: string | null; justification_deadline: string | null });
      return next ? { id: g.id, name: g.name, ...next, days: daysUntil(next.date, todayIso) ?? 0 } : null;
    })
    .filter((d): d is NonNullable<typeof d> => d !== null)
    .sort((a, b) => a.days - b.days);

  const balance = (money ?? []).reduce((a, t) => a + (t.kind === "income" ? 1 : -1) * Number(t.amount_cents), 0);
  const open = (charges ?? []) as unknown as OpenCharge[];
  const outstanding = open.reduce((a, c) => a + Number(c.outstanding_cents), 0);
  const overdue = open.filter((c) => c.status === "overdue");
  const activeIds = new Set((activeMembers ?? []).map((m) => m.id));
  const licensed = new Set((licences ?? []).map((l) => l.member_id).filter((id) => activeIds.has(id)));
  const name = admin.fullName?.split(" ")[0];

  return (
    <>
      <PageHead kicker={today()} title="Parte de la junta" />
      <Notice error={error} messages={{ permiso: "No tienes permiso para esa sección." }} />

      <section className={s.figures} aria-label="Resumen">
        {can("accounts.read") && (
          <Link href="/admin/cuentas" className={s.figure}>
            <span className={s.figureLabel}>Saldo del club</span>
            <span className={s.figureValue}>{eur(balance)}</span>
            <span className={s.figureNote}>según lo apuntado</span>
          </Link>
        )}
        {can("fees.read") && (
          <Link href="/admin/cuotas" className={s.figure}>
            <span className={s.figureLabel}>Pendiente de cobro</span>
            <span className={s.figureValue} data-accent={outstanding ? "" : undefined}>{eur(outstanding)}</span>
            <span className={s.figureNote}>
              {open.length === 1 ? "1 cargo" : `${open.length} cargos`} · {overdue.length === 1 ? "1 vencido" : `${overdue.length} vencidos`}
            </span>
          </Link>
        )}
        {can("members.read") && (
          <Link href="/admin/miembros" className={s.figure}>
            <span className={s.figureLabel}>Licencias {season}</span>
            <span className={s.figureValue}>
              {licensed.size}
              <small>/{activeIds.size}</small>
            </span>
            <span className={s.figureNote}>miembros en activo con licencia</span>
          </Link>
        )}
      </section>

      <div className={s.columns}>
        {can("fees.read") ? (
          <section className={s.block} aria-labelledby="vencidas">
            <header className={s.blockHead}>
              <h2 id="vencidas" className={s.blockTitle}>Cuotas vencidas</h2>
              <Link href="/admin/cuotas?ver=vencidas" className={s.linkButton}>Ver todas</Link>
            </header>
            {overdue.length ? (
              <ul className={s.ledger}>
                {overdue.slice(0, 8).map((c) => (
                  <li key={c.id}>
                    <span className={s.deadlineDate}>{formatDate(c.due_on, { day: "numeric", month: "short" })}</span>
                    <span>
                      <Link href={`/admin/miembros/${c.member_id}`} className={`${s.rowLink} ${s.strong}`}>
                        {[c.members?.first_name, c.members?.last_name].filter(Boolean).join(" ")}
                      </Link>
                      <span className={s.adminMeta}> · {c.concept}</span>
                    </span>
                    <span className={`${s.num} ${s.accentText}`}>{eur(c.outstanding_cents)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className={s.empty}>
                <PeakSilhouette className={s.emptyPeak} />
                <p className={s.emptyTitle}>{name ? `${name}, nadie` : "Nadie"} va con retraso</p>
                <p className={s.emptyText}>Todas las cuotas están dentro de plazo.</p>
              </div>
            )}
          </section>
        ) : (
          <div className={s.empty}>
            <PeakSilhouette className={s.emptyPeak} />
            <p className={s.emptyTitle}>{name ? `Hola, ${name}` : "Hola"}</p>
            <p className={s.emptyText}>Usa el menú para ir a tus secciones.</p>
          </div>
        )}

        {can("grants.read") && deadlines.length > 0 && (
          <section className={s.block} aria-labelledby="plazos">
            <header className={s.blockHead}>
              <h2 id="plazos" className={s.blockTitle}>Plazos de subvenciones</h2>
              <Link href="/admin/subvenciones" className={s.linkButton}>Subvenciones</Link>
            </header>
            <ol className={s.deadlines}>
              {deadlines.slice(0, 5).map((d) => (
                <li key={d.id}>
                  <span className={s.deadlineDate}>{formatDate(d.date, { day: "numeric", month: "short" })}</span>
                  <Link href={`/admin/subvenciones/${d.id}`} className={`${s.rowLink} ${s.deadlineWhat}`}>
                    {d.kind} · {d.name}
                  </Link>
                  <span className={s.deadlineDays} data-soon={d.days <= 21 ? "" : undefined}>
                    {d.days >= 0 ? `${d.days} d` : "vencido"}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {can("events.read") && (events ?? []).length > 0 && (
          <section className={s.block} aria-labelledby="actividades">
            <header className={s.blockHead}>
              <h2 id="actividades" className={s.blockTitle}>Próximas actividades</h2>
              <Link href="/admin/calendario" className={s.linkButton}>Calendario</Link>
            </header>
            <ol className={s.deadlines}>
              {(events ?? []).map((e) => (
                <li key={e.id}>
                  <span className={s.deadlineDate}>{formatDate(e.starts_on, { day: "numeric", month: "short" })}</span>
                  <Link href={`/admin/calendario/${e.id}`} className={`${s.rowLink} ${s.deadlineWhat}`}>{e.title}</Link>
                  <span className={s.deadlineDays}>{e.start_time?.slice(0, 5) ?? ""}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {can("documents.read") && (docs ?? []).length > 0 && (
          <section className={s.block} aria-labelledby="caducan">
            <header className={s.blockHead}>
              <h2 id="caducan" className={s.blockTitle}>Documentos que caducan</h2>
              <Link href="/admin/documentos" className={s.linkButton}>Documentos</Link>
            </header>
            <ol className={s.deadlines}>
              {(docs ?? []).map((d) => {
                const exp = expiryStatus(d.expires_on, todayIso);
                return (
                  <li key={d.id}>
                    <span className={s.deadlineDate}>{formatDate(d.expires_on, { day: "numeric", month: "short" })}</span>
                    <Link href="/admin/documentos" className={`${s.rowLink} ${s.deadlineWhat}`}>{d.name}</Link>
                    <span className={s.deadlineDays} data-soon={(exp.days ?? 0) <= 21 ? "" : undefined}>
                      {exp.days !== null && exp.days >= 0 ? `${exp.days} d` : "caducado"}
                    </span>
                  </li>
                );
              })}
            </ol>
          </section>
        )}

        {can("accounts.read") && (
          <section className={s.block} aria-labelledby="ultimos">
            <header className={s.blockHead}>
              <h2 id="ultimos" className={s.blockTitle}>Últimos movimientos</h2>
              <Link href="/admin/cuentas" className={s.linkButton}>Cuentas</Link>
            </header>
            {lastMoves?.length ? (
              <ul className={s.ledger}>
                {lastMoves.map((m) => (
                  <li key={m.id}>
                    <span className={s.deadlineDate}>{formatDate(m.occurred_on, { day: "numeric", month: "short" })}</span>
                    <span>{m.description}</span>
                    <span className={s.num} data-sign={m.kind === "income" ? "in" : "out"}>
                      {m.kind === "income" ? "+" : "−"}
                      {eur(Number(m.amount_cents))}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={s.emptyText}>Aún no hay movimientos.</p>
            )}
          </section>
        )}
      </div>
    </>
  );
}

import Link from "next/link";
import { Notice } from "@/components/admin/Notice";
import { PageHead } from "@/components/admin/PageHead";
import { PeakSilhouette } from "@/components/admin/marks";
import s from "@/components/admin/admin.module.css";
import { currentSeason, formatDate } from "@/lib/admin/format";
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

  const [{ data: money }, { data: charges }, { data: activeMembers }, { data: licences }, { data: lastMoves }] = await Promise.all([
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
  ]);

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

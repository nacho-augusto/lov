import type { Metadata } from "next";
import Link from "next/link";
import { Notice } from "@/components/admin/Notice";
import { PageHead } from "@/components/admin/PageHead";
import { PeakSilhouette } from "@/components/admin/marks";
import s from "@/components/admin/admin.module.css";
import { formatDate, todayISO } from "@/lib/admin/format";
import { daysUntil, grantMessages, grantStatusLabels, grantStatusTone, nextDeadline, type GrantStatus } from "@/lib/admin/grants";
import { eur } from "@/lib/admin/money";
import { requireAdmin } from "@/lib/admin/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Subvenciones" };

interface GrantRow {
  id: string;
  year: number;
  name: string;
  awarding_body: string | null;
  requested_cents: number | null;
  awarded_cents: number | null;
  status: GrantStatus;
  application_deadline: string | null;
  justification_deadline: string | null;
  grant_requirements: { status: string }[];
}

export default async function GrantsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const me = await requireAdmin("grants.read");
  const { ok, error } = await searchParams;
  const canWrite = me.permissions.has("grants.write");
  const supabase = await createClient();
  const { data } = await supabase
    .from("grants")
    .select("id, year, name, awarding_body, requested_cents, awarded_cents, status, application_deadline, justification_deadline, grant_requirements(status)")
    .order("year", { ascending: false })
    .order("created_at");
  const grants = (data ?? []) as GrantRow[];
  const years = [...new Set(grants.map((g) => g.year))];
  const today = todayISO();

  return (
    <>
      <PageHead
        kicker="Convocatorias y justificaciones"
        title="Subvenciones"
        actions={canWrite && <Link href="/admin/subvenciones/nueva" className={s.primaryButton}>Nueva subvención</Link>}
      />
      <Notice ok={ok} error={error} messages={grantMessages} />

      {grants.length === 0 && (
        <div className={s.empty}>
          <PeakSilhouette className={s.emptyPeak} />
          <p className={s.emptyTitle}>Aún no hay subvenciones</p>
          <p className={s.emptyText}>Crea la primera y apunta qué documentos piden.</p>
        </div>
      )}

      {years.map((year) => (
        <section key={year} className={s.block} aria-labelledby={`y-${year}`}>
          <header className={s.blockHead}>
            <h2 id={`y-${year}`} className={s.blockTitle}>{year}</h2>
          </header>
          <ul className={s.grantList}>
            {grants
              .filter((g) => g.year === year)
              .map((g) => {
                const relevant = g.grant_requirements.filter((r) => r.status !== "not_applicable");
                const done = relevant.filter((r) => r.status === "done").length;
                const next = nextDeadline(g);
                const days = next ? daysUntil(next.date, today) : null;
                return (
                  <li key={g.id}>
                    <Link href={`/admin/subvenciones/${g.id}`} className={s.grantCard}>
                      <span className={s.grantMain}>
                        <span className={s.strong}>{g.name}</span>
                        <span className={s.adminMeta}>{g.awarding_body ?? "Sin organismo"}</span>
                      </span>
                      <span className={s.status} data-tone={grantStatusTone[g.status]}>{grantStatusLabels[g.status]}</span>
                      <span className={s.adminMeta}>
                        {g.awarded_cents != null ? `Concedido ${eur(g.awarded_cents)}` : g.requested_cents != null ? `Solicitado ${eur(g.requested_cents)}` : "—"}
                      </span>
                      <span className={s.progress} aria-label={`${done} de ${relevant.length} documentos listos`}>
                        <span style={{ width: relevant.length ? `${(done / relevant.length) * 100}%` : 0 }} />
                        <em>{done}/{relevant.length} docs</em>
                      </span>
                      <span className={s.adminMeta} data-soon={days !== null && days <= 21 ? "" : undefined}>
                        {next ? `${next.kind}: ${formatDate(next.date, { day: "numeric", month: "short" })}${days !== null ? (days >= 0 ? ` · ${days} d` : " · vencido") : ""}` : ""}
                      </span>
                    </Link>
                  </li>
                );
              })}
          </ul>
        </section>
      ))}
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ChargeRow, type ChargeRowData } from "@/components/admin/ChargeRow";
import { Notice } from "@/components/admin/Notice";
import { PageHead } from "@/components/admin/PageHead";
import { PeakSilhouette } from "@/components/admin/marks";
import s from "@/components/admin/admin.module.css";
import { fullName, todayISO } from "@/lib/admin/format";
import { moneyMessages } from "@/lib/admin/messages";
import { eur, periodicityLabels, type Periodicity } from "@/lib/admin/money";
import { requireAdmin } from "@/lib/admin/session";
import { createClient } from "@/lib/supabase/server";
import { createCharge, generateCharges } from "./actions";

export const metadata: Metadata = { title: "Cuotas" };

const filters = {
  pendientes: { label: "Por cobrar", statuses: ["pending", "partial", "overdue"] },
  vencidas: { label: "Vencidas", statuses: ["overdue"] },
  pagadas: { label: "Pagadas", statuses: ["paid"] },
  todas: { label: "Todas", statuses: ["pending", "partial", "overdue", "paid", "waived"] },
} as const;
type Filter = keyof typeof filters;

function firstOfNextMonth() {
  const [y, m] = todayISO().split("-").map(Number);
  return m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;
}

export default async function FeesPage({
  searchParams,
}: {
  searchParams: Promise<{ ver?: string; ok?: string; error?: string }>;
}) {
  const me = await requireAdmin("fees.read");
  const { ver, ok, error } = await searchParams;
  const filter: Filter = ver && ver in filters ? (ver as Filter) : "pendientes";
  const canWrite = me.permissions.has("fees.write");
  const supabase = await createClient();

  const [{ data: charges }, { data: outstanding }, { data: feeTypes }, { data: members }] = await Promise.all([
    supabase
      .from("charge_status")
      .select("id, member_id, concept, amount_cents, paid_cents, outstanding_cents, due_on, status, waived, members(first_name, last_name)")
      .in("status", [...filters[filter].statuses])
      .order("due_on", { ascending: filter !== "pagadas" })
      .limit(300),
    supabase.from("charge_status").select("outstanding_cents, status").in("status", ["pending", "partial", "overdue"]),
    supabase.from("fee_types").select("id, name, periodicity, default_amount_cents").eq("active", true).order("name"),
    canWrite
      ? supabase.from("members").select("id, first_name, last_name").eq("active", true).order("first_name")
      : Promise.resolve({ data: [] as { id: string; first_name: string; last_name: string }[] }),
  ]);

  const rows = (charges ?? []) as unknown as ChargeRowData[];
  const open = outstanding ?? [];
  const totalOutstanding = open.reduce((a, r) => a + Number(r.outstanding_cents), 0);
  const overdueCount = open.filter((r) => r.status === "overdue").length;
  const returnTo = "/admin/cuotas";

  return (
    <>
      <PageHead
        kicker="Cobros a miembros"
        title="Cuotas"
        actions={<Link href="/admin/cuotas/tipos" className={s.ghostButton}>Tipos de cuota</Link>}
      />
      <Notice ok={ok} error={error} messages={moneyMessages} />

      <section className={s.figures} aria-label="Resumen">
        <div className={s.figure}>
          <span className={s.figureLabel}>Pendiente de cobro</span>
          <span className={s.figureValue} data-accent>{eur(totalOutstanding)}</span>
          <span className={s.figureNote}>{open.length === 1 ? "1 cargo abierto" : `${open.length} cargos abiertos`}</span>
        </div>
        <div className={s.figure}>
          <span className={s.figureLabel}>Vencidos</span>
          <span className={s.figureValue}>{overdueCount}</span>
          <span className={s.figureNote}>pasada la fecha límite</span>
        </div>
      </section>

      <section className={s.rangeBar} aria-label="Filtro">
        <div className={s.chips} role="group" aria-label="Estado">
          {(Object.keys(filters) as Filter[]).map((f) => (
            <Link key={f} href={f === "pendientes" ? "/admin/cuotas" : `/admin/cuotas?ver=${f}`} className={s.chip} aria-pressed={f === filter}>
              {filters[f].label}
            </Link>
          ))}
        </div>
      </section>

      {rows.length ? (
        <table className={s.table}>
          <thead>
            <tr>
              <th scope="col">Miembro</th>
              <th scope="col">Concepto</th>
              <th scope="col" className={s.num}>Importe</th>
              <th scope="col" className={s.num}>Pagado</th>
              <th scope="col">Estado</th>
              {canWrite && <th scope="col"><span className={s.srOnly}>Acciones</span></th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <ChargeRow key={c.id} c={c} canWrite={canWrite} returnTo={returnTo} />
            ))}
          </tbody>
        </table>
      ) : (
        <div className={s.empty}>
          <PeakSilhouette className={s.emptyPeak} />
          <p className={s.emptyTitle}>{filter === "pendientes" ? "Nadie debe nada" : "Nada por aquí"}</p>
          <p className={s.emptyText}>
            {filter === "pendientes" ? "Todas las cuotas están al día. Así da gusto." : "Prueba con otro filtro."}
          </p>
        </div>
      )}

      {canWrite && (
        <div className={s.columns} style={{ marginTop: 40 }}>
          <section className={s.block} aria-labelledby="generar">
            <header className={s.blockHead}>
              <h2 id="generar" className={s.blockTitle}>Generar cargos de un periodo</h2>
            </header>
            {feeTypes?.length ? (
              <form action={generateCharges} className={s.formStack}>
                <input type="hidden" name="return_to" value={returnTo} />
                <label className={s.field}>
                  <span>Tipo de cuota</span>
                  <select name="fee_type_id" className={s.input} required>
                    {feeTypes.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} · {periodicityLabels[f.periodicity as Periodicity]} · {eur(f.default_amount_cents)}
                      </option>
                    ))}
                  </select>
                </label>
                <div className={s.fieldRow}>
                  <label className={s.field}>
                    <span>Empieza el periodo</span>
                    <input name="period_start" type="date" defaultValue={firstOfNextMonth()} className={s.input} required />
                  </label>
                  <label className={s.field}>
                    <span>Fecha límite de pago</span>
                    <input name="due_on" type="date" className={s.input} required />
                  </label>
                </div>
                <p className={s.blockMeta}>
                  Crea un cargo para cada miembro en activo que tenga asignada esa cuota. Si ya existe, no lo repite.
                </p>
                <div>
                  <button type="submit" className={s.primaryButton}>Generar cargos</button>
                </div>
              </form>
            ) : (
              <p className={s.emptyText}>
                Primero crea un <Link href="/admin/cuotas/tipos">tipo de cuota</Link>.
              </p>
            )}
          </section>

          <section className={s.block} aria-labelledby="puntual">
            <header className={s.blockHead}>
              <h2 id="puntual" className={s.blockTitle}>Cargo puntual</h2>
            </header>
            <form action={createCharge} className={s.formStack}>
              <input type="hidden" name="return_to" value={returnTo} />
              <label className={s.field}>
                <span>Miembro</span>
                <select name="member_id" className={s.input} required defaultValue="">
                  <option value="" disabled>Elige…</option>
                  {(members ?? []).map((m) => (
                    <option key={m.id} value={m.id}>{fullName(m)}</option>
                  ))}
                </select>
              </label>
              <label className={s.field}>
                <span>Concepto</span>
                <input name="concept" className={s.input} placeholder="Equipación, inscripción…" required />
              </label>
              <div className={s.fieldRow}>
                <label className={s.field}>
                  <span>Importe (€)</span>
                  <input name="amount" inputMode="decimal" className={s.input} required />
                </label>
                <label className={s.field}>
                  <span>Fecha límite</span>
                  <input name="due_on" type="date" defaultValue={todayISO()} className={s.input} />
                </label>
              </div>
              <div>
                <button type="submit" className={s.secondaryButton}>Crear cargo</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}

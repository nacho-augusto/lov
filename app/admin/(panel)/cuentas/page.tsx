import type { Metadata } from "next";
import Link from "next/link";
import { Notice } from "@/components/admin/Notice";
import { PageHead } from "@/components/admin/PageHead";
import { PeakSilhouette } from "@/components/admin/marks";
import s from "@/components/admin/admin.module.css";
import { currentSeason, formatDate, todayISO } from "@/lib/admin/format";
import { moneyMessages } from "@/lib/admin/messages";
import { eur, euroInput } from "@/lib/admin/money";
import { requireAdmin } from "@/lib/admin/session";
import { createClient } from "@/lib/supabase/server";
import { addTransaction, deleteTransaction, saveBudget } from "./actions";

export const metadata: Metadata = { title: "Cuentas" };

interface Category {
  id: string;
  kind: "income" | "expense";
  name: string;
  key: string | null;
}

interface Movement {
  id: string;
  kind: "income" | "expense";
  occurred_on: string;
  amount_cents: number;
  description: string;
  counterparty: string | null;
  receipt_path: string | null;
  payment_id: string | null;
  category_id: string;
}

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ ano?: string; tipo?: string; ok?: string; error?: string }>;
}) {
  const me = await requireAdmin("accounts.read");
  const { ano, tipo, ok, error } = await searchParams;
  const year = /^\d{4}$/.test(ano ?? "") ? Number(ano) : currentSeason();
  const kindFilter = tipo === "ingresos" ? "income" : tipo === "gastos" ? "expense" : null;
  const canWrite = me.permissions.has("accounts.write");
  const supabase = await createClient();

  let movementsQuery = supabase
    .from("transactions")
    .select("id, kind, occurred_on, amount_cents, description, counterparty, receipt_path, payment_id, category_id")
    .gte("occurred_on", `${year}-01-01`)
    .lte("occurred_on", `${year}-12-31`)
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false });
  if (kindFilter) movementsQuery = movementsQuery.eq("kind", kindFilter);

  const [{ data: cats }, { data: movs }, { data: all }, { data: budgets }] = await Promise.all([
    supabase.from("categories").select("id, kind, name, key").eq("active", true).order("kind").order("sort"),
    movementsQuery,
    // Balance is all-time; a club this size never has enough rows for this to matter.
    supabase.from("transactions").select("kind, amount_cents, occurred_on, category_id"),
    supabase.from("budgets").select("category_id, amount_cents").eq("year", year),
  ]);

  const categories = (cats ?? []) as Category[];
  const catName = new Map(categories.map((c) => [c.id, c.name]));
  const movements = (movs ?? []) as Movement[];
  const everything = all ?? [];
  const sign = (k: string) => (k === "income" ? 1 : -1);
  const balance = everything.reduce((a, t) => a + sign(t.kind) * Number(t.amount_cents), 0);
  const inYear = everything.filter((t) => t.occurred_on.startsWith(String(year)));
  const income = inYear.filter((t) => t.kind === "income").reduce((a, t) => a + Number(t.amount_cents), 0);
  const expense = inYear.filter((t) => t.kind === "expense").reduce((a, t) => a + Number(t.amount_cents), 0);
  const actualByCat = new Map<string, number>();
  inYear.forEach((t) => actualByCat.set(t.category_id, (actualByCat.get(t.category_id) ?? 0) + Number(t.amount_cents)));
  const budgetByCat = new Map((budgets ?? []).map((b) => [b.category_id, Number(b.amount_cents)]));
  const budgetCats = categories.filter((c) => c.key !== "opening_balance");

  const tabHref = (t?: string) => `/admin/cuentas?ano=${year}${t ? `&tipo=${t}` : ""}`;

  return (
    <>
      <PageHead
        kicker={`Ejercicio ${year}`}
        title="Cuentas del club"
        actions={
          <>
            <Link href={`/admin/cuentas?ano=${year - 1}`} className={s.ghostButton} aria-label="Año anterior">← {year - 1}</Link>
            {year < currentSeason() && (
              <Link href={`/admin/cuentas?ano=${year + 1}`} className={s.ghostButton} aria-label="Año siguiente">{year + 1} →</Link>
            )}
            <a href={`/admin/cuentas/exportar?ano=${year}`} className={s.ghostButton}>CSV</a>
          </>
        }
      />
      <Notice ok={ok} error={error} messages={moneyMessages} />

      <section className={s.figures} aria-label="Resumen">
        <div className={s.figure}>
          <span className={s.figureLabel}>Saldo del club</span>
          <span className={s.figureValue}>{eur(balance)}</span>
          <span className={s.figureNote}>todo lo apuntado hasta hoy</span>
        </div>
        <div className={s.figure}>
          <span className={s.figureLabel}>Ingresos {year}</span>
          <span className={s.figureValue}>{eur(income)}</span>
        </div>
        <div className={s.figure}>
          <span className={s.figureLabel}>Gastos {year}</span>
          <span className={s.figureValue}>{eur(expense)}</span>
        </div>
        <div className={s.figure}>
          <span className={s.figureLabel}>Resultado {year}</span>
          <span className={s.figureValue} data-accent={income - expense < 0 ? "" : undefined}>{eur(income - expense)}</span>
        </div>
      </section>

      <div className={s.columns}>
        <section className={s.block} aria-labelledby="movimientos">
          <header className={s.blockHead}>
            <h2 id="movimientos" className={s.blockTitle}>Movimientos</h2>
            <div className={s.chips} role="group" aria-label="Tipo">
              <Link href={tabHref()} className={s.chip} aria-pressed={!kindFilter}>Todos</Link>
              <Link href={tabHref("ingresos")} className={s.chip} aria-pressed={kindFilter === "income"}>Ingresos</Link>
              <Link href={tabHref("gastos")} className={s.chip} aria-pressed={kindFilter === "expense"}>Gastos</Link>
            </div>
          </header>
          {movements.length ? (
            <ul className={s.ledger}>
              {movements.map((m) => (
                <li key={m.id} className={s.ledgerRow}>
                  <span className={s.deadlineDate}>{formatDate(m.occurred_on, { day: "numeric", month: "short" })}</span>
                  <span>
                    {m.description}
                    <span className={s.adminMeta}>
                      {" · "}
                      {catName.get(m.category_id)}
                      {m.counterparty ? ` · ${m.counterparty}` : ""}
                      {m.payment_id ? " · desde cuotas" : ""}
                    </span>
                    {m.receipt_path && (
                      <a href={`/admin/cuentas/justificante/${m.id}`} className={s.linkButton} target="_blank" rel="noopener">
                        Justificante
                      </a>
                    )}
                    {canWrite && !m.payment_id && (
                      <form action={deleteTransaction} className={s.inline}>
                        <input type="hidden" name="id" value={m.id} />
                        <input type="hidden" name="year" value={year} />
                        <button type="submit" className={s.linkButton}>Borrar</button>
                      </form>
                    )}
                  </span>
                  <span className={s.num} data-sign={m.kind === "income" ? "in" : "out"}>
                    {m.kind === "income" ? "+" : "−"}
                    {eur(m.amount_cents)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className={s.empty}>
              <PeakSilhouette className={s.emptyPeak} />
              <p className={s.emptyTitle}>Sin movimientos en {year}</p>
              <p className={s.emptyText}>
                {canWrite ? "Empieza apuntando el saldo inicial de la cuenta del club." : "Aún no se ha apuntado nada."}
              </p>
            </div>
          )}
        </section>

        {canWrite && (
          <section className={s.block} aria-labelledby="apuntar">
            <header className={s.blockHead}>
              <h2 id="apuntar" className={s.blockTitle}>Apuntar movimiento</h2>
            </header>
            <form action={addTransaction} className={s.formStack}>
              <input type="hidden" name="year" value={year} />
              <div className={s.chips} role="radiogroup" aria-label="Tipo de movimiento">
                <label className={s.radioChip}>
                  <input type="radio" name="kind" value="expense" defaultChecked /> Gasto
                </label>
                <label className={s.radioChip}>
                  <input type="radio" name="kind" value="income" /> Ingreso
                </label>
              </div>
              <label className={s.field}>
                <span>Descripción</span>
                <input name="description" className={s.input} placeholder="Avituallamiento salida Navachica" required />
              </label>
              <div className={s.fieldRow}>
                <label className={s.field}>
                  <span>Importe (€)</span>
                  <input name="amount" inputMode="decimal" className={s.input} required />
                </label>
                <label className={s.field}>
                  <span>Fecha</span>
                  <input name="occurred_on" type="date" defaultValue={todayISO()} className={s.input} />
                </label>
              </div>
              <label className={s.field}>
                <span>Categoría</span>
                <select name="category_id" className={s.input} required>
                  <optgroup label="Gastos">
                    {categories.filter((c) => c.kind === "expense").map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Ingresos">
                    {categories.filter((c) => c.kind === "income").map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </optgroup>
                </select>
              </label>
              <label className={s.field}>
                <span>Quién (tienda, patrocinador…)</span>
                <input name="counterparty" className={s.input} placeholder="Opcional" />
              </label>
              <label className={s.field}>
                <span>Justificante (PDF o foto, máx. 4 MB)</span>
                <input name="receipt" type="file" accept="application/pdf,image/*" className={s.input} />
              </label>
              <div>
                <button type="submit" className={s.primaryButton}>Apuntar</button>
              </div>
            </form>
          </section>
        )}
      </div>

      <section className={s.block} aria-labelledby="presupuesto">
        <header className={s.blockHead}>
          <h2 id="presupuesto" className={s.blockTitle}>Presupuesto {year}</h2>
          <p className={s.blockMeta}>Lo previsto frente a lo apuntado, por categoría.</p>
        </header>
        <form action={saveBudget}>
          <input type="hidden" name="year" value={year} />
          <table className={s.table}>
            <thead>
              <tr>
                <th scope="col">Categoría</th>
                <th scope="col" className={s.num}>Previsto</th>
                <th scope="col" className={s.num}>Real</th>
                <th scope="col" className={s.num}>Diferencia</th>
              </tr>
            </thead>
            <tbody>
              {(["income", "expense"] as const).map((kind) =>
                budgetCats
                  .filter((c) => c.kind === kind)
                  .map((c, i) => {
                    const planned = budgetByCat.get(c.id);
                    const actual = actualByCat.get(c.id) ?? 0;
                    if (!canWrite && planned === undefined && !actual) return null;
                    return (
                      <tr key={c.id}>
                        <td>
                          {i === 0 && <span className={s.kindTag}>{kind === "income" ? "Ingresos" : "Gastos"}</span>}
                          {c.name}
                        </td>
                        <td className={s.num}>
                          {canWrite ? (
                            <input name={`budget_${c.id}`} inputMode="decimal" defaultValue={planned === undefined ? "" : planned === 0 ? "0" : euroInput(planned)} className={s.budgetInput} aria-label={`Previsto ${c.name}`} />
                          ) : planned === undefined ? "—" : eur(planned)}
                        </td>
                        <td className={s.num}>{actual ? eur(actual) : "—"}</td>
                        <td className={s.num}>
                          {planned === undefined ? "—" : (
                            <span data-over={kind === "expense" ? (actual > planned ? "" : undefined) : (actual < planned ? "" : undefined)}>
                              {eur(actual - planned)}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  }),
              )}
            </tbody>
          </table>
          {canWrite && (
            <div style={{ marginTop: 12 }}>
              <button type="submit" className={s.secondaryButton}>Guardar presupuesto</button>
            </div>
          )}
        </form>
      </section>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Notice } from "@/components/admin/Notice";
import { PageHead } from "@/components/admin/PageHead";
import s from "@/components/admin/admin.module.css";
import { todayISO } from "@/lib/admin/format";
import { moneyMessages } from "@/lib/admin/messages";
import { eur, euroInput, periodicityLabels, type Periodicity } from "@/lib/admin/money";
import { requireAdmin } from "@/lib/admin/session";
import { createClient } from "@/lib/supabase/server";
import { assignFeeToAll, saveFeeType } from "../actions";

export const metadata: Metadata = { title: "Tipos de cuota" };

interface FeeType {
  id: string;
  name: string;
  default_amount_cents: number;
  periodicity: Periodicity;
  category_id: string | null;
  active: boolean;
  member_fees: { id: string; ends_on: string | null }[];
}

function FeeTypeFields({ f, categories }: { f?: FeeType; categories: { id: string; name: string }[] }) {
  return (
    <>
      <div className={s.fieldRow}>
        <label className={s.field}>
          <span>Nombre</span>
          <input name="name" defaultValue={f?.name} className={s.input} placeholder="Cuota anual, Licencia FAM…" required />
        </label>
        <label className={s.field}>
          <span>Importe (€)</span>
          <input name="amount" inputMode="decimal" defaultValue={euroInput(f?.default_amount_cents)} className={s.input} required />
        </label>
      </div>
      <div className={s.fieldRow}>
        <label className={s.field}>
          <span>Periodicidad</span>
          <select name="periodicity" defaultValue={f?.periodicity ?? "annual"} className={s.input}>
            {Object.entries(periodicityLabels).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </label>
        <label className={s.field}>
          <span>Categoría de ingreso</span>
          <select name="category_id" defaultValue={f?.category_id ?? ""} className={s.input}>
            <option value="">Cuotas de socios</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
      </div>
    </>
  );
}

export default async function FeeTypesPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const me = await requireAdmin("fees.read");
  const { ok, error } = await searchParams;
  const canWrite = me.permissions.has("fees.write");
  const supabase = await createClient();
  const returnTo = "/admin/cuotas/tipos";

  const [{ data }, { data: categories }] = await Promise.all([
    supabase.from("fee_types").select("id, name, default_amount_cents, periodicity, category_id, active, member_fees(id, ends_on)").order("active", { ascending: false }).order("name"),
    supabase.from("categories").select("id, name, key").eq("kind", "income").eq("active", true).order("sort"),
  ]);
  const feeTypes = (data ?? []) as FeeType[];
  const incomeCats = (categories ?? []).filter((c) => c.key !== "member_fees" && c.key !== "opening_balance");

  return (
    <>
      <PageHead
        kicker="Cuotas"
        title="Tipos de cuota"
        actions={<Link href="/admin/cuotas" className={s.ghostButton}>Volver a cuotas</Link>}
      />
      <Notice ok={ok} error={error} messages={moneyMessages} />

      {feeTypes.length > 0 && (
        <ul className={s.adminList}>
          {feeTypes.map((f) => {
            const assigned = f.member_fees.filter((m) => !m.ends_on).length;
            return (
              <li key={f.id} className={s.adminItem} data-inactive={f.active ? undefined : ""}>
                <div className={s.adminWho}>
                  <span className={s.strong}>{f.name}</span>
                  <span className={s.adminMeta}>
                    {eur(f.default_amount_cents)} · {periodicityLabels[f.periodicity]} · {assigned} miembros
                    {!f.active && " · archivada"}
                  </span>
                </div>
                {canWrite ? (
                  <details className={s.adminEdit}>
                    <summary className={s.linkButton}>Editar</summary>
                    <form action={saveFeeType} className={s.formStack}>
                      <input type="hidden" name="id" value={f.id} />
                      <input type="hidden" name="return_to" value={returnTo} />
                      <FeeTypeFields f={f} categories={incomeCats} />
                      <label className={s.checkLine}>
                        <input type="checkbox" name="active" value="true" defaultChecked={f.active} />
                        <span>En uso (desmarca para archivarla)</span>
                      </label>
                      <input type="hidden" name="active" value="false" />
                      <button type="submit" className={s.secondaryButton}>Guardar</button>
                    </form>
                  </details>
                ) : (
                  <span />
                )}
                {canWrite && f.active && (
                  <form action={assignFeeToAll}>
                    <input type="hidden" name="fee_type_id" value={f.id} />
                    <input type="hidden" name="starts_on" value={todayISO()} />
                    <input type="hidden" name="return_to" value={returnTo} />
                    <button type="submit" className={s.linkButton}>Asignar a todos los activos</button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {canWrite && (
        <section className={s.block} aria-labelledby="nuevo-tipo" style={{ marginTop: 32 }}>
          <header className={s.blockHead}>
            <h2 id="nuevo-tipo" className={s.blockTitle}>Nuevo tipo de cuota</h2>
            <p className={s.blockMeta}>Anual, semestral, licencia… Luego se asigna a quien la pague.</p>
          </header>
          <form action={saveFeeType} className={s.formStack}>
            <input type="hidden" name="return_to" value={returnTo} />
            <FeeTypeFields categories={incomeCats} />
            <div>
              <button type="submit" className={s.primaryButton}>Crear tipo de cuota</button>
            </div>
          </form>
        </section>
      )}
    </>
  );
}

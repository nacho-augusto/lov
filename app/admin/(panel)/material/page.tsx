import type { Metadata } from "next";
import { Notice } from "@/components/admin/Notice";
import { PageHead } from "@/components/admin/PageHead";
import { PeakSilhouette } from "@/components/admin/marks";
import s from "@/components/admin/admin.module.css";
import { extrasMessages } from "@/lib/admin/extras";
import { formatDate, fullName, todayISO } from "@/lib/admin/format";
import { requireAdmin } from "@/lib/admin/session";
import { createClient } from "@/lib/supabase/server";
import { lendGear, returnGear, saveGearItem } from "./actions";

export const metadata: Metadata = { title: "Material del club" };

interface Loan {
  id: string;
  out_on: string;
  returned_on: string | null;
  notes: string | null;
  members: { id: string; first_name: string; last_name: string } | null;
}

interface Item {
  id: string;
  name: string;
  code: string | null;
  notes: string | null;
  active: boolean;
  gear_loans: Loan[];
}

function ItemFields({ i }: { i?: Item }) {
  return (
    <>
      <div className={s.fieldRow}>
        <label className={s.field}>
          <span>Nombre</span>
          <input name="name" defaultValue={i?.name} className={s.input} placeholder="Walkie, botiquín, carpa…" required />
        </label>
        <label className={s.field}>
          <span>Código (opcional)</span>
          <input name="code" defaultValue={i?.code ?? ""} className={s.input} placeholder="WT-01" />
        </label>
      </div>
      <label className={s.field}>
        <span>Notas</span>
        <input name="notes" defaultValue={i?.notes ?? ""} className={s.input} />
      </label>
    </>
  );
}

export default async function GearPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const me = await requireAdmin("gear.read");
  const { ok, error } = await searchParams;
  const canWrite = me.permissions.has("gear.write");
  const canSeeMembers = me.permissions.has("members.read");
  const supabase = await createClient();
  const [{ data }, { data: members }] = await Promise.all([
    supabase
      .from("gear_items")
      .select(`id, name, code, notes, active, gear_loans(id, out_on, returned_on, notes${canSeeMembers ? ", members(id, first_name, last_name)" : ""})`)
      .order("active", { ascending: false })
      .order("name"),
    canWrite && canSeeMembers
      ? supabase.from("members").select("id, first_name, last_name").eq("active", true).order("first_name").order("last_name")
      : Promise.resolve({ data: [] }),
  ]);
  const items = (data ?? []) as unknown as Item[];
  const lent = items.filter((i) => i.gear_loans.some((l) => !l.returned_on)).length;

  return (
    <>
      <PageHead kicker="Club" title="Material del club" />
      <Notice ok={ok} error={error} messages={extrasMessages} />
      {items.length > 0 && (
        <p className={s.blockMeta} style={{ marginBottom: 16 }}>
          {items.filter((i) => i.active).length} cosas en el inventario · {lent} prestadas ahora
        </p>
      )}

      {items.length ? (
        <ul className={s.adminList}>
          {items.map((i) => {
            const loans = [...i.gear_loans].sort((a, b) => b.out_on.localeCompare(a.out_on));
            const open = loans.find((l) => !l.returned_on);
            const history = loans.filter((l) => l.returned_on).slice(0, 5);
            return (
              <li key={i.id} className={s.adminItem} data-inactive={i.active ? undefined : ""}>
                <div className={s.adminWho}>
                  <span className={s.strong}>
                    {i.name}
                    {i.code && <span className={s.adminMeta}> · {i.code}</span>}
                  </span>
                  <span className={s.adminMeta}>
                    {open
                      ? `Lo tiene ${open.members ? fullName(open.members) : "un miembro"} desde el ${formatDate(open.out_on)}`
                      : i.active
                        ? "En el club"
                        : "Dado de baja"}
                    {open?.notes && ` · ${open.notes}`}
                  </span>
                  {history.length > 0 && (
                    <span className={s.adminMeta}>
                      Antes: {history.map((l) => `${l.members ? fullName(l.members) : "—"} (${formatDate(l.out_on, { day: "numeric", month: "short" })}–${formatDate(l.returned_on, { day: "numeric", month: "short" })})`).join(", ")}
                    </span>
                  )}
                </div>
                {canWrite ? (
                  <details className={s.adminEdit}>
                    <summary className={s.linkButton}>{open || !i.active ? "Editar" : "Prestar o editar"}</summary>
                    {!open && i.active && (members ?? []).length > 0 && (
                      <form action={lendGear} className={s.formStack}>
                        <input type="hidden" name="item_id" value={i.id} />
                        <div className={s.fieldRow}>
                          <label className={s.field}>
                            <span>Se lo lleva</span>
                            <select name="member_id" className={s.input} required defaultValue="">
                              <option value="" disabled>Elige un miembro</option>
                              {(members ?? []).map((m) => (
                                <option key={m.id} value={m.id}>{fullName(m)}</option>
                              ))}
                            </select>
                          </label>
                          <label className={s.field}>
                            <span>Desde</span>
                            <input name="out_on" type="date" defaultValue={todayISO()} className={s.input} />
                          </label>
                        </div>
                        <label className={s.field}>
                          <span>Nota (opcional)</span>
                          <input name="notes" className={s.input} placeholder="Para la travesía de Sierra Nevada…" />
                        </label>
                        <div>
                          <button type="submit" className={s.secondaryButton}>Apuntar préstamo</button>
                        </div>
                      </form>
                    )}
                    <form action={saveGearItem} className={s.formStack} style={{ marginTop: 14 }}>
                      <input type="hidden" name="id" value={i.id} />
                      <ItemFields i={i} />
                      <label className={s.checkLine}>
                        <input type="checkbox" name="active" value="true" defaultChecked={i.active} />
                        <span>En el inventario (desmarca si se pierde o se tira)</span>
                      </label>
                      <input type="hidden" name="active" value="false" />
                      <button type="submit" className={s.secondaryButton}>Guardar</button>
                    </form>
                  </details>
                ) : (
                  <span />
                )}
                {canWrite && open ? (
                  <form action={returnGear}>
                    <input type="hidden" name="id" value={open.id} />
                    <button type="submit" className={s.linkButton}>Devuelto hoy</button>
                  </form>
                ) : (
                  <span />
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <div className={s.empty}>
          <PeakSilhouette className={s.emptyPeak} />
          <p className={s.emptyTitle}>Inventario vacío</p>
          <p className={s.emptyText}>Apunta walkies, botiquines o la carpa y sabrás siempre quién los tiene.</p>
        </div>
      )}

      {canWrite && (
        <section className={s.block} aria-labelledby="nuevo-material" style={{ marginTop: 32 }}>
          <header className={s.blockHead}>
            <h2 id="nuevo-material" className={s.blockTitle}>Añadir material</h2>
          </header>
          <form action={saveGearItem} className={s.formStack}>
            <ItemFields />
            <div>
              <button type="submit" className={s.primaryButton}>Añadir</button>
            </div>
          </form>
        </section>
      )}
    </>
  );
}

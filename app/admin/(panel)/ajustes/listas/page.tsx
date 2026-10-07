import type { Metadata } from "next";
import { Notice } from "@/components/admin/Notice";
import { PageHead } from "@/components/admin/PageHead";
import s from "@/components/admin/admin.module.css";
import { requireAdmin } from "@/lib/admin/session";
import { createClient } from "@/lib/supabase/server";
import { saveCategory, saveTemplate } from "./actions";

export const metadata: Metadata = { title: "Categorías y trámites" };

const messages: Record<string, string> = {
  categoria: "Categoría guardada.",
  tramite: "Trámite guardado.",
  nombre: "Falta el nombre.",
  tipo: "Elige si es de ingreso o de gasto.",
  "categoria-repetida": "Ya hay una categoría con ese nombre.",
  guardar: "No se ha podido guardar. Inténtalo de nuevo.",
};

interface Category {
  id: string;
  key: string | null;
  kind: "income" | "expense";
  name: string;
  active: boolean;
  sort: number;
}

interface Template {
  id: string;
  name: string;
  description: string | null;
  yearly: boolean;
  active: boolean;
  sort: number;
}

function ActiveToggle({ active, label }: { active: boolean; label: string }) {
  return (
    <>
      <label className={s.checkLine}>
        <input type="checkbox" name="active" value="true" defaultChecked={active} />
        <span>{label}</span>
      </label>
      <input type="hidden" name="active" value="false" />
    </>
  );
}

function CategoryList({ title, items, canWrite }: { title: string; items: Category[]; canWrite: boolean }) {
  return (
    <>
      <h3 className={s.fieldsetLegend}>{title}</h3>
      <ul className={s.adminList}>
        {items.map((c) => (
          <li key={c.id} className={s.adminItem} data-inactive={c.active ? undefined : ""}>
            <div className={s.adminWho}>
              <span className={s.strong}>{c.name}</span>
              <span className={s.adminMeta}>
                {c.key ? "La usa el panel automáticamente" : `Orden ${c.sort}`}
                {!c.active && " · archivada"}
              </span>
            </div>
            {canWrite && !c.key ? (
              <details className={s.adminEdit}>
                <summary className={s.linkButton}>Editar</summary>
                <form action={saveCategory} className={s.formStack}>
                  <input type="hidden" name="id" value={c.id} />
                  <div className={s.fieldRow}>
                    <label className={s.field}>
                      <span>Nombre</span>
                      <input name="name" defaultValue={c.name} className={s.input} required />
                    </label>
                    <label className={s.field}>
                      <span>Orden</span>
                      <input name="sort" type="number" min={0} max={9999} defaultValue={c.sort} className={s.input} />
                    </label>
                  </div>
                  <ActiveToggle active={c.active} label="En uso (desmarca para archivarla; los movimientos la conservan)" />
                  <button type="submit" className={s.secondaryButton}>Guardar</button>
                </form>
              </details>
            ) : (
              <span />
            )}
          </li>
        ))}
      </ul>
    </>
  );
}

export default async function ListsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const me = await requireAdmin();
  const can = (p: string) => me.permissions.has(p);
  const { ok, error } = await searchParams;
  const supabase = await createClient();
  const none = Promise.resolve({ data: null });

  const [{ data: cats }, { data: tpls }] = await Promise.all([
    can("accounts.read") ? supabase.from("categories").select("id, key, kind, name, active, sort").order("sort").order("name") : none,
    can("members.read")
      ? supabase.from("requirement_templates").select("id, name, description, yearly, active, sort").order("sort").order("name")
      : none,
  ]);
  const categories = (cats ?? []) as Category[];
  const templates = (tpls ?? []) as Template[];
  const canCats = can("accounts.write");
  const canTpls = can("members.write");

  return (
    <>
      <PageHead kicker="Ajustes" title="Categorías y trámites" />
      <Notice ok={ok} error={error} messages={messages} />

      <div className={s.stack}>
        {can("accounts.read") && (
          <section className={s.block} aria-labelledby="categorias">
            <header className={s.blockHead}>
              <h2 id="categorias" className={s.blockTitle}>Categorías de las cuentas</h2>
              <p className={s.blockMeta}>Para clasificar ingresos y gastos, y para el presupuesto.</p>
            </header>
            <CategoryList title="Ingresos" items={categories.filter((c) => c.kind === "income")} canWrite={canCats} />
            <CategoryList title="Gastos" items={categories.filter((c) => c.kind === "expense")} canWrite={canCats} />
            {canCats && (
              <form action={saveCategory} className={s.formStack} style={{ marginTop: 24 }}>
                <h3 className={s.fieldsetLegend}>Nueva categoría</h3>
                <div className={s.fieldRow}>
                  <label className={s.field}>
                    <span>Nombre</span>
                    <input name="name" className={s.input} placeholder="Rifas, Alquiler de local…" required />
                  </label>
                  <label className={s.field}>
                    <span>Tipo</span>
                    <select name="kind" defaultValue="expense" className={s.input}>
                      <option value="income">Ingreso</option>
                      <option value="expense">Gasto</option>
                    </select>
                  </label>
                  <label className={s.field}>
                    <span>Orden</span>
                    <input name="sort" type="number" min={0} max={9999} defaultValue={50} className={s.input} />
                  </label>
                </div>
                <div>
                  <button type="submit" className={s.primaryButton}>Crear categoría</button>
                </div>
              </form>
            )}
          </section>
        )}

        {can("members.read") && (
          <section className={s.block} aria-labelledby="tramites">
            <header className={s.blockHead}>
              <h2 id="tramites" className={s.blockTitle}>Trámites de alta</h2>
              <p className={s.blockMeta}>
                La lista que se crea a cada miembro nuevo. Los anuales se renuevan al abrir temporada.
              </p>
            </header>
            <ul className={s.adminList}>
              {templates.map((t) => (
                <li key={t.id} className={s.adminItem} data-inactive={t.active ? undefined : ""}>
                  <div className={s.adminWho}>
                    <span className={s.strong}>{t.name}</span>
                    <span className={s.adminMeta}>
                      {t.yearly ? "Cada temporada" : "Una vez"}
                      {t.description && ` · ${t.description}`}
                      {!t.active && " · archivado"}
                    </span>
                  </div>
                  {canTpls ? (
                    <details className={s.adminEdit}>
                      <summary className={s.linkButton}>Editar</summary>
                      <form action={saveTemplate} className={s.formStack}>
                        <input type="hidden" name="id" value={t.id} />
                        <div className={s.fieldRow}>
                          <label className={s.field}>
                            <span>Nombre</span>
                            <input name="name" defaultValue={t.name} className={s.input} required />
                          </label>
                          <label className={s.field}>
                            <span>Orden</span>
                            <input name="sort" type="number" min={0} max={9999} defaultValue={t.sort} className={s.input} />
                          </label>
                        </div>
                        <label className={s.field}>
                          <span>Descripción</span>
                          <input name="description" defaultValue={t.description ?? ""} className={s.input} />
                        </label>
                        <ActiveToggle active={t.active} label="En uso (desmarca para que no se pida a nadie más)" />
                        <button type="submit" className={s.secondaryButton}>Guardar</button>
                      </form>
                    </details>
                  ) : (
                    <span />
                  )}
                </li>
              ))}
            </ul>
            {canTpls && (
              <form action={saveTemplate} className={s.formStack} style={{ marginTop: 24 }}>
                <h3 className={s.fieldsetLegend}>Nuevo trámite</h3>
                <div className={s.fieldRow}>
                  <label className={s.field}>
                    <span>Nombre</span>
                    <input name="name" className={s.input} placeholder="Certificado médico, Foto…" required />
                  </label>
                  <label className={s.field}>
                    <span>Orden</span>
                    <input name="sort" type="number" min={0} max={9999} defaultValue={50} className={s.input} />
                  </label>
                </div>
                <label className={s.field}>
                  <span>Descripción (opcional)</span>
                  <input name="description" className={s.input} />
                </label>
                <label className={s.checkLine}>
                  <input type="checkbox" name="yearly" />
                  <span>Se renueva cada temporada (no se puede cambiar después)</span>
                </label>
                <div>
                  <button type="submit" className={s.primaryButton}>Crear trámite</button>
                </div>
              </form>
            )}
          </section>
        )}
      </div>
    </>
  );
}

import type { Metadata } from "next";
import { PageHead } from "@/components/admin/PageHead";
import s from "@/components/admin/admin.module.css";
import { requireAdmin } from "@/lib/admin/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Registro de cambios" };

const tableLabels: Record<string, string> = {
  admin_users: "Administradores",
  admin_user_roles: "Roles",
  invitations: "Invitaciones",
  members: "Miembros",
  member_private: "Datos sensibles",
  requirement_templates: "Plantillas de trámites",
  member_requirements: "Trámites",
  federation_licences: "Licencias",
  categories: "Categorías",
  transactions: "Movimientos",
  budgets: "Presupuesto",
  fee_types: "Tipos de cuota",
  member_fees: "Cuotas asignadas",
  charges: "Cargos",
  payments: "Pagos",
  grants: "Subvenciones",
  grant_requirements: "Documentos de subvención",
  grant_documents: "Archivos de subvención",
  league_entries: "Liga",
  email_templates: "Plantillas de correo",
  club_documents: "Documentos del club",
  events: "Actividades",
  event_signups: "Inscripciones",
  gear_items: "Material",
  gear_loans: "Préstamos de material",
};
const actionLabels: Record<string, string> = { insert: "Alta", update: "Cambio", delete: "Borrado" };
const IGNORED = new Set(["updated_at", "created_at", "id"]);

// Which fields an update touched (values are not shown: they may be personal data).
function changedFields(oldData: Record<string, unknown> | null, newData: Record<string, unknown> | null) {
  if (!oldData || !newData) return [];
  return Object.keys(newData).filter((k) => !IGNORED.has(k) && JSON.stringify(oldData[k]) !== JSON.stringify(newData[k]));
}

export default async function AuditPage() {
  await requireAdmin("audit.read");
  const supabase = await createClient();
  const [{ data: rows }, { data: admins }] = await Promise.all([
    supabase.from("audit_log").select("id, table_name, action, old_data, new_data, actor, at").order("at", { ascending: false }).limit(150),
    supabase.from("admin_users").select("id, full_name, email"),
  ]);
  const who = new Map((admins ?? []).map((a) => [a.id, a.full_name ?? a.email]));
  const when = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid" });

  return (
    <>
      <PageHead kicker="Ajustes" title="Registro de cambios" />
      <p className={s.blockMeta} style={{ marginBottom: 16 }}>
        Los últimos 150 cambios hechos en el panel. Se guarda quién y qué, pero aquí no se muestran valores para no exponer datos personales.
      </p>
      <div className={s.tableScroll}>
        <table className={s.table}>
          <thead>
            <tr>
              <th scope="col">Cuándo</th>
              <th scope="col">Quién</th>
              <th scope="col">Qué</th>
              <th scope="col">Detalle</th>
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).map((r) => {
              const fields = r.action === "update" ? changedFields(r.old_data, r.new_data) : [];
              return (
                <tr key={r.id}>
                  <td className={s.adminMeta}>{when.format(new Date(r.at))}</td>
                  <td>{r.actor ? who.get(r.actor) ?? "Administrador retirado" : "Sistema"}</td>
                  <td>
                    <span className={s.strong}>{actionLabels[r.action] ?? r.action}</span> · {tableLabels[r.table_name] ?? r.table_name}
                  </td>
                  <td className={s.adminMeta}>{fields.length ? fields.join(", ") : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

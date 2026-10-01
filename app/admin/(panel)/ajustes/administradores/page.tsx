import type { Metadata } from "next";
import { PageHead } from "@/components/admin/PageHead";
import s from "@/components/admin/admin.module.css";
import { requireAdmin, roleLabels, roleOrder, type Role } from "@/lib/admin/session";
import { createClient } from "@/lib/supabase/server";
import { inviteAdmin, revokeInvitation, setAdminActive, setAdminRoles } from "./actions";

export const metadata: Metadata = { title: "Administradores" };

const messages: Record<string, string> = {
  invitado: "Invitación creada. Avísale de que entre en el panel con ese correo.",
  "invitacion-anulada": "Invitación anulada.",
  desactivado: "Acceso retirado.",
  reactivado: "Acceso devuelto.",
  roles: "Roles actualizados.",
  correo: "Ese correo no parece válido.",
  "sin-roles": "Elige al menos un rol.",
  "ya-admin": "Esa persona ya es administradora.",
  "ya-invitado": "Ya hay una invitación pendiente para ese correo.",
  "a-ti-mismo": "No puedes quitarte el acceso a ti mismo.",
  "ultimo-propietario": "El club debe tener siempre al menos un propietario activo.",
  guardar: "No se ha podido guardar. Inténtalo de nuevo.",
};

const roleHelp: Record<Role, string> = {
  owner: "Todo, incluidos administradores",
  treasurer: "Cuentas y cuotas",
  secretary: "Miembros, subvenciones y correos",
  league: "Liga interna",
  viewer: "Ver sin cambiar nada",
};

const date = (iso: string) =>
  new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Madrid" }).format(new Date(iso));

function RoleChecks({ selected, idPrefix }: { selected: Role[]; idPrefix: string }) {
  return (
    <fieldset className={s.roleChecks}>
      <legend className={s.srOnly}>Roles</legend>
      {roleOrder.map((r) => (
        <label key={r} htmlFor={`${idPrefix}-${r}`} className={s.roleCheck}>
          <input id={`${idPrefix}-${r}`} type="checkbox" name="roles" value={r} defaultChecked={selected.includes(r)} />
          <span>
            <strong>{roleLabels[r]}</strong>
            <small>{roleHelp[r]}</small>
          </span>
        </label>
      ))}
    </fieldset>
  );
}

export default async function AdminsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const me = await requireAdmin("admins.manage");
  const { ok, error } = await searchParams;
  const message = messages[ok ?? error ?? ""];
  const supabase = await createClient();

  const [{ data: admins }, { data: invitations }] = await Promise.all([
    supabase
      .from("admin_users")
      .select("id, email, full_name, active, created_at, admin_user_roles(role)")
      .order("active", { ascending: false })
      .order("created_at"),
    supabase
      .from("invitations")
      .select("id, email, full_name, roles, created_at")
      .is("accepted_at", null)
      .is("revoked_at", null)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <>
      <PageHead kicker="Ajustes" title="Administradores" />

      {message && (
        <p className={s.notice} data-tone={ok ? "ok" : "error"} role={ok ? "status" : "alert"}>
          {message}
        </p>
      )}

      <section className={s.block} aria-labelledby="equipo">
        <header className={s.blockHead}>
          <h2 id="equipo" className={s.blockTitle}>La junta en el panel</h2>
          <p className={s.blockMeta}>Nadie puede registrarse: solo entra quien invitáis aquí.</p>
        </header>
        <ul className={s.adminList}>
          {(admins ?? []).map((a) => {
            const roles = ((a.admin_user_roles ?? []) as { role: Role }[]).map((r) => r.role);
            const isMe = a.id === me.id;
            return (
              <li key={a.id} className={s.adminItem} data-inactive={a.active ? undefined : ""}>
                <div className={s.adminWho}>
                  <span className={s.strong}>
                    {a.full_name ?? a.email}
                    {isMe && <span className={s.meTag}>tú</span>}
                  </span>
                  <span className={s.adminMeta}>
                    {a.email} · desde {date(a.created_at)}
                    {!a.active && " · sin acceso"}
                  </span>
                </div>
                <details className={s.adminEdit}>
                  <summary className={s.linkButton}>
                    {roleOrder.filter((r) => roles.includes(r)).map((r) => roleLabels[r]).join(" · ") || "Sin roles"}
                  </summary>
                  <form action={setAdminRoles} className={s.formStack}>
                    <input type="hidden" name="id" value={a.id} />
                    <RoleChecks selected={roles} idPrefix={`roles-${a.id}`} />
                    <button type="submit" className={s.secondaryButton}>Guardar roles</button>
                  </form>
                </details>
                {!isMe && (
                  <form action={setAdminActive}>
                    <input type="hidden" name="id" value={a.id} />
                    <input type="hidden" name="active" value={String(!a.active)} />
                    <button type="submit" className={s.linkButton}>
                      {a.active ? "Quitar acceso" : "Devolver acceso"}
                    </button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <div className={s.columns}>
        <section className={s.block} aria-labelledby="invitar">
          <header className={s.blockHead}>
            <h2 id="invitar" className={s.blockTitle}>Invitar</h2>
          </header>
          <form action={inviteAdmin} className={s.formStack}>
            <div className={s.fieldRow}>
              <label className={s.field}>
                <span>Nombre</span>
                <input name="full_name" className={s.input} autoComplete="off" placeholder="Opcional" />
              </label>
              <label className={s.field}>
                <span>Correo</span>
                <input name="email" type="email" required className={s.input} autoComplete="off" placeholder="nombre@correo.com" />
              </label>
            </div>
            <RoleChecks selected={["viewer"]} idPrefix="invite" />
            <div>
              <button type="submit" className={s.primaryButton}>Crear invitación</button>
            </div>
          </form>
        </section>

        <section className={s.block} aria-labelledby="pendientes">
          <header className={s.blockHead}>
            <h2 id="pendientes" className={s.blockTitle}>Invitaciones pendientes</h2>
          </header>
          {invitations?.length ? (
            <ul className={s.ledger}>
              {invitations.map((i) => (
                <li key={i.id}>
                  <span className={s.deadlineDate}>{date(i.created_at)}</span>
                  <span>
                    <span className={s.strong}>{i.full_name ?? i.email}</span>
                    <span className={s.adminMeta}>
                      {" "}
                      {(i.roles as Role[]).map((r) => roleLabels[r]).join(" · ")}
                    </span>
                  </span>
                  <form action={revokeInvitation}>
                    <input type="hidden" name="id" value={i.id} />
                    <button type="submit" className={s.linkButton}>Anular</button>
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <p className={s.emptyText}>No hay invitaciones pendientes.</p>
          )}
        </section>
      </div>
    </>
  );
}

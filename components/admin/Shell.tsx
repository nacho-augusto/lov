import Image from "next/image";
import Link from "next/link";
import { signOut } from "@/app/admin/login/actions";
import { roleLabels, type AdminSession } from "@/lib/admin/session";
import { Nav, type NavItem } from "./Nav";
import s from "./admin.module.css";

// Sections appear only with the permission to read them; unbuilt ones stay greyed out.
function navFor(admin: AdminSession): NavItem[] {
  const can = (p: string) => admin.permissions.has(p);
  const items: (NavItem & { show: boolean })[] = [
    { label: "Inicio", href: "/admin", show: true },
    { label: "Miembros", href: "/admin/miembros", show: can("members.read") },
    { label: "Cuentas", href: "/admin/cuentas", show: can("accounts.read") },
    { label: "Cuotas", href: "/admin/cuotas", show: can("fees.read") },
    { label: "Subvenciones", href: "/admin/subvenciones", show: can("grants.read") },
    { label: "Liga interna", href: "/admin/liga", show: can("league.read") },
    { label: "Comunicaciones", href: "/admin/comunicaciones", show: can("comms.read") },
    { label: "Administradores", href: "/admin/ajustes/administradores", show: can("admins.manage") },
  ];
  return items.filter((i) => i.show).map(({ label, href }) => ({ label, href }));
}

export function Shell({ admin, children }: { admin: AdminSession; children: React.ReactNode }) {
  return (
    <div className={s.shell}>
      <aside className={s.sidebar}>
        <Link href="/admin" className={s.sidebarLogo} aria-label="Inicio">
          <Image src="/logo/logo-mark.png" alt="C.D. La Otra Vertiente" width={640} height={192} className={s.logoDay} priority />
          <Image src="/logo/logo-light.png" alt="" width={640} height={192} className={s.logoNight} priority />
        </Link>
        <p className={s.sidebarTag}>Panel de la junta</p>
        <Nav items={navFor(admin)} />
        <div className={s.sidebarFoot}>
          <span className={s.who}>{admin.fullName ?? admin.email}</span>
          <span className={s.role}>{admin.roles.map((r) => roleLabels[r]).join(" · ")}</span>
          <form action={signOut}>
            <button type="submit" className={s.signOut}>
              Salir
            </button>
          </form>
        </div>
      </aside>
      <main className={s.main}>{children}</main>
    </div>
  );
}

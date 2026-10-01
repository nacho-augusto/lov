import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import s from "./admin.module.css";

const nav = [
  { key: "inicio", label: "Inicio", href: "/admin-maqueta/inicio" },
  { key: "miembros", label: "Miembros", href: null },
  { key: "cuentas", label: "Cuentas", href: null },
  { key: "cuotas", label: "Cuotas", href: null },
  { key: "subvenciones", label: "Subvenciones", href: null },
  { key: "liga", label: "Liga interna", href: "/admin-maqueta/liga" },
  { key: "comunicaciones", label: "Comunicaciones", href: null },
] as const;

export function Shell({
  active,
  title,
  kicker,
  actions,
  children,
}: {
  active: (typeof nav)[number]["key"];
  title: string;
  kicker: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className={s.shell}>
      <aside className={s.sidebar}>
        <Link href="/admin-maqueta/inicio" className={s.sidebarLogo} aria-label="Inicio">
          <Image src="/logo/logo-mark.png" alt="C.D. La Otra Vertiente" width={640} height={192} className={s.logoDay} priority />
          <Image src="/logo/logo-light.png" alt="" width={640} height={192} className={s.logoNight} priority />
        </Link>
        <p className={s.sidebarTag}>Panel de la junta</p>
        <nav className={s.nav} aria-label="Secciones">
          {nav.map((item) =>
            item.href ? (
              <Link
                key={item.key}
                href={item.href}
                className={s.navItem}
                aria-current={item.key === active ? "page" : undefined}
              >
                {item.label}
              </Link>
            ) : (
              <span key={item.key} className={s.navItem} data-disabled>
                {item.label}
              </span>
            ),
          )}
        </nav>
        <div className={s.sidebarFoot}>
          <span className={s.who}>Nacho</span>
          <span className={s.role}>Propietario · Tesorero</span>
          <Link href="/admin-maqueta" className={s.signOut}>
            Salir
          </Link>
        </div>
      </aside>

      <main className={s.main}>
        <header className={s.pageHead}>
          <div>
            <p className={s.kicker}>{kicker}</p>
            <h1 className={s.title}>{title}</h1>
          </div>
          <div className={s.headActions}>
            <span className={s.mockBadge}>Maqueta · datos de ejemplo</span>
            {actions}
            <ThemeToggle />
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}

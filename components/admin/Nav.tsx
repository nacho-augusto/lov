"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import s from "./admin.module.css";

export interface NavItem {
  label: string;
  href: string | null; // null = section not built yet
}

export function Nav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className={s.nav} aria-label="Secciones">
      {items.map((item) =>
        item.href ? (
          <Link
            key={item.label}
            href={item.href}
            className={s.navItem}
            aria-current={
              (item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href)) ? "page" : undefined
            }
          >
            {item.label}
          </Link>
        ) : (
          <span key={item.label} className={s.navItem} data-disabled title="Próximamente">
            {item.label}
          </span>
        ),
      )}
    </nav>
  );
}

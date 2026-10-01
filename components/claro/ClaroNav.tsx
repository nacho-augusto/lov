"use client";

import { useEffect, useState } from "react";
import { Logo } from "@/components/shared/Logo";
import { club } from "@/content";
import { scrollToId } from "@/lib/scroll";
import styles from "./claro.module.css";
import { IconArrow, IconInstagram } from "./icons";

const LINKS = [
  { id: "club", label: "El club" },
  { id: "temporada", label: "Temporada" },
  { id: "cumbres", label: "Cumbres" },
  { id: "galeria", label: "Galería" },
];

export function ClaroNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Full-screen menu (phones): freeze the page behind it and close on Escape.
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const go = (id: string) => {
    setOpen(false);
    requestAnimationFrame(() => scrollToId(id, id === "unete" ? -20 : -72));
  };

  return (
    <header className={`${styles.nav} ${scrolled ? styles.navScrolled : ""}`}>
      <div className={styles.navInner}>
        <a
          href="#top"
          aria-label={`${club.name}: volver arriba`}
          onClick={(e) => {
            e.preventDefault();
            setOpen(false);
            if (window.__lenis) window.__lenis.scrollTo(0, { duration: 1.2 });
            else window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="relative z-10 inline-flex"
        >
          <Logo tone="dark" href={null} className="h-7 w-auto md:h-8" />
        </a>

        <nav aria-label="Secciones" className="hidden items-center gap-9 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.id}
              href={`#${l.id}`}
              onClick={(e) => {
                e.preventDefault();
                go(l.id);
              }}
              className={styles.navLink}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="#unete"
            onClick={(e) => {
              e.preventDefault();
              go("unete");
            }}
            className={`${styles.pill} ${styles.pillSmall} ${styles.navCta}`}
          >
            Únete
            <IconArrow className="h-4 w-4" />
          </a>
          <button
            type="button"
            className={styles.menuButton}
            aria-expanded={open}
            aria-controls="claro-menu"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">{open ? "Cerrar menú" : "Abrir menú"}</span>
            <span className={`${styles.menuBars} ${open ? styles.menuBarsOpen : ""}`} aria-hidden />
          </button>
        </div>
      </div>

      <div
        id="claro-menu"
        className={`${styles.menuSheet} ${open ? styles.menuSheetOpen : ""}`}
        data-lenis-prevent
        inert={!open}
      >
        <nav aria-label="Menú" className="flex flex-col gap-2">
          {[...LINKS, { id: "unete", label: "Únete" }].map((l, i) => (
            <a
              key={l.id}
              href={`#${l.id}`}
              onClick={(e) => {
                e.preventDefault();
                go(l.id);
              }}
              className={`${styles.display} ${styles.menuLink}`}
              style={{ "--i": i } as React.CSSProperties}
            >
              <span className={styles.menuIndex}>{String(i + 1).padStart(2, "0")}</span>
              {l.label}
            </a>
          ))}
        </nav>
        <a
          href={club.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto inline-flex items-center gap-3 text-[0.95rem] font-medium"
        >
          <IconInstagram className="h-5 w-5" />
          {club.instagramHandle}
        </a>
      </div>
    </header>
  );
}

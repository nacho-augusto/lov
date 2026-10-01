"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { club } from "@/content";
import { Arrow } from "./Arrow";
import { allChapters, chapters, fmtInt } from "./data";
import { go, lockScroll, subscribeProgress, toMetres } from "./scroll";

/**
 * Fixed running head: small wordmark, the five chapter numbers (the active one
 * carries the sun) and, on small screens, the live altitude + an "Índice" dialog.
 */
export function Header() {
  const [active, setActive] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const altRef = useRef<HTMLSpanElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Live altitude (DOM write, no re-render per frame) + hairline once we leave sea level.
  useEffect(
    () =>
      subscribeProgress((p) => {
        if (altRef.current) altRef.current.textContent = `${fmtInt(toMetres(p))} m`;
        setScrolled(p > 0.002);
      }),
    [],
  );

  // Active chapter = the one crossing the middle of the viewport.
  useEffect(() => {
    const els = allChapters
      .map((c) => document.getElementById(c.id))
      .filter((el): el is HTMLElement => el !== null);
    const visible = new Set<string>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.add(e.target.id);
          else visible.delete(e.target.id);
        }
        const current = allChapters.find((c) => visible.has(c.id));
        setActive(current ? current.id : null);
      },
      { rootMargin: "-48% 0px -50% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const openMenu = () => {
    dialogRef.current?.showModal();
    setMenuOpen(true);
    lockScroll(true);
  };
  const closeMenu = () => dialogRef.current?.close();

  const navigate = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    if (dialogRef.current?.open) {
      dialogRef.current.close();
      // let Lenis restart before scrolling
      window.setTimeout(() => go(id), 40);
    } else {
      go(id);
    }
  };

  return (
    <header className="ix-head" data-scrolled={scrolled ? "" : undefined}>
      <div className="ix-wrap ix-grid ix-head__bar">
        <a href="#portada" className="ix-head__mark" onClick={navigate("portada")}>
          {club.shortName}
        </a>

        <nav className="ix-head__nav" aria-label="Capítulos">
          <ol>
            {chapters.map((c) => (
              <li key={c.id}>
                <a
                  href={`#${c.id}`}
                  onClick={navigate(c.id)}
                  aria-current={active === c.id ? "location" : undefined}
                >
                  <span className="ix-head__n">{c.n}</span>{" "}
                  <span className="ix-head__l">{c.short}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="ix-head__aside">
          <Link href="/" className="ix-head__back">
            <Arrow dir="left" />
            <span>Todas las versiones</span>
          </Link>
          <span className="ix-head__alt" ref={altRef} aria-hidden="true">
            0 m
          </span>
          <button
            type="button"
            className="ix-head__menu"
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
            onClick={openMenu}
          >
            Índice
          </button>
        </div>
      </div>

      <dialog
        ref={dialogRef}
        className="ix-menu"
        aria-label="Índice"
        onClose={() => {
          setMenuOpen(false);
          lockScroll(false);
        }}
      >
        <div className="ix-menu__inner">
          <div className="ix-menu__top">
            <span className="ix-head__mark">{club.shortName}</span>
            <button type="button" className="ix-head__menu" onClick={closeMenu}>
              Cerrar
            </button>
          </div>
          <ol className="ix-menu__list">
            {allChapters.map((c) => (
              <li key={c.id}>
                <a
                  href={`#${c.id}`}
                  onClick={navigate(c.id)}
                  aria-current={active === c.id ? "location" : undefined}
                >
                  <span className="ix-menu__n">{c.n}</span>{" "}
                  <span className="ix-menu__t">{c.title}</span>
                </a>
              </li>
            ))}
          </ol>
          <Link href="/" className="ix-menu__back">
            <Arrow dir="left" />
            <span>Todas las versiones</span>
          </Link>
        </div>
      </dialog>
    </header>
  );
}

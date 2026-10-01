"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { club } from "@/content";
import { goTo } from "./nav";
import { fmtInt, prefersReducedMotion, readBest } from "./store";

/** Footer as a "continue?" screen: countdown, insert coin, credits line. */
export function Footer() {
  const ref = useRef<HTMLElement>(null);
  const [count, setCount] = useState(9);
  const [best, setBest] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setBest(readBest());
    setReduced(prefersReducedMotion());
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    let id = 0;
    const io = new IntersectionObserver(([e]) => {
      window.clearInterval(id);
      if (e.isIntersecting) {
        setBest(readBest());
        setCount(9);
        id = window.setInterval(() => setCount((c) => (c <= -3 ? 9 : c - 1)), 1000);
      }
    });
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearInterval(id);
    };
  }, []);

  const coin = count < 0;

  return (
    <footer ref={ref} className="lq-footer" aria-labelledby="lq-footer-t">
      <div className="lq-footer__inner">
        <h2 id="lq-footer-t" className="lq-footer__title">
          {coin ? "Inserta moneda" : "¿Continuar?"}
        </h2>
        <p className="lq-footer__count lq-num" aria-hidden="true">
          {reduced ? "9" : coin ? "0" : count}
        </p>
        <div className="lq-footer__actions">
          <button type="button" className="lq-btn" onClick={() => goTo("inicio")}>
            Sí, volver a empezar
          </button>
          <Link href="/" className="lq-btn lq-btn--ghost">
            No, ver otras versiones
          </Link>
        </div>
        <p className="lq-footer__best">
          Récord en este navegador: <strong>{fmtInt(best)} m</strong>
        </p>
        <div className="lq-footer__legal">
          <p>
            © 2026 {club.name} · {club.federation} nº {club.federationNumber} · {club.town} ({club.province})
          </p>
          <p>
            <a href={club.instagram} target="_blank" rel="noopener noreferrer">
              Instagram {club.instagramHandle}
            </a>
          </p>
          <p className="lq-footer__mail">
            Correo: <a href={`mailto:${club.contactEmail}`}>{club.contactEmail}</a> (por confirmar)
          </p>
          <p>
            <Link href="/" className="lq-footer__back">
              ← Todas las versiones
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}

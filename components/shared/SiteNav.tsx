"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Logo } from "./Logo";
import { scrollToId } from "@/lib/scroll";

const LINKS = [
  { id: "club", label: "Club" },
  { id: "cumbres", label: "Cumbres" },
  { id: "trail", label: "Trail" },
  { id: "galeria", label: "Galería" },
  { id: "unete", label: "Únete" },
];

/**
 * Shared, theme-aware top navigation. Transparent over the hero, then gains a
 * blurred surface once scrolled. Includes a "change version" link back to the selector.
 */
export function SiteNav({ tone = "light" }: { tone?: "light" | "dark" }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const link = tone === "light" ? "text-snow/80" : "text-ink/70";
  const linkHover = tone === "light" ? "hover:text-snow" : "hover:text-ink";
  const surface =
    tone === "light"
      ? "bg-ink/70 border-white/10"
      : "bg-paper/80 border-black/10";

  const go = (id: string) => {
    setOpen(false);
    scrollToId(id);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      {/* subtle top scrim so the white logo + links stay legible over bright heroes */}
      {tone === "light" && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-ink/80 via-ink/35 to-transparent"
        />
      )}
      <motion.nav
        initial={false}
        animate={{
          backgroundColor: scrolled
            ? tone === "light"
              ? "rgba(7,9,12,0.7)"
              : "rgba(251,248,241,0.8)"
            : "rgba(0,0,0,0)",
        }}
        transition={{ duration: 0.4 }}
        className={`mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 backdrop-blur-md sm:px-8 ${
          scrolled ? `border-b ${surface}` : "border-b border-transparent"
        }`}
      >
        <Logo tone={tone} />

        <div className="hidden items-center gap-7 md:flex">
          {LINKS.map((l) => (
            <button
              key={l.id}
              onClick={() => go(l.id)}
              className={`font-sans text-sm font-medium tracking-wide transition-colors ${link} ${linkHover}`}
            >
              {l.label}
            </button>
          ))}
          <Link
            href="/"
            className="rounded-full border border-orange/60 px-4 py-1.5 text-sm font-semibold text-orange transition-colors hover:bg-orange hover:text-ink"
          >
            Cambiar versión
          </Link>
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Menú"
          aria-expanded={open}
          className={`md:hidden ${tone === "light" ? "text-snow" : "text-ink"}`}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            ) : (
              <>
                <path d="M3 7h18M3 12h18M3 17h18" strokeLinecap="round" />
              </>
            )}
          </svg>
        </button>
      </motion.nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`md:hidden ${
              tone === "light" ? "bg-ink/95 text-snow" : "bg-paper/95 text-ink"
            } border-b ${surface} backdrop-blur-md`}
          >
            <div className="flex flex-col gap-1 px-5 py-4">
              {LINKS.map((l) => (
                <button
                  key={l.id}
                  onClick={() => go(l.id)}
                  className="py-2 text-left font-display text-2xl uppercase"
                >
                  {l.label}
                </button>
              ))}
              <Link
                href="/"
                className="mt-2 py-2 text-left font-semibold text-orange"
              >
                ← Cambiar versión
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

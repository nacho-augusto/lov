"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ridgePath } from "@/lib/mountain";

type Variant = "dark" | "warm" | "tech";

interface Dir {
  href: string;
  name: string;
  tag: string;
  desc: string;
  variant: Variant;
}

const DIRECTIONS: Dir[] = [
  {
    href: "/cumbre-nocturna",
    name: "Cumbre Nocturna",
    tag: "Cine inmersivo · 3D",
    desc: "Asciendes el macizo en un plano único, de la hora azul al amanecer naranja en la cima.",
    variant: "dark",
  },
  {
    href: "/curvas-de-nivel",
    name: "Curvas de Nivel",
    tag: "Editorial · topográfico",
    desc: "Un mapa de papel donde un corredor escala la cresta y planta bandera en lo más alto.",
    variant: "warm",
  },
  {
    href: "/vertice",
    name: "Vértice",
    tag: "WebGL · HUD de altímetro",
    desc: "La montaña como dato: wireframe, telemetría y una banda de altitud que barre la cumbre.",
    variant: "tech",
  },
];

const RIDGE = ridgePath(100, 46, { closed: true, topPad: 6 });
const RIDGE_LINE = ridgePath(100, 46, { topPad: 6 });

/* Animated preview motif per direction (CSS-driven, so prefers-reduced-motion neutralises it). */
function Preview({ variant }: { variant: Variant }) {
  if (variant === "dark") {
    return (
      <div className="relative h-32 overflow-hidden rounded-xl bg-gradient-to-b from-[#0b1220] to-ink">
        {[12, 28, 50, 68, 84].map((l, i) => (
          <span
            key={l}
            className="absolute h-0.5 w-0.5 rounded-full bg-snow"
            style={{ left: `${l}%`, top: `${15 + (i % 3) * 12}%`, animation: `twinkle ${2 + i * 0.4}s ease-in-out infinite` }}
          />
        ))}
        <div
          className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 rounded-full bg-orange/50 blur-xl"
          style={{ animation: "sunrise 5s ease-in-out infinite" }}
        />
        <svg viewBox="0 0 100 52" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-[70%] w-full">
          <path d={RIDGE} fill="#070b12" />
        </svg>
      </div>
    );
  }
  if (variant === "warm") {
    return (
      <div className="relative h-32 overflow-hidden rounded-xl bg-paper-panel">
        <div className="absolute right-6 top-5 h-10 w-10 rounded-full bg-orange/80" />
        <svg viewBox="0 0 100 52" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-[75%] w-full">
          <path d={RIDGE} fill="var(--paper)" />
          <path d={RIDGE_LINE} fill="none" stroke="var(--ink)" strokeWidth="1.2" />
        </svg>
        <span
          className="absolute h-2.5 w-2.5 rounded-full border-2 border-ink bg-orange"
          style={{ animation: "climbdot 4s ease-in-out infinite alternate" }}
        />
      </div>
    );
  }
  return (
    <div
      className="relative h-32 overflow-hidden rounded-xl bg-ink"
      style={{
        backgroundImage:
          "linear-gradient(rgba(242,107,29,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(242,107,29,0.12) 1px, transparent 1px)",
        backgroundSize: "16px 16px",
      }}
    >
      <svg viewBox="0 0 100 52" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-[72%] w-full">
        <path d={RIDGE_LINE} fill="none" stroke="var(--orange)" strokeWidth="1.4" />
      </svg>
      <div
        className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-orange to-transparent"
        style={{ animation: "scanline 3s linear infinite" }}
      />
      <span className="absolute right-3 top-3 font-mono text-[0.55rem] uppercase tracking-widest text-orange/70">
        ▲ 2069m
      </span>
    </div>
  );
}

const SKIN: Record<Variant, { bg: string; text: string; sub: string }> = {
  dark: { bg: "from-charcoal to-ink", text: "text-snow", sub: "text-snow/60" },
  warm: { bg: "from-paper to-paper-panel", text: "text-ink", sub: "text-ink/60" },
  tech: { bg: "from-[#0a0d12] to-ink", text: "text-snow", sub: "text-snow/55" },
};

export function SelectorCards() {
  return (
    <div className="grid w-full max-w-6xl grid-cols-1 gap-5 md:grid-cols-3">
      {DIRECTIONS.map((d, i) => {
        const s = SKIN[d.variant];
        return (
          <motion.div
            key={d.href}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link
              href={d.href}
              className="group block focus-visible:outline-none"
              aria-label={`Abrir versión ${d.name}`}
            >
              <div
                className={`relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b ${s.bg} p-4 transition-all duration-500 group-hover:-translate-y-1.5 group-hover:border-orange/50`}
              >
                <div className="relative">
                  <Preview variant={d.variant} />
                  <span className="absolute left-3 top-3 rounded-full bg-ink/60 px-2 py-0.5 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-orange backdrop-blur-sm">
                    0{i + 1}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-3">
                  <h3 className={`font-display text-2xl uppercase ${s.text}`}>{d.name}</h3>
                  <p className={`mt-1 font-mono text-xs uppercase tracking-widest ${s.sub}`}>
                    {d.tag}
                  </p>
                  <p className={`mt-4 flex-1 text-sm leading-relaxed ${s.sub}`}>{d.desc}</p>

                  <span className={`mt-6 inline-flex items-center gap-2 text-sm font-semibold ${s.text}`}>
                    Entrar
                    <span
                      aria-hidden
                      className="text-orange transition-transform duration-300 group-hover:translate-x-1.5"
                    >
                      →
                    </span>
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}

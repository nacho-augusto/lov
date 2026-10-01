"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

interface Dir {
  href: string;
  name: string;
  tag: string;
  desc: string;
  /** Built on one of the club's own hero images (nuevos_heros/). */
  ownHero?: boolean;
}

const DIRECTIONS: Dir[] = [
  {
    href: "/claro",
    name: "Claro",
    tag: "Luminoso · mar de nubes",
    desc: "Un vertiniano con la camiseta del club en la cresta mientras las nubes fluyen al hacer scroll.",
    ownHero: true,
  },
  {
    href: "/hora-dorada",
    name: "Hora dorada",
    tag: "Cinematográfico · documental",
    desc: "Cuatro corredores al atardecer que avanzan con el scroll, la temporada en escenas y créditos finales.",
    ownHero: true,
  },
  {
    href: "/frontal",
    name: "Frontal",
    tag: "Nocturno · interactivo",
    desc: "Una noche de carrera de las 22:47 al amanecer: tu cursor es el frontal que ilumina la sierra.",
  },
  {
    href: "/lov-quest",
    name: "LOV Quest",
    tag: "Pixel art · jugable",
    desc: "La web como videojuego de 8 bits: juega en la portada y sube del mar hasta La Maroma.",
  },
  {
    href: "/dorsal",
    name: "Dorsal",
    tag: "Brutalista · cartel de carrera",
    desc: "El dorsal 2069, reglamento, clasificación y fotos impresas a dos tintas: negro y naranja.",
  },
  {
    href: "/indice",
    name: "Índice",
    tag: "Minimalista · editorial",
    desc: "Un libro de montaña en blanco: capítulos, apéndices y un sol que sube por la línea de altitud.",
  },
];

const ARCHIVE: Dir[] = [
  { href: "/cumbre-nocturna", name: "Cumbre Nocturna", tag: "Cinematográfico · La Maroma", desc: "" },
  { href: "/curvas-de-nivel", name: "Curvas de Nivel", tag: "Editorial · topográfico", desc: "" },
  { href: "/vertice", name: "Vértice", tag: "WebGL · altímetro", desc: "" },
];

const thumb = (href: string) => `/selector${href}.jpg`;
const ease = [0.16, 1, 0.3, 1] as const;

export function SelectorCards() {
  return (
    <div className="w-full max-w-7xl">
      <ol className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {DIRECTIONS.map((d, i) => (
          <motion.li
            key={d.href}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 + i * 0.08, ease }}
          >
            <Link
              href={d.href}
              className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-charcoal transition-all duration-500 hover:-translate-y-1.5 hover:border-orange/60 focus-visible:-translate-y-1.5 focus-visible:border-orange focus-visible:outline-none"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-ink">
                <Image
                  src={thumb(d.href)}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 92vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  preload={i < 3}
                />
                <span className="absolute left-3 top-3 rounded-full bg-ink/70 px-2.5 py-1 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-orange backdrop-blur-sm">
                  0{i + 1}
                </span>
                {d.ownHero && (
                  <span className="absolute right-3 top-3 rounded-full bg-orange px-2.5 py-1 font-mono text-[0.6rem] uppercase tracking-[0.16em] text-ink">
                    Con vuestra cabecera
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="font-display text-2xl uppercase text-snow">{d.name}</h3>
                <p className="mt-1 font-mono text-xs uppercase tracking-widest text-snow/55">{d.tag}</p>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-snow/70">{d.desc}</p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-snow">
                  Entrar
                  <span aria-hidden className="text-orange transition-transform duration-300 group-hover:translate-x-1.5">
                    →
                  </span>
                </span>
              </div>
            </Link>
          </motion.li>
        ))}
      </ol>

      <motion.section
        aria-labelledby="archive-title"
        className="mt-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.7 }}
      >
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-t border-white/10 pt-6">
          <h2 id="archive-title" className="font-mono text-xs uppercase tracking-[0.3em] text-snow/60">
            Archivo · primera ronda
          </h2>
          <p className="text-xs text-snow/40">Las tres maquetas anteriores, por si quieres compararlas.</p>
        </div>
        <ul className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {ARCHIVE.map((d) => (
            <li key={d.href}>
              <Link
                href={d.href}
                className="group flex items-center gap-4 rounded-xl border border-white/10 p-2.5 transition-colors duration-300 hover:border-orange/50 focus-visible:border-orange focus-visible:outline-none"
              >
                <div className="relative aspect-[16/10] w-28 shrink-0 overflow-hidden rounded-lg bg-ink">
                  <Image src={thumb(d.href)} alt="" fill sizes="112px" className="object-cover opacity-80" />
                </div>
                <div>
                  <p className="font-display text-lg uppercase text-snow/85">{d.name}</p>
                  <p className="font-mono text-[0.65rem] uppercase tracking-widest text-snow/45">{d.tag}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </motion.section>
    </div>
  );
}

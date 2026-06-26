"use client";

import { motion } from "framer-motion";
import { club } from "@/content/club";
import { sections } from "@/content/copy";

/**
 * Shared, theme-aware "Únete / Contacto" section. Informative club site: the CTA
 * is email + Instagram (no backend form). Reused by all three directions.
 */
export function JoinSection({ tone = "light" }: { tone?: "light" | "dark" }) {
  const isDark = tone === "light"; // page is dark → light text
  const text = isDark ? "text-snow" : "text-ink";
  const muted = isDark ? "text-snow/60" : "text-ink/60";
  const card = isDark
    ? "border-white/10 bg-white/[0.03]"
    : "border-black/10 bg-black/[0.02]";
  const j = sections.join;

  const details = [
    { label: "Correo", value: club.contactEmail, href: `mailto:${club.contactEmail}` },
    { label: "Instagram", value: club.instagramHandle, href: club.instagram },
    { label: "Dónde", value: `${club.town} · ${club.region}`, href: null },
    {
      label: "Federación",
      value: `${club.federation} · nº ${club.federationNumber}`,
      href: null,
    },
  ];

  return (
    <section id="unete" className={`relative px-5 py-24 sm:px-8 sm:py-32 ${text}`}>
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-orange">
            {j.eyebrow}
          </p>
          <h2 className="font-display mt-4 text-5xl uppercase sm:text-7xl">
            {j.title}
          </h2>
          <p className={`mt-5 max-w-xl text-lg ${muted}`}>{j.subtitle}</p>
        </motion.div>

        <div className="mt-12 flex flex-wrap gap-4">
          <a
            href={`mailto:${club.contactEmail}`}
            className="group relative inline-flex items-center gap-2 rounded-full bg-orange px-7 py-3.5 font-semibold text-ink transition-transform hover:scale-[1.03]"
          >
            {j.cta}
            <span aria-hidden className="transition-transform group-hover:translate-x-1">
              →
            </span>
          </a>
          <a
            href={club.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-2 rounded-full border px-7 py-3.5 font-semibold transition-colors ${
              isDark
                ? "border-white/25 hover:bg-white/10"
                : "border-black/20 hover:bg-black/5"
            }`}
          >
            {j.secondaryCta}
          </a>
        </div>

        <p className={`mt-6 text-sm ${muted}`}>{j.trainingNote}</p>

        <dl className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border sm:grid-cols-2 lg:grid-cols-4">
          {details.map((d) => (
            <div key={d.label} className={`border p-5 ${card}`}>
              <dt className="font-mono text-[0.7rem] uppercase tracking-widest text-orange">
                {d.label}
              </dt>
              <dd className="mt-2 text-sm">
                {d.href ? (
                  <a
                    href={d.href}
                    target={d.href.startsWith("http") ? "_blank" : undefined}
                    rel={d.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="transition-colors hover:text-orange"
                  >
                    {d.value}
                  </a>
                ) : (
                  d.value
                )}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

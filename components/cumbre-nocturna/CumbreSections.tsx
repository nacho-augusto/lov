"use client";

import { motion } from "framer-motion";
import { peaks } from "@/content/peaks";
import { values, trailDefinition } from "@/content/values";
import { sections } from "@/content/copy";
import { stats } from "@/content/club";

const reveal = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-70px" },
  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
};

export function CumbreAbout() {
  const a = sections.about;
  return (
    <section id="club" className="relative bg-ink px-5 py-28 text-snow sm:px-8 sm:py-36">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background:
            "radial-gradient(60% 50% at 20% 0%, rgba(242,107,29,0.12), transparent 70%)",
        }}
      />
      <div className="relative mx-auto max-w-6xl">
        <motion.div {...reveal} className="max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-orange">
            {a.eyebrow}
          </p>
          <h2 className="font-display mt-4 text-5xl uppercase leading-[0.95] sm:text-7xl">
            {a.title}
          </h2>
        </motion.div>
        <div className="mt-10 grid gap-10 md:grid-cols-[1.5fr_1fr]">
          <motion.div {...reveal} className="space-y-5 text-lg leading-relaxed text-snow/75">
            {a.paragraphs.map((p) => (
              <p key={p.slice(0, 12)}>{p}</p>
            ))}
          </motion.div>
          <motion.div {...reveal} className="grid grid-cols-2 gap-3 self-start">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
              >
                <div className="font-display text-3xl tabular text-snow">
                  {s.value}
                  <span className="ml-0.5 text-lg text-orange">{s.unit}</span>
                </div>
                <div className="mt-1 text-xs leading-snug text-snow/55">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export function CumbrePeaks() {
  const s = sections.peaks;
  return (
    <section id="cumbres" className="relative overflow-hidden bg-charcoal px-5 py-28 text-snow sm:px-8 sm:py-36">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: "url('/generated/texture-topo.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="relative mx-auto max-w-5xl">
        <motion.div {...reveal} className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-orange">
            {s.eyebrow}
          </p>
          <h2 className="font-display mt-4 text-5xl uppercase leading-[0.95] sm:text-7xl">
            {s.title}
          </h2>
          <p className="mt-5 text-lg text-snow/65">{s.subtitle}</p>
        </motion.div>

        {/* ascent route: vertical line with waypoints */}
        <div className="relative mt-16 pl-8 sm:pl-12">
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gradient-to-b from-orange via-orange/40 to-transparent sm:left-[11px]" />
          <ul className="space-y-10">
            {peaks.map((p, i) => (
              <motion.li
                key={p.id}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.55, delay: (i % 5) * 0.05 }}
                className="group relative"
              >
                <span
                  className={`absolute -left-8 top-1.5 grid h-4 w-4 place-items-center rounded-full border-2 sm:-left-12 ${
                    p.home ? "border-orange bg-orange" : "border-snow/40 bg-ink"
                  }`}
                />
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <span className="font-display text-3xl tabular text-orange sm:text-4xl">
                    {p.elevation}
                    <span className="text-base text-snow/40">m</span>
                  </span>
                  <h3 className="font-display text-2xl uppercase tracking-tight transition-colors group-hover:text-orange">
                    {p.name}
                  </h3>
                  {p.home && (
                    <span className="rounded-full bg-orange/15 px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-wider text-ember">
                      Nuestra sierra
                    </span>
                  )}
                </div>
                <p className="mt-1 font-mono text-xs uppercase tracking-wider text-snow/40">
                  {p.sierra} · {p.area}
                </p>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-snow/65">
                  {p.why}
                </p>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function CumbreTrail() {
  const s = sections.trail;
  return (
    <section id="trail" className="relative overflow-hidden bg-ink px-5 py-28 text-snow sm:px-8 sm:py-36">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: "url('/generated/texture-topo.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="relative mx-auto max-w-6xl">
        <motion.div {...reveal} className="max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-orange">
            {s.eyebrow}
          </p>
          <h2 className="font-display mt-4 text-5xl uppercase leading-[0.95] sm:text-7xl">
            {trailDefinition.title}
          </h2>
          <p className="mt-6 text-2xl leading-snug text-snow/85">
            {trailDefinition.lead}
          </p>
          <p className="mt-4 text-lg text-snow/60">{trailDefinition.body}</p>
        </motion.div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((v, i) => (
            <motion.div
              key={v.id}
              {...reveal}
              transition={{ ...reveal.transition, delay: i * 0.08 }}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-colors hover:border-orange/40"
            >
              <span className="font-mono text-xs text-orange">0{i + 1}</span>
              <h3 className="mt-3 font-display text-2xl uppercase">{v.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-snow/60">{v.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

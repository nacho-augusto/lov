"use client";

import { motion } from "framer-motion";
import { peaks } from "@/content/peaks";
import { values, trailDefinition } from "@/content/values";
import { sections } from "@/content/copy";
import { stats } from "@/content/club";

const reveal = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-70px" },
  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
};

const MAX_ELEV = 2069;

export function CurvasAbout() {
  const a = sections.about;
  return (
    <section id="club" className="bg-paper px-5 py-24 text-ink sm:px-8 sm:py-32">
      <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-[1.4fr_1fr]">
        <motion.div {...reveal}>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-orange">
            {a.eyebrow}
          </p>
          <h2 className="mt-4 font-serif text-5xl leading-tight sm:text-6xl">
            {a.title}
          </h2>
          <div className="mt-7 space-y-5 text-lg leading-relaxed text-ink/75">
            <p className="first-letter:float-left first-letter:mr-3 first-letter:font-serif first-letter:text-7xl first-letter:font-semibold first-letter:leading-[0.8] first-letter:text-orange">
              {a.paragraphs[0]}
            </p>
            {a.paragraphs.slice(1).map((p) => (
              <p key={p.slice(0, 12)}>{p}</p>
            ))}
          </div>
        </motion.div>

        <motion.div {...reveal} className="flex flex-col justify-center gap-px self-center overflow-hidden rounded-2xl border border-ink/10">
          {stats.map((s) => (
            <div key={s.label} className="border-b border-ink/10 bg-paper-panel p-6 last:border-0">
              <div className="font-display text-4xl text-ink tabular">
                {s.value}
                <span className="ml-1 text-xl text-orange">{s.unit}</span>
              </div>
              <div className="mt-1 text-sm text-ink/60">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export function CurvasPeaks() {
  const s = sections.peaks;
  return (
    <section id="cumbres" className="bg-paper-panel px-5 py-24 text-ink sm:px-8 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <motion.div {...reveal} className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-orange">
            {s.eyebrow}
          </p>
          <h2 className="mt-4 font-serif text-5xl leading-tight sm:text-6xl">
            {s.title}
          </h2>
          <p className="mt-5 text-lg text-ink/70">{s.subtitle}</p>
        </motion.div>

        <ul className="mt-14 divide-y divide-ink/10 border-y border-ink/10">
          {peaks.map((p, i) => (
            <motion.li
              key={p.id}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: (i % 6) * 0.04 }}
              className="group grid grid-cols-[auto_1fr] items-center gap-x-6 gap-y-2 py-6 transition-colors sm:grid-cols-[120px_1.2fr_2fr]"
            >
              <div className="font-display text-3xl tabular text-ink sm:text-4xl">
                {p.elevation}
                <span className="text-base text-ink/40">m</span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-2xl transition-colors group-hover:text-orange">
                    {p.name}
                  </h3>
                  {p.home && (
                    <span className="rounded-full bg-orange/15 px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-wider text-amber-deep">
                      Nuestra sierra
                    </span>
                  )}
                </div>
                <p className="font-mono text-xs uppercase tracking-wider text-ink/45">
                  {p.sierra} · {p.difficulty}
                </p>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <p className="text-sm leading-relaxed text-ink/70">{p.why}</p>
                {/* elevation bar */}
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-ink/10">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: p.elevation / MAX_ELEV }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                    style={{ transformOrigin: "left" }}
                    className="h-full rounded-full bg-gradient-to-r from-amber-deep to-orange"
                  />
                </div>
              </div>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function CurvasTrail() {
  const s = sections.trail;
  return (
    <section id="trail" className="bg-paper px-5 py-24 text-ink sm:px-8 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <motion.div {...reveal} className="max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-orange">
            {s.eyebrow}
          </p>
          <h2 className="mt-4 font-serif text-5xl leading-tight sm:text-6xl">
            {trailDefinition.title}
          </h2>
          <p className="mt-6 text-2xl leading-snug text-ink/85">
            {trailDefinition.lead}
          </p>
          <p className="mt-4 text-lg text-ink/65">{trailDefinition.body}</p>
        </motion.div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((v, i) => (
            <motion.div
              key={v.id}
              {...reveal}
              transition={{ ...reveal.transition, delay: i * 0.08 }}
              className="relative overflow-hidden rounded-2xl border border-ink/10 bg-paper-panel p-6"
            >
              <span className="font-mono text-xs text-orange">0{i + 1}</span>
              <h3 className="mt-3 font-serif text-2xl">{v.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/65">{v.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

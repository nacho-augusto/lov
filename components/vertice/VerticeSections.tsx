"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { peaks } from "@/content/peaks";
import { values, trailDefinition } from "@/content/values";
import { sections } from "@/content/copy";
import { stats } from "@/content/club";

const reveal = {
  initial: { opacity: 0, y: 26 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-70px" },
  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
};

function Counter({ raw }: { raw: string }) {
  const prefix = raw.trim().startsWith("+") ? "+" : "";
  const target = parseInt(raw.replace(/[^\d]/g, ""), 10) || 0;
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  return (
    <motion.span
      ref={ref}
      viewport={{ once: true }}
      onViewportEnter={() => {
        if (started.current) return;
        started.current = true;
        const dur = 1200;
        const t0 = performance.now();
        const tick = (t: number) => {
          const k = Math.min(1, (t - t0) / dur);
          const eased = 1 - Math.pow(1 - k, 3);
          const val = Math.round(eased * target);
          if (ref.current) ref.current.textContent = prefix + val.toLocaleString("es-ES");
          if (k < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }}
    >
      {prefix}0
    </motion.span>
  );
}

export function VerticeAbout() {
  const a = sections.about;
  return (
    <section id="club" className="relative bg-ink px-5 py-24 text-snow sm:px-8 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <motion.div {...reveal} className="max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-orange">
            {a.eyebrow}
          </p>
          <h2 className="font-display mt-4 text-5xl uppercase sm:text-7xl">{a.title}</h2>
          <div className="mt-6 space-y-4 text-lg leading-relaxed text-snow/70">
            {a.paragraphs.map((p) => (
              <p key={p.slice(0, 12)}>{p}</p>
            ))}
          </div>
        </motion.div>

        <div className="mt-14 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              {...reveal}
              transition={{ ...reveal.transition, delay: i * 0.07 }}
              className="relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] p-5"
            >
              <span className="absolute right-3 top-3 font-mono text-[0.6rem] text-snow/30">
                V-0{i + 1}
              </span>
              <div className="font-display text-4xl tabular text-snow sm:text-5xl">
                <Counter raw={s.value} />
                <span className="ml-1 text-xl text-orange">{s.unit}</span>
              </div>
              <div className="mt-2 font-mono text-[0.7rem] uppercase tracking-wider text-snow/50">
                {s.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function VerticeCumbres() {
  const s = sections.peaks;
  return (
    <section id="cumbres" className="relative bg-ink px-5 py-24 text-snow sm:px-8 sm:py-32">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(242,107,29,1) 1px, transparent 1px), linear-gradient(90deg, rgba(242,107,29,1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <div className="relative mx-auto max-w-6xl">
        <motion.div {...reveal} className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-orange">
            {s.eyebrow}
          </p>
          <h2 className="font-display mt-4 text-5xl uppercase sm:text-7xl">{s.title}</h2>
          <p className="mt-5 text-lg text-snow/65">{s.subtitle}</p>
        </motion.div>

        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/5 sm:grid-cols-2">
          {peaks.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.5, delay: (i % 6) * 0.05 }}
              className="group flex items-center gap-5 bg-ink p-5 transition-colors hover:bg-white/[0.03]"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-orange/30 font-mono text-[0.6rem] text-orange">
                V{String(i + 1).padStart(2, "0")}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="truncate text-xl font-semibold transition-colors group-hover:text-orange">
                    {p.name}
                  </h3>
                  <span className="font-display text-2xl tabular text-snow">
                    {p.elevation}
                    <span className="text-sm text-snow/40">m</span>
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-2 font-mono text-[0.7rem] uppercase tracking-wider text-snow/45">
                  <span className="truncate">{p.sierra}</span>
                  {p.home && <span className="text-orange">· nuestra sierra</span>}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function VerticeTrail() {
  const s = sections.trail;
  return (
    <section id="trail" className="relative bg-ink px-5 py-24 text-snow sm:px-8 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <motion.div {...reveal} className="max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-orange">
            {s.eyebrow}
          </p>
          <h2 className="font-display mt-4 text-5xl uppercase sm:text-7xl">
            {trailDefinition.title}
          </h2>
          <p className="mt-6 text-2xl leading-snug text-snow/85">{trailDefinition.lead}</p>
          <p className="mt-4 text-lg text-snow/60">{trailDefinition.body}</p>
        </motion.div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((v, i) => (
            <motion.div
              key={v.id}
              {...reveal}
              transition={{ ...reveal.transition, delay: i * 0.08 }}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-6 transition-colors hover:border-orange/40"
            >
              <span className="font-mono text-xs text-orange">[0{i + 1}]</span>
              <h3 className="mt-3 text-2xl font-semibold">{v.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-snow/60">{v.desc}</p>
              <span
                aria-hidden
                className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-orange/20 blur-2xl transition-opacity group-hover:opacity-100 sm:opacity-0"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

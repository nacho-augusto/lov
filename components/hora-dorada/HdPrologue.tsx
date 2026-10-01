"use client";

import { useRef } from "react";
import { club } from "@/content";
import { gsap, useGSAP } from "@/lib/gsap";
import { Chapter } from "./Chapter";
import styles from "./hd.module.css";

const PROLOGUE =
  "Hay una hora en la que la sierra se vuelve de oro. La caliza arde, el mar se apaga al fondo y el grupo sigue subiendo. Somos La Otra Vertiente, un club de montaña de Rincón de la Victoria, y esta es nuestra película.";

const FACTS = [
  { k: "Título", v: club.name },
  { k: "Género", v: club.discipline },
  { k: "Localización", v: `${club.town}, ${club.province} · ${club.region}` },
  { k: "Producción", v: `Club deportivo federado en ${club.federation} · nº ${club.federationNumber}` },
  { k: "Reparto", v: `Los ${club.memberTerm}` },
  { k: "Duración", v: "Toda la temporada" },
];

export function HdPrologue() {
  const ref = useRef<HTMLParagraphElement>(null);

  // Words light up one by one as the paragraph crosses the screen, like a slow subtitle.
  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const words = ref.current?.querySelectorAll(`.${styles.word}`);
      if (!ref.current || !words?.length) return;
      ref.current.classList.add(styles.armed);
      gsap.to(words, {
        opacity: 1,
        ease: "none",
        stagger: 0.1,
        scrollTrigger: { trigger: ref.current, start: "top 78%", end: "bottom 42%", scrub: 0.6 },
      });
    },
    { scope: ref },
  );

  return (
    <section id="club" data-hd-chapter="I. El club" aria-labelledby="hd-club-title" className={styles.container}>
      <Chapter numeral="I" slug="Capítulo uno · Prólogo" title="El" accent="club" titleId="hd-club-title" />

      <p ref={ref} className={`${styles.serif} ${styles.prologue} mt-[clamp(4rem,10vh,7rem)]`}>
        {PROLOGUE.split(" ").map((w, i) => (
          <span key={i} className={styles.word}>
            {w}{" "}
          </span>
        ))}
      </p>

      <dl className={styles.factSheet} aria-label="Ficha técnica">
        {FACTS.map((f) => (
          <div key={f.k} className={styles.fact}>
            <dt className={styles.mono}>{f.k}</dt>
            <dd>{f.v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

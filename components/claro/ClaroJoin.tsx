import Image from "next/image";
import { club } from "@/content";
import { Reveal } from "./Reveal";
import styles from "./claro.module.css";
import { IconInstagram } from "./icons";

const STEPS = [
  {
    title: "Escríbenos",
    text: "Mándanos un mensaje por Instagram: cuéntanos de dónde eres y qué te apetece correr.",
  },
  {
    title: "Sal con el grupo",
    text: "Ven a una salida con el club y conoce de primera mano el ambiente vertiniano.",
  },
  {
    title: "Hazte vertiniano",
    text: "Si te quedas, te contamos cómo hacerte socio del club.",
  },
];

export function ClaroJoin() {
  return (
    <section id="unete" aria-labelledby="claro-join-title" className={styles.joinSection}>
      <div className={`${styles.container} grid items-center gap-12 py-[clamp(5rem,14vh,9rem)] md:grid-cols-12`}>
        <Reveal className="md:col-span-5">
          <figure className={styles.joinFigure}>
            <Image
              src="/heroes/claro/runner-detail.jpg"
              alt="Corredor de espaldas con la camiseta naranja y blanca del club, en una cresta entre nubes."
              width={500}
              height={800}
              sizes="(min-width: 768px) 36vw, 100vw"
              className="h-full w-full object-cover"
            />
            <figcaption className={styles.joinBadge}>
              <span className={styles.calloutDot} aria-hidden />
              Naranja y blanco, los colores del club
            </figcaption>
          </figure>
        </Reveal>

        <div className="md:col-span-6 md:col-start-7">
          <Reveal>
            <p className={`${styles.eyebrow} text-[var(--c-orange-deep)]`}>Únete</p>
            <h2 id="claro-join-title" className={`${styles.display} ${styles.h2Sm} mt-4`}>
              ¿Te vienes a la
              <br />
              otra vertiente?
            </h2>
            <p className={`${styles.lead} mt-6`}>
              No hace falta ser ultrafondista: hacen falta ganas de monte y de buena compañía. El resto lo hacemos subiendo
              juntos.
            </p>
          </Reveal>

          <ol className="mt-10 grid gap-6">
            {STEPS.map((s, i) => (
              <li key={s.title}>
                <Reveal className={styles.step} delay={i * 90}>
                  <span className={styles.stepIndex}>{i + 1}</span>
                  <div>
                    <h3 className={`${styles.display} text-[1.5rem]`}>{s.title}</h3>
                    <p className="mt-1 text-[0.98rem] leading-relaxed text-[var(--c-ink-soft)]">{s.text}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>

          <Reveal className="mt-10 flex flex-wrap gap-3" delay={200}>
            <a
              href={club.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.pill} ${styles.pillSolid}`}
            >
              <IconInstagram className="h-5 w-5" />
              Escríbenos por Instagram
            </a>
          </Reveal>
          <p className="mt-6 text-[0.85rem] text-[var(--c-stone)]">
            Club federado en {club.federation} · nº {club.federationNumber}
          </p>
        </div>
      </div>
    </section>
  );
}

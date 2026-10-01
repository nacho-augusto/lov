import Image from "next/image";
import { club } from "@/content";
import { InView } from "./InView";
import styles from "./hd.module.css";

const TAKES = [
  { take: "Toma 1", title: "Escríbenos", text: "Un mensaje por Instagram: de dónde eres y qué te apetece correr." },
  { take: "Toma 2", title: "Sal con el grupo", text: "Ven a una salida con el club y conoce el ambiente vertiniano." },
  { take: "Toma 3", title: "Quédate", text: "Si te gusta, te contamos cómo hacerte socio del club." },
];

export function HdCasting() {
  return (
    <section id="casting" data-hd-chapter="V. Casting abierto" aria-labelledby="hd-casting-title" className={styles.casting}>
      <div className={styles.castingBg} aria-hidden>
        <Image src="/club/omd-expedicion.jpg" alt="" fill sizes="100vw" />
      </div>
      <div className={`${styles.container} grid gap-12 py-[clamp(7rem,22vh,14rem)] lg:grid-cols-12`}>
        <InView className="lg:col-span-6">
          <p className={`${styles.mono} ${styles.gold}`}>Capítulo cinco · Casting abierto</p>
          <h2 id="hd-casting-title" className={`${styles.serif} ${styles.chapterTitle} mt-4`}>
            Buscamos <em>reparto</em> para la próxima temporada.
          </h2>
          <p className={`${styles.lead} mt-6 max-w-xl`}>
            No hace falta experiencia ni un gran palmarés: solo ganas de monte y de buena compañía. El guion lo escribimos
            subiendo juntos.
          </p>
          <a href={club.instagram} target="_blank" rel="noopener noreferrer" className={`${styles.cta} mt-10`}>
            Escríbenos por Instagram
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M7 17 17 7M8 7h9v9" />
            </svg>
          </a>
        </InView>
        <InView className="lg:col-span-5 lg:col-start-8 lg:self-end" delay={150}>
          <ol className={styles.takes}>
            {TAKES.map((t) => (
              <li key={t.take} className={styles.take}>
                <span className={`${styles.mono} ${styles.gold}`}>{t.take}</span>
                <div>
                  <h3 className={`${styles.serif} text-[1.9rem] leading-none`}>{t.title}</h3>
                  <p className="mt-2 text-[0.98rem] leading-relaxed text-[var(--hd-sand)]">{t.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className={`${styles.mono} mt-6 text-[var(--hd-dim)]`}>
            Club federado en {club.federation} · nº {club.federationNumber}
          </p>
        </InView>
      </div>
    </section>
  );
}

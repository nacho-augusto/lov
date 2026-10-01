import { club, values } from "@/content";
import { Reveal } from "./Reveal";
import styles from "./claro.module.css";

const FACTS = [
  { label: "Sede", value: `${club.town}, ${club.province}` },
  { label: "Comarca", value: club.region },
  { label: "Federación", value: `${club.federation} · nº ${club.federationNumber}` },
  { label: "Disciplina", value: club.discipline },
];

export function ClaroIntro() {
  return (
    <section id="club" aria-labelledby="claro-intro-title" className={`${styles.container} pt-[clamp(4rem,10vh,7rem)]`}>
      <Reveal>
        <p className={`${styles.eyebrow} text-[var(--c-orange-deep)]`}>El club</p>
        <h2 id="claro-intro-title" className={`${styles.display} ${styles.manifesto} mt-5`}>
          La otra vertiente
          <br />
          <span className="text-[var(--c-stone)]">empieza donde acaba</span>
          <br />
          el asfalto.
        </h2>
      </Reveal>

      <div className="mt-[clamp(3rem,8vh,5.5rem)] grid gap-12 md:grid-cols-12">
        <Reveal className="md:col-span-5" delay={80}>
          <p className={styles.lead}>
            Somos {club.name}, un club deportivo de montaña de {club.town}. {club.rhythm}
          </p>
          <p className="mt-5 text-[1.02rem] leading-relaxed text-[var(--c-ink-soft)]">
            Entre el mar y los 2.069 m de La Maroma, el techo de Málaga, está nuestro terreno de juego. A quienes
            salen con nosotros se les llama <strong className="font-semibold text-[var(--c-ink)]">{club.memberTerm}</strong>.
          </p>
        </Reveal>
        <Reveal className="md:col-span-6 md:col-start-7" delay={160}>
          <dl className={styles.facts}>
            {FACTS.map((f) => (
              <div key={f.label} className={styles.factRow}>
                <dt className={`${styles.eyebrow} text-[var(--c-stone)]`}>{f.label}</dt>
                <dd className="text-[1.05rem] font-medium">{f.value}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>

      <ul className={styles.values}>
        {values.map((v, i) => (
          <li key={v.id}>
            <Reveal className={styles.valueCard} delay={i * 90}>
              <span className={styles.valueIndex}>{String(i + 1).padStart(2, "0")}</span>
              <h3 className={`${styles.display} mt-10 text-[1.9rem]`}>{v.title}</h3>
              <p className="mt-3 text-[0.98rem] leading-relaxed text-[var(--c-ink-soft)]">{v.desc}</p>
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  );
}

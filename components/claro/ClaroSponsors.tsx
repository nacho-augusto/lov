import { sponsors, sponsorsIntro } from "@/content";
import { Reveal } from "./Reveal";
import styles from "./claro.module.css";
import { IconArrowUpRight } from "./icons";

const current = sponsors.filter((s) => s.current);
const earlier = sponsors.filter((s) => !s.current);

export function ClaroSponsors() {
  return (
    <section aria-labelledby="claro-sponsors-title" className={`${styles.container} py-[clamp(4.5rem,12vh,8rem)]`}>
      <Reveal className="flex flex-col gap-3 md:flex-row md:items-baseline md:justify-between">
        <h2 id="claro-sponsors-title" className={`${styles.display} text-[clamp(2rem,3.4vw,3rem)]`}>
          {sponsorsIntro}
        </h2>
        <p className="text-[0.9rem] text-[var(--c-stone)]">Patrocinadores y colaboradores de la temporada 2026</p>
      </Reveal>

      <ul className={styles.sponsorGrid}>
        {current.map((s, i) => (
          <li key={s.name}>
            <Reveal delay={i * 60} className="h-full">
              {s.instagram ? (
                <a
                  href={`https://www.instagram.com/${s.instagram}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.sponsor}
                >
                  <span>{s.name}</span>
                  <span className={styles.sponsorHandle}>
                    @{s.instagram}
                    <IconArrowUpRight className="h-3.5 w-3.5" />
                  </span>
                </a>
              ) : (
                <div className={styles.sponsor}>
                  <span>{s.name}</span>
                </div>
              )}
            </Reveal>
          </li>
        ))}
      </ul>

      <Reveal>
        <p className="mt-8 max-w-4xl text-[0.95rem] leading-relaxed text-[var(--c-ink-soft)]">
          <span className="font-semibold text-[var(--c-ink)]">También nos han acompañado: </span>
          {earlier.map((s) => s.name).join(" · ")}.
        </p>
      </Reveal>
    </section>
  );
}

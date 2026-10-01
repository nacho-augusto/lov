import Link from "next/link";
import { club, season, seasonEvents, sponsors } from "@/content";
import styles from "./hd.module.css";

const current = sponsors.filter((s) => s.current).map((s) => s.name);
const earlier = sponsors.filter((s) => !s.current).map((s) => s.name);
// every place the season visited, in order, without repeats
const places = [...new Set(seasonEvents.map((e) => e.place.split(" · ")[0]))];

export function HdCredits() {
  return (
    <section id="creditos" data-hd-chapter="Créditos" aria-labelledby="hd-credits-title">
      <div className={`${styles.container} ${styles.credits}`}>
        <h2 id="hd-credits-title" className="sr-only">
          Créditos
        </h2>
        <div className={styles.creditBlock}>
          <p className={`${styles.mono} ${styles.creditRole}`}>Una producción de</p>
          <p className={styles.creditName}>{club.name}</p>
        </div>
        <div className={styles.creditBlock}>
          <p className={`${styles.mono} ${styles.creditRole}`}>Reparto</p>
          <p className={styles.creditName}>
            Los {club.memberTerm} <span className="italic text-[var(--hd-sand)]">como ellos mismos</span>
          </p>
        </div>
        <div className={styles.creditBlock}>
          <p className={`${styles.mono} ${styles.creditRole}`}>Rodada en</p>
          <p className={styles.creditSmall}>{places.join(" · ")}</p>
        </div>
        <div className={styles.creditBlock}>
          <p className={`${styles.mono} ${styles.creditRole}`}>Fotografía</p>
          <p className={styles.creditSmall}>Archivo del club · {club.instagramHandle}</p>
        </div>
        <div className={styles.creditBlock}>
          <p className={`${styles.mono} ${styles.creditRole}`}>Con el apoyo de</p>
          {current.map((name) => (
            <p key={name} className={styles.creditName}>
              {name}
            </p>
          ))}
          <p className={`${styles.creditSmall} mt-4`}>y también {earlier.join(" · ")}</p>
        </div>
        <div className={styles.creditBlock}>
          <p className={`${styles.mono} ${styles.creditRole}`}>Federación</p>
          <p className={styles.creditSmall}>
            {club.federation} · nº {club.federationNumber}
          </p>
        </div>
        <div className={styles.creditBlock}>
          <p className={`${styles.mono} ${styles.creditRole}`}>Banda sonora</p>
          <p className={styles.creditSmall}>Respiración, piedra suelta y viento de levante</p>
        </div>
        <p className={`${styles.creditSmall} mx-auto mb-[clamp(4rem,12vh,7rem)] italic`}>
          Ningún sendero resultó dañado durante el rodaje.
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element -- the logo must paint instantly */}
        <img src="/logo/logo-light.png" alt={club.name} width={640} height={195} className="mx-auto h-14 w-auto md:h-16" />
        <p className={`${styles.serif} ${styles.fin} mt-10`}>Fin</p>
        <p className={`${styles.mono} mt-4 text-[var(--hd-dim)]`}>
          {season.title} · continuará
        </p>
      </div>

      <footer className={`${styles.container} ${styles.footer}`}>
        <div className={`${styles.mono} flex flex-wrap items-center justify-between gap-4 text-[var(--hd-sand)]`}>
          <span>
            © {season.year} {club.name} · {club.town}
          </span>
          <a href={club.instagram} target="_blank" rel="noopener noreferrer" className={styles.hudLink}>
            {club.instagramHandle} ↗
          </a>
          <Link href="/" className={styles.hudLink}>
            ← Todas las versiones
          </Link>
        </div>
      </footer>
    </section>
  );
}

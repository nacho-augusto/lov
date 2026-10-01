import Link from "next/link";
import { club } from "@/content";
import { BIB } from "./copy";
import s from "./dorsal.module.css";

/** Footer: the finish line, then the organiser's small print. */
export function Meta() {
  return (
    <footer className={s.foot}>
      <div className={s.finish}>
        <p className={s.finishWord} aria-hidden="true">
          Meta
        </p>
        <p className={s.finishLine}>
          <span>Línea de meta</span>
          <span>{club.town} · 0 m</span>
          <span>Dorsal {BIB} · Temporada 2026</span>
        </p>
      </div>

      <div className={s.colophon}>
        <div>
          <p className={s.footLabel}>Organiza</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo/logo-light.png"
            alt={club.name}
            width={640}
            height={195}
            loading="lazy"
            className={s.footLogo}
          />
          <p className={s.footOrg}>
            {club.name}
            <br />
            {club.igBio}
            <br />
            {club.town} ({club.province}) · {club.federation} nº {club.federationNumber}
          </p>
        </div>

        <div>
          <p className={s.footLabel}>Contacto</p>
          <ul className={s.footLinks}>
            <li>
              <a href={club.instagram} target="_blank" rel="noopener noreferrer">
                Instagram {club.instagramHandle} ↗
              </a>
            </li>
            <li className={s.footMail}>
              {/* contactEmail is still a placeholder in content/club.ts: label it as unconfirmed */}
              <a href={`mailto:${club.contactEmail}`}>{club.contactEmail}</a>
              <span className={s.tbc}>Por confirmar</span>
            </li>
          </ul>
        </div>

        <div>
          <p className={s.footLabel}>Letra pequeña</p>
          <p className={s.footSmall}>
            Los datos de la temporada salen de las publicaciones del propio club en Instagram. Las
            categorías, el material obligatorio y el régimen sancionador son de broma; la montaña, no.
            Este dorsal es personal e intransferible. No doblar. No recortar, salvo por la línea de
            puntos.
          </p>
        </div>

        <div>
          <p className={s.footLabel}>Otras versiones</p>
          <Link href="/" className={s.footBack}>
            ← Todas las versiones
          </Link>
        </div>
      </div>
    </footer>
  );
}

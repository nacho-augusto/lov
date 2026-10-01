import Link from "next/link";
import { club, season, sponsors, sponsorsIntro } from "@/content";
import f from "./frontal.module.css";
import s from "./dia.module.css";

/** After dawn the page turns to daylight: first the thanks… */
export function Gracias() {
  const ordered = [...sponsors.filter((x) => x.current), ...sponsors.filter((x) => !x.current)];

  return (
    <section id="dia" className={`${s.day} ${s.thanks}`} aria-labelledby="gracias-title">
      <div className={f.wrap}>
        <h2 id="gracias-title" className={s.thanksTitle}>
          {sponsorsIntro}
        </h2>
        <p className={s.names}>
          {ordered.map((x, i) => {
            const sep = i < ordered.length - 2 ? ", " : i === ordered.length - 2 ? " y " : ".";
            const name = x.instagram ? (
              <a
                href={`https://www.instagram.com/${x.instagram}/`}
                target="_blank"
                rel="noopener noreferrer"
                className={x.current ? s.current : undefined}
              >
                {x.name}
              </a>
            ) : (
              <span className={x.current ? s.current : undefined}>{x.name}</span>
            );
            return (
              <span key={x.name}>
                {name}
                {sep}
              </span>
            );
          })}
        </p>
        <p className={s.note}>
          Quienes apoyan al club y aparecen en los agradecimientos de sus publicaciones de {season.year}. En tinta
          más oscura, los de las publicaciones más recientes.
        </p>
      </div>
    </section>
  );
}

/** …then the footer. */
export function Pie() {
  return (
    <footer className={`${s.day} ${s.footer}`}>
      <div className={`${f.wrap} ${s.footGrid}`}>
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo/logo-mark.png" alt={club.name} width={640} height={195} className={s.logo} />
          <p className={s.about}>
            {club.legalType} de actividades de montaña de {club.town} ({club.province}). Federado en{" "}
            {club.federation} con el nº {club.federationNumber}.
          </p>
        </div>

        <nav className={s.links} aria-label="Contacto y versiones">
          <a href={club.instagram} target="_blank" rel="noopener noreferrer">
            Instagram {club.instagramHandle}
          </a>
          <a
            href={`mailto:${club.contactEmail}`}
            aria-label={`Correo del club: ${club.contactEmail} (dirección por confirmar)`}
          >
            {club.contactEmail} <span className={s.tag}>por confirmar</span>
          </a>
          <Link href="/" className={s.back}>
            ← Todas las versiones
          </Link>
        </nav>
      </div>
      <div className={`${f.wrap} ${s.fine}`}>
        <p>Fotos: publicaciones del club en Instagram. La panorámica nocturna es una imagen ilustrativa.</p>
        <p>Hecho de noche, en la Axarquía.</p>
      </div>
    </footer>
  );
}

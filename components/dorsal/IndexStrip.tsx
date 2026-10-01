import Link from "next/link";
import { BIB, sectionIndex } from "./copy";
import s from "./dorsal.module.css";

/** Blunt, sticky index strip: the tabs of the race dossier. No JS, instant jumps. */
export function IndexStrip() {
  return (
    <header className={s.strip}>
      <nav className={s.stripNav} aria-label="Índice del dossier">
        <a href="#dorsal" className={s.stripHome}>
          <span className={s.stripHomeLov}>LOV</span>
          <span className={s.stripHomeNo}>
            <span className={s.srOnly}>Dorsal </span>Nº {BIB}
          </span>
        </a>
        <ol className={s.stripList}>
          {sectionIndex.map((item, i) => (
            <li key={item.id}>
              <a href={`#${item.id}`} className={s.stripLink}>
                <span className={s.stripNum}>{String(i + 1).padStart(2, "0")}</span>
                <span className={s.stripLabel}>{item.label}</span>
                <span className={s.stripShort} aria-hidden="true">
                  {item.short}
                </span>
              </a>
            </li>
          ))}
        </ol>
        <Link href="/" className={s.stripBack}>
          ← Todas las versiones
        </Link>
      </nav>
    </header>
  );
}

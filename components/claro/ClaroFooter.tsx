import Link from "next/link";
import { club, season } from "@/content";
import styles from "./claro.module.css";
import { IconInstagram } from "./icons";

export function ClaroFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <p className={`${styles.display} ${styles.footerMark}`} aria-hidden>
          La otra
          <br />
          vertiente<span className="text-[var(--c-orange)]">.</span>
        </p>

        <div className="mt-12 grid gap-8 border-t border-white/15 pt-8 text-[0.9rem] text-white/70 md:grid-cols-4">
          <div>
            <p className="font-semibold text-white">{club.name}</p>
            <p className="mt-1">
              {club.town}, {club.province}
            </p>
          </div>
          <div>
            <p className="font-semibold text-white">Federación</p>
            <p className="mt-1">
              {club.federation} · nº {club.federationNumber}
            </p>
          </div>
          <div>
            <a
              href={club.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-semibold text-white hover:text-[var(--c-orange)]"
            >
              <IconInstagram className="h-4 w-4" />
              {club.instagramHandle}
            </a>
          </div>
          <div className="md:text-right">
            <Link href="/" className="font-semibold text-white hover:text-[var(--c-orange)]">
              ← Todas las versiones
            </Link>
          </div>
        </div>
        <p className="mt-10 text-[0.8rem] text-white/45">© {season.year} {club.name}</p>
      </div>
    </footer>
  );
}

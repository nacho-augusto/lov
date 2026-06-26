import Link from "next/link";
import { Logo } from "./Logo";
import { club } from "@/content/club";

/** Shared, theme-aware footer with club identity, socials and legal. */
export function SiteFooter({ tone = "light" }: { tone?: "light" | "dark" }) {
  const isLight = tone === "light";
  const bg = isLight ? "bg-charcoal text-snow" : "bg-paper-panel text-ink";
  const muted = isLight ? "text-snow/55" : "text-ink/55";
  const border = isLight ? "border-white/10" : "border-black/10";
  const year = 2026;

  return (
    <footer className={`${bg} relative overflow-hidden`}>
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <Logo tone={tone} href={null} />
            <p className={`mt-4 text-sm leading-relaxed ${muted}`}>
              Club deportivo de montaña y trail running en {club.town},{" "}
              {club.province}. Corremos por la otra vertiente: la que no se ve
              desde la playa.
            </p>
          </div>

          <nav className="flex flex-col gap-2.5 text-sm">
            <span className={`mb-1 font-semibold uppercase tracking-wider ${muted}`}>
              Navega
            </span>
            <Link href="/cumbre-nocturna" className="transition-colors hover:text-orange">
              Cumbre Nocturna
            </Link>
            <Link href="/curvas-de-nivel" className="transition-colors hover:text-orange">
              Curvas de Nivel
            </Link>
            <Link href="/vertice" className="transition-colors hover:text-orange">
              Vértice
            </Link>
          </nav>

          <div className="flex flex-col gap-2.5 text-sm">
            <span className={`mb-1 font-semibold uppercase tracking-wider ${muted}`}>
              Contacto
            </span>
            <a
              href={club.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-orange"
            >
              Instagram {club.instagramHandle}
            </a>
            <a
              href={`mailto:${club.contactEmail}`}
              className="transition-colors hover:text-orange"
            >
              {club.contactEmail}
            </a>
            <span className={muted}>
              {club.federation} · nº {club.federationNumber}
            </span>
          </div>
        </div>

        <div
          className={`mt-12 flex flex-col gap-2 border-t ${border} pt-6 text-xs sm:flex-row sm:items-center sm:justify-between ${muted}`}
        >
          <span>
            © {year} {club.name}. Hecho en la montaña malagueña.
          </span>
          <span>
            {club.town} · {club.region}
          </span>
        </div>
      </div>
    </footer>
  );
}

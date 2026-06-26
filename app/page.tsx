import type { Metadata } from "next";
import { SelectorCards } from "@/components/selector/SelectorCards";
import { Logo } from "@/components/shared/Logo";
import { club } from "@/content/club";

export const metadata: Metadata = {
  title: "Elige tu experiencia",
  description:
    "Tres versiones de la web de C.D. La Otra Vertiente. Elige la que más te guste.",
};

export default function SelectorPage() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-ink px-5 py-20 text-snow">
      {/* ambient backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, rgba(242,107,29,0.18), transparent 70%), radial-gradient(40% 40% at 80% 90%, rgba(242,107,29,0.10), transparent 70%)",
        }}
      />

      <header className="relative mb-12 flex flex-col items-center text-center">
        <Logo tone="light" href={null} className="mb-6 h-12 w-auto sm:h-16" />
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-orange">
          {club.legalType} · {club.town}
        </p>
        <h1 className="font-display mt-4 text-5xl uppercase sm:text-7xl">
          Elige tu vertiente
        </h1>
        <p className="mt-5 max-w-xl text-balance text-snow/65">
          Tres maquetas de la web del club, cada una con su propia personalidad y
          su montaña que se escala al hacer scroll. Ábrelas y elige tu favorita.
        </p>
      </header>

      <SelectorCards />

      <footer className="relative mt-14 text-center text-xs text-snow/40">
        Hecho en la montaña malagueña · {club.federation} nº {club.federationNumber}
      </footer>
    </main>
  );
}

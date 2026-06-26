import type { Metadata } from "next";
import SmoothScroll from "@/components/shared/SmoothScroll";
import { SiteNav } from "@/components/shared/SiteNav";
import { SiteFooter } from "@/components/shared/SiteFooter";
import { JoinSection } from "@/components/shared/JoinSection";
import { Gallery } from "@/components/shared/Gallery";
import { CurvasHero } from "@/components/curvas-de-nivel/CurvasHero";
import {
  CurvasAbout,
  CurvasPeaks,
  CurvasTrail,
} from "@/components/curvas-de-nivel/CurvasSections";
import { galleryImages } from "@/content/gallery";
import { sections } from "@/content/copy";

export const metadata: Metadata = {
  title: "Curvas de Nivel",
  description:
    "Versión editorial topográfica de la web de C.D. La Otra Vertiente: un mapa de papel que se escala al hacer scroll.",
};

export default function CurvasDeNivelPage() {
  const g = sections.gallery;
  return (
    <SmoothScroll>
      <div className="bg-paper text-ink">
        <SiteNav tone="dark" />
        <main>
          <CurvasHero />
          <CurvasAbout />
          <CurvasPeaks />
          <CurvasTrail />

          <section id="galeria" className="bg-paper-panel px-5 py-24 sm:px-8 sm:py-32">
            <div className="mx-auto max-w-6xl">
              <div className="mb-12 max-w-2xl">
                <p className="font-mono text-xs uppercase tracking-[0.3em] text-orange">
                  {g.eyebrow}
                </p>
                <h2 className="mt-4 font-serif text-5xl leading-tight sm:text-6xl">
                  {g.title}
                </h2>
                <p className="mt-5 text-lg text-ink/70">{g.subtitle}</p>
              </div>
              <Gallery images={galleryImages} tone="dark" layout="grid" />
            </div>
          </section>

          <JoinSection tone="dark" />
        </main>
        <SiteFooter tone="dark" />
      </div>
    </SmoothScroll>
  );
}

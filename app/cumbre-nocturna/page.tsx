import type { Metadata } from "next";
import SmoothScroll from "@/components/shared/SmoothScroll";
import { SiteNav } from "@/components/shared/SiteNav";
import { SiteFooter } from "@/components/shared/SiteFooter";
import { JoinSection } from "@/components/shared/JoinSection";
import { Gallery } from "@/components/shared/Gallery";
import { CumbreHero } from "@/components/cumbre-nocturna/CumbreHero";
import {
  CumbreAbout,
  CumbrePeaks,
  CumbreTrail,
} from "@/components/cumbre-nocturna/CumbreSections";
import { galleryImages } from "@/content/gallery";
import { sections } from "@/content/copy";

export const metadata: Metadata = {
  title: "Cumbre Nocturna",
  description:
    "Versión cinematográfica 3D de la web de C.D. La Otra Vertiente: asciende el macizo al hacer scroll, de la hora azul al amanecer.",
};

export default function CumbreNocturnaPage() {
  const g = sections.gallery;
  return (
    <SmoothScroll>
      <div className="bg-ink text-snow">
        <SiteNav tone="light" />
        <main>
          <CumbreHero />
          <CumbreAbout />
          <CumbrePeaks />
          <CumbreTrail />

          <section id="galeria" className="bg-charcoal px-5 py-28 sm:px-8 sm:py-36">
            <div className="mx-auto max-w-6xl">
              <div className="mb-12 max-w-2xl">
                <p className="font-mono text-xs uppercase tracking-[0.3em] text-orange">
                  {g.eyebrow}
                </p>
                <h2 className="font-display mt-4 text-5xl uppercase leading-[0.95] sm:text-7xl">
                  {g.title}
                </h2>
                <p className="mt-5 text-lg text-snow/65">{g.subtitle}</p>
              </div>
              <Gallery images={galleryImages} tone="light" layout="grid" />
            </div>
          </section>

          <div className="relative overflow-hidden">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-30"
              style={{ backgroundImage: "url('/generated/summit-dawn.jpg')" }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(to bottom, #07090c 0%, rgba(7,9,12,0.7) 40%, rgba(7,9,12,0.85) 100%)",
              }}
            />
            <div className="relative">
              <JoinSection tone="light" />
            </div>
          </div>
        </main>
        <SiteFooter tone="light" />
      </div>
    </SmoothScroll>
  );
}

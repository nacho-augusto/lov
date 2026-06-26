import type { Metadata } from "next";
import SmoothScroll from "@/components/shared/SmoothScroll";
import { SiteNav } from "@/components/shared/SiteNav";
import { SiteFooter } from "@/components/shared/SiteFooter";
import { JoinSection } from "@/components/shared/JoinSection";
import { Gallery } from "@/components/shared/Gallery";
import { VerticeHero } from "@/components/vertice/VerticeHero";
import {
  VerticeAbout,
  VerticeCumbres,
  VerticeTrail,
} from "@/components/vertice/VerticeSections";
import { galleryImages } from "@/content/gallery";
import { sections } from "@/content/copy";

export const metadata: Metadata = {
  title: "Vértice",
  description:
    "Versión WebGL de la web de C.D. La Otra Vertiente: la montaña como dato, un altímetro y una banda de altitud que se escala al hacer scroll.",
};

export default function VerticePage() {
  const g = sections.gallery;
  return (
    <SmoothScroll>
      <div className="bg-ink text-snow">
        <SiteNav tone="light" />
        <main>
          <VerticeHero />
          <VerticeAbout />
          <VerticeCumbres />
          <VerticeTrail />

          <section id="galeria" className="bg-ink px-5 py-24 sm:px-8 sm:py-32">
            <div className="mx-auto max-w-6xl">
              <div className="mb-12 max-w-2xl">
                <p className="font-mono text-xs uppercase tracking-[0.3em] text-orange">
                  {g.eyebrow}
                </p>
                <h2 className="font-display mt-4 text-5xl uppercase sm:text-7xl">
                  {g.title}
                </h2>
                <p className="mt-5 text-lg text-snow/65">{g.subtitle}</p>
              </div>
              <Gallery images={galleryImages} tone="light" layout="marquee" />
            </div>
          </section>

          <JoinSection tone="light" />
        </main>
        <SiteFooter tone="light" />
      </div>
    </SmoothScroll>
  );
}

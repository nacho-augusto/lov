import SmoothScroll from "@/components/shared/SmoothScroll";
import { AltitudeRail } from "@/components/indice/AltitudeRail";
import { BackMatter } from "@/components/indice/BackMatter";
import { ClubChapter } from "@/components/indice/ClubChapter";
import { ContactChapter } from "@/components/indice/ContactChapter";
import { Contents } from "@/components/indice/Contents";
import { FiguresChapter } from "@/components/indice/FiguresChapter";
import { Footer } from "@/components/indice/Footer";
import { Header } from "@/components/indice/Header";
import { Hero } from "@/components/indice/Hero";
import { PeaksChapter } from "@/components/indice/PeaksChapter";
import { RevealObserver } from "@/components/indice/RevealObserver";
import { SeasonChapter } from "@/components/indice/SeasonChapter";

/**
 * ÍNDICE — the club as a quietly typeset mountain book: title page, table of
 * contents, five chapters and back matter, read from sea level to 2.069 m.
 */
export default function IndicePage() {
  return (
    <SmoothScroll>
      <a href="#contenido" className="ix-skip">
        Saltar al contenido
      </a>
      <Header />
      <AltitudeRail />
      <main id="contenido">
        <Hero />
        <Contents />
        <ClubChapter />
        <SeasonChapter />
        <PeaksChapter />
        <FiguresChapter />
        <ContactChapter />
        <BackMatter />
      </main>
      <Footer />
      <RevealObserver />
    </SmoothScroll>
  );
}

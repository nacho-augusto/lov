import type { Metadata } from "next";
import SmoothScroll from "@/components/shared/SmoothScroll";
import { HdCast } from "@/components/hora-dorada/HdCast";
import { HdCasting } from "@/components/hora-dorada/HdCasting";
import { HdCredits } from "@/components/hora-dorada/HdCredits";
import { HdHero } from "@/components/hora-dorada/HdHero";
import { HdHud } from "@/components/hora-dorada/HdHud";
import { HdLocations } from "@/components/hora-dorada/HdLocations";
import { HdPrologue } from "@/components/hora-dorada/HdPrologue";
import { HdScenes } from "@/components/hora-dorada/HdScenes";
import styles from "@/components/hora-dorada/hd.module.css";

export const metadata: Metadata = {
  title: "Hora dorada",
  description:
    "La web de C.D. La Otra Vertiente contada como un documental: cuatro vertinianos corriendo hacia el sol de la tarde, la temporada en escenas y los créditos finales.",
};

export default function HoraDoradaPage() {
  return (
    <SmoothScroll>
      <div className={styles.root}>
        <HdHud />
        <main>
          <HdHero />
          <HdPrologue />
          <HdScenes />
          <HdLocations />
          <HdCast />
          <HdCasting />
        </main>
        <HdCredits />
        <div className={styles.grain} aria-hidden />
      </div>
    </SmoothScroll>
  );
}

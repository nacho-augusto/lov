import type { Metadata } from "next";
import SmoothScroll from "@/components/shared/SmoothScroll";
import { Amanecer } from "@/components/frontal/Amanecer";
import { Cumbres } from "@/components/frontal/Cumbres";
import { Gracias, Pie } from "@/components/frontal/Dia";
import { FrontalShell } from "@/components/frontal/FrontalShell";
import { Hero } from "@/components/frontal/Hero";
import { Manual } from "@/components/frontal/Manual";
import { Noche } from "@/components/frontal/Noche";
import { Nocturnas } from "@/components/frontal/Nocturnas";
import { Vertinianos } from "@/components/frontal/Vertinianos";

export const metadata: Metadata = {
  title: "Frontal",
  description:
    "La web de C.D. La Otra Vertiente contada como una noche de montaña: enciende el frontal, sigue la fila de luces y llega al amanecer.",
};

/**
 * FRONTAL — the page is one night run (22:47 → 07:12). Your pointer is a headlamp.
 */
export default function FrontalPage() {
  return (
    <SmoothScroll>
      <FrontalShell>
        <main id="frontal-main">
          <Hero />
          <Noche />
          <Nocturnas />
          <Manual />
          <Cumbres />
          <Vertinianos />
          <Amanecer />
          <Gracias />
        </main>
        <Pie />
      </FrontalShell>
    </SmoothScroll>
  );
}

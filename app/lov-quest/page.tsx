import type { Metadata } from "next";
import { club, season } from "@/content";
import { Achievements } from "@/components/lov-quest/Achievements";
import { Altimeter } from "@/components/lov-quest/Altimeter";
import { Captures } from "@/components/lov-quest/Captures";
import { CharacterSelect } from "@/components/lov-quest/CharacterSelect";
import { TIPS } from "@/components/lov-quest/copy";
import { Credits } from "@/components/lov-quest/Credits";
import { Footer } from "@/components/lov-quest/Footer";
import { Hero } from "@/components/lov-quest/Hero";
import { LoadingTip } from "@/components/lov-quest/LoadingTip";
import { Manual } from "@/components/lov-quest/Manual";
import { Menu } from "@/components/lov-quest/Menu";
import { Multiplayer } from "@/components/lov-quest/Multiplayer";
import { Screen } from "@/components/lov-quest/Screen";
import { WorldMap } from "@/components/lov-quest/WorldMap";

export const metadata: Metadata = {
  title: "LOV Quest",
  description:
    "La Otra Vertiente: el videojuego. El club de trail running de Rincón de la Victoria convertido en un juego de plataformas de 8 bits: elige personaje, recorre las cumbres de Málaga y desbloquea la temporada 2026.",
};

export default function LovQuestPage() {
  return (
    <>
      <Menu />
      <Altimeter />
      <main id="lq-main">
        <Hero />

        <LoadingTip next="personajes" tip={TIPS[5]} />
        <Screen
          id="personaje"
          stage="1-2"
          title="Selecciona personaje"
          intro={
            <>
              En este juego no hay héroes: hay {club.memberTerm}. Elige clase, mira sus atributos y sal a la sierra. La
              clase que elijas es la que corre en la pantalla de título.
            </>
          }
        >
          <CharacterSelect />
        </Screen>

        <LoadingTip next="el mapa del mundo" tip={TIPS[0]} />
        <Screen
          id="mapa"
          stage="1-3"
          tone="ink"
          title="Mapa del mundo"
          intro="Diez niveles del mar a los 2.069 m, ordenados por altitud. Las cumbres de la Axarquía son nuestra casa; La Maroma, el jefe final."
        >
          <WorldMap />
        </Screen>

        <LoadingTip next="los logros" tip={TIPS[3]} />
        <Screen id="logros" stage="1-4" title={`Logros desbloqueados\u00a0· ${season.year}`} intro={season.intro}>
          <Achievements />
        </Screen>

        <LoadingTip next="las capturas" tip={TIPS[1]} />
        <Screen
          id="capturas"
          stage="1-5"
          tone="ink"
          title="Capturas"
          intro="Fotos reales del club guardadas en 8 bits. Pasa el cursor, enfoca o toca una captura para cargarla en alta resolución."
        >
          <Captures />
        </Screen>

        <LoadingTip next="el manual" tip={TIPS[2]} />
        <Screen
          id="manual"
          stage="1-6"
          tone="paper"
          title="Manual de instrucciones"
          intro="Léelo antes de jugar. O después de tu primera pájara, como todo el mundo."
        >
          <Manual />
        </Screen>

        <Screen
          id="unete"
          stage="1-7"
          tone="sky"
          title="Modo multijugador"
          intro="Este juego se disfruta más en grupo. Si quieres ser el siguiente jugador, escríbenos."
        >
          <Multiplayer />
        </Screen>

        <Screen id="creditos" stage="1-8" tone="ink" title="Créditos">
          <Credits />
        </Screen>
      </main>
      <Footer />
    </>
  );
}

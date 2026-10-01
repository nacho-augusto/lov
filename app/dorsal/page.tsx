import type { Metadata } from "next";
import { IndexStrip } from "@/components/dorsal/IndexStrip";
import { Bib } from "@/components/dorsal/Bib";
import { Tape } from "@/components/dorsal/Tape";
import { Reglamento } from "@/components/dorsal/Reglamento";
import { Clasificacion } from "@/components/dorsal/Clasificacion";
import { Perfil } from "@/components/dorsal/Perfil";
import { Fotos } from "@/components/dorsal/Fotos";
import { Inscripcion } from "@/components/dorsal/Inscripcion";
import { Patrocinadores } from "@/components/dorsal/Patrocinadores";
import { Meta } from "@/components/dorsal/Meta";
import s from "@/components/dorsal/dorsal.module.css";

export const metadata: Metadata = {
  title: "Dorsal",
  description:
    "Versión cartel de carrera de la web de C.D. La Otra Vertiente: el dorsal 2069, el reglamento, la clasificación de la temporada 2026, el perfil y la inscripción. Sin animaciones.",
};

export default function DorsalPage() {
  return (
    <div className={s.root}>
      <a href="#contenido" className={s.skip}>
        Saltar al contenido
      </a>
      <IndexStrip />
      <main id="contenido">
        <Bib />
        <Tape tone="ink" tilt={-1.4} />
        <Reglamento />
        <Clasificacion />
        <Perfil />
        <Fotos />
        <Tape tone="orange" tilt={1.2} offset={2} />
        <Inscripcion />
        <Patrocinadores />
      </main>
      <Meta />
    </div>
  );
}

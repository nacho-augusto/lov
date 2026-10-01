import Image from "next/image";
import { club, photoById, seasonEvents } from "@/content";
import { plates } from "./copy";
import { SectionHead } from "./SectionHead";
import { CropMarks, Stamp } from "./marks";
import s from "./dorsal.module.css";

const eventDate = (eventId: string) => seasonEvents.find((e) => e.id === eventId)?.dateLabel ?? "";

/** 04 — Club photos as two-ink halftone plates in a hard grid. */
export function Fotos() {
  return (
    <section id="fotos" className={s.fotos} aria-labelledby="fotos-title">
      <SectionHead id="fotos" title="Fotos" fit={4.44} note="Archivo gráfico · Tramado a dos tintas" />

      <div className={s.plate}>
        <div className={s.figs}>
          <CropMarks className={s.plateCrop} />
          {plates.map((pl, i) => {
            const photo = photoById(pl.photo);
            return (
              <figure key={pl.slot} className={`${s.fig} ${s[`fig_${pl.slot}`]}`}>
                <Image
                  src={`/dorsal/${pl.file}`}
                  alt={photo.alt}
                  width={pl.w}
                  height={pl.h}
                  unoptimized
                  loading="lazy"
                  className={s.figImg}
                />
                {"stamp" in pl && (
                  <Stamp className={s.figStamp} tone="paper">
                    {pl.stamp}
                  </Stamp>
                )}
                <figcaption className={s.figCap}>
                  <span className={s.figNo}>Fig. {i + 1}</span>
                  <span className={s.figText}>
                    {photo.caption}
                    <span className={s.figMeta}> · {eventDate(photo.event)}</span>
                  </span>
                </figcaption>
              </figure>
            );
          })}
        </div>

        <div className={s.plateFoot}>
          <p className={s.plateNote}>
            La temporada en pruebas de imprenta · Fotos: {club.instagramHandle} · Trama de punto
            redondo, naranja a 15° y negro a 45°
          </p>
          <p className={s.colorBar} aria-hidden="true">
            <i className={s.cbK} />
            <i className={s.cbK50} />
            <i className={s.cbO} />
            <i className={s.cbO50} />
            <i className={s.cbP} />
          </p>
        </div>
      </div>
    </section>
  );
}

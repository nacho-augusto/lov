import Image from "next/image";
import { photoById, season, seasonEvents, seasonKindLabel } from "@/content";
import { Chapter } from "./Chapter";
import { InView } from "./InView";
import styles from "./hd.module.css";

// One subtitle per scene, condensed from the club's own post for that event.
const SUBTITLES: Record<string, string> = {
  "nocturna-frigiliana": "— Una noche entera de montaña: Navachica y Pico del Cielo.",
  "omd-utmb": "— Cuatro de los nuestros cruzaron juntos la meta. Más de 38 horas de carrera.",
  "ronda-101": "— Dos corazones naranjas, hasta la meta nocturna.",
  "leguas-alpujarras": "— Carrera terminada y un recorrido para repetir.",
  "cxm-el-fuerte": "— Vistas desde las alturas de Frigiliana. Ya está en el calendario.",
  "pico-del-cielo": "— Ese día, nuestro naranja fue blanquiazul.",
  "premios-lov": "— Un premio al compañerismo, dentro y fuera de la montaña.",
  carratraca: "— Nuestra pareja clásica entró junta en meta.",
  "trail-nocturno-la-jabega": "— En casa: nuestra montaña, nuestra playa y premio en la categoría local.",
  "san-anton-trail": "— Primera edición y broche final a las nocturnas del verano.",
};

// Where to hold the crop in the 1.85:1 frame (faces sit high in most of these photos).
const FOCUS: Record<string, string> = {
  "san-anton-noche": "50% 40%",
  "omd-finishers": "50% 42%",
  "leguas-finishers": "50% 40%",
  "el-fuerte-trio": "50% 35%",
  "pico-del-cielo-cruz": "50% 55%",
  "carratraca-meta": "50% 38%",
};

export function HdScenes() {
  return (
    <section id="temporada" data-hd-chapter="II. La temporada" aria-labelledby="hd-season-title" className={styles.container}>
      <Chapter numeral="II" slug={`Capítulo dos · ${seasonEvents.length} escenas`} title="La" accent="temporada" titleId="hd-season-title">
        <p>{season.intro}</p>
      </Chapter>

      <ol className={styles.scenes}>
        {seasonEvents.map((e, i) => {
          const photo = e.photos[0] ? photoById(e.photos[0]) : null;
          const no = String(i + 1).padStart(2, "0");
          const lead = e.stats?.[0];
          return (
            <li key={e.id} className={`${styles.scene} ${i % 2 ? styles.sceneAlt : ""}`}>
              <InView className={styles.sceneMeta}>
                <p className={`${styles.mono} ${styles.sceneNo}`}>Esc. {no}</p>
                <p className={styles.mono}>
                  {e.dateLabel} · Ext. {e.night ? "noche" : "día"}
                </p>
                <p className={styles.mono}>{e.place}</p>
                <h3 className={`${styles.serif} ${styles.sceneTitle}`}>{e.title}</h3>
                <p className={styles.mono}>{seasonKindLabel[e.kind]}</p>
                <a href={e.source} target="_blank" rel="noopener noreferrer" className={`${styles.mono} ${styles.sceneLink}`}>
                  Ver la publicación ↗
                </a>
              </InView>

              <InView mode="develop" className={styles.frame}>
                {photo && photo.height > photo.width ? (
                  // portrait photo: pillarboxed over a blurred copy of itself, nothing cropped
                  <>
                    <Image src={photo.src} alt="" fill sizes="40vw" className={styles.frameFill} aria-hidden />
                    <Image
                      src={photo.src}
                      alt={photo.alt}
                      fill
                      sizes="(min-width: 900px) 30vw, 50vw"
                      className={styles.framePortrait}
                    />
                    <div className={styles.frameShade} aria-hidden />
                  </>
                ) : photo ? (
                  <>
                    <Image
                      src={photo.src}
                      alt={photo.alt}
                      fill
                      sizes="(min-width: 900px) 70vw, 100vw"
                      style={{ objectPosition: FOCUS[photo.id] ?? "50% 45%" }}
                    />
                    <div className={styles.frameShade} aria-hidden />
                  </>
                ) : (
                  // no photo in the club's post: an intertitle card instead
                  <div className={styles.intertitle}>
                    <p className={`${styles.mono} ${styles.gold}`}>{e.place}</p>
                    <p className={`${styles.serif} ${styles.intertitleFigure}`}>{lead ? lead.value : e.title}</p>
                    {lead && <p className={styles.mono}>{lead.label}</p>}
                  </div>
                )}
                <p className={`${styles.mono} ${styles.frameTc}`} aria-hidden>
                  Esc. {no} · {e.month.toString().padStart(2, "0")}/26
                </p>
                <p className={styles.frameSub}>{SUBTITLES[e.id]}</p>
              </InView>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

import Image from "next/image";
import { club, photoById } from "@/content";
import type { ClubPhoto } from "@/content";
import { Chapter } from "./Chapter";
import styles from "./hd.module.css";

const ROW_A = ["omd-expedicion", "el-fuerte-trio", "premios-playa", "leguas-photocall", "san-anton-dorsales", "el-fuerte-cima"].map(
  photoById,
);
const ROW_B = ["carratraca-salida", "omd-board", "el-fuerte-pareja", "alpujarra-bosque", "premios-mesa", "ronda-tajo"].map(
  photoById,
);

function Frame({ photo, code, hidden }: { photo: ClubPhoto; code: string; hidden?: boolean }) {
  const h = 272; // rendered height in px at the largest strip size (17rem)
  return (
    <figure className={styles.stripFrame} aria-hidden={hidden || undefined}>
      <Image
        src={photo.src}
        alt={hidden ? "" : photo.alt}
        width={Math.round((photo.width / photo.height) * h)}
        height={h}
        sizes={`${Math.round((photo.width / photo.height) * 17)}rem`}
      />
      <figcaption className={`${styles.mono} ${styles.edgeCode}`}>{code}</figcaption>
    </figure>
  );
}

/** Two strips of film running in opposite directions; each is doubled for a seamless loop. */
function Strip({ photos, reverse, offset }: { photos: ClubPhoto[]; reverse?: boolean; offset: number }) {
  return (
    <div className={`${styles.strip} ${reverse ? styles.stripReverse : ""}`}>
      {[0, 1].map((copy) =>
        photos.map((p, i) => (
          <Frame key={`${copy}-${p.id}`} photo={p} hidden={copy === 1} code={`LOV 2069 · ${offset + i * 2}A`} />
        )),
      )}
    </div>
  );
}

export function HdCast() {
  return (
    <section id="reparto" data-hd-chapter="IV. Reparto" aria-labelledby="hd-cast-title">
      <div className={styles.container}>
        <Chapter numeral="IV" slug="Capítulo cuatro · Reparto" title="Los" accent="vertinianos" titleId="hd-cast-title">
          <p>
            En el papel de sí mismos. Fotogramas de la temporada sacados del archivo del club en{" "}
            <a href={club.instagram} target="_blank" rel="noopener noreferrer" className="text-[var(--hd-gold)] underline-offset-4 hover:underline">
              {club.instagramHandle}
            </a>
            .
          </p>
        </Chapter>
      </div>
      <div className={styles.stripWrap}>
        <Strip photos={ROW_A} offset={12} />
        <Strip photos={ROW_B} reverse offset={31} />
      </div>
    </section>
  );
}

import Image from "next/image";
import { club, photoById, seasonEvents } from "@/content";
import { Reveal } from "./Reveal";
import styles from "./claro.module.css";
import { IconArrowUpRight, IconInstagram } from "./icons";

// Mixed aspect ratios read best in the masonry; order picked by eye.
const SHOTS = [
  "omd-finishers",
  "ronda-101-meta",
  "el-fuerte-cresta",
  "premios-playa",
  "alpujarra-bosque",
  "san-anton-noche",
  "pico-del-cielo-cruz",
  "leguas-finishers",
  "ronda-tajo",
  "el-fuerte-brazos",
  "san-anton-dorsales",
  "carratraca-meta",
].map(photoById);

const sourceOf = (eventId: string) => seasonEvents.find((e) => e.id === eventId)?.source ?? club.instagram;

export function ClaroGallery() {
  return (
    <section id="galeria" aria-labelledby="claro-gallery-title" className={`${styles.container} py-[clamp(5rem,14vh,9rem)]`}>
      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <Reveal>
          <p className={`${styles.eyebrow} text-[var(--c-orange-deep)]`}>Galería</p>
          <h2 id="claro-gallery-title" className={`${styles.display} ${styles.h2} mt-4`}>
            Desde nuestro
            <br />
            Instagram
          </h2>
        </Reveal>
        <Reveal delay={120}>
          <a href={club.instagram} target="_blank" rel="noopener noreferrer" className={styles.pill}>
            <IconInstagram className="h-5 w-5" />
            {club.instagramHandle}
          </a>
        </Reveal>
      </div>

      <div className={`${styles.gallery} mt-12`}>
        {SHOTS.map((p) => (
          <a
            key={p.id}
            href={sourceOf(p.event)}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.shot}
            aria-label={`${p.caption}: ver la publicación en Instagram`}
          >
            <Image
              src={p.src}
              alt={p.alt}
              width={p.width}
              height={p.height}
              sizes="(min-width: 1200px) 24vw, (min-width: 768px) 32vw, 48vw"
            />
            <span className={styles.shotCaption}>
              <span className="flex items-center justify-between gap-3">
                {p.caption}
                <IconArrowUpRight className="h-4 w-4 shrink-0" />
              </span>
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}

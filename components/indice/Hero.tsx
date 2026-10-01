import Image from "next/image";
import { club } from "@/content";
import { Arrow } from "./Arrow";
import { heroPlate } from "./data";

/**
 * Title page: almost nothing. Tiny metadata on top, one small offset figure,
 * the club name set large and light with its second line indented, and the
 * one-line description nested in the space that indent leaves.
 */
export function Hero() {
  const p = heroPlate;
  return (
    <section id="portada" className="ix-wrap ix-hero" aria-labelledby="ix-titulo">
      <div className="ix-grid ix-hero__meta">
        <p className="ix-hero__cell" style={{ "--i": 0 } as React.CSSProperties}>
          <span>{club.name}</span>
          <span className="ix-grey">{club.legalType}</span>
        </p>
        <p className="ix-hero__cell" style={{ "--i": 1 } as React.CSSProperties}>
          <span>36.72° N</span>
          <span className="ix-grey">4.28° W</span>
        </p>
        <p className="ix-hero__cell" style={{ "--i": 2 } as React.CSSProperties}>
          <span>{club.federation}</span>
          <span className="ix-grey">nº {club.federationNumber}</span>
        </p>
        <p className="ix-hero__cell ix-hero__cell--end" style={{ "--i": 3 } as React.CSSProperties}>
          <span>0 m</span>
          <span className="ix-grey">Nivel del mar</span>
        </p>
      </div>

      <figure className="ix-hero__fig" id={p.domId}>
        <div className="ix-plate" style={{ aspectRatio: p.aspect }}>
          <Image
            src={p.photo.src}
            alt={p.photo.alt}
            fill
            sizes="(min-width: 1024px) 20vw, 44vw"
            loading="eager"
            style={{ objectPosition: p.pos }}
          />
        </div>
        <figcaption className="ix-cap">
          <span className="ix-cap__n">{p.fig}</span>
          <span className="ix-cap__t">{p.title}</span>
          <span className="ix-cap__m">{p.meta}</span>
        </figcaption>
      </figure>

      <div className="ix-grid ix-hero__name">
        <h1 id="ix-titulo" className="ix-hero__title">
          <span className="ix-line ix-hero__l1">
            <span>La Otra</span>
          </span>{" "}
          <span className="ix-line ix-hero__l2">
            <span>Vertiente</span>
          </span>
        </h1>
        <p className="ix-hero__lede">
          {club.igBio}. {club.town}, {club.province}.
        </p>
      </div>

      <p className="ix-hero__cue">
        <span>Baja para subir</span>
        <Arrow dir="down" />
      </p>
    </section>
  );
}

"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { plates } from "./data";
import { lockScroll } from "./scroll";

/** `sizes` per layout slot (see .ix-fig--* in indice.css). */
const SIZES: Record<string, string> = {
  a: "(min-width: 1024px) 36vw, (min-width: 720px) 67vw, 100vw",
  b: "(min-width: 1024px) 22vw, (min-width: 720px) 58vw, 75vw",
  c: "(min-width: 1024px) 36vw, 83vw",
  d: "(min-width: 1024px) 22vw, (min-width: 720px) 67vw, 83vw",
  e: "(min-width: 1024px) 22vw, (min-width: 720px) 50vw, 67vw",
  f: "(min-width: 1024px) 29vw, (min-width: 720px) 75vw, 92vw",
  g: "(min-width: 1024px) 22vw, (min-width: 720px) 67vw, 75vw",
  h: "(min-width: 1024px) 36vw, (min-width: 720px) 75vw, 100vw",
  i: "(min-width: 1024px) 22vw, (min-width: 720px) 58vw, 75vw",
  j: "(min-width: 1024px) 43vw, 83vw",
};

/**
 * 04 — plates on a white wall, in black and white until you look at them
 * (hover/focus on desktop; crossing the middle of the screen on touch).
 * Each opens full size in a native modal dialog.
 */
export function Plates() {
  const [index, setIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(hover: none)").matches) return;
    const items = Array.from(listRef.current?.querySelectorAll<HTMLElement>(".ix-fig") ?? []);
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.target.toggleAttribute("data-focus", e.isIntersecting)),
      { rootMargin: "-40% 0px -40% 0px" },
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const openAt = (i: number) => {
    setIndex(i);
    dialogRef.current?.showModal();
    lockScroll(true);
  };
  const close = () => dialogRef.current?.close();
  const step = (d: number) => setIndex((i) => (i === null ? i : (i + d + plates.length) % plates.length));

  const current = index === null ? null : plates[index];

  return (
    <>
      <ol className="ix-grid ix-plates" ref={listRef}>
        {plates.map((p, i) => (
          <li key={p.fig} id={p.domId} className={`ix-fig ix-fig--${p.slot}`} data-reveal="plate">
            <figure>
              <button type="button" className="ix-plate" style={{ aspectRatio: p.aspect }} onClick={() => openAt(i)}>
                <span className="sr-only">Ampliar {p.fig}. </span>
                <Image src={p.photo.src} alt={p.photo.alt} fill sizes={SIZES[p.slot]} style={{ objectPosition: p.pos }} />
              </button>
              <figcaption className="ix-cap">
                <span className="ix-cap__n">
                  <span className="ix-sun" aria-hidden="true" />
                  {p.fig}
                </span>
                <span className="ix-cap__t">{p.title}</span>
                <span className="ix-cap__m">{p.meta}</span>
              </figcaption>
            </figure>
          </li>
        ))}
      </ol>

      <dialog
        ref={dialogRef}
        className="ix-lightbox"
        aria-label="Lámina ampliada"
        onClose={() => {
          setIndex(null);
          lockScroll(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") step(1);
          if (e.key === "ArrowLeft") step(-1);
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        {current ? (
          <div className="ix-lightbox__inner">
            <div className="ix-lightbox__bar">
              <span>
                {current.fig} <span className="ix-grey">de {plates.length + 1}</span>
              </span>
              <button type="button" className="ix-lightbox__btn" onClick={close} autoFocus>
                Cerrar
              </button>
            </div>
            <div className="ix-lightbox__stage" onClick={close}>
              <Image
                key={current.fig}
                src={current.photo.src}
                alt={current.photo.alt}
                fill
                sizes="(min-width: 1024px) 70vw, 100vw"
                quality={85}
                className="ix-lightbox__img"
              />
            </div>
            <div className="ix-lightbox__foot">
              <button type="button" className="ix-lightbox__btn" onClick={() => step(-1)}>
                Anterior
              </button>
              <p className="ix-cap ix-lightbox__cap" aria-live="polite">
                <span className="ix-cap__t">{current.title}</span>
                <span className="ix-cap__m">{current.meta}</span>
              </p>
              <button type="button" className="ix-lightbox__btn" onClick={() => step(1)}>
                Siguiente
              </button>
            </div>
          </div>
        ) : null}
      </dialog>
    </>
  );
}

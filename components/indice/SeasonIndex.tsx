"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { photoById, seasonEvents, seasonKindLabel } from "@/content";
import { Arrow } from "./Arrow";
import { eventDate, eventDomId, isReel, keyFigure, monthAbbr, pad2, plateForPhoto } from "./data";
import { IndexLink } from "./IndexLink";
import { ITEM_EVENT } from "./scroll";

const withPhotos = seasonEvents.filter((e) => e.photos.length > 0);
const PREVIEW_GAP = 24;

/** Month shown only on the first entry of each month (book-index style); exact dates win. */
function monthCell(i: number): string {
  const ev = seasonEvents[i];
  const exact = /^(\d+)/.exec(ev.dateLabel);
  if (exact) return `${exact[1]} ${monthAbbr(ev.month)}`;
  const prev = seasonEvents[i - 1];
  return prev && prev.month === ev.month ? "" : monthAbbr(ev.month);
}

const capFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * 02 — the season as an index: one row per outing, each an accessible
 * disclosure. On desktop a small photograph follows the cursor over the rows.
 */
export function SeasonIndex() {
  const [open, setOpen] = useState<ReadonlySet<string>>(() => new Set());
  const [hover, setHover] = useState<string | null>(null);
  const [canPreview, setCanPreview] = useState(false);
  const [armed, setArmed] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const follow = useRef({ x: 0, y: 0, tx: 0, ty: 0, raf: 0, shown: false });
  const kick = useRef<() => void>(() => {});

  // Cursor previews only where hovering exists and motion is welcome.
  useEffect(() => {
    const hoverMq = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 1024px)");
    const motionMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setCanPreview(hoverMq.matches && !motionMq.matches);
    update();
    hoverMq.addEventListener("change", update);
    motionMq.addEventListener("change", update);
    return () => {
      hoverMq.removeEventListener("change", update);
      motionMq.removeEventListener("change", update);
    };
  }, []);

  // Eased follow loop; runs only while the preview is catching up with the cursor.
  useEffect(() => {
    if (!canPreview) return;
    const s = follow.current;
    const step = () => {
      s.x += (s.tx - s.x) * 0.2;
      s.y += (s.ty - s.y) * 0.2;
      if (boxRef.current) boxRef.current.style.transform = `translate3d(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px, 0)`;
      s.raf = Math.abs(s.tx - s.x) + Math.abs(s.ty - s.y) > 0.4 ? requestAnimationFrame(step) : 0;
    };
    kick.current = () => {
      if (!s.raf) s.raf = requestAnimationFrame(step);
    };
    return () => {
      cancelAnimationFrame(s.raf);
      s.raf = 0;
      kick.current = () => {};
    };
  }, [canPreview]);

  // Cross-references ("02.05" in the index of places) open their entry.
  useEffect(() => {
    const onItem = (e: Event) => {
      const target = (e as CustomEvent<string>).detail;
      const ev = seasonEvents.find((x) => eventDomId(x.id) === target);
      if (ev) setOpen((prev) => new Set(prev).add(ev.id));
    };
    window.addEventListener(ITEM_EVENT, onItem);
    return () => window.removeEventListener(ITEM_EVENT, onItem);
  }, []);

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const onPointerMove = (e: React.PointerEvent) => {
    if (!canPreview) return;
    const s = follow.current;
    const w = boxRef.current?.offsetWidth ?? 240;
    const h = boxRef.current?.offsetHeight ?? 300;
    // Hang below-right of the cursor so the hovered title stays readable;
    // flip when the viewport edge is near.
    const right = e.clientX + PREVIEW_GAP + w < window.innerWidth - 96;
    const below = e.clientY + PREVIEW_GAP + h < window.innerHeight - 16;
    s.tx = right ? e.clientX + PREVIEW_GAP : e.clientX - PREVIEW_GAP - w;
    s.ty = below ? e.clientY + PREVIEW_GAP : Math.max(e.clientY - PREVIEW_GAP - h, 72);
    if (!s.shown) {
      s.x = s.tx;
      s.y = s.ty;
      s.shown = true;
    }
    kick.current();
  };

  const hovered = hover ? withPhotos.find((e) => e.id === hover) : undefined;
  const hoveredPhoto = hovered ? photoById(hovered.photos[0]) : undefined;

  return (
    <div
      className="ix-season"
      onPointerMove={onPointerMove}
      onPointerLeave={() => {
        setHover(null);
        follow.current.shown = false;
      }}
    >
      <div className="ix-grid ix-season__cols" aria-hidden="true">
        <span className="ix-ev__n">Nº</span>
        <span className="ix-ev__m">Fecha</span>
        <span className="ix-ev__t">Cita</span>
        <span className="ix-ev__p">Lugar</span>
        <span className="ix-ev__k">Cifra</span>
      </div>

      <ol className="ix-season__list">
        {seasonEvents.map((ev, i) => {
          const dom = eventDomId(ev.id);
          const isOpen = open.has(ev.id);
          const fig = keyFigure(ev);
          return (
            <li
              key={ev.id}
              id={dom}
              className="ix-ev"
              data-open={isOpen ? "" : undefined}
              data-hover={hover === ev.id ? "" : undefined}
              data-reveal="row"
              style={{ "--d": `${i * 45}ms` } as React.CSSProperties}
            >
              <h3 className="ix-ev__h">
                <button
                  type="button"
                  id={`${dom}-btn`}
                  className="ix-grid ix-ev__btn"
                  aria-expanded={isOpen}
                  aria-controls={`${dom}-panel`}
                  onClick={() => toggle(ev.id)}
                  onPointerEnter={() => {
                    setArmed(true);
                    setHover(ev.id);
                  }}
                >
                  <span className="ix-ev__n" aria-hidden="true">
                    {pad2(i + 1)}
                  </span>
                  <span className="ix-ev__m" aria-hidden="true">
                    {monthCell(i)}
                  </span>
                  <span className="ix-ev__t">{ev.title}</span>
                  <span className="sr-only">, {eventDate(ev)}, </span>
                  <span className="ix-ev__p">{ev.place}</span>{" "}
                  <span className="ix-ev__k" aria-hidden={fig === "—" ? true : undefined}>
                    {fig}
                  </span>
                  <span className="ix-ev__x" aria-hidden="true" />
                </button>
              </h3>

              <div
                id={`${dom}-panel`}
                className="ix-ev__panel"
                role="region"
                aria-labelledby={`${dom}-btn`}
                inert={!isOpen}
                onPointerEnter={() => setHover(null)}
              >
                <div className="ix-ev__clip">
                  <div className="ix-grid ix-ev__body">
                    <div className="ix-ev__text">
                      <p className="ix-ev__sum">{ev.summary}</p>
                      <a className="ix-link ix-ev__src" href={ev.source} target="_blank" rel="noopener noreferrer">
                        {isReel(ev) ? "Ver el vídeo en Instagram" : "Ver la publicación en Instagram"}
                        <Arrow />
                      </a>
                    </div>
                    <dl className="ix-dl ix-ev__facts">
                      <div className="ix-dl__row">
                        <dt>Fecha</dt>
                        <dd>{capFirst(eventDate(ev))}</dd>
                      </div>
                      <div className="ix-dl__row">
                        <dt>Tipo</dt>
                        <dd>
                          {seasonKindLabel[ev.kind]}
                          {ev.night ? ", de noche" : ""}
                        </dd>
                      </div>
                      {ev.stats?.map((s) => (
                        <div className="ix-dl__row" key={s.label}>
                          <dt>{s.label}</dt>
                          <dd>{s.value}</dd>
                        </div>
                      ))}
                    </dl>
                    {ev.photos.length > 0 ? (
                      <ul className="ix-ev__thumbs">
                        {ev.photos.slice(0, 3).map((pid) => {
                          const ph = photoById(pid);
                          const plate = plateForPhoto(pid);
                          return (
                            <li key={pid}>
                              <div className="ix-plate ix-plate--thumb">
                                <Image src={ph.src} alt={ph.alt} fill sizes="(min-width: 1024px) 8vw, 28vw" />
                              </div>
                              {plate ? (
                                <IndexLink target={plate.domId} className="ix-cap__ref">
                                  {plate.fig}
                                </IndexLink>
                              ) : null}
                            </li>
                          );
                        })}
                      </ul>
                    ) : null}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {canPreview && armed ? (
        <div className="ix-preview" ref={boxRef} data-on={hovered ? "" : undefined} aria-hidden="true">
          <div className="ix-preview__frame">
            {withPhotos.map((ev) => {
              const ph = photoById(ev.photos[0]);
              return (
                <div key={ev.id} className="ix-preview__img" data-active={hover === ev.id ? "" : undefined}>
                  <Image src={ph.src} alt="" fill sizes="260px" />
                </div>
              );
            })}
          </div>
          <span className="ix-preview__cap">{hoveredPhoto?.caption ?? " "}</span>
        </div>
      ) : null}
    </div>
  );
}

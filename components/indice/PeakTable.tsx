"use client";

import { useEffect, useState } from "react";
import type { Peak } from "@/content";
import {
  difficultyLevel,
  eventDomId,
  eventRef,
  eventsForPeak,
  fmtInt,
  pad2,
  peakDomId,
  peakRef,
  peaksByAltitude,
  platesForPeak,
  SUMMIT_M,
} from "./data";
import { IndexLink } from "./IndexLink";
import { ITEM_EVENT } from "./scroll";

const prettyArea = (a: string) => a.replace(/ · /g, ", ").replace(/ \/ /g, " y ");

function PeakFacts({ peak, withArea }: { peak: Peak; withArea?: boolean }) {
  const evs = eventsForPeak(peak);
  const figs = platesForPeak(peak);
  const level = difficultyLevel[peak.difficulty];
  return (
    <dl className="ix-dl ix-pane__facts">
      {withArea ? (
        <div className="ix-dl__row">
          <dt>Zona</dt>
          <dd>{prettyArea(peak.area)}</dd>
        </div>
      ) : null}
      <div className="ix-dl__row">
        <dt>Dificultad</dt>
        <dd>
          <span className="ix-diff" data-level={level} aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          {peak.difficulty}
        </dd>
      </div>
      <div className="ix-dl__row ix-dl__row--wrap">
        <dt>Ruta</dt>
        <dd>{peak.route}</dd>
      </div>
      {evs.length + figs.length > 0 ? (
        <div className="ix-dl__row">
          <dt>Véase</dt>
          <dd className="ix-refs">
            {evs.map((e) => (
              <IndexLink key={e.id} target={eventDomId(e.id)} item className="ix-cap__ref" label={`${eventRef(e.id)}: ${e.title}`}>
                {eventRef(e.id)}
              </IndexLink>
            ))}
            {figs.map((f) => (
              <IndexLink key={f.fig} target={f.domId} className="ix-cap__ref">
                {f.fig}
              </IndexLink>
            ))}
          </dd>
        </div>
      ) : null}
    </dl>
  );
}

/**
 * 03 — the peaks as a precise table, highest first. Each row carries a hairline
 * proportional to its altitude. Desktop: hovering or focusing a row fills the
 * side panel. Mobile: rows are disclosures with the same details inline.
 */
export function PeakTable() {
  const [active, setActive] = useState(peaksByAltitude[0].id);
  const [open, setOpen] = useState<string | null>(null);
  const [wide, setWide] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setWide(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const onItem = (e: Event) => {
      const target = (e as CustomEvent<string>).detail;
      const peak = peaksByAltitude.find((p) => peakDomId(p.id) === target);
      if (peak) {
        setActive(peak.id);
        setOpen(peak.id);
      }
    };
    window.addEventListener(ITEM_EVENT, onItem);
    return () => window.removeEventListener(ITEM_EVENT, onItem);
  }, []);

  const rank = Math.max(0, peaksByAltitude.findIndex((p) => p.id === active));
  const peak = peaksByAltitude[rank];

  return (
    <div className="ix-grid ix-peaks">
      <div className="ix-peaks__table">
        <div className="ix-peaks__cols" aria-hidden="true">
          <span className="ix-peak__n">Nº</span>
          <span className="ix-peak__name">Cumbre</span>
          <span className="ix-peak__sierra">Sierra</span>
          <span className="ix-peak__alt">Altitud</span>
        </div>
        <ol className="ix-peaks__list">
          {peaksByAltitude.map((p, i) => {
            const dom = peakDomId(p.id);
            const isActive = active === p.id;
            const isOpen = open === p.id;
            return (
              <li
                key={p.id}
                id={dom}
                className="ix-peak"
                data-active={isActive ? "" : undefined}
                data-open={isOpen ? "" : undefined}
                data-reveal="row"
                style={{ "--d": `${i * 45}ms`, "--r": (p.elevation / SUMMIT_M).toFixed(4) } as React.CSSProperties}
              >
                <button
                  type="button"
                  className="ix-peak__btn"
                  aria-expanded={wide ? undefined : isOpen}
                  aria-current={wide && isActive ? "true" : undefined}
                  aria-controls={wide ? "ix-peak-pane" : `${dom}-detalle`}
                  onPointerEnter={() => setActive(p.id)}
                  onFocus={() => setActive(p.id)}
                  onClick={() => {
                    setActive(p.id);
                    if (!wide) setOpen((o) => (o === p.id ? null : p.id));
                  }}
                >
                  <span className="ix-peak__n">{pad2(i + 1)}</span>{" "}
                  <span className="ix-peak__name">
                    {p.name}
                    {p.home ? <span className="ix-peak__home">Axarquía</span> : null}
                  </span>{" "}
                  <span className="ix-peak__sierra">{p.sierra}</span>{" "}
                  <span className="ix-peak__alt">{fmtInt(p.elevation)} m</span>
                  <span className="ix-peak__bar" aria-hidden="true">
                    <span className="ix-peak__ink" />
                  </span>
                  <span className="ix-peak__x" aria-hidden="true" />
                </button>
                <div id={`${dom}-detalle`} className="ix-peak__detail" inert={wide || !isOpen}>
                  <div className="ix-peak__clip">
                    <div className="ix-peak__inner">
                      <p className="ix-pane__why">{p.why}</p>
                      <PeakFacts peak={p} withArea />
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <aside id="ix-peak-pane" className="ix-peaks__pane" aria-live="polite" aria-label="Detalle de la cumbre">
        <div key={peak.id} className="ix-pane">
          <p className="ix-pane__ref">{peakRef(peak.id)}</p>
          <p className="ix-pane__alt">
            <span>{fmtInt(peak.elevation)}</span>
            <span className="ix-pane__unit">m</span>
          </p>
          <p className="ix-pane__name">{peak.name}</p>
          <p className="ix-pane__where">
            {peak.sierra}. {prettyArea(peak.area)}.
          </p>
          <p className="ix-pane__why">{peak.why}</p>
          <PeakFacts peak={peak} />
        </div>
      </aside>
    </div>
  );
}

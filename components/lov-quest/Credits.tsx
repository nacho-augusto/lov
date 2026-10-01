"use client";

import { useState } from "react";
import { club, peaks, sponsors, sponsorsIntro } from "@/content";

function Roll({ hidden = false }: { hidden?: boolean }) {
  const sierras = [...new Set(peaks.map((p) => p.sierra))];
  const current = sponsors.filter((s) => s.current);
  const past = sponsors.filter((s) => !s.current);
  const name = (s: (typeof sponsors)[number]) =>
    s.instagram ? (
      <a href={`https://www.instagram.com/${s.instagram}/`} target="_blank" rel="noopener noreferrer" tabIndex={hidden ? -1 : undefined}>
        {s.name}
      </a>
    ) : (
      s.name
    );
  return (
    <div className="lq-roll__block" aria-hidden={hidden || undefined}>
      <p className="lq-roll__big">La Otra Vertiente</p>
      <p className="lq-roll__sub">El videojuego</p>

      <dl>
        <dt>Una producción de</dt>
        <dd>{club.name}</dd>
        <dt>Desde</dt>
        <dd>
          {club.town} · {club.region}
        </dd>
        <dt>Protagonistas</dt>
        <dd>Los vertinianos y las vertinianas</dd>
        <dt>Escenarios</dt>
        {sierras.map((s) => (
          <dd key={s}>{s}</dd>
        ))}
        <dt>Federados en</dt>
        <dd>
          {club.federation} · nº {club.federationNumber}
        </dd>
      </dl>

      <p className="lq-roll__thanks">{sponsorsIntro}</p>
      <ul className="lq-roll__list lq-roll__list--main">
        {current.map((s) => (
          <li key={s.name}>{name(s)}</li>
        ))}
      </ul>
      <p className="lq-roll__k">Y también a</p>
      <ul className="lq-roll__list">
        {past.map((s) => (
          <li key={s.name}>{name(s)}</li>
        ))}
      </ul>

      <dl>
        <dt>Efectos de sonido</dt>
        <dd>El viento en la cresta y la grava bajo las zapatillas</dd>
        <dt>Iluminación</dt>
        <dd>Un frontal con pilas de repuesto</dd>
      </dl>
      <p className="lq-roll__note">Ninguna cabra montés fue molestada durante el rodaje.</p>
      <p className="lq-roll__end">Fin</p>
      <p className="lq-roll__tag">{club.tagline}</p>
    </div>
  );
}

export function Credits() {
  const [paused, setPaused] = useState(false);
  return (
    <div className="lq-credits">
      <div className={`lq-frame lq-roll${paused ? " is-paused" : ""}`}>
        <div className="lq-roll__track">
          <Roll />
          <Roll hidden />
        </div>
      </div>
      <div className="lq-credits__ctrl">
        <button type="button" className="lq-btn lq-btn--ghost" aria-pressed={paused} onClick={() => setPaused((p) => !p)}>
          {paused ? "Reanudar créditos" : "Pausar créditos"}
        </button>
      </div>
    </div>
  );
}

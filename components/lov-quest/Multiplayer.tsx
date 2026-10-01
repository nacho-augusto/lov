"use client";

import { useRef, useState } from "react";
import { club } from "@/content";
import { AtlasSprite } from "./AtlasSprite";
import { PixelArrow } from "./PixelArrow";
import { playSfx } from "./sfx";
import { useSettings } from "./store";

const LETTERS = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ".split("");

export function Multiplayer() {
  const settings = useSettings();
  const [ini, setIni] = useState(["V", "R", "T"]);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const bump = (i: number, d: number) => {
    setIni((prev) => {
      const next = [...prev];
      const k = LETTERS.indexOf(prev[i]);
      next[i] = LETTERS[(k + d + LETTERS.length) % LETTERS.length];
      return next;
    });
    if (settings.sound) playSfx("menu");
  };

  const onKey = (i: number) => (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      bump(i, 1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      bump(i, -1);
    } else if (e.key === "ArrowRight" && i < 2) {
      e.preventDefault();
      inputs.current[i + 1]?.focus();
    } else if (e.key === "ArrowLeft" && i > 0) {
      e.preventDefault();
      inputs.current[i - 1]?.focus();
    }
  };

  const onChange = (i: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.toUpperCase().slice(-1);
    if (!LETTERS.includes(v)) return;
    setIni((prev) => {
      const next = [...prev];
      next[i] = v;
      return next;
    });
    if (i < 2) inputs.current[i + 1]?.focus();
  };

  const tag = ini.join("");
  const subject = `Player 2 [${tag}] quiere unirse a La Otra Vertiente`;
  const body = `¡Hola, vertinianos!\n\nQuiero salir a la montaña con vosotros. ¿Cómo puedo unirme al club?\n\n— ${tag}`;
  const mailto = `mailto:${club.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return (
    <div className="lq-mp">
      <div className="lq-mp__slots">
        <div className="lq-frame lq-mp__slot">
          <p className="lq-mp__p">P1</p>
          <div className="lq-mp__avatar lq-mp__avatar--stage" aria-hidden="true">
            <AtlasSprite name="tee_idle" scale={5} />
            <AtlasSprite name="flag0" scale={5} className="lq-mp__flag" />
          </div>
          <p className="lq-mp__who">{club.name}</p>
          <p className="lq-mp__ready">Listo</p>
          <p className="lq-mp__copy">{club.rhythm}</p>
          <ol className="lq-mp__how">
            <li>Escríbenos por Instagram a {club.instagramHandle}.</li>
            <li>¿Prefieres correo? Introduce tus iniciales y envía la solicitud (la dirección está por confirmar).</li>
          </ol>
        </div>

        <div className="lq-frame lq-frame--orange lq-mp__slot lq-mp__slot--p2">
          <p className="lq-mp__p">P2</p>
          <div className="lq-mp__avatar lq-mp__avatar--ghost" aria-hidden="true">
            <AtlasSprite name="hair_idle" scale={5} />
            <span className="lq-mp__q">?</span>
          </div>
          <p className="lq-mp__press">Pulsa start</p>
          <p className="lq-mp__copy">No importa tu ritmo: importa que quieras subir.</p>

          <div className="lq-mp__actions">
            <a className="lq-btn" href={club.instagram} target="_blank" rel="noopener noreferrer">
              Escríbenos por Instagram
            </a>
          </div>
          <p className="lq-mp__contact">
            <a href={club.instagram} target="_blank" rel="noopener noreferrer">
              {club.instagramHandle}
            </a>
          </p>

          <div className="lq-mp__alt">
            <p className="lq-mp__alt-k">O por correo</p>
            <fieldset className="lq-initials">
              <legend>Introduce tus iniciales</legend>
              <div className="lq-initials__row">
                {ini.map((ch, i) => (
                  <div key={i} className="lq-initials__col">
                    <button type="button" className="lq-initials__btn" onClick={() => bump(i, 1)} aria-label={`Letra siguiente para la inicial ${i + 1}`}>
                      <PixelArrow dir="up" size={12} />
                    </button>
                    <input
                      ref={(el) => {
                        inputs.current[i] = el;
                      }}
                      className="lq-initials__input"
                      value={ch}
                      onChange={onChange(i)}
                      onKeyDown={onKey(i)}
                      onFocus={(e) => e.target.select()}
                      maxLength={2}
                      inputMode="text"
                      autoCapitalize="characters"
                      autoComplete="off"
                      spellCheck={false}
                      aria-label={`Inicial ${i + 1}`}
                    />
                    <button type="button" className="lq-initials__btn" onClick={() => bump(i, -1)} aria-label={`Letra anterior para la inicial ${i + 1}`}>
                      <PixelArrow dir="down" size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </fieldset>
            <div className="lq-mp__mail">
              <a className="lq-btn lq-btn--ghost" href={mailto} aria-describedby="lq-mail-note">
                Enviar solicitud por correo
              </a>
              <span id="lq-mail-note" className="lq-badge lq-badge--warn">
                Correo por confirmar
              </span>
            </div>
            <p className="lq-mp__contact lq-mp__contact--muted">
              {club.contactEmail} <span>(dirección provisional, por confirmar)</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

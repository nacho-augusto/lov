import { trailDefinition } from "@/content";
import { AtlasSprite } from "./AtlasSprite";
import { BESTIARY, GLOSSARY, INVENTORY, RARITY_LABEL } from "./copy";
import { PixelArrow } from "./PixelArrow";
import { PixelIcon } from "./PixelIcon";

function Key({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return <kbd className={`lq-key${wide ? " lq-key--wide" : ""}`}>{children}</kbd>;
}

/** The printed game manual: a light "paper" spread that breaks the night rhythm. */
export function Manual() {
  return (
    <div className="lq-manual">
      <div className="lq-manual__spread">
        <article className="lq-page" aria-labelledby="man-how">
          <h3 id="man-how" className="lq-page__title">
            Cómo se juega
          </h3>
          <p className="lq-page__lead">
            <strong>Objetivo.</strong> {trailDefinition.lead}
          </p>
          <p>{trailDefinition.body}</p>

          <h4 className="lq-page__sub">Controles</h4>
          <ul className="lq-controls">
            <li>
              <span className="lq-controls__keys">
                <Key wide>Espacio</Key>
                <Key>
                  <PixelArrow dir="up" />
                  <span className="lq-sr">Flecha arriba</span>
                </Key>
                <Key>W</Key>
              </span>
              <span>Saltar. Mantén pulsado para saltar más alto.</span>
            </li>
            <li>
              <span className="lq-controls__keys">
                <Key wide>Toca</Key>
              </span>
              <span>Saltar en el móvil: toca cualquier punto del juego.</span>
            </li>
            <li>
              <span className="lq-controls__keys">
                <Key>P</Key>
                <Key wide>Esc</Key>
              </span>
              <span>Pausa la partida.</span>
            </li>
            <li>
              <span className="lq-controls__keys">
                <Key wide>Intro</Key>
              </span>
              <span>Empieza a correr desde la pantalla de título.</span>
            </li>
          </ul>
          <p className="lq-page__num" aria-hidden="true">
            — 2 —
          </p>
        </article>

        <article className="lq-page" aria-labelledby="man-foes">
          <h3 id="man-foes" className="lq-page__title">
            Enemigos y objetos
          </h3>
          <ul className="lq-bestiary">
            {BESTIARY.map((b) => (
              <li key={b.name}>
                <span className="lq-bestiary__sprite">
                  <AtlasSprite name={b.sprite} scale={3} />
                </span>
                <span>
                  <strong>{b.name}.</strong> {b.desc}
                </span>
              </li>
            ))}
          </ul>
          <div className="lq-cheat">
            <p className="lq-cheat__k">Truco</p>
            <p className="lq-cheat__code" aria-label="Arriba, arriba, abajo, abajo, izquierda, derecha, izquierda, derecha, B, A">
              <PixelArrow dir="up" />
              <PixelArrow dir="up" />
              <PixelArrow dir="down" />
              <PixelArrow dir="down" />
              <PixelArrow dir="left" />
              <PixelArrow dir="right" />
              <PixelArrow dir="left" />
              <PixelArrow dir="right" />
              <span>B A</span>
            </p>
            <p>Teclea el código clásico en cualquier pantalla y se hará de noche: modo frontal activado.</p>
          </div>
          <p className="lq-page__num" aria-hidden="true">
            — 3 —
          </p>
        </article>
      </div>

      <div className="lq-manual__spread">
        <article className="lq-page" aria-labelledby="man-inv">
          <h3 id="man-inv" className="lq-page__title">
            Inventario recomendado
          </h3>
          <ul className="lq-inv">
            {INVENTORY.map((it) => (
              <li key={it.name} className={`lq-inv__item lq-inv__item--${it.rarity}`}>
                <PixelIcon name={it.icon} size={48} />
                <span className="lq-inv__text">
                  <strong>{it.name}</strong>
                  <small className={`lq-rarity lq-rarity--${it.rarity}`}>{RARITY_LABEL[it.rarity]}</small>
                  <span>{it.desc}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="lq-page__num" aria-hidden="true">
            — 4 —
          </p>
        </article>

        <article className="lq-page" aria-labelledby="man-glos">
          <h3 id="man-glos" className="lq-page__title">
            Glosario vertiniano
          </h3>
          <dl className="lq-glossary">
            {GLOSSARY.map((g) => (
              <div key={g.term}>
                <dt>{g.term}</dt>
                <dd>{g.def}</dd>
              </div>
            ))}
          </dl>
          <p className="lq-page__num" aria-hidden="true">
            — 5 —
          </p>
        </article>
      </div>
    </div>
  );
}

import Link from "next/link";
import { club, peaks } from "@/content";
import { Logo } from "@/components/shared/Logo";
import { BIB } from "./copy";
import { thousands } from "./format";
import { Barcode, Chip, RegMark } from "./marks";
import s from "./dorsal.module.css";

const roof = peaks.reduce((a, b) => (b.elevation > a.elevation ? b : a));

/**
 * HERO — the race bib, printed on Tyvek-white and pinned to the club's orange
 * jacket. Bib number 2069 = La Maroma, the roof of Málaga.
 */
export function Bib() {
  const singular = club.memberTermSingular; // "vertiniano"
  const category = `${singular}/a`;
  // "La otra vertiente empieza donde acaba el asfalto." → "Donde acaba el asfalto"
  const start = club.tagline.replace(/^.*?(donde)/i, "Donde").replace(/\.$/, "");

  return (
    <section id="dorsal" className={s.hero} aria-labelledby="dorsal-title">
      <RegMark className={`${s.heroReg} ${s.heroRegL}`} />
      <RegMark className={`${s.heroReg} ${s.heroRegR}`} />

      <article className={s.bib}>
        <div className={s.bibMain}>
          <span className={`${s.pin} ${s.pinTL}`} aria-hidden="true" />
          <span className={`${s.pin} ${s.pinTR}`} aria-hidden="true" />
          <span className={`${s.pin} ${s.pinBL}`} aria-hidden="true" />
          <span className={`${s.pin} ${s.pinBR}`} aria-hidden="true" />

          <div className={s.bibHead}>
            <Logo tone="dark" href={null} className={s.bibLogo} />
            <div className={s.bibEvent}>
              <p className={s.bibEventLine}>
                <span>Trail running y montaña</span>
                <span className={s.bibEventRegion}>{club.region}</span>
              </p>
              <p className={s.bibSeason}>Temporada 2026</p>
            </div>
          </div>

          <h1 id="dorsal-title" className={s.bibNumberRow}>
            <span className={s.bibNumberLabel} aria-hidden="true">
              Dorsal
              <br />
              Nº
            </span>
            <span className={s.srOnly}>
              {club.name}, club de trail running de {club.town}. Dorsal número{" "}
            </span>
            <span className={s.bibNumber}>
              <span>{BIB.slice(0, 2)}</span>
              <span>{BIB.slice(2)}</span>
            </span>
          </h1>

          <dl className={s.bibFields}>
            <div className={s.bibField}>
              <dt>Categoría</dt>
              <dd>{category}</dd>
            </div>
            <div className={s.bibField}>
              <dt>Salida</dt>
              <dd>{start}</dd>
            </div>
            <div className={s.bibField}>
              <dt>Club</dt>
              <dd>
                {club.name} · {club.town}
              </dd>
            </div>
            <div className={s.bibField}>
              <dt>Federación</dt>
              <dd>
                {club.federation} nº {club.federationNumber}
              </dd>
            </div>
          </dl>
        </div>

        <div className={s.bibStub}>
          <p className={s.tearHint} aria-hidden="true">
            Desprender por la línea de puntos
          </p>
          <div className={s.stubBlock}>
            <span className={s.stubLabel}>Resguardo · bolsa de vida</span>
            <span className={s.stubNo}>{BIB}</span>
          </div>
          <div className={s.stubBlock}>
            <span className={s.stubLabel}>Meta</span>
            <span className={s.stubMeta}>
              {thousands(roof.elevation)} m · {roof.name}
            </span>
          </div>
          <div className={s.stubCode}>
            <Barcode value={`LOV${BIB}`} className={s.stubBarcode} />
            <span className={s.stubCodeText} aria-hidden="true">
              *LOV{BIB}*
            </span>
          </div>
          <div className={s.stubChip}>
            <Chip className={s.chipSvg} />
            <span className={s.stubLabel}>Chip · no doblar</span>
          </div>
        </div>
      </article>

      <p className={s.heroFoot}>
        <span>Hoja 00 · Prueba de imprenta · Tintas: negro y naranja</span>
        <Link href="/" className={s.heroBack}>
          ← Todas las versiones
        </Link>
      </p>
    </section>
  );
}

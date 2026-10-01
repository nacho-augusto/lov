import { sponsors, sponsorsIntro, type Sponsor } from "@/content";
import { BIB } from "./copy";
import { SectionHead } from "./SectionHead";
import s from "./dorsal.module.css";

type Variant = "xt" | "nm" | "cn";
const EM_PER_CHAR: Record<Variant, number> = { xt: 0.84, nm: 0.66, cn: 0.47 };

/** Mixed widths/weights, sized so each name roughly fills the print width. */
function typeFor(name: string, i: number): { variant: Variant; size: number } {
  const len = name.length;
  const variant: Variant = len <= 13 ? "xt" : len <= 20 ? (i % 2 ? "nm" : "cn") : "cn";
  const size = Math.max(2.4, Math.min(4.9, 45 / (len * EM_PER_CHAR[variant])));
  return { variant, size: Math.round(size * 100) / 100 };
}

function SponsorLine({ sp, i }: { sp: Sponsor; i: number }) {
  const { variant, size } = typeFor(sp.name, i);
  const cls = `${s.spName} ${s[`sp_${variant}`]} ${sp.current ? s.spNow : s.spBefore}`;
  const style = { "--sz": size } as React.CSSProperties;
  if (sp.instagram) {
    return (
      <li className={s.spItem}>
        <a
          href={`https://www.instagram.com/${sp.instagram}/`}
          target="_blank"
          rel="noopener noreferrer"
          className={cls}
          style={style}
        >
          {sp.name}
          <span className={s.srOnly}> (Instagram)</span>
        </a>
      </li>
    );
  }
  return (
    <li className={s.spItem}>
      <span className={cls} style={style}>
        {sp.name}
      </span>
    </li>
  );
}

/** 06 — Sponsors, printed on the back of the club race tee. */
export function Patrocinadores() {
  const now = sponsors.filter((x) => x.current);
  const before = sponsors.filter((x) => !x.current);
  return (
    <section id="patrocinadores" className={s.patro} aria-labelledby="patrocinadores-title">
      <SectionHead
        id="patrocinadores"
        title="Patrocinadores"
        fit={6.61}
        width="cn"
        note="La espalda de la camiseta"
      />

      <div className={s.shirtStage}>
        <div className={s.shirt}>
          <svg className={s.shirtSvg} viewBox="0 0 1000 1200" aria-hidden="true" focusable="false">
            <path
              className={s.shirtBody}
              d="M392 58Q500 96 608 58L792 112L986 300L872 414L806 352L818 1160Q500 1184 182 1160L194 352L128 414L14 300L208 112Z"
            />
            <path className={s.shirtRib} d="M392 58Q500 96 608 58" />
            <path className={s.shirtRib} d="M970 285L856 399M30 285L144 399" />
          </svg>

          <p className={`${s.callout} ${s.calloutA}`} aria-hidden="true">
            <span className={s.calloutKey}>A</span>
            Cuello canalé naranja
          </p>
          <p className={`${s.callout} ${s.calloutB}`} aria-hidden="true">
            <span className={s.calloutKey}>B</span>
            Serigrafía a dos tintas
          </p>
          <p className={`${s.callout} ${s.calloutC}`} aria-hidden="true">
            <span className={s.calloutKey}>C</span>
            Talla única: la tuya
          </p>

          <div className={s.shirtPrint}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo/logo-light.png"
              alt=""
              width={640}
              height={195}
              loading="lazy"
              className={s.shirtLogo}
            />
            <p className={s.shirtNo} aria-hidden="true">
              {BIB}
            </p>
            <p className={s.shirtThanks}>{sponsorsIntro}</p>
            <ul className={s.spList} aria-label="Patrocinadores actuales">
              {now.map((sp, i) => (
                <SponsorLine key={sp.name} sp={sp} i={i} />
              ))}
            </ul>
            <span className={s.spRule} aria-hidden="true" />
            <ul className={s.spList} aria-label="Han apoyado al club durante la temporada">
              {before.map((sp, i) => (
                <SponsorLine key={sp.name} sp={sp} i={i + 1} />
              ))}
            </ul>
          </div>
        </div>
      </div>

      <p className={s.shirtLegend}>
        <span className={s.shirtLegendItem}>
          <i className={s.swPaper} aria-hidden="true" />
          En blanco: en nuestras últimas publicaciones
        </span>
        <span className={s.shirtLegendItem}>
          <i className={s.swOrange} aria-hidden="true" />
          En naranja: nos han acompañado durante la temporada
        </span>
      </p>
    </section>
  );
}

import { club, trailDefinition, values } from "@/content";
import { categories, mandatoryKit, penalties } from "./copy";
import { SectionHead } from "./SectionHead";
import { Stamp } from "./marks";
import s from "./dorsal.module.css";

function Article({
  n,
  title,
  side,
  children,
}: {
  n: number;
  title: string;
  side: "l" | "r" | "w";
  children: React.ReactNode;
}) {
  const sideClass = side === "l" ? s.artL : side === "r" ? s.artR : s.artWide;
  return (
    <article className={`${s.art} ${sideClass}`} aria-labelledby={`art-${n}`}>
      <p className={s.artNo} aria-hidden="true">
        <span className={s.artNoLabel}>Art.</span>
        {n}
      </p>
      <div className={s.artBody}>
        <h3 id={`art-${n}`} className={s.artTitle}>
          <span className={s.srOnly}>Artículo {n}. </span>
          {title}
        </h3>
        {children}
      </div>
    </article>
  );
}

/** 01 — The club identity, written as the race rulebook. */
export function Reglamento() {
  const bio = club.igBio.charAt(0).toLowerCase() + club.igBio.slice(1);
  return (
    <section id="reglamento" className={s.regl} aria-labelledby="reglamento-title">
      <SectionHead id="reglamento" title="Reglamento" fit={9.3} note="Reglamento particular · Edición 2026" />

      <div className={s.preamble}>
        <p className={s.preambleLabel}>Preámbulo</p>
        <p className={s.preambleText}>
          Normas de obligado cumplimiento para todo aquel que corra con el dorsal 2069. Léase antes de
          la salida; se olvida en la primera cuesta.
        </p>
      </div>

      <div className={s.arts}>
        <Article n={1} title="De la entidad" side="l">
          <p>
            El {club.name} —{club.nickname} para los amigos— es un {bio} con sede en {club.town}{" "}
            ({club.region.split(" · ")[0]}, {club.province}), federado en la {club.federation} con el
            número {club.federationNumber}. Sus miembros responden al nombre de {club.memberTerm} y
            vertinianas.
          </p>
          <p className={s.artMotto}>«{club.tagline}»</p>
        </Article>

        <Article n={2} title="Del objeto" side="r">
          <p>A efectos del presente reglamento, se entiende por trail running:</p>
          <p className={s.artQuote}>{trailDefinition.lead}</p>
          <p>{trailDefinition.body}</p>
        </Article>

        <Article n={3} title="Del territorio" side="l">
          <p>
            El ámbito de aplicación comprende la Axarquía y las sierras del Mediterráneo malagueño
            —Almijara, Tejeda, Montes de Málaga—, desde el nivel del mar hasta los 2.069 m de La
            Maroma, techo de la provincia.
          </p>
          <p>
            Quedan autorizadas las escapadas: la Alpujarra, la Serranía de Ronda, Portugal y lo que
            venga.
          </p>
        </Article>

        <Article n={4} title="Del ritmo" side="r">
          <p>{club.rhythm}</p>
          <p className={s.artRule}>
            No se exige ritmo mínimo.
            <br />
            Se exige esperar arriba.
          </p>
        </Article>

        <Article n={5} title="De los valores" side="w">
          <ol className={s.valueList}>
            {values.map((v, i) => (
              <li key={v.id} className={s.valueItem}>
                <span className={s.valueNo}>5.{i + 1}</span>
                <h4 className={s.valueTitle}>{v.title}</h4>
                <p>{v.desc}</p>
              </li>
            ))}
          </ol>
        </Article>

        <Article n={6} title="De las categorías" side="l">
          <dl className={s.catList}>
            {categories.map((c) => (
              <div key={c.code} className={s.catItem}>
                <dt>
                  <span className={s.catCode} aria-hidden="true">
                    {c.code}
                  </span>
                  <span className={s.catName}>{c.name}</span>
                </dt>
                <dd>{c.desc}</dd>
              </div>
            ))}
          </dl>
          <p className={s.artSmall}>Ninguna categoría da puntos. Todas dan agujetas.</p>
        </Article>

        <Article n={7} title="Del material obligatorio" side="r">
          <p className={s.artSmall}>Márquese antes de salir de casa:</p>
          <ul className={s.kitList}>
            {mandatoryKit.map((k) => (
              <li key={k}>
                <span className={s.kitBox} aria-hidden="true" />
                {k}
              </li>
            ))}
          </ul>
        </Article>

        <Article n={8} title="Del régimen sancionador" side="l">
          <ul className={s.penList}>
            {penalties.map((p) => (
              <li key={p.level}>
                <span className={s.penLevel}>{p.level}</span>
                <span>{p.text}</span>
              </li>
            ))}
          </ul>
        </Article>

        <Article n={9} title="Disposición final" side="r">
          <p className={s.artFinal}>
            Todo lo no previsto en este reglamento se resolverá en la cima, por mayoría de los que hayan
            llegado.
          </p>
          <p className={s.artSign}>Dado en {club.town}, a 0 m sobre el nivel del mar.</p>
          <Stamp className={s.reglStamp} tone="orange">
            Aprobado
            <br />
            en cima
          </Stamp>
        </Article>
      </div>
    </section>
  );
}

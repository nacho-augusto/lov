import { peaks } from "@/content";
import { Chapter } from "./Chapter";
import { InView } from "./InView";
import styles from "./hd.module.css";

const byHeight = [...peaks].sort((a, b) => b.elevation - a.elevation);
const metres = (n: number) => `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".")} m`;

export function HdLocations() {
  return (
    <section
      id="localizaciones"
      data-hd-chapter="III. Localizaciones"
      aria-labelledby="hd-locations-title"
      className={styles.container}
    >
      <Chapter
        numeral="III"
        slug={`Capítulo tres · ${byHeight.length} localizaciones`}
        title="Las"
        accent="localizaciones"
        titleId="hd-locations-title"
      >
        <p>
          Las cumbres donde transcurre la película, de la más alta a la más baja. Las de casa, en la Axarquía, van
          marcadas en naranja.
        </p>
      </Chapter>

      <ul className={styles.slates}>
        {byHeight.map((p, i) => (
          <li key={p.id}>
            <InView className={styles.slate} delay={(i % 4) * 90}>
              <span className={styles.clapper} aria-hidden />
              <div className={styles.slateBar} aria-hidden />
              <article className={styles.slateBody} aria-labelledby={`hd-slate-${p.id}`}>
                <div className={`${styles.mono} mb-3 flex justify-between gap-3 text-[var(--hd-dim)]`}>
                  <span>Prod. La Otra Vertiente</span>
                  <span>Rollo {String(i + 1).padStart(2, "0")}</span>
                </div>
                <h3 id={`hd-slate-${p.id}`} className={`${styles.slateName} ${p.home ? styles.slateHome : ""}`}>
                  {p.name}
                </h3>
                <dl className={`${styles.slateGrid} mt-3`}>
                  <dt className={styles.mono}>Altitud</dt>
                  <dd className="font-medium">{metres(p.elevation)}</dd>
                  <dt className={styles.mono}>Sierra</dt>
                  <dd>{p.sierra}</dd>
                  <dt className={styles.mono}>Dific.</dt>
                  <dd>
                    {p.difficulty}
                    {p.home && <span className="ml-2 text-[var(--hd-orange)]">· En casa</span>}
                  </dd>
                </dl>
                <p className={styles.slateWhy}>{p.why}</p>
              </article>
            </InView>
          </li>
        ))}
      </ul>
    </section>
  );
}

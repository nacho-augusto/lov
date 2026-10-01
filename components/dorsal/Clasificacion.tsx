import { season, seasonEvents, seasonKindLabel, seasonStats } from "@/content";
import { omdPositions, seasonResults } from "./copy";
import { pad2 } from "./format";
import { SectionHead } from "./SectionHead";
import { Moon, Stamp } from "./marks";
import s from "./dorsal.module.css";

const MONTHS = ["", "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

/** "28 de agosto de 2026" → "28"; "Mayo 2026" → null. */
const dayOf = (label: string) => /^(\d{1,2})\s/.exec(label)?.[1] ?? null;

/** 02 — The 2026 season as a printed results board. */
export function Clasificacion() {
  return (
    <section id="clasificacion" className={s.clas} aria-labelledby="clasificacion-title">
      <SectionHead
        id="clasificacion"
        title="Clasificación"
        fit={5.58}
        width="cn"
        note={`${season.title} · Resultados oficiosos`}
      />

      <div className={s.clasBody}>
        <div className={s.totalsBar}>
          <p className={s.totalsIntro}>{season.intro}</p>
          <ul className={s.totals} aria-label="Totales de la temporada">
            {seasonStats.map((st) => (
              <li key={st.label} className={s.total}>
                <span className={s.totalValue}>{st.value}</span>
                <span className={s.totalLabel}>{st.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <table className={s.board} role="table">
          <caption className={s.srOnly}>
            Clasificación de la {season.title.toLowerCase()} del club, prueba a prueba
          </caption>
          <thead role="rowgroup">
            <tr role="row">
              <th role="columnheader" scope="col">Nº</th>
              <th role="columnheader" scope="col">Fecha</th>
              <th role="columnheader" scope="col">Prueba</th>
              <th role="columnheader" scope="col">Tipo</th>
              <th role="columnheader" scope="col">Datos</th>
              <th role="columnheader" scope="col">Resultado</th>
              <th role="columnheader" scope="col">
                <span className={s.srOnly}>Fuente</span>
              </th>
            </tr>
          </thead>
          <tbody role="rowgroup">
            {seasonEvents.map((e, i) => {
              const isOmd = e.id === "omd-utmb";
              const data = e.stats ?? [];
              const result = seasonResults[e.id];
              const day = dayOf(e.dateLabel);
              return (
                <tr key={e.id} role="row" className={isOmd ? s.rowStar : undefined}>
                  <td role="cell" className={s.cNo}>
                    {pad2(i + 1)}
                  </td>
                  <td role="cell" className={s.cDate}>
                    <span className={s.cMonth}>
                      {day ? `${day} ` : ""}
                      {MONTHS[e.month]}
                    </span>
                    <span className={s.cDateFull}>{season.year}</span>
                  </td>
                  <th role="rowheader" scope="row" className={s.cRace}>
                    <span className={s.cRaceName}>{e.title}</span>
                    <span className={s.cPlace}>{e.place}</span>
                  </th>
                  <td role="cell" className={s.cKind}>
                    {e.kind !== "nocturna" && <span>{seasonKindLabel[e.kind]}</span>}
                    {e.night && (
                      <span className={s.night}>
                        <Moon className={s.moon} />
                        Nocturna
                      </span>
                    )}
                  </td>
                  <td role="cell" className={s.cData}>
                    {data.length ? (
                      <ul className={s.dataList}>
                        {data.map((d) => (
                          <li key={d.label}>
                            <span className={s.dataValue}>{d.value}</span>
                            <span className={s.dataLabel}>{d.label}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className={s.dash}>—</span>
                    )}
                  </td>
                  <td role="cell" className={s.cResult}>
                    {result}
                    {isOmd && <span className={s.cResultExtra}>Puestos {omdPositions}</span>}
                    {isOmd && (
                      <Stamp className={s.finisherStamp} tone="ink">
                        Finisher
                      </Stamp>
                    )}
                  </td>
                  <td role="cell" className={s.cSource}>
                    <a href={e.source} target="_blank" rel="noopener noreferrer" className={s.sourceLink}>
                      Acta ↗<span className={s.srOnly}> (publicación del club en Instagram sobre {e.title})</span>
                    </a>
                  </td>
                </tr>
              );
            })}
            <tr role="row" className={s.rowNext}>
              <td role="cell" className={s.cNo}>
                {pad2(seasonEvents.length + 1)}
              </td>
              <td role="cell" className={s.cDate}>
                <span className={s.cMonth}>Otoño</span>
                <span className={s.cDateFull}>{season.year}</span>
              </td>
              <th role="rowheader" scope="row" className={s.cRace}>
                <span className={s.cRaceName}>Próxima prueba</span>
                <span className={s.cPlace}>Por confirmar</span>
              </th>
              <td role="cell" className={s.cNextNote} colSpan={4}>
                {season.next}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

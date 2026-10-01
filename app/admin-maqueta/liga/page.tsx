import { Shell } from "@/components/admin-maqueta/Shell";
import { ProfileChart, Spark } from "@/components/admin-maqueta/charts";
import {
  MAROMA_M, effortKm, league, months, monthsLong, num, sumRange,
} from "@/components/admin-maqueta/data";
import s from "@/components/admin-maqueta/admin.module.css";

// Selected range: Jul–Sep 2026, compared with the previous three months (Apr–Jun).
const FROM = 9;
const TO = 11;
const CMP_FROM = 6;
const CMP_TO = 8;

const presets = ["Este mes", "Últimos 3 meses", "Últimos 6 meses", "Temporada", "Personalizado"];

export default function AdminMockLeague() {
  // Club cumulative effort-km month by month: the season profile.
  let acc = 0;
  const cumulative = months.map((_, i) => {
    acc += league.reduce((a, m) => a + effortKm(m.months[i]), 0);
    return acc;
  });

  const rows = league
    .map((m) => {
      const cur = sumRange(m, FROM, TO);
      const prev = sumRange(m, CMP_FROM, CMP_TO);
      const e = effortKm(cur);
      return {
        name: m.name,
        ...cur,
        effort: e,
        delta: e - effortKm(prev),
        spark: m.months.map(effortKm),
      };
    })
    .sort((a, b) => b.effort - a.effort);

  const clubGain = rows.reduce((a, r) => a + r.gain, 0);
  const clubKm = rows.reduce((a, r) => a + r.km, 0);

  return (
    <Shell
      active="liga"
      kicker="Temporada 2025–26"
      title="Liga interna"
      actions={<button type="button" className={s.primaryButton}>Apuntar septiembre</button>}
    >
      <section className={s.rangeBar} aria-label="Franja de fechas">
        <div className={s.chips} role="group" aria-label="Rangos rápidos">
          {presets.map((p) => (
            <button key={p} type="button" className={s.chip} aria-pressed={p === "Últimos 3 meses"}>
              {p}
            </button>
          ))}
        </div>
        <p className={s.rangeText}>
          <strong>{monthsLong[FROM]} – {monthsLong[TO]}</strong>
          <span> frente a </span>
          {monthsLong[CMP_FROM]} – {monthsLong[CMP_TO]}
        </p>
      </section>

      <section className={s.block} aria-labelledby="perfil">
        <header className={s.blockHead}>
          <h2 id="perfil" className={s.blockTitle}>Perfil de la temporada</h2>
          <p className={s.blockMeta}>
            En la franja, el club ha sumado <strong>{num(clubKm)} km</strong> y{" "}
            <strong>{num(clubGain)} m+</strong>: <strong className={s.accentText}>{num(clubGain / MAROMA_M, 1)} veces La Maroma</strong>.
          </p>
        </header>
        <ProfileChart values={cumulative} labels={months} from={FROM} to={TO} compareFrom={CMP_FROM} compareTo={CMP_TO} />
        <p className={s.legend}>
          <span className={s.legendSel} /> Franja elegida <span className={s.legendCmp} /> Franja de comparación
        </p>
      </section>

      <section className={s.block} aria-labelledby="tablon">
        <header className={s.blockHead}>
          <h2 id="tablon" className={s.blockTitle}>Tablón de cumbre</h2>
          <p className={s.blockMeta}>km-esfuerzo = km + m+ / 100</p>
        </header>
        <table className={s.table}>
          <thead>
            <tr>
              <th scope="col" className={s.num}>#</th>
              <th scope="col">Miembro</th>
              <th scope="col" className={s.num}>km</th>
              <th scope="col" className={s.num}>m+</th>
              <th scope="col" className={s.num}>Maromas</th>
              <th scope="col" className={s.num}>km-esfuerzo</th>
              <th scope="col" className={s.num}>vs. abr–jun</th>
              <th scope="col">Últimos 12 meses</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.name} data-top={i < 3 ? "" : undefined}>
                <td className={`${s.num} ${s.pos}`}>{i + 1}</td>
                <td className={s.strong}>{r.name}</td>
                <td className={s.num}>{num(r.km)}</td>
                <td className={s.num}>{num(r.gain)}</td>
                <td className={s.num}>{num(r.gain / MAROMA_M, 1)}</td>
                <td className={`${s.num} ${s.effort}`}>{num(r.effort)}</td>
                <td className={s.num}>
                  <span className={s.delta} data-dir={r.delta >= 0 ? "up" : "down"}>
                    {r.delta >= 0 ? "▲" : "▼"} {num(Math.abs(r.delta))}
                  </span>
                </td>
                <td>
                  <Spark values={r.spark} from={FROM} to={TO} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </Shell>
  );
}

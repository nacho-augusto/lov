import type { Metadata } from "next";
import Link from "next/link";
import { ProfileChart, Spark } from "@/components/admin/charts";
import { Notice } from "@/components/admin/Notice";
import { PageHead } from "@/components/admin/PageHead";
import { PeakSilhouette } from "@/components/admin/marks";
import s from "@/components/admin/admin.module.css";
import { fullName, todayISO } from "@/lib/admin/format";
import {
  MAROMA_M, addMonths, effortKm, isMonthKey, monthDate, monthDiff, monthLong, monthRange, monthShort,
} from "@/lib/admin/league";
import { requireAdmin } from "@/lib/admin/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Liga interna" };

const num = (n: number, d = 0) => n.toLocaleString("es-ES", { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: "always" });

interface Entry {
  member_id: string;
  month: string;
  distance_m: number;
  elevation_gain_m: number;
}

export default async function LeaguePage({
  searchParams,
}: {
  searchParams: Promise<{ desde?: string; hasta?: string; ok?: string }>;
}) {
  const me = await requireAdmin("league.read");
  const q = await searchParams;
  const lastMonth = addMonths(todayISO().slice(0, 7), -1);
  const to = isMonthKey(q.hasta) && q.hasta <= todayISO().slice(0, 7) ? q.hasta : lastMonth;
  const from = isMonthKey(q.desde) && q.desde <= to ? q.desde : addMonths(to, -2);
  const length = monthDiff(from, to) + 1;
  // The comparison franja is the same length, right before.
  const cmpTo = addMonths(from, -1);
  const cmpFrom = addMonths(cmpTo, -(length - 1));
  // The chart and sparklines show the 12 months ending at "to".
  const windowFrom = addMonths(to, -11);
  const firstNeeded = cmpFrom < windowFrom ? cmpFrom : windowFrom;

  const supabase = await createClient();
  const [{ data: members }, { data: entries }] = await Promise.all([
    supabase.from("members").select("id, first_name, last_name, active"),
    supabase
      .from("league_entries")
      .select("member_id, month, distance_m, elevation_gain_m")
      .gte("month", monthDate(firstNeeded))
      .lte("month", monthDate(to)),
  ]);
  const rowsData = (entries ?? []) as Entry[];
  const key = (e: Entry) => e.month.slice(0, 7);
  const inRange = (k: string, a: string, b: string) => k >= a && k <= b;

  const sum = (memberId: string, a: string, b: string) =>
    rowsData
      .filter((e) => e.member_id === memberId && inRange(key(e), a, b))
      .reduce((acc, e) => ({ km: acc.km + e.distance_m / 1000, gain: acc.gain + e.elevation_gain_m }), { km: 0, gain: 0 });

  const months12 = monthRange(windowFrom, to);
  const participants = (members ?? []).filter((m) => m.active || rowsData.some((e) => e.member_id === m.id && inRange(key(e), from, to)));
  const rows = participants
    .map((m) => {
      const cur = sum(m.id, from, to);
      const prev = sum(m.id, cmpFrom, cmpTo);
      return {
        id: m.id,
        name: fullName(m),
        ...cur,
        effort: effortKm(cur.km, cur.gain),
        delta: effortKm(cur.km, cur.gain) - effortKm(prev.km, prev.gain),
        spark: months12.map((mk) => {
          const x = sum(m.id, mk, mk);
          return effortKm(x.km, x.gain);
        }),
      };
    })
    .sort((a, b) => b.effort - a.effort);

  let acc = 0;
  const cumulative = months12.map((mk) => {
    acc += rowsData.filter((e) => key(e) === mk).reduce((a, e) => a + effortKm(e.distance_m / 1000, e.elevation_gain_m), 0);
    return acc;
  });
  const clubKm = rows.reduce((a, r) => a + r.km, 0);
  const clubGain = rows.reduce((a, r) => a + r.gain, 0);
  const hasData = rowsData.length > 0;

  const presets = [
    { label: "Último mes", desde: to, hasta: to },
    { label: "Últimos 3 meses", desde: addMonths(to, -2), hasta: to },
    { label: "Últimos 6 meses", desde: addMonths(to, -5), hasta: to },
    { label: "Últimos 12 meses", desde: addMonths(to, -11), hasta: to },
    { label: `Año ${to.slice(0, 4)}`, desde: `${to.slice(0, 4)}-01`, hasta: to },
  ];

  return (
    <>
      <PageHead
        kicker="Kilómetros y desnivel"
        title="Liga interna"
        actions={
          me.permissions.has("league.write") && (
            <Link href={`/admin/liga/apuntar?mes=${lastMonth}`} className={s.primaryButton}>
              Apuntar {monthLong(lastMonth).split(" ")[0].toLowerCase()}
            </Link>
          )
        }
      />
      <Notice ok={q.ok} messages={{ guardado: "Mes guardado. La clasificación ya está al día." }} />

      <section className={s.rangeBar} aria-label="Franja de fechas">
        <div className={s.chips} role="group" aria-label="Rangos rápidos">
          {presets.map((p) => (
            <Link
              key={p.label}
              href={`/admin/liga?desde=${p.desde}&hasta=${p.hasta}`}
              className={s.chip}
              aria-pressed={p.desde === from && p.hasta === to}
            >
              {p.label}
            </Link>
          ))}
        </div>
        <form className={s.inlineForm} aria-label="Franja personalizada">
          <label className={s.field}>
            <span>Desde</span>
            <input type="month" name="desde" defaultValue={from} className={s.input} />
          </label>
          <label className={s.field}>
            <span>Hasta</span>
            <input type="month" name="hasta" defaultValue={to} max={todayISO().slice(0, 7)} className={s.input} />
          </label>
          <button type="submit" className={s.ghostButton}>Ver</button>
        </form>
      </section>
      <p className={s.rangeText} style={{ marginBottom: 24 }}>
        <strong>{from === to ? monthLong(from) : `${monthLong(from)} – ${monthLong(to)}`}</strong>
        <span> frente a </span>
        {cmpFrom === cmpTo ? monthLong(cmpFrom) : `${monthLong(cmpFrom)} – ${monthLong(cmpTo)}`}
      </p>

      {!hasData ? (
        <div className={s.empty}>
          <PeakSilhouette className={s.emptyPeak} />
          <p className={s.emptyTitle}>La liga aún no ha salido del refugio</p>
          <p className={s.emptyText}>Apunta los kilómetros y el desnivel del último mes para estrenarla.</p>
        </div>
      ) : (
        <>
          <section className={s.block} aria-labelledby="perfil">
            <header className={s.blockHead}>
              <h2 id="perfil" className={s.blockTitle}>Perfil de la temporada</h2>
              <p className={s.blockMeta}>
                En la franja, el club ha sumado <strong>{num(clubKm)} km</strong> y <strong>{num(clubGain)} m+</strong>:{" "}
                <strong className={s.accentText}>{num(clubGain / MAROMA_M, 1)} veces La Maroma</strong>.
              </p>
            </header>
            <ProfileChart
              values={cumulative}
              labels={months12.map(monthShort)}
              from={monthDiff(windowFrom, from)}
              to={monthDiff(windowFrom, to)}
              compareFrom={monthDiff(windowFrom, cmpFrom)}
              compareTo={monthDiff(windowFrom, cmpTo)}
            />
            <p className={s.legend}>
              <span className={s.legendSel} /> Franja elegida <span className={s.legendCmp} /> Franja anterior
            </p>
          </section>

          <section className={s.block} aria-labelledby="tablon">
            <header className={s.blockHead}>
              <h2 id="tablon" className={s.blockTitle}>Tablón de cumbre</h2>
              <p className={s.blockMeta}>km-esfuerzo = km + m+ / 100</p>
            </header>
            <div className={s.tableScroll}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th scope="col" className={s.num}>#</th>
                    <th scope="col">Miembro</th>
                    <th scope="col" className={s.num}>km</th>
                    <th scope="col" className={s.num}>m+</th>
                    <th scope="col" className={s.num}>Maromas</th>
                    <th scope="col" className={s.num}>km-esfuerzo</th>
                    <th scope="col" className={s.num}>vs. franja anterior</th>
                    <th scope="col">Últimos 12 meses</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={r.id} data-top={i < 3 && r.effort > 0 ? "" : undefined}>
                      <td className={`${s.num} ${s.pos}`}>{r.effort > 0 ? i + 1 : "—"}</td>
                      <td className={s.strong}>{r.name}</td>
                      <td className={s.num}>{num(r.km, r.km % 1 ? 1 : 0)}</td>
                      <td className={s.num}>{num(r.gain)}</td>
                      <td className={s.num}>{num(r.gain / MAROMA_M, 1)}</td>
                      <td className={`${s.num} ${s.effort}`}>{num(r.effort)}</td>
                      <td className={s.num}>
                        {Math.round(r.delta) === 0 ? (
                          <span className={s.adminMeta}>=</span>
                        ) : (
                          <span className={s.delta} data-dir={r.delta > 0 ? "up" : "down"}>
                            {r.delta > 0 ? "▲" : "▼"} {num(Math.abs(r.delta))}
                          </span>
                        )}
                      </td>
                      <td>
                        <Spark values={r.spark} from={monthDiff(windowFrom, from)} to={monthDiff(windowFrom, to)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </>
  );
}

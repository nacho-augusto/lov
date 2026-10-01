import { Shell } from "@/components/admin-maqueta/Shell";
import { PeakSilhouette } from "@/components/admin-maqueta/marks";
import {
  MAROMA_M, balance, deadlines, eur, league, licences, movements, num, pendingCharges,
} from "@/components/admin-maqueta/data";
import s from "@/components/admin-maqueta/admin.module.css";

export default function AdminMockHome() {
  const pendingTotal = pendingCharges.reduce((a, c) => a + c.amount, 0);
  const overdue = pendingCharges.filter((c) => c.overdueDays > 0);
  const last = league
    .map((m) => ({ name: m.name, ...m.months[11] }))
    .sort((a, b) => b.km + b.gain / 100 - (a.km + a.gain / 100))
    .slice(0, 3);

  return (
    <Shell active="inicio" kicker="Miércoles, 1 de octubre" title="Parte de la junta">
      <section className={s.figures} aria-label="Resumen">
        <div className={s.figure}>
          <span className={s.figureLabel}>Saldo del club</span>
          <span className={s.figureValue}>{eur(balance)}</span>
          <span className={s.figureNote}>+27 € este mes</span>
        </div>
        <div className={s.figure}>
          <span className={s.figureLabel}>Pendiente de cobro</span>
          <span className={s.figureValue} data-accent>{eur(pendingTotal)}</span>
          <span className={s.figureNote}>
            {pendingCharges.length} cargos · {overdue.length} vencidos
          </span>
        </div>
        <div className={s.figure}>
          <span className={s.figureLabel}>Licencias FAM 2027</span>
          <span className={s.figureValue}>
            {licences.renewed}
            <small>/{licences.total}</small>
          </span>
          <span className={s.figureNote}>Renovación abre el 1 dic</span>
        </div>
        <div className={s.figure}>
          <span className={s.figureLabel}>Próximo plazo</span>
          <span className={s.figureValue}>{deadlines[0].days} días</span>
          <span className={s.figureNote}>Justificar subvención Diputación</span>
        </div>
      </section>

      <div className={s.columns}>
        <section className={s.block} aria-labelledby="cobros">
          <header className={s.blockHead}>
            <h2 id="cobros" className={s.blockTitle}>Cuotas por cobrar</h2>
            <button type="button" className={s.primaryButton}>
              Recordar a los {overdue.length} vencidos
            </button>
          </header>
          <table className={s.table}>
            <thead>
              <tr>
                <th scope="col">Miembro</th>
                <th scope="col">Concepto</th>
                <th scope="col" className={s.num}>Importe</th>
                <th scope="col">Estado</th>
                <th scope="col"><span className={s.srOnly}>Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              {pendingCharges.map((c) => (
                <tr key={c.member + c.concept}>
                  <td className={s.strong}>{c.member}</td>
                  <td>{c.concept}</td>
                  <td className={s.num}>{eur(c.amount)}</td>
                  <td>
                    {c.overdueDays > 0 ? (
                      <span className={s.status} data-tone="overdue">Vencida hace {c.overdueDays} d</span>
                    ) : (
                      <span className={s.status} data-tone="pending">Pendiente</span>
                    )}
                  </td>
                  <td className={s.rowActions}>
                    <button type="button" className={s.linkButton}>Cobrado</button>
                    <button type="button" className={s.linkButton}>Recordar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <div className={s.stack}>
          <section className={s.block} aria-labelledby="plazos">
            <header className={s.blockHead}>
              <h2 id="plazos" className={s.blockTitle}>Plazos</h2>
            </header>
            <ol className={s.deadlines}>
              {deadlines.map((d) => (
                <li key={d.what}>
                  <span className={s.deadlineDate}>{d.date}</span>
                  <span className={s.deadlineWhat}>{d.what}</span>
                  <span className={s.deadlineDays} data-soon={d.days <= 21 ? "" : undefined}>
                    {d.days} d
                  </span>
                </li>
              ))}
            </ol>
          </section>

          <section className={s.block} aria-labelledby="liga-mes">
            <header className={s.blockHead}>
              <h2 id="liga-mes" className={s.blockTitle}>Liga · septiembre</h2>
            </header>
            <ol className={s.podium}>
              {last.map((p, i) => (
                <li key={p.name}>
                  <span className={s.podiumPos}>{i + 1}</span>
                  <span className={s.strong}>{p.name}</span>
                  <span className={s.podiumData}>
                    {num(p.km)} km · {num(p.gain)} m+
                    <em>{num(p.gain / MAROMA_M, 1)} Maromas</em>
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>

      <div className={s.columns}>
        <section className={s.block} aria-labelledby="movs">
          <header className={s.blockHead}>
            <h2 id="movs" className={s.blockTitle}>Últimos movimientos</h2>
            <button type="button" className={s.secondaryButton}>Apuntar movimiento</button>
          </header>
          <ul className={s.ledger}>
            {movements.map((m) => (
              <li key={m.date + m.what}>
                <span className={s.deadlineDate}>{m.date}</span>
                <span>{m.what}</span>
                <span className={s.num} data-sign={m.amount < 0 ? "out" : "in"}>
                  {m.amount > 0 ? "+" : ""}
                  {eur(m.amount)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className={s.block} aria-labelledby="material">
          <header className={s.blockHead}>
            <h2 id="material" className={s.blockTitle}>Material prestado</h2>
          </header>
          <div className={s.empty}>
            <PeakSilhouette className={s.emptyPeak} />
            <p className={s.emptyTitle}>Todo en el armario</p>
            <p className={s.emptyText}>Nadie tiene material del club ahora mismo.</p>
          </div>
        </section>
      </div>
    </Shell>
  );
}

import Link from "next/link";
import { recordPayment, setChargeWaived } from "@/app/admin/(panel)/cuotas/actions";
import { formatDate, todayISO } from "@/lib/admin/format";
import { chargeStatusLabels, chargeStatusTone, eur, euroInput, methodLabels, type ChargeStatus } from "@/lib/admin/money";
import s from "./admin.module.css";

export interface ChargeRowData {
  id: string;
  member_id: string;
  concept: string;
  amount_cents: number;
  paid_cents: number;
  outstanding_cents: number;
  due_on: string;
  status: ChargeStatus;
  waived: boolean;
  members?: { first_name: string; last_name: string } | null;
}

// One charge with its inline "register payment" and "waive" actions.
export function ChargeRow({ c, canWrite, returnTo }: { c: ChargeRowData; canWrite: boolean; returnTo: string }) {
  return (
    <tr>
      <td className={s.strong}>
        <Link href={`/admin/miembros/${c.member_id}`} className={s.rowLink}>
          {[c.members?.first_name, c.members?.last_name].filter(Boolean).join(" ")}
        </Link>
      </td>
      <td>
        {c.concept}
        <span className={s.adminMeta}> · vence {formatDate(c.due_on, { day: "numeric", month: "short" })}</span>
      </td>
      <td className={s.num}>{eur(c.amount_cents)}</td>
      <td className={s.num}>{c.paid_cents ? eur(c.paid_cents) : "—"}</td>
      <td>
        <span className={s.status} data-tone={chargeStatusTone[c.status]}>
          {chargeStatusLabels[c.status]}
        </span>
      </td>
      {canWrite && (
        <td className={s.rowActions}>
          <ChargeActions c={c} returnTo={returnTo} />
        </td>
      )}
    </tr>
  );
}

function ChargeActions({ c, returnTo }: { c: ChargeRowData; returnTo: string }) {
  const open = c.status !== "paid" && c.status !== "waived";
  return (
    <>
      {open && (
        <details className={s.popover}>
          <summary className={s.linkButton}>Registrar pago</summary>
          <form action={recordPayment} className={s.popoverBody}>
            <input type="hidden" name="charge_id" value={c.id} />
            <input type="hidden" name="return_to" value={returnTo} />
            <label className={s.field}>
              <span>Importe (€)</span>
              <input name="amount" inputMode="decimal" defaultValue={euroInput(c.outstanding_cents)} className={s.input} required />
            </label>
            <label className={s.field}>
              <span>Fecha</span>
              <input name="paid_on" type="date" defaultValue={todayISO()} className={s.input} />
            </label>
            <label className={s.field}>
              <span>Forma de pago</span>
              <select name="method" className={s.input} defaultValue="bizum">
                {Object.entries(methodLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </label>
            <button type="submit" className={s.primaryButton}>Guardar pago</button>
          </form>
        </details>
      )}
      {c.status !== "paid" && (
        <form action={setChargeWaived} className={s.inline}>
          <input type="hidden" name="id" value={c.id} />
          <input type="hidden" name="waived" value={String(!c.waived)} />
          <input type="hidden" name="return_to" value={returnTo} />
          <button type="submit" className={s.linkButton}>{c.waived ? "Reabrir" : "Condonar"}</button>
        </form>
      )}
    </>
  );
}

// Compact variant for narrow columns (member record).
export function ChargeItem({ c, canWrite, returnTo }: { c: ChargeRowData; canWrite: boolean; returnTo: string }) {
  return (
    <li className={s.chargeItem}>
      <span>
        {c.concept}
        <span className={s.adminMeta}>
          {" · "}
          {eur(c.amount_cents)}
          {c.paid_cents ? ` (pagado ${eur(c.paid_cents)})` : ""} · vence {formatDate(c.due_on, { day: "numeric", month: "short" })}
        </span>
      </span>
      <span className={s.status} data-tone={chargeStatusTone[c.status]}>
        {chargeStatusLabels[c.status]}
      </span>
      {canWrite && (
        <span className={s.chargeActions}>
          <ChargeActions c={c} returnTo={returnTo} />
        </span>
      )}
    </li>
  );
}

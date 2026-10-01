import type { Metadata } from "next";
import Link from "next/link";
import { Notice } from "@/components/admin/Notice";
import { PageHead } from "@/components/admin/PageHead";
import s from "@/components/admin/admin.module.css";
import { fullName, todayISO } from "@/lib/admin/format";
import { addMonths, isMonthKey, monthDate, monthLong } from "@/lib/admin/league";
import { requireAdmin } from "@/lib/admin/session";
import { createClient } from "@/lib/supabase/server";
import { saveMonth } from "../actions";

export const metadata: Metadata = { title: "Apuntar mes" };

const kmInput = (m: number) => (m / 1000).toFixed(m % 1000 ? 1 : 0).replace(".", ",");

export default async function LeagueEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; error?: string }>;
}) {
  await requireAdmin("league.write");
  const { mes, error } = await searchParams;
  const lastMonth = addMonths(todayISO().slice(0, 7), -1);
  const month = isMonthKey(mes) ? mes : lastMonth;
  const supabase = await createClient();

  const [{ data: members }, { data: entries }] = await Promise.all([
    supabase.from("members").select("id, first_name, last_name").eq("active", true).order("first_name").order("last_name"),
    supabase.from("league_entries").select("member_id, distance_m, elevation_gain_m").eq("month", monthDate(month)),
  ]);
  const byMember = new Map((entries ?? []).map((e) => [e.member_id, e]));

  return (
    <>
      <PageHead
        kicker="Liga interna"
        title={`Apuntar ${monthLong(month).toLowerCase()}`}
        actions={
          <>
            <Link href={`/admin/liga/apuntar?mes=${addMonths(month, -1)}`} className={s.ghostButton}>← {monthLong(addMonths(month, -1))}</Link>
            {month < lastMonth && (
              <Link href={`/admin/liga/apuntar?mes=${addMonths(month, 1)}`} className={s.ghostButton}>{monthLong(addMonths(month, 1))} →</Link>
            )}
          </>
        }
      />
      <Notice
        error={error}
        messages={{
          valores: "Revisa los números: km con hasta dos decimales (123,5) y metros sin decimales (4500).",
          mes: "Ese mes no es válido.",
          guardar: "No se ha podido guardar. Inténtalo de nuevo.",
        }}
      />
      <p className={s.blockMeta} style={{ marginBottom: 16 }}>
        Kilómetros y desnivel positivo acumulados en el mes. Deja ambos vacíos si alguien no ha salido.
      </p>

      <form action={saveMonth}>
        <input type="hidden" name="month" value={month} />
        <table className={s.table}>
          <thead>
            <tr>
              <th scope="col">Miembro</th>
              <th scope="col" className={s.num}>Km</th>
              <th scope="col" className={s.num}>Desnivel (m+)</th>
            </tr>
          </thead>
          <tbody>
            {(members ?? []).map((m) => {
              const e = byMember.get(m.id);
              return (
                <tr key={m.id}>
                  <td className={s.strong}>
                    <input type="hidden" name="member_id" value={m.id} />
                    {fullName(m)}
                  </td>
                  <td className={s.num}>
                    <input name={`km_${m.id}`} inputMode="decimal" defaultValue={e ? kmInput(e.distance_m) : ""} className={s.budgetInput} aria-label={`Km de ${fullName(m)}`} />
                  </td>
                  <td className={s.num}>
                    <input name={`gain_${m.id}`} inputMode="numeric" defaultValue={e ? e.elevation_gain_m : ""} className={s.budgetInput} aria-label={`Desnivel de ${fullName(m)}`} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className={s.formActions} style={{ marginTop: 16 }}>
          <button type="submit" className={s.primaryButton}>Guardar {monthLong(month).toLowerCase()}</button>
          <Link href="/admin/liga" className={s.linkButton}>Cancelar</Link>
        </div>
      </form>
    </>
  );
}

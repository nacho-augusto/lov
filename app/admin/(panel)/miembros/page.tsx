import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/admin/PageHead";
import { PeakSilhouette } from "@/components/admin/marks";
import s from "@/components/admin/admin.module.css";
import { currentSeason, formatDate, fullName } from "@/lib/admin/format";
import { requireAdmin } from "@/lib/admin/session";
import { createClient } from "@/lib/supabase/server";
import { openSeason } from "./actions";

export const metadata: Metadata = { title: "Miembros" };

interface Row {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  joined_on: string;
  left_on: string | null;
  member_requirements: { status: string; season: number | null }[];
  federation_licences: { season: number }[];
}

const errors: Record<string, string> = {
  temporada: "Esa temporada no es válida.",
  guardar: "No se ha podido guardar. Inténtalo de nuevo.",
};

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; q?: string; ok?: string; error?: string }>;
}) {
  const me = await requireAdmin("members.read");
  const { estado, q, ok, error } = await searchParams;
  const showingLeft = estado === "baja";
  const season = currentSeason();
  const canWrite = me.permissions.has("members.write");

  const supabase = await createClient();
  let query = supabase
    .from("members")
    .select("id, first_name, last_name, email, phone, joined_on, left_on, member_requirements(status, season), federation_licences(season)")
    .eq("active", !showingLeft)
    .order("first_name")
    .order("last_name");
  // Only letters, digits, spaces and a few name characters reach the filter.
  const term = (q ?? "").replace(/[^\p{L}\p{N} .'-]/gu, "").trim();
  if (term) query = query.or(`first_name.ilike.*${term}*,last_name.ilike.*${term}*`);
  const { data } = await query;
  const members = (data ?? []) as Row[];

  const seasonMsg = ok?.match(/^temporada-(\d{4})-(\d+)$/);

  return (
    <>
      <PageHead
        kicker={`Temporada ${season}`}
        title="Miembros"
        actions={
          canWrite && (
            <Link href="/admin/miembros/nuevo" className={s.primaryButton}>
              Dar de alta
            </Link>
          )
        }
      />

      {seasonMsg && (
        <p className={s.notice} data-tone="ok" role="status">
          Temporada {seasonMsg[1]} abierta: {seasonMsg[2]} trámites nuevos.
        </p>
      )}
      {error && errors[error] && (
        <p className={s.notice} data-tone="error" role="alert">
          {errors[error]}
        </p>
      )}

      <section className={s.rangeBar} aria-label="Filtros">
        <div className={s.chips} role="group" aria-label="Estado">
          <Link href="/admin/miembros" className={s.chip} aria-pressed={!showingLeft}>
            En activo
          </Link>
          <Link href="/admin/miembros?estado=baja" className={s.chip} aria-pressed={showingLeft}>
            De baja
          </Link>
        </div>
        <form className={s.search} role="search">
          {showingLeft && <input type="hidden" name="estado" value="baja" />}
          <label htmlFor="q" className={s.srOnly}>Buscar por nombre</label>
          <input id="q" name="q" defaultValue={term} placeholder="Buscar por nombre" className={s.input} />
        </form>
      </section>

      {members.length ? (
        <table className={s.table}>
          <thead>
            <tr>
              <th scope="col">Miembro</th>
              <th scope="col">Contacto</th>
              <th scope="col">{showingLeft ? "Baja" : "Alta"}</th>
              <th scope="col">Licencia {season}</th>
              <th scope="col" className={s.num}>Trámites pendientes</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => {
              const pending = m.member_requirements.filter(
                (r) => r.status === "pending" && (r.season === null || r.season === season),
              ).length;
              const licensed = m.federation_licences.some((l) => l.season === season);
              return (
                <tr key={m.id}>
                  <td className={s.strong}>
                    <Link href={`/admin/miembros/${m.id}`} className={s.rowLink}>
                      {fullName(m)}
                    </Link>
                  </td>
                  <td className={s.adminMeta}>{[m.phone, m.email].filter(Boolean).join(" · ") || "—"}</td>
                  <td>{formatDate(showingLeft ? m.left_on : m.joined_on)}</td>
                  <td>
                    {licensed ? (
                      <span className={s.status} data-tone="done">Tramitada</span>
                    ) : (
                      <span className={s.status} data-tone="pending">Sin licencia</span>
                    )}
                  </td>
                  <td className={s.num}>
                    {pending ? <span className={s.accentText}>{pending}</span> : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <div className={s.empty}>
          <PeakSilhouette className={s.emptyPeak} />
          <p className={s.emptyTitle}>
            {term ? "Nadie con ese nombre" : showingLeft ? "Nadie de baja" : "Aún no hay miembros"}
          </p>
          <p className={s.emptyText}>
            {term || showingLeft ? "Prueba con otro filtro." : "Da de alta al primero y empezamos la cordada."}
          </p>
        </div>
      )}

      {canWrite && !showingLeft && (
        <section className={s.block} aria-labelledby="temporada" style={{ marginTop: 40 }}>
          <header className={s.blockHead}>
            <h2 id="temporada" className={s.blockTitle}>Nueva temporada</h2>
            <p className={s.blockMeta}>
              Crea los trámites anuales (licencia, cuota…) para todos los miembros en activo.
            </p>
          </header>
          <form action={openSeason} className={s.inlineForm}>
            <label className={s.field}>
              <span>Temporada</span>
              <input name="season" type="number" min={2000} max={2100} defaultValue={season + 1} className={s.input} />
            </label>
            <button type="submit" className={s.secondaryButton}>Abrir temporada</button>
          </form>
        </section>
      )}
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { GrantFields } from "@/components/admin/GrantFields";
import { Notice } from "@/components/admin/Notice";
import { PageHead } from "@/components/admin/PageHead";
import s from "@/components/admin/admin.module.css";
import { currentSeason } from "@/lib/admin/format";
import { grantMessages } from "@/lib/admin/grants";
import { requireAdmin } from "@/lib/admin/session";
import { createGrant } from "../actions";

export const metadata: Metadata = { title: "Nueva subvención" };

export default async function NewGrantPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireAdmin("grants.write");
  const { error } = await searchParams;
  return (
    <>
      <PageHead kicker="Subvenciones" title="Nueva subvención" />
      <Notice error={error} messages={grantMessages} />
      <form action={createGrant} className={s.formStack}>
        <GrantFields v={{ year: currentSeason() }} />
        <label className={s.field}>
          <span>Documentos que piden (uno por línea)</span>
          <textarea
            name="requirements"
            rows={7}
            className={s.textarea}
            placeholder={"Solicitud firmada\nMemoria de actividades\nPresupuesto de la temporada\nCertificado de estar al corriente con Hacienda\nCertificado de la Seguridad Social\nCopia del CIF"}
          />
        </label>
        <div className={s.formActions}>
          <button type="submit" className={s.primaryButton}>Crear subvención</button>
          <Link href="/admin/subvenciones" className={s.linkButton}>Cancelar</Link>
        </div>
      </form>
    </>
  );
}

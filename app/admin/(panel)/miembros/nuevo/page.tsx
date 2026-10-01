import type { Metadata } from "next";
import Link from "next/link";
import { MemberFields } from "@/components/admin/MemberFields";
import { PageHead } from "@/components/admin/PageHead";
import s from "@/components/admin/admin.module.css";
import { todayISO } from "@/lib/admin/format";
import { requireAdmin } from "@/lib/admin/session";
import { createMember } from "../actions";

export const metadata: Metadata = { title: "Dar de alta" };

const errors: Record<string, string> = {
  nombre: "Falta el nombre.",
  datos: "Revisa las fechas y el correo.",
  guardar: "No se ha podido guardar. Inténtalo de nuevo.",
};

export default async function NewMemberPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const me = await requireAdmin("members.write");
  const { error } = await searchParams;

  return (
    <>
      <PageHead kicker="Miembros" title="Dar de alta" />
      {error && errors[error] && (
        <p className={s.notice} data-tone="error" role="alert">
          {errors[error]}
        </p>
      )}
      <form action={createMember} className={s.formStack}>
        <MemberFields v={{ joined_on: todayISO() }} showPrivate={me.permissions.has("members.sensitive")} />
        <p className={s.blockMeta}>
          Al darle de alta se crea su lista de trámites de esta temporada.
        </p>
        <div className={s.formActions}>
          <button type="submit" className={s.primaryButton}>Dar de alta</button>
          <Link href="/admin/miembros" className={s.linkButton}>Cancelar</Link>
        </div>
      </form>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Contours, PeakSilhouette } from "@/components/admin/marks";
import s from "@/components/admin/admin.module.css";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../login/actions";

export const metadata: Metadata = { title: "Sin acceso" };

export default async function NoAccess() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims);

  return (
    <div className={s.login}>
      <Contours className={s.contours} />
      <section className={s.loginCard} aria-labelledby="no-access-title">
        <PeakSilhouette className={s.emptyPeak} />
        <h1 id="no-access-title" className={s.loginTitle}>
          Por aquí no hay sendero
        </h1>
        <p className={s.loginText}>
          Esta cuenta no tiene acceso al panel de la junta. Si deberías tenerlo, pide a un
          administrador que te invite con este mismo correo.
        </p>
        {signedIn ? (
          <form action={signOut}>
            <button type="submit" className={s.secondaryButton}>
              Probar con otra cuenta
            </button>
          </form>
        ) : (
          <Link href="/admin/login" className={s.secondaryButton}>
            Volver a entrar
          </Link>
        )}
      </section>
    </div>
  );
}

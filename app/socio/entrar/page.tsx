import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Contours } from "@/components/admin/marks";
import s from "@/components/admin/admin.module.css";
import { getPortalMembers } from "@/lib/portal/session";
import { requestPortalLink } from "./actions";

export const metadata: Metadata = { title: "Entrar" };

const errors: Record<string, string> = {
  correo: "Ese correo no parece válido.",
  envio: "No hemos podido enviar el enlace. Inténtalo de nuevo en un rato.",
  espera: "Has pedido varios enlaces seguidos. Espera un minuto y vuelve a probar.",
  enlace: "El enlace ha caducado o ya se usó. Pide uno nuevo.",
  "sin-ficha": "Ese correo no corresponde a ningún socio en activo. Si crees que es un error, avisa a la junta.",
};

// No accounts and no passwords: the email the club has on file is the key.
export default async function PortalLogin({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; enviado?: string }>;
}) {
  if ((await getPortalMembers())?.length) redirect("/socio");
  const { error, enviado } = await searchParams;

  return (
    <div className={s.login}>
      <Contours className={s.contours} />
      <section className={s.loginCard} aria-labelledby="login-title">
        <div className={s.loginLogo}>
          <Image src="/logo/logo-mark.png" alt="C.D. La Otra Vertiente" width={640} height={192} className={s.logoDay} priority />
          <Image src="/logo/logo-light.png" alt="" width={640} height={192} className={s.logoNight} priority />
        </div>
        <h1 id="login-title" className={s.loginTitle}>
          Zona de socios
        </h1>
        <p className={s.loginText}>
          Tus cuotas, tu liga y las próximas salidas. Escribe el correo que tiene el club y te mandamos un enlace para entrar.
        </p>

        {error && errors[error] && (
          <p className={s.notice} data-tone="error" role="alert">
            {errors[error]}
          </p>
        )}
        {enviado && (
          <p className={s.notice} data-tone="ok" role="status">
            Si ese correo es de un socio, te acaba de llegar un enlace. Ábrelo en este mismo navegador.
          </p>
        )}

        <form className={s.magic} action={requestPortalLink}>
          <label htmlFor="email" className={s.srOnly}>
            Correo electrónico
          </label>
          <input id="email" name="email" type="email" required placeholder="tu@correo.com" className={s.input} autoComplete="email" />
          <button type="submit" className={s.primaryButton}>
            Enviar enlace
          </button>
        </form>
      </section>
      <p className={s.loginFoot}>C.D. La Otra Vertiente · Rincón de la Victoria</p>
    </div>
  );
}

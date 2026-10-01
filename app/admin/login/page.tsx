import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Contours } from "@/components/admin/marks";
import s from "@/components/admin/admin.module.css";
import { getAdmin } from "@/lib/admin/session";
import { signInWithEmail, signInWithGoogle } from "./actions";

export const metadata: Metadata = { title: "Entrar" };

const errors: Record<string, string> = {
  correo: "Ese correo no parece válido.",
  envio: "No hemos podido enviar el enlace. Inténtalo de nuevo en un rato.",
  espera: "Has pedido varios enlaces seguidos. Espera un minuto y vuelve a probar.",
  google: "El acceso con Google no está disponible ahora mismo. Usa el enlace por correo.",
  enlace: "El enlace ha caducado o ya se usó. Pide uno nuevo.",
};

// Invitation only: there is deliberately no "create account" path.
export default async function AdminLogin({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; enviado?: string }>;
}) {
  if (await getAdmin()) redirect("/admin");
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
          Panel de la junta
        </h1>
        <p className={s.loginText}>
          Acceso solo por invitación. Si eres de la junta y no puedes entrar, pídele acceso a
          otro administrador.
        </p>

        {error && errors[error] && (
          <p className={s.notice} data-tone="error" role="alert">
            {errors[error]}
          </p>
        )}
        {enviado && (
          <p className={s.notice} data-tone="ok" role="status">
            Si tienes invitación, te acaba de llegar un enlace para entrar. Ábrelo en este
            mismo navegador.
          </p>
        )}

        <form action={signInWithGoogle}>
          <button type="submit" className={s.googleButton}>
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.3-1.6 3.8-5.4 3.8-3.2 0-5.9-2.7-5.9-6s2.7-6 5.9-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.4 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z" />
            </svg>
            Entrar con Google
          </button>
        </form>

        <div className={s.or}>
          <span>o recibe un enlace en tu correo</span>
        </div>
        <form className={s.magic} action={signInWithEmail}>
          <label htmlFor="email" className={s.srOnly}>
            Correo electrónico
          </label>
          <input id="email" name="email" type="email" required placeholder="tu@correo.com" className={s.input} autoComplete="email" />
          <button type="submit" className={s.secondaryButton}>
            Enviar enlace
          </button>
        </form>
      </section>
      <p className={s.loginFoot}>C.D. La Otra Vertiente · Rincón de la Victoria</p>
    </div>
  );
}

import { PageHead } from "@/components/admin/PageHead";
import { PeakSilhouette } from "@/components/admin/marks";
import s from "@/components/admin/admin.module.css";
import { requireAdmin } from "@/lib/admin/session";

const today = () =>
  new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Madrid" })
    .format(new Date())
    .replace(/^./, (c) => c.toUpperCase());

export default async function AdminHome({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const admin = await requireAdmin();
  const { error } = await searchParams;
  const name = admin.fullName?.split(" ")[0];

  return (
    <>
      <PageHead kicker={today()} title="Parte de la junta" />
      {error === "permiso" && (
        <p className={s.notice} data-tone="error" role="alert">
          No tienes permiso para esa sección.
        </p>
      )}
      <div className={s.empty}>
        <PeakSilhouette className={s.emptyPeak} />
        <p className={s.emptyTitle}>{name ? `Hola, ${name}. ` : ""}Esto acaba de empezar</p>
        <p className={s.emptyText}>
          Aquí verás lo pendiente del club: cuotas por cobrar, plazos y la liga. Llegará con
          los próximos módulos.
        </p>
      </div>
    </>
  );
}

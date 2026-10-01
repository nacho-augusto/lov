import { euroInput } from "@/lib/admin/money";
import s from "./admin.module.css";

export interface GrantValues {
  year?: number;
  name?: string;
  awarding_body?: string | null;
  call_url?: string | null;
  requested_cents?: number | null;
  awarded_cents?: number | null;
  application_deadline?: string | null;
  justification_deadline?: string | null;
  notes?: string | null;
}

export function GrantFields({ v = {}, showAwarded = false }: { v?: GrantValues; showAwarded?: boolean }) {
  return (
    <>
      <div className={s.fieldRow}>
        <label className={s.field}>
          <span>Nombre</span>
          <input name="name" defaultValue={v.name} className={s.input} placeholder="Ayudas a clubes deportivos" required />
        </label>
        <label className={s.field}>
          <span>Año</span>
          <input name="year" type="number" min={2000} max={2100} defaultValue={v.year} className={s.input} />
        </label>
      </div>
      <div className={s.fieldRow}>
        <label className={s.field}>
          <span>Organismo</span>
          <input name="awarding_body" defaultValue={v.awarding_body ?? ""} className={s.input} placeholder="Diputación de Málaga, Ayto. Rincón…" />
        </label>
        <label className={s.field}>
          <span>Enlace a la convocatoria</span>
          <input name="call_url" type="url" defaultValue={v.call_url ?? ""} className={s.input} placeholder="https://…" />
        </label>
      </div>
      <div className={s.fieldRow}>
        <label className={s.field}>
          <span>Importe solicitado (€)</span>
          <input name="requested" inputMode="decimal" defaultValue={euroInput(v.requested_cents)} className={s.input} />
        </label>
        {showAwarded && (
          <label className={s.field}>
            <span>Importe concedido (€)</span>
            <input name="awarded" inputMode="decimal" defaultValue={euroInput(v.awarded_cents)} className={s.input} />
          </label>
        )}
      </div>
      <div className={s.fieldRow}>
        <label className={s.field}>
          <span>Plazo de solicitud</span>
          <input name="application_deadline" type="date" defaultValue={v.application_deadline ?? ""} className={s.input} />
        </label>
        <label className={s.field}>
          <span>Plazo de justificación</span>
          <input name="justification_deadline" type="date" defaultValue={v.justification_deadline ?? ""} className={s.input} />
        </label>
      </div>
      <label className={s.field}>
        <span>Notas</span>
        <textarea name="notes" rows={3} defaultValue={v.notes ?? ""} className={s.textarea} />
      </label>
    </>
  );
}

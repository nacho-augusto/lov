import { eventKindLabels } from "@/lib/admin/extras";
import s from "./admin.module.css";

export interface EventValues {
  title?: string;
  kind?: string;
  starts_on?: string;
  start_time?: string | null;
  ends_on?: string | null;
  location?: string | null;
  description?: string | null;
  capacity?: number | null;
  signup_deadline?: string | null;
}

export function EventFields({ e = {} }: { e?: EventValues }) {
  return (
    <>
      <div className={s.fieldRow}>
        <label className={s.field}>
          <span>Título</span>
          <input name="title" defaultValue={e.title} className={s.input} placeholder="Subida a La Maroma…" required />
        </label>
        <label className={s.field}>
          <span>Tipo</span>
          <select name="kind" defaultValue={e.kind ?? "outing"} className={s.input}>
            {Object.entries(eventKindLabels).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </label>
      </div>
      <div className={s.fieldRow}>
        <label className={s.field}>
          <span>Fecha</span>
          <input name="starts_on" type="date" defaultValue={e.starts_on ?? ""} className={s.input} required />
        </label>
        <label className={s.field}>
          <span>Hora (opcional)</span>
          <input name="start_time" type="time" defaultValue={e.start_time?.slice(0, 5) ?? ""} className={s.input} />
        </label>
        <label className={s.field}>
          <span>Hasta (si dura varios días)</span>
          <input name="ends_on" type="date" defaultValue={e.ends_on ?? ""} className={s.input} />
        </label>
      </div>
      <div className={s.fieldRow}>
        <label className={s.field}>
          <span>Lugar o punto de encuentro</span>
          <input name="location" defaultValue={e.location ?? ""} className={s.input} />
        </label>
        <label className={s.field}>
          <span>Plazas (vacío = sin límite)</span>
          <input name="capacity" type="number" min={1} defaultValue={e.capacity ?? ""} className={s.input} />
        </label>
        <label className={s.field}>
          <span>Inscripción hasta</span>
          <input name="signup_deadline" type="date" defaultValue={e.signup_deadline ?? ""} className={s.input} />
        </label>
      </div>
      <label className={s.field}>
        <span>Descripción</span>
        <textarea name="description" defaultValue={e.description ?? ""} rows={3} className={s.textarea} />
      </label>
    </>
  );
}

import s from "./admin.module.css";

export interface MemberValues {
  first_name?: string;
  last_name?: string;
  email?: string | null;
  phone?: string | null;
  birth_date?: string | null;
  emergency_name?: string | null;
  emergency_phone?: string | null;
  joined_on?: string;
  data_consent_on?: string | null;
  image_consent?: boolean;
  notes?: string | null;
  national_id?: string | null;
  health_notes?: string | null;
}

function Field({
  label,
  name,
  type = "text",
  value,
  required,
  placeholder,
  autoComplete = "off",
}: {
  label: string;
  name: string;
  type?: string;
  value?: string | null;
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <label className={s.field}>
      <span>{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={value ?? ""}
        required={required}
        placeholder={placeholder}
        className={s.input}
        autoComplete={autoComplete}
      />
    </label>
  );
}

// The member form body, shared by "alta" and the member record.
export function MemberFields({ v = {}, showPrivate }: { v?: MemberValues; showPrivate: boolean }) {
  return (
    <>
      <fieldset className={s.fieldset}>
        <legend className={s.legend}>Datos</legend>
        <div className={s.fieldRow}>
          <Field label="Nombre" name="first_name" value={v.first_name} required />
          <Field label="Apellidos" name="last_name" value={v.last_name} />
        </div>
        <div className={s.fieldRow}>
          <Field label="Correo" name="email" type="email" value={v.email} placeholder="para recordatorios" />
          <Field label="Teléfono" name="phone" type="tel" value={v.phone} />
          <Field label="Fecha de nacimiento" name="birth_date" type="date" value={v.birth_date} />
        </div>
      </fieldset>

      <fieldset className={s.fieldset}>
        <legend className={s.legend}>Contacto de emergencia</legend>
        <div className={s.fieldRow}>
          <Field label="Nombre" name="emergency_name" value={v.emergency_name} />
          <Field label="Teléfono" name="emergency_phone" type="tel" value={v.emergency_phone} />
        </div>
      </fieldset>

      <fieldset className={s.fieldset}>
        <legend className={s.legend}>Club</legend>
        <div className={s.fieldRow}>
          <Field label="Fecha de alta" name="joined_on" type="date" value={v.joined_on} />
          <Field label="Consentimiento de datos firmado el" name="data_consent_on" type="date" value={v.data_consent_on} />
        </div>
        <label className={s.checkLine}>
          <input type="checkbox" name="image_consent" defaultChecked={v.image_consent} />
          <span>Autoriza el uso de su imagen en fotos y redes del club</span>
        </label>
        <label className={s.field}>
          <span>Notas</span>
          <textarea name="notes" defaultValue={v.notes ?? ""} rows={3} className={s.textarea} />
        </label>
      </fieldset>

      {showPrivate && (
        <fieldset className={s.fieldset} data-private="">
          <legend className={s.legend}>Datos sensibles · solo propietarios y secretaría</legend>
          <div className={s.fieldRow}>
            <Field label="DNI / NIE" name="national_id" value={v.national_id} />
          </div>
          <label className={s.field}>
            <span>Salud (alergias, medicación…)</span>
            <textarea name="health_notes" defaultValue={v.health_notes ?? ""} rows={2} className={s.textarea} />
          </label>
        </fieldset>
      )}
    </>
  );
}

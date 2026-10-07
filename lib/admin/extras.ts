// Labels and helpers for club documents, the activity calendar and club gear.
import { daysUntil } from "./grants";

export const documentKindLabels = {
  statutes: "Estatutos",
  tax: "Fiscal (CIF…)",
  insurance: "Seguro",
  minutes: "Acta",
  agreement: "Convenio",
  other: "Otro",
} as const;
export type DocumentKind = keyof typeof documentKindLabels;

export const eventKindLabels = {
  outing: "Salida",
  race: "Carrera",
  social: "Quedada",
  other: "Otra",
} as const;
export type EventKind = keyof typeof eventKindLabels;

// Documents due to expire within this many days show up on the dashboard.
export const EXPIRY_WARNING_DAYS = 60;

// Status chip for a document's expiry date.
export function expiryStatus(expiresOn: string | null, todayIso: string) {
  const days = daysUntil(expiresOn, todayIso);
  if (days === null) return { tone: "done", label: "Sin caducidad", days };
  if (days < 0) return { tone: "overdue", label: "Caducado", days };
  if (days <= EXPIRY_WARNING_DAYS) return { tone: "pending", label: days === 0 ? "Caduca hoy" : `Caduca en ${days} d`, days };
  return { tone: "done", label: "Vigente", days };
}

export const isUuid = (v: unknown): v is string => typeof v === "string" && /^[0-9a-f-]{36}$/i.test(v);

// File names as stored in Storage paths: ASCII word characters, dots and dashes.
export const safeFileName = (name: string) => name.normalize("NFKD").replace(/[^\w.-]+/g, "_").slice(-100) || "archivo";

export const extrasMessages: Record<string, string> = {
  documento: "Documento guardado.",
  "documento-borrado": "Documento borrado.",
  actividad: "Actividad guardada.",
  cancelada: "Actividad cancelada.",
  reactivada: "Actividad recuperada.",
  apuntado: "Apuntado.",
  desapuntado: "Quitado de la lista.",
  "sin-plazas": "No quedan plazas (o la actividad está cancelada).",
  "ya-apuntado": "Ya estaba apuntado.",
  material: "Material guardado.",
  prestado: "Préstamo apuntado.",
  devuelto: "Devolución apuntada.",
  "ya-prestado": "Eso ya lo tiene alguien: apunta antes la devolución.",
  "codigo-repetido": "Ya hay material con ese código.",
  nombre: "Falta el nombre.",
  titulo: "Falta el título.",
  fecha: "Revisa las fechas.",
  plazas: "Las plazas deben ser un número mayor que cero.",
  miembro: "Elige un miembro.",
  guardar: "No se ha podido guardar. Inténtalo de nuevo.",
};

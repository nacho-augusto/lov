export const grantStatusLabels = {
  preparing: "En preparación",
  submitted: "Presentada",
  awarded: "Concedida",
  rejected: "Denegada",
  justified: "Justificada",
} as const;
export type GrantStatus = keyof typeof grantStatusLabels;

export const grantStatusTone: Record<GrantStatus, string> = {
  preparing: "pending",
  submitted: "pending",
  awarded: "done",
  rejected: "pending",
  justified: "done",
};

export const taskStatusLabels = {
  pending: "Pendiente",
  in_progress: "En marcha",
  done: "Listo",
  not_applicable: "No aplica",
} as const;
export type TaskStatus = keyof typeof taskStatusLabels;

// Whole days from today (Madrid) to an ISO date; negative when past.
export function daysUntil(iso: string | null, todayIso: string) {
  if (!iso) return null;
  return Math.round((Date.parse(`${iso}T12:00:00Z`) - Date.parse(`${todayIso}T12:00:00Z`)) / 86_400_000);
}

// The next deadline that still matters for a grant in its current status.
export function nextDeadline(g: { status: GrantStatus; application_deadline: string | null; justification_deadline: string | null }) {
  if (g.status === "preparing") return g.application_deadline ? { kind: "Solicitud", date: g.application_deadline } : null;
  if (g.status === "awarded") return g.justification_deadline ? { kind: "Justificación", date: g.justification_deadline } : null;
  return null;
}

export const grantMessages: Record<string, string> = {
  creada: "Subvención creada.",
  guardada: "Datos guardados.",
  documentos: "Documentos añadidos a la lista.",
  estado: "Estado actualizado.",
  "documento-quitado": "Documento quitado de la lista.",
  "archivo-borrado": "Archivo borrado.",
  "gasto-vinculado": "Gasto añadido a la justificación.",
  "gasto-desvinculado": "Gasto quitado de la justificación.",
  nombre: "Falta el nombre de la subvención.",
  importe: "Un importe no es válido. Usa por ejemplo 1500, 1.500 o 1.500,50.",
  "sin-documentos": "Escribe al menos un documento (uno por línea).",
  guardar: "No se ha podido guardar. Inténtalo de nuevo.",
};

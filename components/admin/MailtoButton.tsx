"use client";

import { useState } from "react";
import { logMessage } from "@/app/admin/(panel)/comunicaciones/actions";
import { buildMailto } from "@/lib/admin/mailto";
import s from "./admin.module.css";

// Logs the message, then opens it in the admin's own mail app (mailto).
// For groups the addresses go in BCC so members don't see each other's emails.
export function MailtoButton({
  templateId,
  subject,
  body,
  recipients,
  label,
  variant = "secondary",
}: {
  templateId: string | null;
  subject: string;
  body: string;
  recipients: { memberId: string; email: string }[];
  label: string;
  variant?: "primary" | "secondary" | "link";
}) {
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");

  async function send() {
    setState("busy");
    const res = await logMessage({ templateId, subject, memberIds: recipients.map((r) => r.memberId) });
    if ("error" in res) {
      setState("error");
      return;
    }
    window.location.href = buildMailto(recipients.map((r) => r.email), subject, body);
    setState("done");
  }

  const cls = variant === "primary" ? s.primaryButton : variant === "link" ? s.linkButton : s.secondaryButton;
  return (
    <span className={s.upload}>
      <button type="button" className={cls} onClick={send} disabled={state === "busy" || recipients.length === 0}>
        {state === "busy" ? "Abriendo…" : label}
      </button>
      {state === "done" && <span className={s.adminMeta}>Apuntado en el registro ✓</span>}
      {state === "error" && <span className={s.uploadError}>No se ha podido preparar.</span>}
    </span>
  );
}

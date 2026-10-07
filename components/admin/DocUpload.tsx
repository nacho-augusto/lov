"use client";

import { prepareGrantUpload, registerGrantDocument } from "@/app/admin/(panel)/subvenciones/actions";
import { SignedUpload } from "./SignedUpload";

// Attaches a file to a grant (optionally to one of its required documents).
export function DocUpload({ grantId, requirementId = null, label = "Adjuntar" }: { grantId: string; requirementId?: string | null; label?: string }) {
  return (
    <SignedUpload
      bucket="club-grants"
      label={label}
      prepare={(fileName) => prepareGrantUpload(grantId, fileName)}
      register={async (f) => {
        const r = await registerGrantDocument({ grantId, requirementId, ...f });
        return "error" in r ? { error: String(r.error) } : { ok: true };
      }}
    />
  );
}

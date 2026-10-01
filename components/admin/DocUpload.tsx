"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { prepareGrantUpload, registerGrantDocument } from "@/app/admin/(panel)/subvenciones/actions";
import s from "./admin.module.css";

const MAX = 25 * 1024 * 1024;

// Uploads a grant file straight to private Storage through a signed upload URL
// (no request body limit on our server), then records it.
export function DocUpload({ grantId, requirementId = null, label = "Adjuntar" }: { grantId: string; requirementId?: string | null; label?: string }) {
  const router = useRouter();
  const id = useId();
  const [state, setState] = useState<"idle" | "uploading" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX) {
      setState("error");
      setMessage("Máximo 25 MB.");
      return;
    }
    setState("uploading");
    setMessage(file.name);
    try {
      const prepared = await prepareGrantUpload(grantId, file.name);
      if ("error" in prepared) throw new Error();
      const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
      const { error } = await supabase.storage.from("club-grants").uploadToSignedUrl(prepared.path, prepared.token, file, {
        contentType: file.type || "application/octet-stream",
      });
      if (error) throw error;
      const saved = await registerGrantDocument({ grantId, requirementId, path: prepared.path, fileName: file.name, size: file.size });
      if ("error" in saved) throw new Error();
      setState("idle");
      setMessage("");
      router.refresh();
    } catch {
      setState("error");
      setMessage("No se ha podido subir. Comprueba el tipo de archivo (PDF, imagen, Word, Excel…).");
    }
  }

  return (
    <span className={s.upload}>
      <label htmlFor={id} className={s.linkButton} aria-disabled={state === "uploading"}>
        {state === "uploading" ? "Subiendo…" : label}
      </label>
      <input id={id} type="file" className={s.srOnly} onChange={onChange} disabled={state === "uploading"} />
      {message && <span className={state === "error" ? s.uploadError : s.adminMeta}>{message}</span>}
    </span>
  );
}

"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import s from "./admin.module.css";

type Result = { error: string } | { ok: true };

// Uploads a file straight to a private Storage bucket through a signed upload URL
// (no request body limit on our server), then lets the server record it.
// `prepare` hands out the path and token; `register` checks the path and saves it.
export function SignedUpload({
  bucket,
  prepare,
  register,
  label = "Adjuntar",
  maxMb = 25,
  errorText = "No se ha podido subir. Comprueba el tipo de archivo (PDF, imagen, Word, Excel…).",
}: {
  bucket: string;
  prepare: (fileName: string) => Promise<{ path: string; token: string } | { error: string }>;
  register: (file: { path: string; fileName: string; size: number }) => Promise<Result>;
  label?: string;
  maxMb?: number;
  errorText?: string;
}) {
  const router = useRouter();
  const id = useId();
  const [state, setState] = useState<"idle" | "uploading" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > maxMb * 1024 * 1024) {
      setState("error");
      setMessage(`Máximo ${maxMb} MB.`);
      return;
    }
    setState("uploading");
    setMessage(file.name);
    try {
      const prepared = await prepare(file.name);
      if ("error" in prepared) throw new Error();
      const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
      const { error } = await supabase.storage.from(bucket).uploadToSignedUrl(prepared.path, prepared.token, file, {
        contentType: file.type || "application/octet-stream",
      });
      if (error) throw error;
      const saved = await register({ path: prepared.path, fileName: file.name, size: file.size });
      if ("error" in saved) throw new Error();
      setState("idle");
      setMessage("");
      router.refresh();
    } catch {
      setState("error");
      setMessage(errorText);
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

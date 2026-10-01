import s from "./admin.module.css";

// Renders the ?ok= / ?error= feedback that Server Actions redirect with.
// `messages` maps a code (or a code prefix ending in "-", for codes carrying a number
// like "generados-12") to Spanish copy; {n} is replaced by that number.
export function Notice({
  ok,
  error,
  messages,
}: {
  ok?: string;
  error?: string;
  messages: Record<string, string>;
}) {
  const code = ok ?? error;
  if (!code) return null;
  const num = code.match(/-(\d+)$/)?.[1];
  const text = messages[code] ?? (num ? messages[code.slice(0, -num.length)]?.replace("{n}", num) : undefined);
  if (!text) return null;
  return (
    <p className={s.notice} data-tone={ok ? "ok" : "error"} role={ok ? "status" : "alert"}>
      {text}
    </p>
  );
}

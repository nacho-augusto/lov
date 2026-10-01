"use client";

import { fmtInt } from "./data";
import { useFolios } from "./scroll";

/** A chapter's "page number": the altitude at which it starts on the climb. */
export function Folio({ id, className }: { id: string; className?: string }) {
  const folios = useFolios();
  const m = folios?.[id];
  return (
    <span className={className} data-ready={m === undefined ? undefined : ""} aria-hidden="true">
      {m === undefined ? " " : `${fmtInt(m)} m`}
    </span>
  );
}

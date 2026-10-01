"use client";

import { go } from "./scroll";

/**
 * In-page cross-reference ("02.05", "Fig. 09", "03"). Works as a plain anchor
 * without JS; with JS it glides there and, for list items, opens the entry.
 */
export function IndexLink({
  target,
  item = false,
  className,
  children,
  label,
}: {
  target: string;
  item?: boolean;
  className?: string;
  children: React.ReactNode;
  label?: string;
}) {
  return (
    <a
      href={`#${target}`}
      className={className}
      aria-label={label}
      onClick={(e) => {
        e.preventDefault();
        go(target, { item });
      }}
    >
      {children}
    </a>
  );
}

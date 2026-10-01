// Thin line icons in the spirit of the original Claro mock-up.
type IconProps = { className?: string; title?: string };

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function IconMountain({ className }: IconProps) {
  return (
    <svg viewBox="0 0 40 28" className={className} aria-hidden {...base}>
      <path d="M2 26 L14 7 L21 17 L26 11 L38 26 Z" />
      <path d="M11.2 11.4 L14 7 L16.6 10.8" />
    </svg>
  );
}

export function IconCommunity({ className }: IconProps) {
  return (
    <svg viewBox="0 0 40 30" className={className} aria-hidden {...base}>
      <circle cx="20" cy="8" r="4.2" />
      <path d="M12 26c0-5 3.6-8.2 8-8.2s8 3.2 8 8.2" />
      <circle cx="8.6" cy="11" r="3.2" />
      <path d="M2.5 26c0-3.9 2.6-6.4 6-6.4 1.3 0 2.5.3 3.4 1" />
      <circle cx="31.4" cy="11" r="3.2" />
      <path d="M37.5 26c0-3.9-2.6-6.4-6-6.4-1.3 0-2.5.3-3.4 1" />
    </svg>
  );
}

export function IconCompass({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden {...base}>
      <circle cx="16" cy="16" r="13.5" />
      <path d="M20.8 11.2 L13.9 13.9 L11.2 20.8 L18.1 18.1 Z" />
    </svg>
  );
}

export function IconArrow({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...base} strokeWidth={1.9}>
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  );
}

export function IconArrowUpRight({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...base} strokeWidth={1.9}>
      <path d="M7 17 17 7M8 7h9v9" />
    </svg>
  );
}

export function IconInstagram({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...base}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.6" r="0.6" fill="currentColor" />
    </svg>
  );
}

export function IconMail({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...base}>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

export function IconMoon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...base}>
      <path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5Z" />
    </svg>
  );
}

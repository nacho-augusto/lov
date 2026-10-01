// Brand drawings for the admin mockup: peak silhouettes and contour lines.

// Silhouette of a named peak for empty states: a simple asymmetric ridge.
export function PeakSilhouette({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 160 60" aria-hidden="true">
      <path
        d="M0 60 L28 38 L40 44 L66 14 L78 22 L88 10 L112 36 L124 30 L160 60 Z"
        fill="currentColor"
      />
    </svg>
  );
}

// Faint contour lines around an invisible summit: the only texture in the panel.
export function Contours({ className }: { className?: string }) {
  const rings = Array.from({ length: 11 }, (_, i) => {
    const r = 40 + i * 34;
    const pts = Array.from({ length: 48 }, (_, k) => {
      const t = (k / 48) * Math.PI * 2;
      const wobble = 1 + 0.09 * Math.sin(3 * t + i * 0.6) + 0.05 * Math.cos(5 * t - i);
      return [500 + Math.cos(t) * r * wobble * 1.35, 380 + Math.sin(t) * r * wobble];
    });
    return `M${pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" L")} Z`;
  });
  return (
    <svg className={className} viewBox="0 0 1000 760" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {rings.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="currentColor" strokeWidth={i % 5 === 4 ? 1.4 : 0.7} />
      ))}
    </svg>
  );
}

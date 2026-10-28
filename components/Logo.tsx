// DSA logo, drawn from public/DSA-1c (D -> S -> A). Colors come from the --logo-* tokens, which switch between the
// primary (light) and navy (dark) versions with color-scheme. `mark` is the square D icon for tight spaces.
export function Logo({ mark, className = "" }: { mark?: boolean; className?: string }) {
  const arrow = (x: number) => `M${x} 40 H${x + 40} M${x + 30} 30 L${x + 42} 40 L${x + 30} 50`;
  return (
    <svg viewBox={mark ? "0 6 106 68" : "0 6 352 68"} className={className} role="img" aria-label="DSA Daily">
      <g fontFamily="var(--font-archivo), Arial Black, sans-serif" fontWeight={900} fontSize={44} textAnchor="middle">
        <rect x="4" y="10" width="70" height="60" rx="30" fill="var(--logo-ink)" />
        <text x="39" y="56" fill="var(--logo-cut)">D</text>
        {mark ? <path d="M78 40 H100 M100 24 V56" stroke="var(--logo-ink)" strokeWidth="6" fill="none" /> : (
          <>
            <path d={arrow(78)} stroke="var(--logo-navy)" strokeWidth="6" fill="none" />
            <rect x="129" y="13" width="64" height="54" rx="27" fill="var(--logo-s)" stroke="var(--logo-navy)" strokeWidth="6" />
            <text x="161" y="56" fill="var(--logo-s-ink)">S</text>
            <path d={arrow(200)} stroke="var(--logo-navy)" strokeWidth="6" fill="none" />
            <rect x="248" y="10" width="70" height="60" rx="30" fill="var(--logo-ink)" />
            <text x="283" y="56" fill="var(--logo-cut)">A</text>
            <path d="M322 40 H346 M346 24 V56" stroke="var(--logo-ink)" strokeWidth="6" fill="none" />
          </>
        )}
      </g>
    </svg>
  );
}
